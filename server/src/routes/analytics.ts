import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate as any);

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

router.get("/overview", async (req: any, res) => {
  const userId = req.userId;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const habits = await prisma.habit.findMany({ where: { userId } });
  const completions = await prisma.completion.findMany({
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
  });

  const days = daysInMonth(year, month);
  const totalPossible = habits.length * days;
  const totalCompleted = completions.filter(c => c.completed).length;
  const overallPercent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const dailyCounts: Record<string, { done: number; total: number }> = {};
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dailyCounts[dateStr] = { done: 0, total: habits.length };
  }
  for (const c of completions) {
    const key = c.date.toISOString().split("T")[0];
    if (dailyCounts[key]) {
      dailyCounts[key].done += c.completed ? 1 : 0;
    }
  }

  const sorted = Object.entries(dailyCounts).sort(([a], [b]) => a.localeCompare(b));
  const dailyRates = sorted.map(([date, counts]) => ({
    date,
    rate: counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0,
    done: counts.done,
    total: counts.total,
  }));

  const streak = calculateStreak(completions, habits.length);

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  res.json({
    totalHabits: habits.length,
    overallPercent,
    dailyRates,
    streak,
    bestDay: dailyRates.reduce((best, curr) => (curr.rate > (best?.rate || 0) ? curr : best), dailyRates[0]),
    daysInMonth: days,
    month,
    year,
    isCurrentMonth,
  });
});

router.get("/habits", async (req: any, res) => {
  const userId = req.userId;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const habits = await prisma.habit.findMany({ where: { userId } });
  const completions = await prisma.completion.findMany({
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
  });

  const totalDays = daysInMonth(year, month);
  const habitRates = habits.map(habit => {
    const habitCompletions = completions.filter(c => c.habitId === habit.id);
    const done = habitCompletions.filter(c => c.completed).length;
    return {
      id: habit.id,
      name: habit.name,
      color: habit.color,
      rate: Math.round((done / totalDays) * 100),
      done,
      total: totalDays,
    };
  });

  const sorted = [...habitRates].sort((a, b) => b.rate - a.rate);
  const best = sorted[0] || null;
  const worst = sorted[sorted.length - 1] || null;
  const mostConsistent = sorted.length > 0
    ? sorted.reduce((a, b) => {
        const aVar = a.done / a.total;
        const bVar = b.done / b.total;
        return Math.abs(aVar - 0.5) < Math.abs(bVar - 0.5) ? a : b;
      })
    : null;

  res.json({ habits: habitRates, best, worst, mostConsistent });
});

router.get("/weekly", async (req: any, res) => {
  const userId = req.userId;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth();

  const habits = await prisma.habit.findMany({ where: { userId } });
  const days = daysInMonth(year, month);
  const weeks: any[] = [];

  let weekStart = 1;
  let weekIndex = 0;

  while (weekStart <= days) {
    const weekEnd = Math.min(weekStart + 6, days);
    const start = new Date(year, month, weekStart);
    const end = new Date(year, month, weekEnd, 23, 59, 59);

    const completions = await prisma.completion.findMany({
      where: { userId, date: { gte: start, lte: end } },
    });

    const daysInWeek = weekEnd - weekStart + 1;
    const totalPossible = habits.length * daysInWeek;
    const done = completions.filter(c => c.completed).length;
    const score = totalPossible > 0 ? Math.round((done / totalPossible) * 100) : 0;

    const startDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(weekStart).padStart(2, "0")}`;
    const endDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(weekEnd).padStart(2, "0")}`;

    weeks.push({
      week: weekIndex + 1,
      score,
      done,
      total: totalPossible,
      startDate: startDateStr,
      endDate: endDateStr,
    });

    weekStart += 7;
    weekIndex++;
  }

  res.json(weeks);
});

router.get("/trends", async (req: any, res) => {
  const userId = req.userId;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth();

  const habits = await prisma.habit.findMany({ where: { userId } });

  // Weekly trend (last 4 weeks)
  const now = new Date(year, month, 1);
  const weeklyData: { week: string; rate: number }[] = [];
  for (let w = 0; w < 4; w++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const completions = await prisma.completion.findMany({
      where: { userId, date: { gte: weekStart, lte: weekEnd } },
    });

    const days = Math.min(7, daysInMonth(weekStart.getFullYear(), weekStart.getMonth()) - weekStart.getDate() + 1);
    const totalPossible = habits.length * Math.max(0, days);
    const done = completions.filter(c => c.completed).length;
    const rate = totalPossible > 0 ? Math.round((done / totalPossible) * 100) : 0;

    weeklyData.push({
      week: `W${getWeekNumber(weekStart)}`,
      rate,
    });
  }

  // Monthly trend (last 6 months)
  const monthlyData: { month: string; rate: number }[] = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(year, month - m, 1);
    const y = d.getFullYear();
    const mo = d.getMonth();
    const start = new Date(y, mo, 1);
    const end = new Date(y, mo + 1, 0, 23, 59, 59);

    const completions = await prisma.completion.findMany({
      where: { userId, date: { gte: start, lte: end } },
    });

    const totalDays = daysInMonth(y, mo);
    const totalPossible = habits.length * totalDays;
    const done = completions.filter(c => c.completed).length;
    const rate = totalPossible > 0 ? Math.round((done / totalPossible) * 100) : 0;

    monthlyData.push({
      month: d.toLocaleString("en-US", { month: "short" }),
      rate,
    });
  }

  // Yearly trend (last 3 years)
  const yearlyData: { year: string; rate: number }[] = [];
  for (let y = 2; y >= 0; y--) {
    const yTarget = year - y;
    const start = new Date(yTarget, 0, 1);
    const end = new Date(yTarget, 11, 31, 23, 59, 59);

    const completions = await prisma.completion.findMany({
      where: { userId, date: { gte: start, lte: end } },
    });

    const totalDays = daysInMonth(yTarget, 0) + daysInMonth(yTarget, 1) + daysInMonth(yTarget, 2) +
      daysInMonth(yTarget, 3) + daysInMonth(yTarget, 4) + daysInMonth(yTarget, 5) +
      daysInMonth(yTarget, 6) + daysInMonth(yTarget, 7) + daysInMonth(yTarget, 8) +
      daysInMonth(yTarget, 9) + daysInMonth(yTarget, 10) + daysInMonth(yTarget, 11);
    const totalPossible = habits.length * totalDays;
    const done = completions.filter(c => c.completed).length;
    const rate = totalPossible > 0 ? Math.round((done / totalPossible) * 100) : 0;

    yearlyData.push({ year: String(yTarget), rate });
  }

  res.json({ weekly: weeklyData, monthly: monthlyData, yearly: yearlyData });
});

router.get("/longest-streak", async (req: any, res) => {
  const userId = req.userId;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const habits = await prisma.habit.findMany({ where: { userId } });

  const result: { id: string; name: string; color: string; streak: number }[] = [];

  for (const habit of habits) {
    const completions = await prisma.completion.findMany({
      where: {
        userId,
        habitId: habit.id,
        date: { gte: startOfMonth, lte: endOfMonth },
        completed: true,
      },
      orderBy: { date: "desc" },
    });

    let streak = 0;
    const completedDates = new Set(completions.map(c => c.date.toISOString().split("T")[0]));
    const today = new Date();
    for (let d = daysInMonth(year, month); d >= 1; d--) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (completedDates.has(dateStr)) {
        streak++;
      } else {
        if (d < today.getDate() || year < today.getFullYear() || month < today.getMonth()) break;
      }
    }

    result.push({ id: habit.id, name: habit.name, color: habit.color, streak });
  }

  result.sort((a, b) => b.streak - a.streak);
  res.json(result);
});

function calculateStreak(completions: any[], habitCount: number) {
  let streak = 0;
  const grouped: Record<string, number> = {};
  for (const c of completions) {
    const key = c.date.toISOString().split("T")[0];
    grouped[key] = (grouped[key] || 0) + (c.completed ? 1 : 0);
  }
  const sortedDates = Object.keys(grouped).sort().reverse();
  for (const date of sortedDates) {
    if (grouped[date] >= habitCount * 0.5) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default router;

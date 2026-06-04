import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate as any);

router.get("/overview", async (req: any, res) => {
  const userId = req.userId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const habits = await prisma.habit.findMany({ where: { userId } });
  const tasks = await prisma.task.findMany({ where: { userId } });

  const completions = await prisma.completion.findMany({
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
  });

  const totalPossible = (habits.length + tasks.length) * daysInMonth(now.getFullYear(), now.getMonth());
  const totalCompleted = completions.filter(c => c.completed).length;
  const overallPercent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const dailyCounts: Record<string, { done: number; total: number }> = {};
  const days = daysInMonth(now.getFullYear(), now.getMonth());
  for (let d = 1; d <= days; d++) {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dailyCounts[dateStr] = { done: 0, total: habits.length + tasks.length };
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

  const streak = calculateStreak(completions, habits.length + tasks.length);

  res.json({
    totalHabits: habits.length,
    totalTasks: tasks.length,
    overallPercent,
    dailyRates,
    streak,
    bestDay: dailyRates.reduce((best, curr) => (curr.rate > (best?.rate || 0) ? curr : best), dailyRates[0]),
  });
});

router.get("/habits", async (req: any, res) => {
  const userId = req.userId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const habits = await prisma.habit.findMany({ where: { userId } });
  const completions = await prisma.completion.findMany({
    where: { userId, habitId: { not: null }, date: { gte: startOfMonth, lte: endOfMonth } },
  });

  const habitRates = habits.map(habit => {
    const habitCompletions = completions.filter(c => c.habitId === habit.id);
    const totalDays = daysInMonth(now.getFullYear(), now.getMonth());
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

  const best = habitRates.reduce((a, b) => (a.rate > b.rate ? a : b), habitRates[0]);
  const worst = habitRates.reduce((a, b) => (a.rate < b.rate ? a : b), habitRates[0]);

  res.json({ habits: habitRates, best, worst });
});

router.get("/weekly", async (req: any, res) => {
  const userId = req.userId;
  const now = new Date();
  const weeks: any[] = [];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const habits = await prisma.habit.findMany({ where: { userId } });
  const tasks = await prisma.task.findMany({ where: { userId } });
  const totalItems = habits.length + tasks.length;

  for (let w = 0; w < 4; w++) {
    const start = new Date(currentYear, currentMonth, w * 7 + 1);
    const end = new Date(currentYear, currentMonth, (w + 1) * 7);
    if (start > endOfMonth(currentYear, currentMonth)) break;

    const completions = await prisma.completion.findMany({
      where: { userId, date: { gte: start, lte: end } },
    });

    const totalPossible = totalItems * 7;
    const done = completions.filter(c => c.completed).length;
    const score = totalPossible > 0 ? Math.round((done / totalPossible) * 100) : 0;

    weeks.push({ week: w + 1, score, done, total: totalPossible });
  }

  res.json(weeks);
});

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0, 23, 59, 59);
}

function calculateStreak(completions: any[], dailyTotal: number) {
  let streak = 0;
  const grouped: Record<string, number> = {};
  for (const c of completions) {
    const key = c.date.toISOString().split("T")[0];
    grouped[key] = (grouped[key] || 0) + (c.completed ? 1 : 0);
  }
  const sortedDates = Object.keys(grouped).sort().reverse();
  for (const date of sortedDates) {
    if (grouped[date] >= dailyTotal * 0.5) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default router;

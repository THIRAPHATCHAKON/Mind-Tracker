import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, Target, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { getMonthName, getWeekDates, getDateString, formatDateShort } from "@/lib/utils";
import type { HabitGroup, Completion, WeekData } from "@/types";

function useWeekNavigation() {
  const now = new Date();
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  });

  const goPrev = useCallback(() => setBaseDate((d) => {
    const next = new Date(d);
    next.setDate(next.getDate() - 7);
    return next;
  }), []);

  const goNext = useCallback(() => setBaseDate((d) => {
    const next = new Date(d);
    next.setDate(next.getDate() + 7);
    return next;
  }), []);

  const goToday = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    setBaseDate(d);
  }, []);

  const weekStart = new Date(baseDate);
  const weekEnd = new Date(baseDate);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [baseDate]);

  const year = weekStart.getFullYear();
  const month = weekStart.getMonth();

  return { weekDays, weekStart, weekEnd, year, month, goPrev, goNext, goToday };
}

export default function WeeklyProgress() {
  const { weekDays, weekStart, weekEnd, year, month, goPrev, goNext, goToday } = useWeekNavigation();
  const [groups, setGroups] = useState<HabitGroup[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  const monthName = getMonthName(month);

  useEffect(() => {
    loadData();
  }, [year, month]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
    const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];
    try {
      const [g, c] = await Promise.all([
        api.habitGroups.list(),
        api.completions.list(monthStart, monthEnd),
      ]);
      setGroups(g);
      setCompletions(c);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  const weekData = useMemo(() => {
    const days = weekDays;
    const totalHabits = groups.reduce((acc, g) => acc + g.habits.length, 0);
    let totalDone = 0;

    for (const group of groups) {
      for (const habit of group.habits) {
        for (const day of days) {
          const ds = day.toISOString().split("T")[0];
          if (completions.some((c) => c.habitId === habit.id && new Date(c.date).toISOString().split("T")[0] === ds && c.completed)) {
            totalDone++;
          }
        }
      }
    }

    const totalPossible = totalHabits * days.length;
    const score = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    return { score, done: totalDone, total: totalPossible, totalHabits };
  }, [groups, completions, weekDays]);

  const isCurrentWeek = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return weekStart <= today && weekEnd >= today;
  }, [weekStart, weekEnd]);

  const circumference = 2 * Math.PI * 80;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Weekly Progress - Mind Tracker</title>
        <meta name="description" content="View your weekly habit tracking progress with detailed insights." />
      </Helmet>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Weekly Progress</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isCurrentWeek ? "default" : "ghost"}
              size="sm"
              onClick={goToday}
            >
              This Week
            </Button>
            <Button variant="outline" size="sm" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {formatDateShort(weekStart)} - {formatDateShort(weekEnd)}
        </p>
      </motion.div>

      {/* Main week overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-48 h-48 -rotate-90" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="80" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                  <circle
                    cx="90" cy="90" r="80"
                    fill="none"
                    stroke={weekData.score >= 80 ? "#22c55e" : weekData.score >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (weekData.score / 100) * circumference}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl font-bold">{weekData.score}%</span>
                    <p className="text-sm text-muted-foreground mt-1">Completion</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{weekData.done}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <Target className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{weekData.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{weekData.totalHabits}</p>
                  <p className="text-xs text-muted-foreground">Habits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
              <CardDescription>Your completion rate for each day of the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weekDays.map((day, index) => {
                  const dateStr = day.toISOString().split("T")[0];
                  const totalHabits = groups.reduce((acc, g) => acc + g.habits.length, 0);
                  const done = completions.filter(
                    (c) => new Date(c.date).toISOString().split("T")[0] === dateStr && c.completed
                  ).length;
                  const rate = totalHabits > 0 ? Math.round((done / totalHabits) * 100) : 0;
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-24 text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                        <span className="block text-xs text-muted-foreground">{day.getDate()}</span>
                      </div>
                      <div className="flex-1">
                        <Progress value={rate} className={`h-3 ${isToday ? "ring-2 ring-primary/30" : ""}`} />
                      </div>
                      <span className={`text-sm font-bold min-w-[3rem] text-right ${
                        rate >= 80 ? "text-emerald-500" : rate >= 50 ? "text-amber-500" : "text-red-500"
                      }`}>
                        {rate}%
                      </span>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {done}/{totalHabits}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly habit view */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Weekly Habit Overview</CardTitle>
            <CardDescription>See how each habit performed this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Habit</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Group</th>
                    {weekDays.map((day, i) => (
                      <th key={i} className="text-center py-2 px-1 font-medium text-muted-foreground text-xs">
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                        <div className="text-xs opacity-70">{day.getDate()}</div>
                      </th>
                    ))}
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) =>
                    group.habits.map((habit) => {
                      let done = 0;
                      return (
                        <tr key={habit.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                              <span className="font-medium">{habit.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground text-xs">{group.name}</td>
                          {weekDays.map((day, i) => {
                            const ds = day.toISOString().split("T")[0];
                            const checked = completions.some(
                              (c) => c.habitId === habit.id && new Date(c.date).toISOString().split("T")[0] === ds && c.completed
                            );
                            if (checked) done++;
                            return (
                              <td key={i} className="text-center py-2 px-1">
                                <div className={`h-6 w-6 rounded-full mx-auto flex items-center justify-center text-xs ${
                                  checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}>
                                  {checked ? "✓" : "—"}
                                </div>
                              </td>
                            );
                          })}
                          <td className={`text-center py-2 px-2 font-bold text-xs ${
                            done >= Math.ceil(weekDays.length * 0.8) ? "text-emerald-500" :
                            done >= Math.ceil(weekDays.length * 0.5) ? "text-amber-500" : "text-red-500"
                          }`}>
                            {Math.round((done / weekDays.length) * 100)}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {groups.every((g) => g.habits.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">No habits created yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

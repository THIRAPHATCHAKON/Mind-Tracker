import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Flame, Target, Plus, CheckCircle2, CalendarDays, Zap, Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { getMonthName, getDaysInMonth } from "@/lib/utils";
import type { Habit, Task, Completion, DailyRate, AnalyticsOverview, HabitRate } from "@/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year] = useState(now.getFullYear());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [habitRates, setHabitRates] = useState<HabitRate[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [newTask, setNewTask] = useState("");

  const monthName = getMonthName(month);
  const daysInMonth = getDaysInMonth(year, month);

  useEffect(() => {
    loadData();
  }, [month]);

  async function loadData() {
    const start = new Date(year, month, 1).toISOString().split("T")[0];
    const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
    const [h, t, c, o, hr] = await Promise.all([
      api.habits.list(),
      api.tasks.list(),
      api.completions.list(start, end),
      api.analytics.overview(),
      api.analytics.habits(),
    ]);
    setHabits(h);
    setTasks(t);
    setCompletions(c);
    setOverview(o);
    setHabitRates(hr.habits || []);
  }

  function getDateString(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isCompleted(itemId: string, type: "habit" | "task", day: number): boolean {
    const dateStr = getDateString(day);
    return completions.some(
      (c) => {
        const cDate = new Date(c.date).toISOString().split("T")[0];
        return cDate === dateStr && (type === "habit" ? c.habitId === itemId : c.taskId === itemId) && c.completed;
      }
    );
  }

  async function toggleCompletion(itemId: string, type: "habit" | "task", day: number) {
    const dateStr = getDateString(day);
    await api.completions.toggle(dateStr, type === "habit" ? itemId : undefined, type === "task" ? itemId : undefined);
    const start = new Date(year, month, 1).toISOString().split("T")[0];
    const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
    const c = await api.completions.list(start, end);
    setCompletions(c);
    const o = await api.analytics.overview();
    setOverview(o);
    const hr = await api.analytics.habits();
    setHabitRates(hr.habits || []);
  }

  async function addHabit() {
    if (!newHabit.trim()) return;
    await api.habits.create(newHabit.trim());
    setNewHabit("");
    const h = await api.habits.list();
    setHabits(h);
  }

  async function addTask() {
    if (!newTask.trim()) return;
    await api.tasks.create(newTask.trim());
    setNewTask("");
    const t = await api.tasks.list();
    setTasks(t);
  }

  function getDailyRate(day: number): number {
    const dateStr = getDateString(day);
    const total = habits.length + tasks.length;
    if (total === 0) return 0;
    const done = completions.filter((c) => {
      const cDate = new Date(c.date).toISOString().split("T")[0];
      return cDate === dateStr && c.completed;
    }).length;
    return Math.round((done / total) * 100);
  }

  function getWeekDates(weekIndex: number) {
    const start = weekIndex * 7 + 1;
    const end = Math.min(start + 6, daysInMonth);
    return { start, end };
  }

  const weeklyData = [0, 1, 2, 3, 4].slice(0, Math.ceil(daysInMonth / 7)).map((w) => {
    const { start, end } = getWeekDates(w);
    let totalDone = 0;
    let totalPossible = 0;
    for (let d = start; d <= end; d++) {
      totalDone += completions.filter((c) => {
        const cDate = new Date(c.date).toISOString().split("T")[0];
        return cDate === getDateString(d) && c.completed;
      }).length;
      totalPossible += habits.length + tasks.length;
    }
    return {
      name: `Week ${w + 1}`,
      rate: totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0,
    };
  });

  const dailyChartData = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    rate: getDailyRate(i + 1),
  }));

  const bestHabit = habitRates.length > 0 ? habitRates.reduce((a, b) => (a.rate > b.rate ? a : b)) : null;
  const worstHabit = habitRates.length > 0 ? habitRates.reduce((a, b) => (a.rate < b.rate ? a : b)) : null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header - Monthly Overview */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold">{monthName} {year}</h2>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="text-sm bg-muted rounded-md px-2 py-1 border border-border"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>{getMonthName(i)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{overview?.overallPercent || 0}%</p>
                  <p className="text-xs text-muted-foreground">Overall</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={overview?.overallPercent || 0} className="h-3" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[
                { icon: CheckCircle2, label: "Habits Done", value: overview?.totalHabits || 0, color: "text-emerald-500" },
                { icon: Target, label: "Tasks Done", value: overview?.totalTasks || 0, color: "text-amber-500" },
                { icon: Flame, label: "Day Streak", value: overview?.streak || 0, color: "text-orange-500" },
                { icon: Zap, label: "Best Day", value: overview?.bestDay?.rate ? `${overview.bestDay.rate}%` : "N/A", color: "text-violet-500" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit & Work Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Habits</CardTitle>
                  <CardDescription>Track your daily habits</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="New habit..."
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                    className="w-40"
                    onKeyDown={(e) => e.key === "Enter" && addHabit()}
                  />
                  <Button size="sm" onClick={addHabit}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Habit</th>
                        {DAYS.map((d) => (
                          <th key={d} className="text-center py-2 px-1 font-medium text-muted-foreground text-xs">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {habits.map((habit) => (
                        <tr key={habit.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.color }} />
                              <span className="font-medium">{habit.name}</span>
                            </div>
                          </td>
                          {Array.from({ length: 7 }, (_, i) => {
                            const day = i + 1;
                            const checked = isCompleted(habit.id, "habit", day);
                            return (
                              <td key={i} className="text-center py-2">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleCompletion(habit.id, "habit", day)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {habits.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-muted-foreground">
                            No habits yet. Add your first habit above!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Work Tasks</CardTitle>
                  <CardDescription>Track your daily work tasks</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="New task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="w-40"
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                  />
                  <Button size="sm" onClick={addTask}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Task</th>
                        {DAYS.map((d) => (
                          <th key={d} className="text-center py-2 px-1 font-medium text-muted-foreground text-xs">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.color }} />
                              <span className="font-medium">{task.name}</span>
                            </div>
                          </td>
                          {Array.from({ length: 7 }, (_, i) => {
                            const day = i + 1;
                            const checked = isCompleted(task.id, "task", day);
                            return (
                              <td key={i} className="text-center py-2">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleCompletion(task.id, "task", day)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {tasks.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-muted-foreground">
                            No tasks yet. Add your first task above!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Daily Success Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Daily Success Summary</CardTitle>
                <CardDescription>Your completion rate for each day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dailyChartData.filter((_, i) => i < 7).map((d) => (
                    <div key={d.day} className="flex items-center gap-4">
                      <span className="w-24 text-sm font-medium capitalize">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][d.day - 1]}
                      </span>
                      <div className="flex-1">
                        <Progress value={d.rate} className="h-2.5" />
                      </div>
                      <span className={`text-sm font-bold min-w-[3rem] text-right ${
                        d.rate >= 80 ? "text-emerald-500" : d.rate >= 50 ? "text-amber-500" : "text-red-500"
                      }`}>
                        {d.rate}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analytics Panel - Right Side */}
        <div className="space-y-6">
          {/* Success Graph */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Target vs Actual */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Target vs Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {weeklyData.map((entry, index) => (
                        <Cell key={index} fill={entry.rate >= 80 ? "#22c55e" : entry.rate >= 50 ? "#f59e0b" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Analysis Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">AI Analysis</CardTitle>
                </div>
                <CardDescription>Insights from your performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Habit Completion Rates</h4>
                  <div className="space-y-2">
                    {habitRates.slice(0, 4).map((h) => (
                      <div key={h.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                        <span className="text-sm flex-1">{h.name}</span>
                        <span className={`text-sm font-bold ${h.rate >= 80 ? "text-emerald-500" : h.rate >= 50 ? "text-amber-500" : "text-red-500"}`}>
                          {h.rate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Productivity Insights</h4>
                  <div className="space-y-2 text-sm">
                    {bestHabit && (
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">
                          <span className="text-foreground font-medium">{bestHabit.name}</span> is your most consistent habit at <span className="text-emerald-500 font-medium">{bestHabit.rate}%</span>
                        </p>
                      </div>
                    )}
                    {worstHabit && bestHabit?.id !== worstHabit.id && (
                      <div className="flex items-start gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">
                          <span className="text-foreground font-medium">{worstHabit.name}</span> needs attention at <span className="text-red-500 font-medium">{worstHabit.rate}%</span>
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Flame className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <p className="text-muted-foreground">
                        Current streak: <span className="text-foreground font-medium">{overview?.streak || 0} days</span>
                      </p>
                    </div>
                    {overview?.bestDay && (
                      <div className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">
                          Best day: <span className="text-foreground font-medium">{overview.bestDay.rate}%</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground italic">
                    {bestHabit && bestHabit.rate >= 80
                      ? `Your "${bestHabit.name}" habit has been consistently strong this month with a ${bestHabit.rate}% completion rate. Keep it up!`
                      : `You're making progress! Focus on consistency to build momentum.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

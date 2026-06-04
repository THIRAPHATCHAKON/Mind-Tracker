import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { getMonthName, getDaysInMonth } from "@/lib/utils";
import type { AnalyticsOverview, HabitRate, WeekData } from "@/types";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899", "#14b8a6"];

export default function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [habitRates, setHabitRates] = useState<HabitRate[]>([]);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const now = new Date();
  const monthName = getMonthName(now.getMonth());
  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());

  useEffect(() => {
    Promise.all([api.analytics.overview(), api.analytics.habits(), api.analytics.weekly()]).then(([o, hr, w]) => {
      setOverview(o);
      setHabitRates(hr.habits || []);
      setWeeks(w);
    });
  }, []);

  const dailyChartData = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    rate: overview?.dailyRates?.[i]?.rate || 0,
  }));

  const pieData = habitRates.map((h) => ({ name: h.name, value: h.rate }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Completion Rate */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Daily Completion Rate</CardTitle>
              <CardDescription>{monthName} - Day by day progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="rate" name="Completion %" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Weekly Completion Rate</CardTitle>
              <CardDescription>Comparing weekly performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tickFormatter={(v) => `W${v}`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Bar dataKey="score" name="Score %" radius={[4, 4, 0, 0]}>
                    {weeks.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Habit Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Habit Distribution</CardTitle>
              <CardDescription>Completion rate by habit</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Analysis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle>AI Insights</CardTitle>
              </div>
              <CardDescription>Smart analysis of your productivity patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {habitRates.length > 0 && (
                <>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Habit Performance</h4>
                    {habitRates.map((h) => (
                      <div key={h.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                          <span className="text-sm">{h.name}</span>
                        </div>
                        <span className={`text-sm font-bold ${h.rate >= 80 ? "text-emerald-500" : h.rate >= 50 ? "text-amber-500" : "text-red-500"}`}>
                          {h.rate}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    {habitRates.filter(h => h.rate >= 80).length > 0 && (
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          Strong habits: {habitRates.filter(h => h.rate >= 80).map(h => h.name).join(", ")}
                        </p>
                      </div>
                    )}
                    {habitRates.filter(h => h.rate < 50).length > 0 && (
                      <div className="flex items-start gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          Needs focus: {habitRates.filter(h => h.rate < 50).map(h => h.name).join(", ")}
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Overall productivity trend:{" "}
                        {overview && overview.overallPercent >= 70
                          ? "Excellent - you're on fire! 🔥"
                          : overview && overview.overallPercent >= 50
                          ? "Good - keep building momentum!"
                          : "Room for improvement - start small!"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

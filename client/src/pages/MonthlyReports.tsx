import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, TrendingUp, Trophy, Flame, BarChart3, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { getMonthName } from "@/lib/utils";
import type { AnalyticsOverview, HabitRate } from "@/types";

export default function MonthlyReports() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [habitRates, setHabitRates] = useState<HabitRate[]>([]);
  const now = new Date();
  const monthName = getMonthName(now.getMonth());

  useEffect(() => {
    Promise.all([api.analytics.overview(), api.analytics.habits()]).then(([o, hr]) => {
      setOverview(o);
      setHabitRates(hr.habits || []);
    });
  }, []);

  const sortedHabits = [...habitRates].sort((a, b) => b.rate - a.rate);
  const best = sortedHabits[0];
  const worst = sortedHabits[sortedHabits.length - 1];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Monthly Reports</h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>{monthName} Summary</CardTitle>
              <CardDescription>Your monthly performance at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4">
                <p className="text-5xl font-bold text-primary">{overview?.overallPercent || 0}%</p>
                <p className="text-sm text-muted-foreground mt-1">Total Completion Rate</p>
                <div className="mt-3">
                  <Progress value={overview?.overallPercent || 0} className="h-3" />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-muted-foreground">Longest Streak</span>
                  </div>
                  <p className="text-2xl font-bold">{overview?.streak || 0} days</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Best Day</span>
                  </div>
                  <p className="text-2xl font-bold">{overview?.bestDay?.rate || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Habits</span>
                  </div>
                  <p className="text-2xl font-bold">{overview?.totalHabits || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-violet-500" />
                    <span className="text-sm text-muted-foreground">Tasks</span>
                  </div>
                  <p className="text-2xl font-bold">{overview?.totalTasks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Habit Rankings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Habit Rankings</CardTitle>
              <CardDescription>Your habits ranked by completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedHabits.map((h, i) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-6 ${i === 0 ? "text-yellow-500" : i === sortedHabits.length - 1 ? "text-red-500" : "text-muted-foreground"}`}>
                      #{i + 1}
                    </span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                    <span className="text-sm flex-1">{h.name}</span>
                    <div className="w-24">
                      <Progress value={h.rate} />
                    </div>
                    <span className={`text-sm font-bold w-10 text-right ${
                      h.rate >= 80 ? "text-emerald-500" : h.rate >= 50 ? "text-amber-500" : "text-red-500"
                    }`}>
                      {h.rate}%
                    </span>
                  </div>
                ))}
                {sortedHabits.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No habits tracked this month.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key takeaways from this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {best && (
                  <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <Flame className="h-5 w-5 text-emerald-500 mb-2" />
                    <h4 className="font-medium text-sm">Most Consistent</h4>
                    <p className="text-lg font-bold">{best.name}</p>
                    <p className="text-sm text-emerald-500">{best.rate}% completion</p>
                  </div>
                )}
                {worst && best?.id !== worst.id && (
                  <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <TrendingUp className="h-5 w-5 text-red-500 mb-2" />
                    <h4 className="font-medium text-sm">Needs Improvement</h4>
                    <p className="text-lg font-bold">{worst.name}</p>
                    <p className="text-sm text-red-500">{worst.rate}% completion</p>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <Trophy className="h-5 w-5 text-amber-500 mb-2" />
                  <h4 className="font-medium text-sm">Longest Streak</h4>
                  <p className="text-lg font-bold">{overview?.streak || 0} days</p>
                  <p className="text-sm text-amber-500">Keep it going!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

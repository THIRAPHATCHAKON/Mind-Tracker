import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  FileText, TrendingUp, Trophy, Flame, BarChart3, Star, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getMonthName, getDaysInMonth } from "@/lib/utils";
import type { AnalyticsOverview, HabitRate, HabitRatesResponse, WeekData, HabitStreak } from "@/types";

export default function MonthlyReports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [habitRates, setHabitRates] = useState<HabitRate[]>([]);
  const [bestHabit, setBestHabit] = useState<HabitRate | null>(null);
  const [worstHabit, setWorstHabit] = useState<HabitRate | null>(null);
  const [mostConsistent, setMostConsistent] = useState<HabitRate | null>(null);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [streaks, setStreaks] = useState<HabitStreak[]>([]);
  const [loading, setLoading] = useState(true);

  const monthName = getMonthName(month);
  const daysInMonth = getDaysInMonth(year, month);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.analytics.overview(year, month),
      api.analytics.habits(year, month),
      api.analytics.weekly(year, month),
      api.analytics.longestStreak(year, month),
    ]).then(([o, hr, w, s]) => {
      setOverview(o);
      const ratesResponse = hr as HabitRatesResponse;
      setHabitRates(ratesResponse.habits || []);
      setBestHabit(ratesResponse.best);
      setWorstHabit(ratesResponse.worst);
      setMostConsistent(ratesResponse.mostConsistent);
      setWeeks(w);
      setStreaks(s);
    }).finally(() => setLoading(false));
  }, [year, month]);

  const sortedHabits = useMemo(() => [...habitRates].sort((a, b) => b.rate - a.rate), [habitRates]);
  const best = sortedHabits[0];
  const worst = sortedHabits[sortedHabits.length - 1];
  const longestStreakItem = streaks[0];

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
        <title>Monthly Reports - Mind Tracker</title>
        <meta name="description" content="View detailed monthly habit tracking reports and performance summaries." />
      </Helmet>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Monthly Reports</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (month === 0) { setYear(year - 1); setMonth(11); }
              else setMonth(month - 1);
            }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">{monthName} {year}</span>
            <Button variant="outline" size="sm" onClick={() => {
              if (month === 11) { setYear(year + 1); setMonth(0); }
              else setMonth(month + 1);
            }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>{monthName} {year} Summary</CardTitle>
              <CardDescription>Your monthly performance at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4">
                <p className="text-5xl font-bold text-primary">{overview?.overallPercent || 0}%</p>
                <p className="text-sm text-muted-foreground mt-1">Monthly Completion Rate</p>
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
                    <span className="text-sm text-muted-foreground">Active Habits</span>
                  </div>
                  <p className="text-2xl font-bold">{overview?.totalHabits || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-violet-500" />
                    <span className="text-sm text-muted-foreground">Days Tracked</span>
                  </div>
                  <p className="text-2xl font-bold">{daysInMonth}</p>
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
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                    <span className="text-sm flex-1">{h.name}</span>
                    <div className="w-24">
                      <Progress value={h.rate} className="h-2" />
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

        {/* Weekly Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Weekly Breakdown</CardTitle>
              <CardDescription>How each week performed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeks.map((week, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Week {week.week}</span>
                      <span className={`text-sm font-bold ${
                        week.score >= 80 ? "text-emerald-500" : week.score >= 50 ? "text-amber-500" : "text-red-500"
                      }`}>
                        {week.score}%
                      </span>
                    </div>
                    <Progress value={week.score} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {week.done} of {week.total} completions
                    </p>
                  </div>
                ))}
                {weeks.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">No weekly data available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key takeaways from this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {best && (
                  <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <Flame className="h-5 w-5 text-emerald-500 mb-2" />
                    <h4 className="font-medium text-sm text-muted-foreground">Most Consistent</h4>
                    <p className="text-lg font-bold">{best.name}</p>
                    <p className="text-sm text-emerald-500">{best.rate}% completion</p>
                  </div>
                )}
                {worst && best?.id !== worst.id && (
                  <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <TrendingUp className="h-5 w-5 text-red-500 mb-2" />
                    <h4 className="font-medium text-sm text-muted-foreground">Needs Improvement</h4>
                    <p className="text-lg font-bold">{worst.name}</p>
                    <p className="text-sm text-red-500">{worst.rate}% completion</p>
                  </div>
                )}
                {longestStreakItem && (
                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <Trophy className="h-5 w-5 text-amber-500 mb-2" />
                    <h4 className="font-medium text-sm text-muted-foreground">Longest Streak</h4>
                    <p className="text-lg font-bold">{longestStreakItem.name}</p>
                    <p className="text-sm text-amber-500">{longestStreakItem.streak} day streak</p>
                  </div>
                )}
                {mostConsistent && (
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <Star className="h-5 w-5 text-blue-500 mb-2" />
                    <h4 className="font-medium text-sm text-muted-foreground">Most Balanced</h4>
                    <p className="text-lg font-bold">{mostConsistent.name}</p>
                    <p className="text-sm text-blue-500">{mostConsistent.rate}% completion</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

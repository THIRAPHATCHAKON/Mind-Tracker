import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Target, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { WeekData } from "@/types";

export default function WeeklyProgress() {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.weekly().then(setWeeks).finally(() => setLoading(false));
  }, []);

  const circumference = 2 * Math.PI * 54;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Weekly Progress</h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {weeks.map((week, index) => {
          const offset = circumference - (week.score / 100) * circumference;
          return (
            <motion.div
              key={week.week}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Week {week.week}</CardTitle>
                  <CardDescription>
                    {new Date(2026, 5, (week.week - 1) * 7 + 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(2026, 5, week.week * 7).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="54"
                        fill="none"
                        stroke={week.score >= 80 ? "#22c55e" : week.score >= 50 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{week.score}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                      <p className="text-sm font-bold">{week.done}</p>
                      <p className="text-xs text-muted-foreground">Done</p>
                    </div>
                    <div>
                      <Target className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                      <p className="text-sm font-bold">{week.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                      <p className="text-sm font-bold">{Math.floor(week.score / 10)}</p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

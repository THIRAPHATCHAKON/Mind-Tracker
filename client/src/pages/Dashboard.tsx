import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
  Plus, CheckCircle2, GripVertical, Pencil, Trash2, X, Check, TrendingUp, Brain,
  TrendingDown, Trophy, ChevronLeft, ChevronRight, Flame, Star, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { getDayNameShort, formatDateRange, getDayDates, getDateStr, getMonthName, getDaysInMonth } from "@/lib/utils";
import type { HabitGroup, Habit, Completion, DailyRate, AnalyticsOverview, HabitRate, HabitRatesResponse, TrendData, WeekData, HabitStreak } from "@/types";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899", "#14b8a6"];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  );
}

function CircularProgress({ value, size = 36, strokeWidth = 3, className = "" }: { value: number; size?: number; strokeWidth?: number; className?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold leading-none" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, subtext }: { icon: any; label: string; value: string | number; color: string; subtext?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
      <Icon className={`h-8 w-8 ${color}`} />
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}

function isCompletedOnDate(completions: Completion[], habitId: string, dateStr: string): boolean {
  return completions.some(
    (c) => c.habitId === habitId && new Date(c.date).toISOString().split("T")[0] === dateStr && c.completed
  );
}

// ---- Compact Habit Row ----
const CompactHabitRow = memo(function CompactHabitRow({
  habit,
  dates,
  completions,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  habit: Habit;
  dates: Date[];
  completions: Completion[];
  onToggle: (habitId: string, dateStr: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onDragStart: (e: any, id: string) => void;
  onDragOver: (e: any) => void;
  onDrop: (e: any, id: string) => void;
}) {
  const done = dates.filter((d) => isCompletedOnDate(completions, habit.id, getDateStr(d))).length;
  const rate = dates.length > 0 ? Math.round((done / dates.length) * 100) : 0;

  return (
    <tr
      draggable
      onDragStart={(e: any) => onDragStart(e, habit.id)}
      onDragOver={(e: any) => onDragOver(e)}
      onDrop={(e: any) => onDrop(e, habit.id)}
      className="border-b border-border/30 hover:bg-muted/20 transition-colors"
    >
      <td className="py-1 px-0.5 w-4 cursor-grab active:cursor-grabbing text-muted-foreground">
        <GripVertical className="h-3 w-3" />
      </td>
      <td className="py-1 px-1">
        <div className="flex items-center gap-1.5 group">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
          <span className="text-xs font-medium truncate max-w-[80px]">{habit.name}</span>
          <div className="hidden group-hover:flex items-center gap-0.5 ml-0.5">
            <button onClick={() => onEdit(habit)} className="text-muted-foreground hover:text-foreground p-0.5">
              <Pencil className="h-2.5 w-2.5" />
            </button>
            <button onClick={() => onDelete(habit.id)} className="text-muted-foreground hover:text-destructive p-0.5">
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      </td>
      {dates.map((d) => {
        const ds = getDateStr(d);
        const checked = isCompletedOnDate(completions, habit.id, ds);
        return (
          <td key={ds} className="text-center py-1 px-0.5">
            <Checkbox
              checked={checked}
              onCheckedChange={() => onToggle(habit.id, ds)}
              className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </td>
        );
      })}
      <td className="text-center py-1 px-1">
        <span className={`text-[10px] font-bold ${
          rate >= 80 ? "text-emerald-500" : rate >= 50 ? "text-amber-500" : "text-red-500"
        }`}>
          {rate}%
        </span>
      </td>
    </tr>
  );
});

// ---- Compact Habit Group Card ----
const CompactGroupCard = memo(function CompactGroupCard({
  group,
  completions,
  onToggle,
  onRename,
  onDelete,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onDragStart,
  onDragOver,
  onDrop,
  onHabitDragStart,
  onHabitDragOver,
  onHabitDrop,
}: {
  group: HabitGroup;
  completions: Completion[];
  onToggle: (habitId: string, dateStr: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddHabit: (groupId: string, name: string) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onDragStart: (e: any, id: string) => void;
  onDragOver: (e: any) => void;
  onDrop: (e: any, id: string) => void;
  onHabitDragStart: (e: any, id: string) => void;
  onHabitDragOver: (e: any) => void;
  onHabitDrop: (e: any, groupId: string, habitId: string) => void;
}) {
  const [newHabitName, setNewHabitName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(group.name);

  const startDate = new Date(group.startDate);
  const endDate = new Date(group.endDate);
  const dates = useMemo(() => getDayDates(startDate, endDate), [group.startDate, group.endDate]);

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== group.name) {
      onRename(group.id, renameValue.trim());
    }
    setRenaming(false);
  };

  const groupCompletion = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const habit of group.habits) {
      for (const d of dates) {
        total++;
        if (isCompletedOnDate(completions, habit.id, getDateStr(d))) done++;
      }
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [group.habits, dates, completions]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-lg shrink-0 w-[300px] flex flex-col"
      draggable
      onDragStart={(e: any) => onDragStart(e, group.id)}
      onDragOver={(e: any) => onDragOver(e)}
      onDrop={(e: any) => onDrop(e, group.id)}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-2.5 py-2 bg-muted/20 border-b border-border group cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {renaming ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-6 text-xs"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
              <button onClick={handleRename} className="text-primary p-0.5"><Check className="h-3 w-3" /></button>
              <button onClick={() => setRenaming(false)} className="text-muted-foreground p-0.5"><X className="h-3 w-3" /></button>
            </div>
          ) : (
            <>
              <span className="text-xs font-semibold truncate">{group.name}</span>
              <button
                onClick={() => { setRenameValue(group.name); setRenaming(true); }}
                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 p-0.5"
              >
                <Pencil className="h-2.5 w-2.5" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground">{formatDateRange(startDate, endDate)}</span>
          <button
            onClick={() => onDelete(group.id)}
            className="text-muted-foreground hover:text-destructive p-0.5 rounded hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Circular progress */}
      <div className="px-2.5 py-1.5 flex items-center justify-center">
        <CircularProgress value={groupCompletion} size={40} strokeWidth={3} />
      </div>

      {/* Habit table */}
      <div className="overflow-x-auto flex-1 px-1">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border/30">
              <th className="w-4" />
              <th className="text-left py-1 px-1 font-medium text-muted-foreground" style={{ fontSize: "9px" }}>Habit</th>
              {dates.map((d) => {
                const today = new Date();
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <th key={getDateStr(d)} className={`text-center py-1 px-0.5 font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`} style={{ fontSize: "9px" }}>
                    {getDayNameShort(d.getDay())}
                    <div className={`text-xs font-bold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
                  </th>
                );
              })}
              <th className="text-center py-1 px-1 font-medium text-muted-foreground" style={{ fontSize: "9px" }}>%</th>
            </tr>
          </thead>
          <tbody>
            {group.habits.map((habit) => (
              <CompactHabitRow
                key={habit.id}
                habit={habit}
                dates={dates}
                completions={completions}
                onToggle={onToggle}
                onEdit={onEditHabit}
                onDelete={onDeleteHabit}
                onDragStart={onHabitDragStart}
                onDragOver={onHabitDragOver}
                onDrop={(e, hid) => onHabitDrop(e, group.id, hid)}
              />
            ))}
          </tbody>
        </table>
        {group.habits.length === 0 && (
          <div className="text-center py-3 text-muted-foreground" style={{ fontSize: "10px" }}>No habits yet</div>
        )}
      </div>

      {/* Add habit */}
      <div className="px-2 py-1.5 border-t border-border/30 mt-auto">
        <div className="flex items-center gap-1">
          <Input
            placeholder="+ habit"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="h-6 text-[11px] px-1.5"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newHabitName.trim()) {
                onAddHabit(group.id, newHabitName.trim());
                setNewHabitName("");
              }
            }}
          />
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
            if (newHabitName.trim()) {
              onAddHabit(group.id, newHabitName.trim());
              setNewHabitName("");
            }
          }}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

// ---- Main Dashboard ----
export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [groups, setGroups] = useState<HabitGroup[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [dailyRates, setDailyRates] = useState<DailyRate[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [habitRates, setHabitRates] = useState<HabitRate[]>([]);
  const [bestHabit, setBestHabit] = useState<HabitRate | null>(null);
  const [worstHabit, setWorstHabit] = useState<HabitRate | null>(null);
  const [mostConsistent, setMostConsistent] = useState<HabitRate | null>(null);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [streaks, setStreaks] = useState<HabitStreak[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editHabitName, setEditHabitName] = useState("");
  const [dragGroupId, setDragGroupId] = useState<string | null>(null);
  const [dragHabitId, setDragHabitId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const monthName = getMonthName(month);
  const daysInMonth = getDaysInMonth(year, month);

  const loadData = useCallback(async () => {
    const [g, o, hr, w, t, s] = await Promise.all([
      api.habitGroups.list(),
      api.analytics.overview(year, month),
      api.analytics.habits(year, month),
      api.analytics.weekly(year, month),
      api.analytics.trends(year, month),
      api.analytics.longestStreak(year, month),
    ]);
    setGroups(g);
    setOverview(o);

    if (g.length > 0) {
      const earliest = new Date(g[0].startDate);
      const latest = new Date(g[g.length - 1].endDate);
      const start = earliest.toISOString().split("T")[0];
      const end = latest.toISOString().split("T")[0];
      const c = await api.completions.list(start, end);
      setCompletions(c);
    } else {
      setCompletions([]);
    }

    if (o?.dailyRates) {
      setDailyRates(o.dailyRates);
    }

    const ratesResponse = hr as HabitRatesResponse;
    setHabitRates(ratesResponse.habits || []);
    setBestHabit(ratesResponse.best);
    setWorstHabit(ratesResponse.worst);
    setMostConsistent(ratesResponse.mostConsistent);
    setWeeks(w);
    setTrends(t);
    setStreaks(s);
  }, [year, month]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleCompletion = useCallback(
    async (habitId: string, dateStr: string) => {
      await api.completions.toggle(dateStr, habitId);
      if (groups.length > 0) {
        const earliest = new Date(groups[0].startDate);
        const latest = new Date(groups[groups.length - 1].endDate);
        const start = earliest.toISOString().split("T")[0];
        const end = latest.toISOString().split("T")[0];
        const c = await api.completions.list(start, end);
        setCompletions(c);
      }
      const o = await api.analytics.overview(year, month);
      if (o?.dailyRates) setDailyRates(o.dailyRates);
      setOverview(o);
    },
    [groups, year, month]
  );

  const addGroup = useCallback(async () => {
    if (!newGroupName.trim()) return;
    await api.habitGroups.create(newGroupName.trim());
    setNewGroupName("");
    loadData();
  }, [newGroupName, loadData]);

  const renameGroup = useCallback(async (id: string, name: string) => {
    await api.habitGroups.update(id, name);
    loadData();
  }, [loadData]);

  const deleteGroup = useCallback(async (id: string) => {
    await api.habitGroups.delete(id);
    loadData();
  }, [loadData]);

  const addHabit = useCallback(async (groupId: string, name: string) => {
    if (!name.trim()) return;
    await api.habits.create(name.trim(), undefined, undefined, groupId);
    loadData();
  }, [loadData]);

  const editHabit = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setEditHabitName(habit.name);
  }, []);

  const saveEditHabit = useCallback(async () => {
    if (!editingHabit || !editHabitName.trim()) return;
    await api.habits.update(editingHabit.id, { name: editHabitName.trim() });
    setEditingHabit(null);
    loadData();
  }, [editingHabit, editHabitName, loadData]);

  const deleteHabit = useCallback(async (habitId: string) => {
    await api.habits.delete(habitId);
    loadData();
  }, [loadData]);

  // Drag and drop
  const handleGroupDragStart = useCallback((e: any, id: string) => {
    setDragGroupId(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleGroupDragOver = useCallback((e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleGroupDrop = useCallback(
    async (e: any, targetId: string) => {
      e.preventDefault();
      if (!dragGroupId || dragGroupId === targetId) return;
      const ids = groups.map((g) => g.id);
      const fromIdx = ids.indexOf(dragGroupId);
      const toIdx = ids.indexOf(targetId);
      ids.splice(fromIdx, 1);
      ids.splice(toIdx, 0, dragGroupId);
      await api.habitGroups.reorder(ids);
      setDragGroupId(null);
      loadData();
    },
    [dragGroupId, groups, loadData]
  );

  const handleHabitDragStart = useCallback((e: any, id: string) => {
    setDragHabitId(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleHabitDragOver = useCallback((e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleHabitDrop = useCallback(
    async (e: any, groupId: string, targetHabitId: string) => {
      e.preventDefault();
      if (!dragHabitId || dragHabitId === targetHabitId) return;
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;
      const ids = group.habits.map((h) => h.id);
      const fromIdx = ids.indexOf(dragHabitId);
      const toIdx = ids.indexOf(targetHabitId);
      if (fromIdx === -1 || toIdx === -1) return;
      ids.splice(fromIdx, 1);
      ids.splice(toIdx, 0, dragHabitId);
      await api.habits.reorder(groupId, ids);
      setDragHabitId(null);
      loadData();
    },
    [dragHabitId, groups, loadData]
  );

  const totalCompletions = useMemo(() => completions.filter((c) => c.completed).length, [completions]);
  const totalHabits = useMemo(() => groups.reduce((acc, g) => acc + g.habits.length, 0), [groups]);
  const overallRate = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const group of groups) {
      const start = new Date(group.startDate);
      const end = new Date(group.endDate);
      const dates = getDayDates(start, end);
      for (const habit of group.habits) {
        for (const d of dates) {
          total++;
          if (isCompletedOnDate(completions, habit.id, getDateStr(d))) done++;
        }
      }
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [groups, completions]);

  const dailyChartData = useMemo(
    () =>
      dailyRates.map((d) => ({
        day: new Date(d.date).getDate(),
        rate: d.rate,
      })),
    [dailyRates]
  );

  const sortedHabits = useMemo(() => [...habitRates].sort((a, b) => b.rate - a.rate), [habitRates]);
  const longestStreakItem = streaks[0];

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <Helmet>
        <title>Dashboard - Mind Tracker</title>
        <meta name="description" content="Track your daily habits and monitor your progress with Mind Tracker's interactive dashboard." />
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{totalHabits} habits</span>
            <span>·</span>
            <span>{groups.length} groups</span>
            <span>·</span>
            <span>{totalCompletions} completions</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          <CircularProgress value={overallRate} size={36} strokeWidth={3} />
        </div>
      </div>

      {/* Group timeline */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Input
              placeholder="New group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="h-7 text-xs w-44"
              onKeyDown={(e) => e.key === "Enter" && addGroup()}
            />
            <Button size="sm" className="h-7 text-xs px-2.5" onClick={addGroup}>
              <Plus className="h-3 w-3 mr-1" /> Group
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin"
          style={{ scrollBehavior: "smooth" }}
        >
          <AnimatePresence mode="popLayout">
            {groups.map((group) => (
              <CompactGroupCard
                key={group.id}
                group={group}
                completions={completions}
                onToggle={toggleCompletion}
                onRename={renameGroup}
                onDelete={deleteGroup}
                onAddHabit={addHabit}
                onEditHabit={editHabit}
                onDeleteHabit={deleteHabit}
                onDragStart={handleGroupDragStart}
                onDragOver={handleGroupDragOver}
                onDrop={handleGroupDrop}
                onHabitDragStart={handleHabitDragStart}
                onHabitDragOver={handleHabitDragOver}
                onHabitDrop={handleHabitDrop}
              />
            ))}
          </AnimatePresence>

          {groups.length === 0 && (
            <div className="flex items-center justify-center w-full h-48 text-muted-foreground">
              <div className="text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Create a group to start tracking</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Trophy} label="Completion Rate" value={`${overview?.overallPercent || 0}%`} color="text-primary" />
          <StatCard icon={Flame} label="Day Streak" value={overview?.streak || 0} color="text-orange-500" subtext="consecutive days" />
          <StatCard icon={Star} label="Best Day" value={overview?.bestDay?.rate ? `${overview.bestDay.rate}%` : "N/A"} color="text-yellow-500" />
          <StatCard icon={Brain} label="Total Habits" value={overview?.totalHabits || 0} color="text-violet-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Daily Completion Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Completion Rate</CardTitle>
              <CardDescription>{monthName} {year} - Day by day progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[1, daysInMonth]} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="rate" name="Completion %" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Completion Rate</CardTitle>
              <CardDescription>Comparing weekly performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tickFormatter={(v) => `W${v}`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<ChartTooltip />} />
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
        </div>

        {/* Habit Performance Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>Habit Performance Ranking</CardTitle>
            <CardDescription>Your habits ranked by completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {bestHabit && (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-500 mb-2" />
                  <h4 className="text-sm font-medium text-muted-foreground">Best Habit</h4>
                  <p className="text-lg font-bold">{bestHabit.name}</p>
                  <p className="text-sm text-emerald-500">{bestHabit.rate}%</p>
                </div>
              )}
              {worstHabit && bestHabit?.id !== worstHabit.id && (
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <TrendingDown className="h-5 w-5 text-red-500 mb-2" />
                  <h4 className="text-sm font-medium text-muted-foreground">Worst Habit</h4>
                  <p className="text-lg font-bold">{worstHabit.name}</p>
                  <p className="text-sm text-red-500">{worstHabit.rate}%</p>
                </div>
              )}
              {mostConsistent && (
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Star className="h-5 w-5 text-blue-500 mb-2" />
                  <h4 className="text-sm font-medium text-muted-foreground">Most Consistent</h4>
                  <p className="text-lg font-bold">{mostConsistent.name}</p>
                  <p className="text-sm text-blue-500">{mostConsistent.rate}%</p>
                </div>
              )}
              {longestStreakItem && (
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <Flame className="h-5 w-5 text-amber-500 mb-2" />
                  <h4 className="text-sm font-medium text-muted-foreground">Longest Streak</h4>
                  <p className="text-lg font-bold">{longestStreakItem.name}</p>
                  <p className="text-sm text-amber-500">{longestStreakItem.streak} day streak</p>
                </div>
              )}
            </div>

            {sortedHabits.length > 0 && (
              <div className="space-y-3">
                {sortedHabits.map((h, i) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-6 ${i === 0 ? "text-yellow-500" : i === sortedHabits.length - 1 ? "text-red-500" : "text-muted-foreground"}`}>
                      #{i + 1}
                    </span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                    <span className="text-sm flex-1">{h.name}</span>
                    <div className="w-32">
                      <Progress value={h.rate} className="h-2" />
                    </div>
                    <span className={`text-sm font-bold w-10 text-right ${
                      h.rate >= 80 ? "text-emerald-500" : h.rate >= 50 ? "text-amber-500" : "text-red-500"
                    }`}>
                      {h.rate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
            {sortedHabits.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">No habits tracked this month.</p>
            )}
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Trend Analysis</CardTitle>
            </div>
            <CardDescription>Weekly, monthly, and yearly trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Weekly Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trends?.weekly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Rate" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3">Monthly Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trends?.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3">Yearly Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trends?.yearly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="rate" fill="#22c55e" radius={[4, 4, 0, 0]} name="Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>AI Insights</CardTitle>
            </div>
            <CardDescription>Smart analysis of your habit patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {habitRates.length > 0 ? (
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
                  {bestHabit && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Best habit: <span className="text-foreground font-medium">{bestHabit.name}</span> at <span className="text-emerald-500">{bestHabit.rate}%</span>
                      </p>
                    </div>
                  )}
                  {worstHabit && bestHabit?.id !== worstHabit.id && (
                    <div className="flex items-start gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Needs focus: <span className="text-foreground font-medium">{worstHabit.name}</span> at <span className="text-red-500">{worstHabit.rate}%</span>
                      </p>
                    </div>
                  )}
                  {longestStreakItem && (
                    <div className="flex items-start gap-2">
                      <Flame className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Longest streak: <span className="text-foreground font-medium">{longestStreakItem.name}</span> - <span className="text-orange-500">{longestStreakItem.streak} days</span>
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Overall: {overview && overview.overallPercent >= 70 ? "Excellent progress! Keep building momentum."
                        : overview && overview.overallPercent >= 50 ? "Good progress! Room for improvement."
                        : "Starting out! Consistency is key."}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No data available yet. Start tracking habits!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Habit Modal */}
      <AnimatePresence>
        {editingHabit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setEditingHabit(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-5 w-full max-w-xs mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-sm mb-3">Edit Habit</h3>
              <Input
                value={editHabitName}
                onChange={(e) => setEditHabitName(e.target.value)}
                autoFocus
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && saveEditHabit()}
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setEditingHabit(null)}>Cancel</Button>
                <Button size="sm" onClick={saveEditHabit}>Save</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

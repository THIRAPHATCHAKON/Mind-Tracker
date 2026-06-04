export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface HabitGroup {
  id: string;
  userId: string;
  name: string;
  order: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  habits: Habit[];
}

export interface Habit {
  id: string;
  userId: string;
  groupId?: string;
  name: string;
  category: string;
  color: string;
  order: number;
  createdAt: string;
}

export interface Completion {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  completed: boolean;
  habit?: Habit;
}

export interface DailyRate {
  date: string;
  rate: number;
  done: number;
  total: number;
}

export interface AnalyticsOverview {
  totalHabits: number;
  overallPercent: number;
  dailyRates: DailyRate[];
  streak: number;
  bestDay: DailyRate;
  daysInMonth: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

export interface HabitRate {
  id: string;
  name: string;
  color: string;
  rate: number;
  done: number;
  total: number;
}

export interface HabitRatesResponse {
  habits: HabitRate[];
  best: HabitRate | null;
  worst: HabitRate | null;
  mostConsistent: HabitRate | null;
}

export interface WeekData {
  week: number;
  score: number;
  done: number;
  total: number;
  startDate: string;
  endDate: string;
}

export interface TrendData {
  weekly: { week: string; rate: number }[];
  monthly: { month: string; rate: number }[];
  yearly: { year: string; rate: number }[];
}

export interface HabitStreak {
  id: string;
  name: string;
  color: string;
  streak: number;
}

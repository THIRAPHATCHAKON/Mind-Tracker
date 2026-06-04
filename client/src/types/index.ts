export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  category: string;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  name: string;
  category: string;
  color: string;
  createdAt: string;
}

export interface Completion {
  id: string;
  userId: string;
  habitId?: string;
  taskId?: string;
  date: string;
  completed: boolean;
  habit?: Habit;
  task?: Task;
}

export interface DailyRate {
  date: string;
  rate: number;
  done: number;
  total: number;
}

export interface AnalyticsOverview {
  totalHabits: number;
  totalTasks: number;
  overallPercent: number;
  dailyRates: DailyRate[];
  streak: number;
  bestDay: DailyRate;
}

export interface HabitRate {
  id: string;
  name: string;
  color: string;
  rate: number;
  done: number;
  total: number;
}

export interface WeekData {
  week: number;
  score: number;
  done: number;
  total: number;
}

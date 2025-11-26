
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  source: string; // Source for income, Category for expense
  date: string;
  tags?: string[];
  notes?: string;
}

export interface Pot {
  id: string;
  name: string;
  percentage: number;
  balance: number;
}

export interface RecommendedAction {
  title: string;
  why: string;
  how: string;
}

export interface IAAnalysis {
  baseline: number;
  buffer: number;
  allocation_rules: {
    name: string;
    percentage: number;
  }[];
  predicted_deficit: boolean;
  recommended_actions: RecommendedAction[];
}

export enum TaskStatus {
  PENDING = 'PENDING',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'Faible',
  MEDIUM = 'Moyenne',
  HIGH = 'Haute'
}

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
}

export interface Profile {
  name: string;
  age: number | null;
  monthlyGoal: number | null;
  photo: string | null; // Base64 string for the image
  badges: string[];
}

export type Plan = 'free' | 'pro' | 'ultimate';

export interface FinancialPlan {
  id: string;
  createdAt: string;
  // Form fields
  incomeGoal: number;
  currentIncome: number;
  expenseGoal: number;
  savingsGoal: number;
  investmentGoal: number;
  leisureGoal: number;
  budgetLimit: number;
  // Calculated fields
  weeklySpendingLimit: number;
  weeklySavingsTarget: number;
  dailySavingsTarget: number;
  weeklyInvestmentTarget: number;
  minDailyIncome: number;
  remainingCash: number;
  discretionarySpending: number;
  isRealistic: boolean;
}

// --- AUTH TYPES ---

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface UserData {
  transactions: Transaction[];
  pots: Pot[];
  profile: Profile;
  plan: Plan;
  xp: number;
  tasks: Task[];
  financialPlan: FinancialPlan | null;
}

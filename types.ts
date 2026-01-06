
export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  role: 'admin' | 'user';
  name: string;
}

export interface Expense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  week: string;
  year: number;
  months?: number[];
  isInstallment?: boolean;
  totalInstallments?: number;
  currentInstallment?: number;
  startDate?: string;
  // Fix: Added optional fields for debt management and strategy used in FinancialStrategy.tsx
  initialBalance?: number;
  interestRate?: number;
}

export interface Income {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  date: string;
}

export interface Payment {
  id: string;
  userId: string;
  expenseId: string;
  expenseName: string;
  category?: string; 
  amount: number;
  date: string;
  note?: string;
  discountAmount?: number;
  discountGoalId?: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
}

export interface GoalTransaction {
  id: string;
  amount: number;
  date: string;
  bankAccountId: string;
  note?: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  transactions?: GoalTransaction[];
}

export enum Tab {
  DASHBOARD = 'dashboard',
  INCOME = 'ingresos',
  EXPENSES = 'gastos fijos',
  PAYMENTS = 'pagos',
  PROGRESS = 'metas',
  STRATEGY = 'estrategia'
}

export const CATEGORIES = [
  'Vivienda', 'Servicios', 'Alimentación', 'Transporte', 'Seguros', 
  'Deudas', 'Tarjetas', 'Entretenimiento', 'Educación', 'Salud', 'Otros'
];

export const WEEKS = ['S1', 'S2', 'S3', 'S4'];
export const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

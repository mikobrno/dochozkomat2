export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
  hourlyRate: number;
  monthlyDeductions: number; // Informativní částka odvodů
  isActive: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  projectId: string;
  description?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

export interface MonthlyReport {
  month: string;
  totalHours: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
}

export interface FilterOptions {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  filterType?: 'month' | 'year' | 'custom';
}

export interface Settings {
  id: string;
  companyName: string;
  taxRate: number;
  socialInsuranceRate: number;
  healthInsuranceRate: number;
  currency: string;
  workingHoursPerDay: number;
  workingDaysPerWeek: number;
}
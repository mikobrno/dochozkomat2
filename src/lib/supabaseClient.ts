import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          password: string;
          role: 'admin' | 'employee';
          hourlyRate: number;
          monthlyDeductions: number;
          isActive: boolean;
          createdAt: string;
        };
        Insert: {
          id?: string;
          firstName: string;
          lastName: string;
          email: string;
          password: string;
          role: 'admin' | 'employee';
          hourlyRate: number;
          monthlyDeductions: number;
          isActive?: boolean;
          createdAt?: string;
        };
        Update: {
          id?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
          password?: string;
          role?: 'admin' | 'employee';
          hourlyRate?: number;
          monthlyDeductions?: number;
          isActive?: boolean;
          createdAt?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          isActive: boolean;
          createdAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          isActive?: boolean;
          createdAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          isActive?: boolean;
          createdAt?: string;
        };
      };
      time_entries: {
        Row: {
          id: string;
          userId: string;
          date: string;
          startTime: string;
          endTime: string;
          hoursWorked: number;
          projectId: string;
          description: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          date: string;
          startTime: string;
          endTime: string;
          hoursWorked: number;
          projectId: string;
          description?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          date?: string;
          startTime?: string;
          endTime?: string;
          hoursWorked?: number;
          projectId?: string;
          description?: string | null;
          createdAt?: string;
        };
      };
    };
  };
}
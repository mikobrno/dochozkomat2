import { supabase } from '../lib/supabaseClient';
import { User, Project, TimeEntry } from '../types';

// User operations with Supabase Auth integration
export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('createdAt', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  // Transform profiles to User type
  return (data || []).map(profile => ({
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: '', // Email is managed by Supabase Auth
    password: '', // Password is managed by Supabase Auth
    role: profile.role,
    hourlyRate: profile.hourlyRate,
    monthlyDeductions: profile.monthlyDeductions,
    isActive: profile.isActive,
    createdAt: profile.createdAt
  }));
};

export const createUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
  hourlyRate: number;
  monthlyDeductions: number;
}): Promise<User | null> => {
  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        hourlyRate: userData.hourlyRate,
        monthlyDeductions: userData.monthlyDeductions
      }
    }
  });

  if (authError) {
    console.error('Error creating user:', authError);
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Failed to create user');
  }

  // Return user data
  return {
    id: authData.user.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: '', // Don't return password
    role: userData.role,
    hourlyRate: userData.hourlyRate,
    monthlyDeductions: userData.monthlyDeductions,
    isActive: true,
    createdAt: authData.user.created_at
  };
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      firstName: updates.firstName,
      lastName: updates.lastName,
      role: updates.role,
      hourlyRate: updates.hourlyRate,
      monthlyDeductions: updates.monthlyDeductions,
      isActive: updates.isActive
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: '', // Email is managed by Supabase Auth
    password: '', // Password is managed by Supabase Auth
    role: data.role,
    hourlyRate: data.hourlyRate,
    monthlyDeductions: data.monthlyDeductions,
    isActive: data.isActive,
    createdAt: data.createdAt
  };
};

export const deleteUser = async (id: string): Promise<boolean> => {
  // Note: User deletion from auth.users requires service role key
  // This operation cannot be performed from client-side with anonymous key
  // For now, we'll just deactivate the user in profiles table
  const { error } = await supabase
    .from('profiles')
    .update({ isActive: false })
    .eq('id', id);

  if (error) {
    console.error('Error deactivating user:', error);
    return false;
  }

  return true;
};

// Project operations
export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('createdAt', { ascending: true });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return data || [];
};

export const createProject = async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw new Error(error.message);
  }

  return data;
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw new Error(error.message);
  }

  return data;
};

// Time entry operations
export const getTimeEntries = async (): Promise<TimeEntry[]> => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching time entries:', error);
    return [];
  }

  return data || [];
};

export const createTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'createdAt'>): Promise<TimeEntry | null> => {
  const { data, error } = await supabase
    .from('time_entries')
    .insert([entry])
    .select()
    .single();

  if (error) {
    console.error('Error creating time entry:', error);
    throw new Error(error.message);
  }

  return data;
};

export const updateTimeEntry = async (id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | null> => {
  const { data, error } = await supabase
    .from('time_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating time entry:', error);
    throw new Error(error.message);
  }

  return data;
};

export const deleteTimeEntry = async (id: string): Promise<boolean> => {
  console.log('deleteTimeEntry called with ID:', id);
  
  if (!id) {
    console.error('No ID provided for deletion');
    return false;
  }
  
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting time entry:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return false;
  }

  console.log('Time entry deleted successfully');
  return true;
};

// Authentication with Supabase Auth
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Error authenticating user:', error);
    return null;
  }

  if (!data.user) {
    return null;
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    
    // If profile doesn't exist, try to create one for existing auth users
    if (profileError.code === 'PGRST116') { // No rows returned
      console.log('Profile not found, attempting to create one...');
      
      // Try to create a basic profile for the authenticated user
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          firstName: data.user.email?.split('@')[0] || 'User',
          lastName: 'Name',
          role: 'employee',
          hourlyRate: 450,
          monthlyDeductions: 8500,
          isActive: true
        }])
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating profile:', createError);
        return null;
      }
      
      return {
        id: newProfile.id,
        firstName: newProfile.firstName,
        lastName: newProfile.lastName,
        email: data.user.email || '',
        password: '',
        role: newProfile.role,
        hourlyRate: newProfile.hourlyRate,
        monthlyDeductions: newProfile.monthlyDeductions,
        isActive: newProfile.isActive,
        createdAt: newProfile.createdAt
      };
    }
    
    return null;
  }

  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: data.user.email || '',
    password: '', // Don't return password
    role: profile.role,
    hourlyRate: profile.hourlyRate,
    monthlyDeductions: profile.monthlyDeductions,
    isActive: profile.isActive,
    createdAt: profile.createdAt
  };
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    return null;
  }

  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: user.email || '',
    password: '', // Don't return password
    role: profile.role,
    hourlyRate: profile.hourlyRate,
    monthlyDeductions: profile.monthlyDeductions,
    isActive: profile.isActive,
    createdAt: profile.createdAt
  };
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  
  if (error && error.message !== 'session_not_found') {
    console.error('Error during sign out:', error);
    throw error;
  }
  
  if (error && error.message === 'session_not_found') {
    console.warn('Session was already expired or invalid, but user is now logged out');
  }
};

// Utility functions
export const calculateGrossSalary = (hours: number, hourlyRate: number): number => {
  // Hrubá mzda = hodiny × sazba + příspěvky zaměstnavatele (33.8%)
  const baseSalary = hours * hourlyRate;
  const employerContributions = baseSalary * 0.338; // 25% sociální + 9% zdravotní pojištění
  return baseSalary + employerContributions;
};

export const calculateNetSalary = (hours: number, hourlyRate: number): number => {
  // Čistá mzda = hodiny × sazba (bez příspěvků)
  return hours * hourlyRate;
};

export const calculateHoursFromTime = (startTime: string, endTime: string): number => {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  // Handle overnight shifts
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  const diffMs = end.getTime() - start.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  
  return Math.round(hours * 100) / 100; // Round to 2 decimal places
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
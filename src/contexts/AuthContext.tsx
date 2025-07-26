import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authenticateUser, getCurrentUser, signOut, createUser } from '../utils/supabaseStorage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in via Supabase session
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking current user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const authenticatedUser = await authenticateUser(email, password);
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const newUser = await createUser({
        ...userData,
        role: 'employee',
        hourlyRate: 450,
        monthlyDeductions: 8500
      });

      if (newUser) {
        // After successful registration, log the user in
        const loginSuccess = await login(userData.email, userData.password);
        setIsLoading(false);
        return { success: loginSuccess };
      }
      
      setIsLoading(false);
      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      setIsLoading(false);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        errorMessage = 'An account with this email already exists.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
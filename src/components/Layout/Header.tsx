import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Vítejte zpět, {user?.firstName} {user?.lastName}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user?.role === 'admin' ? 'Administrátor' : 'Zaměstnanec'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Odhlásit se</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
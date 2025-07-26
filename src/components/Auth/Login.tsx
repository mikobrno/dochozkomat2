import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle, Loader2, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type AuthMode = 'login' | 'register';

export const Login: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login, register, isLoading } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    });
    setError('');
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
    setIsSubmitting(false);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError('Prosím vyplňte všechna povinná pole');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Prosím zadejte platný email');
      return false;
    }

    if (formData.password.length < 4) {
      setError('Heslo musí mít alespoň 4 znaky');
      return false;
    }

    if (authMode === 'register') {
      if (!formData.firstName || !formData.lastName) {
        setError('Prosím vyplňte jméno a příjmení');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Hesla se neshodují');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (authMode === 'login') {
        const success = await login(formData.email, formData.password);
        if (!success) {
          setError('Neplatné přihlašovací údaje nebo neaktivní účet.');
        }
      } else {
        // Registration
        const result = await register({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password
        });

        if (!result.success) {
          setError(result.error || 'Registrace se nezdařila. Zkuste to znovu.');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError('Došlo k neočekávané chybě. Zkuste to znovu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentLoading = isLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Evidence docházky
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {authMode === 'login' ? 'Přihlaste se do svého účtu' : 'Vytvořte si nový účet'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {authMode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Křestní jméno
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required={authMode === 'register'}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Jan"
                      disabled={currentLoading}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Příjmení
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required={authMode === 'register'}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Novák"
                      disabled={currentLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="vas.email@firma.cz"
                  disabled={currentLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Heslo
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Zadejte heslo"
                  disabled={currentLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={currentLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {authMode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Potvrdit heslo
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required={authMode === 'register'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Potvrďte heslo"
                    disabled={currentLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={currentLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={currentLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {currentLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  {authMode === 'login' ? 'Přihlašování...' : 'Registrování...'}
                </>
              ) : (
                authMode === 'login' ? 'Přihlásit se' : 'Registrovat se'
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">nebo</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              {authMode === 'login' ? (
                <p className="text-sm text-gray-600">
                  Nemáte účet?{' '}
                  <button
                    onClick={() => switchMode('register')}
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                    disabled={currentLoading}
                  >
                    Registrujte se zde
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Již máte účet?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                    disabled={currentLoading}
                  >
                    Přihlaste se zde
                  </button>
                </p>
              )}
            </div>
          </div>

          {authMode === 'login' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 space-y-2">
                <p className="font-medium">Testovací účty:</p>
                <div className="space-y-1">
                  <p><strong>Admin:</strong> admin@firma.cz / admin123</p>
                  <p><strong>Jan Novák:</strong> jan.novak@firma.cz / heslo123</p>
                  <p><strong>Marie Svobodová:</strong> marie.svobodova@firma.cz / heslo123</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
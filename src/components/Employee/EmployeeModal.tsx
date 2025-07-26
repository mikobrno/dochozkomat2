import React, { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { User as UserType } from '../../types'; // Alias to avoid conflict with Lucide icon
import { createUser, updateUser, getUsers } from '../../utils/storage'; // Import storage functions

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
  onSuccess: () => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  editingId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    hourlyRate: 450,
    deductions: 0,
    projectName: '',
    projectDescription: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingId) {
      const users = getUsers();
      const user = users.find(u => u.id === editingId);
      if (user) {
        setFormData({
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          password: user.password,
          hourlyRate: user.hourlyRate,
          deductions: user.deductions,
          projectName: user.projectName || '',
          projectDescription: user.projectDescription || ''
        });
      }
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        hourlyRate: 450,
        deductions: 0,
        projectName: '',
        projectDescription: ''
      });
    }
  }, [editingId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Jméno je povinné';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Jméno musí mít alespoň 2 znaky';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Příjmení je povinné';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Příjmení musí mít alespoň 2 znaky';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Uživatelské jméno je povinné';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Uživatelské jméno musí mít alespoň 3 znaky';
    } else {
      // Check if username already exists (for new users or different user being edited)
      const users = getUsers();
      const existingUser = users.find(u => 
        u.username.toLowerCase() === formData.username.trim().toLowerCase() && 
        u.id !== editingId
      );
      if (existingUser) {
        newErrors.username = 'Toto uživatelské jméno je již použito';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Heslo je povinné';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Heslo musí mít alespoň 4 znaky';
    }

    if (formData.hourlyRate <= 0) {
      newErrors.hourlyRate = 'Hodinová sazba musí být větší než 0';
    } else if (formData.hourlyRate > 10000) {
      newErrors.hourlyRate = 'Hodinová sazba se zdá příliš vysoká';
    }

    if (formData.deductions < 0) {
      newErrors.deductions = 'Srážky nemohou být záporné';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        password: formData.password,
        role: 'employee' as const,
        hourlyRate: formData.hourlyRate,
        deductions: formData.deductions,
        projectName: formData.projectName.trim() || undefined,
        projectDescription: formData.projectDescription.trim() || undefined
      };

      if (editingId) {
        await updateUser(editingId, userData); // Update existing user
      } else {
        await createUser(userData); // Create new user
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      setErrors({ submit: 'Nepodařilo se uložit zaměstnance. Zkuste to znovu.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingId ? 'Upravit zaměstnance' : 'Přidat zaměstnance'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Křestní jméno
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Jan"
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Příjmení
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Novák"
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uživatelské jméno
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="jan.novak"
                />
                {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heslo
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Zadejte heslo"
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hodinová sazba (Kč)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.hourlyRate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="450"
                  />
                  {errors.hourlyRate && <p className="mt-1 text-xs text-red-600">{errors.hourlyRate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Srážky (Kč)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.deductions ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {errors.deductions && <p className="mt-1 text-xs text-red-600">{errors.deductions}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Název projektu <span className="text-gray-400">(volitelné)</span>
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="E-commerce platforma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Popis projektu <span className="text-gray-400">(volitelné)</span>
                </label>
                <textarea
                  value={formData.projectDescription}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Stručný popis projektu na kterém zaměstnanec pracuje"
                />
              </div>
              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'Ukládám...' : (editingId ? 'Aktualizovat' : 'Uložit')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
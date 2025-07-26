import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TimeEntry } from '../../types';
import { 
  createTimeEntry, 
  updateTimeEntry, 
  getTimeEntries,
  getUsers 
} from '../../utils/supabaseStorage';

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
}

export const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
  isOpen,
  onClose,
  editingId
}) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    userId: user?.id || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    hoursWorked: 8,
    projectName: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  React.useEffect(() => {
    const loadEmployees = async () => {
      try {
        const users = await getUsers();
        setEmployees(users.filter(u => u.role === 'employee'));
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };

    loadEmployees();
  }, []);

  useEffect(() => {
    if (editingId) {
      const loadEntry = async () => {
        try {
          const entries = await getTimeEntries();
          const entry = entries.find(e => e.id === editingId);
          if (entry) {
            setFormData({
              userId: entry.userId,
              date: entry.date,
              startTime: entry.startTime,
              endTime: entry.endTime,
              hoursWorked: entry.hoursWorked,
              projectName: entry.projectId, // Note: Changed from projectName to projectId
              description: entry.description
            });
          }
        } catch (error) {
          console.error('Error loading entry:', error);
        }
      };
      loadEntry();
    } else {
      setFormData({
        userId: user?.id || '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        hoursWorked: 8,
        projectName: '',
        description: ''
      });
    }
  }, [editingId, user]);

  const calculateHours = (start: string, end: string): number => {
    const startTime = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);
    const diffMs = endTime.getTime() - startTime.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    if (field === 'startTime' || field === 'endTime') {
      const hours = calculateHours(
        field === 'startTime' ? value : formData.startTime,
        field === 'endTime' ? value : formData.endTime
      );
      newFormData.hoursWorked = Math.round(hours * 100) / 100;
    }
    
    setFormData(newFormData);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) newErrors.userId = 'Please select an employee';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.projectName.trim()) newErrors.projectName = 'Project name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.hoursWorked <= 0) newErrors.hoursWorked = 'Hours worked must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const entryData = {
        ...formData,
        projectName: formData.projectName.trim(),
        description: formData.description.trim()
      };

      if (editingId) {
        await updateTimeEntry(editingId, entryData);
      } else {
        await createTimeEntry(entryData);
      }

      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error saving time entry:', error);
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
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Upravit časový záznam' : 'Přidat časový záznam'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zaměstnanec
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.userId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Vyberte zaměstnance</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  {errors.userId && <p className="mt-1 text-xs text-red-600">{errors.userId}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Odpracované hodiny
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    value={formData.hoursWorked}
                    onChange={(e) => setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.hoursWorked ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.hoursWorked && <p className="mt-1 text-xs text-red-600">{errors.hoursWorked}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Začátek
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.startTime ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.startTime && <p className="mt-1 text-xs text-red-600">{errors.startTime}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konec
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.endTime ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.endTime && <p className="mt-1 text-xs text-red-600">{errors.endTime}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Název projektu
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.projectName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Zadejte název projektu"
                />
                {errors.projectName && <p className="mt-1 text-xs text-red-600">{errors.projectName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Popis
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Popište vykonanou práci"
                />
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
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
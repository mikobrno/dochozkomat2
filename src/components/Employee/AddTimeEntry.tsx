import React, { useState } from 'react';
import { Save, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createTimeEntry, getProjects, calculateHoursFromTime } from '../../utils/supabaseStorage';
import { useNavigate } from 'react-router-dom';

export const AddTimeEntry: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    hoursWorked: 8,
    projectId: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await getProjects();
        setProjects(projectsData.filter(p => p.isActive));
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, []);

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    // Automatically calculate hours when both times are set
    if (newFormData.startTime && newFormData.endTime) {
      const calculatedHours = calculateHoursFromTime(newFormData.startTime, newFormData.endTime);
      newFormData.hoursWorked = calculatedHours;
    }
    
    setFormData(newFormData);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Datum je povinné';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Čas začátku je povinný';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Čas konce je povinný';
    }

    if (formData.startTime && formData.endTime) {
      const hours = calculateHoursFromTime(formData.startTime, formData.endTime);
      if (hours <= 0) {
        newErrors.endTime = 'Čas konce musí být po času začátku';
      } else if (hours > 24) {
        newErrors.endTime = 'Pracovní doba nemůže být delší než 24 hodin';
      }
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Projekt je povinný';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await createTimeEntry({
        userId: user.id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hoursWorked: formData.hoursWorked,
        projectId: formData.projectId,
        description: formData.description.trim() || undefined
      });

      setSuccessMessage('Záznam byl úspěšně přidán!');
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        hoursWorked: 8,
        projectId: '',
        description: ''
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating time entry:', error);
      setErrors({ submit: 'Nepodařilo se uložit záznam. Zkuste to znovu.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Přidat záznam</h1>
        <p className="mt-1 text-sm text-gray-600">
          Zaznamenejte odpracované hodiny
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Nový časový záznam</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Čas začátku
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Čas konce
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Celkem hodin
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <span className="text-lg font-semibold text-gray-900">
                    {formData.hoursWorked}h
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Automaticky vypočítáno</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projekt
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.projectId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Vyberte projekt</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && <p className="mt-1 text-xs text-red-600">{errors.projectId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Popis práce <span className="text-gray-400">(volitelné)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Stručný popis vykonané práce..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Ukládám...' : 'Uložit záznam'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
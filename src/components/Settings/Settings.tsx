import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, Building2, DollarSign, Clock } from 'lucide-react';
import { getSettings, saveSettings } from '../../utils/storage'; // Import storage functions
import { Settings as SettingsType } from '../../types';

export const Settings: React.FC = () => {
  const [formData, setFormData] = useState<SettingsType>({
    id: '',
    companyName: '',
    taxRate: 15,
    socialInsuranceRate: 6.5,
    healthInsuranceRate: 4.5,
    currency: 'CZK',
    workingHoursPerDay: 8,
    workingDaysPerWeek: 5
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const settings = getSettings();
    setFormData(settings);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (formData.taxRate < 0 || formData.taxRate > 50) {
      newErrors.taxRate = 'Tax rate must be between 0% and 50%';
    }

    if (formData.socialInsuranceRate < 0 || formData.socialInsuranceRate > 20) {
      newErrors.socialInsuranceRate = 'Social insurance rate must be between 0% and 20%';
    }

    if (formData.healthInsuranceRate < 0 || formData.healthInsuranceRate > 20) {
      newErrors.healthInsuranceRate = 'Health insurance rate must be between 0% and 20%';
    }

    if (formData.workingHoursPerDay < 1 || formData.workingHoursPerDay > 24) {
      newErrors.workingHoursPerDay = 'Working hours per day must be between 1 and 24';
    }

    if (formData.workingDaysPerWeek < 1 || formData.workingDaysPerWeek > 7) {
      newErrors.workingDaysPerWeek = 'Working days per week must be between 1 and 7';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const updatedSettings = {
        ...formData,
        companyName: formData.companyName.trim()
      };

      saveSettings(updatedSettings);
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrors({ submit: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
        <p className="mt-1 text-sm text-gray-600">
          Konfigurace nastavení aplikace a parametrů společnosti
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <SettingsIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Nastavení aplikace</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">Nastavení bylo úspěšně uloženo!</p>
            </div>
          )}

          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              <h3 className="text-base font-medium text-gray-900">Informace o společnosti</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Název společnosti
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.companyName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Zadejte název společnosti"
                />
                {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Měna
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CZK">Česká koruna (CZK)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Americký dolar (USD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tax and Insurance Rates */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <h3 className="text-base font-medium text-gray-900">Daňové a pojistné sazby</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daňová sazba (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.taxRate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.taxRate && <p className="mt-1 text-xs text-red-600">{errors.taxRate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sociální pojištění (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={formData.socialInsuranceRate}
                  onChange={(e) => setFormData({ ...formData, socialInsuranceRate: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.socialInsuranceRate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.socialInsuranceRate && <p className="mt-1 text-xs text-red-600">{errors.socialInsuranceRate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zdravotní pojištění (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={formData.healthInsuranceRate}
                  onChange={(e) => setFormData({ ...formData, healthInsuranceRate: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.healthInsuranceRate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.healthInsuranceRate && <p className="mt-1 text-xs text-red-600">{errors.healthInsuranceRate}</p>}
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <h3 className="text-base font-medium text-gray-900">Pracovní doba</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pracovních hodin za den
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.workingHoursPerDay}
                  onChange={(e) => setFormData({ ...formData, workingHoursPerDay: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.workingHoursPerDay ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.workingHoursPerDay && <p className="mt-1 text-xs text-red-600">{errors.workingHoursPerDay}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pracovních dnů v týdnu
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={formData.workingDaysPerWeek}
                  onChange={(e) => setFormData({ ...formData, workingDaysPerWeek: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.workingDaysPerWeek ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.workingDaysPerWeek && <p className="mt-1 text-xs text-red-600">{errors.workingDaysPerWeek}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Ukládám...' : 'Uložit nastavení'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
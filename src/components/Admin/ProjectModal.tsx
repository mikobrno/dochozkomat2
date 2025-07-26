import React, { useState, useEffect } from 'react';
import { X, Save, FolderOpen } from 'lucide-react';
import { createProject, updateProject, getProjects } from '../../utils/supabaseStorage';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
  onSuccess: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  editingId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingId) {
      const loadProject = async () => {
        try {
          const projects = await getProjects();
          const project = projects.find(p => p.id === editingId);
          if (project) {
            setFormData({
              name: project.name
            });
          }
        } catch (error) {
          console.error('Error loading project:', error);
        }
      };
      loadProject();
    } else {
      setFormData({
        name: ''
      });
    }
  }, [editingId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Název projektu je povinný';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Název projektu musí mít alespoň 2 znaky';
    } else {
      // Kontrola duplicitního názvu
      // Note: This validation will be done on the server side with Supabase
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const projectData = {
        name: formData.name.trim(),
        isActive: true
      };

      if (editingId) {
        await updateProject(editingId, projectData);
      } else {
        await createProject(projectData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      setErrors({ submit: 'Nepodařilo se uložit projekt. Zkuste to znovu.' });
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
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingId ? 'Upravit projekt' : 'Přidat projekt'}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Název projektu
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Zadejte název projektu"
                  autoFocus
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
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
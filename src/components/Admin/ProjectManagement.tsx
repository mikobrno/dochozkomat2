import React, { useState } from 'react';
import { Plus, Edit2, Archive, FolderOpen, CheckCircle, XCircle } from 'lucide-react';
import { getProjects, createProject, updateProject } from '../../utils/supabaseStorage';
import { Project } from '../../types';
import { ProjectModal } from './ProjectModal';
import { format } from 'date-fns';

export const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);
  const refreshProjects = () => {
    const loadProjects = async () => {
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  };

  const toggleProjectStatus = async (id: string, isActive: boolean) => {
    await updateProject(id, { isActive });
    refreshProjects();
  };

  const filteredProjects = projects.filter(project => 
    showArchived ? !project.isActive : project.isActive
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Správa projektů</h1>
          <p className="mt-1 text-sm text-gray-600">
            Správa projektů pro evidenci docházky
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 border rounded-lg transition-colors duration-200 ${
              showArchived
                ? 'bg-gray-100 text-gray-700 border-gray-300'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showArchived ? 'Zobrazit aktivní' : 'Zobrazit archivované'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Přidat projekt</span>
          </button>
        </div>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktivní projekty</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Archive className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Archivované projekty</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => !p.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Celkem projektů</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabulka projektů */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {showArchived ? 'Archivované projekty' : 'Aktivní projekty'}
          </h3>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {showArchived ? 'Žádné archivované projekty' : 'Žádné aktivní projekty'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {showArchived 
                ? 'Všechny projekty jsou aktivní.' 
                : 'Začněte přidáním prvního projektu.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Název projektu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vytvořeno
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FolderOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {project.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleProjectStatus(project.id, !project.isActive)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          project.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {project.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aktivní
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Archivovaný
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(project.createdAt), 'dd.MM.yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingProject(project.id);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleProjectStatus(project.id, !project.isActive)}
                          className="text-amber-600 hover:text-amber-900 transition-colors duration-200"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pro přidání/úpravu projektu */}
      {isModalOpen && (
        <ProjectModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProject(null);
          }}
          editingId={editingProject}
          onSuccess={refreshProjects}
        />
      )}
    </div>
  );
};
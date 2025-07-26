import React, { useState } from 'react';
import { Plus, Edit2, Trash2, UserCheck, DollarSign, Mail } from 'lucide-react';
import { getUsers, deleteUser } from '../../utils/supabaseStorage';
import { User } from '../../types';
import { EmployeeModal } from './EmployeeModal';
import { format } from 'date-fns';

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>(
    []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const users = await getUsers();
        setEmployees(users.filter(u => u.role === 'employee'));
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);
  const refreshEmployees = () => {
    const loadEmployees = async () => {
      try {
        const users = await getUsers();
        setEmployees(users.filter(u => u.role === 'employee'));
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };
    loadEmployees();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Opravdu chcete deaktivovat tohoto zaměstnance? Uživatel se nebude moci přihlásit, ale jeho data zůstanou zachována.')) {
      const success = await deleteUser(id);
      if (success) {
        refreshEmployees();
      }
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    // Implementace aktivace/deaktivace uživatele
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      users[userIndex].isActive = isActive;
      localStorage.setItem('users', JSON.stringify(users));
      refreshEmployees();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Správa zaměstnanců</h1>
          <p className="mt-1 text-sm text-gray-600">
            Správa uživatelských účtů a hodinových sazeb
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Přidat zaměstnance</span>
        </button>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktivní zaměstnanci</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(e => e.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Průměrná hodinová sazba</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.length > 0 
                  ? Math.round(employees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / employees.length)
                  : 0
                } Kč
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Celkové odvody</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.reduce((sum, emp) => sum + emp.monthlyDeductions, 0).toLocaleString('cs-CZ')} Kč
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabulka zaměstnanců */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Zaměstnanci</h3>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Žádní zaměstnanci</h3>
            <p className="mt-1 text-sm text-gray-500">
              Začněte přidáním prvního zaměstnance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zaměstnanec
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hodinová sazba
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Měsíční odvody
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
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {employee.firstName?.charAt(0)?.toUpperCase() || ''}{employee.lastName?.charAt(0)?.toUpperCase() || ''}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.hourlyRate} Kč/h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.monthlyDeductions.toLocaleString('cs-CZ')} Kč
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(employee.id, !employee.isActive)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {employee.isActive ? 'Aktivní' : 'Neaktivní'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(employee.createdAt), 'dd.MM.yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingEmployee(employee.id);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modal pro přidání/úpravu zaměstnance */}
      {isModalOpen && (
        <EmployeeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEmployee(null);
          }}
          editingId={editingEmployee}
          onSuccess={refreshEmployees}
        />
      )}
    </div>
  );
};
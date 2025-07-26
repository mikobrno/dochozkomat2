import React, { useState, useMemo } from 'react';
import { Clock, Edit2, Trash2, Calendar, Save, X, Users, DollarSign, Filter, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getTimeEntries, getProjects, deleteTimeEntry, updateTimeEntry, getUsers, calculateGrossSalary, exportToCSV } from '../../utils/supabaseStorage';
import { format } from 'date-fns';

export const TimeHistory: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editFormData, setEditFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    hoursWorked: 0,
    projectId: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [entriesData, projectsData, usersData] = await Promise.all([
          getTimeEntries(),
          getProjects(),
          getUsers()
        ]);
        setTimeEntries(entriesData);
        setProjects(projectsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const employees = users.filter(u => u.role === 'employee' && u.isActive);

  const filteredEntries = useMemo(() => {
    let entries = timeEntries;
    
    // Filter by user role
    if (user?.role === 'employee') {
      entries = entries.filter(entry => entry.userId === user.id);
    } else if (user?.role === 'admin' && selectedEmployee !== 'all') {
      entries = entries.filter(entry => entry.userId === selectedEmployee);
    }
    
    // Filter by selected month
    entries = entries.filter(entry => {
      const entryDate = format(new Date(entry.date), 'yyyy-MM');
      return entryDate === selectedMonth;
    });
    
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [timeEntries, user, selectedMonth, selectedEmployee]);

  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  
  const totalCost = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => {
      const entryUser = users.find(u => u.id === entry.userId);
      return entryUser ? sum + (entry.hoursWorked * entryUser.hourlyRate) : sum;
    }, 0);
  }, [filteredEntries, users]);
  
  const uniqueEmployees = new Set(filteredEntries.map(e => e.userId)).size;
  const uniqueProjects = new Set(filteredEntries.map(e => e.projectId)).size;

  const calculateHours = (start: string, end: string): number => {
    const startTime = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);
    const diffMs = endTime.getTime() - startTime.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60));
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry.id);
    setEditFormData({
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      hoursWorked: entry.hoursWorked,
      projectId: entry.projectId,
      description: entry.description || ''
    });
    setErrors({});
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newFormData = { ...editFormData, [field]: value };
    
    if (newFormData.startTime && newFormData.endTime) {
      const calculatedHours = calculateHours(newFormData.startTime, newFormData.endTime);
      newFormData.hoursWorked = Math.round(calculatedHours * 100) / 100;
    }
    
    setEditFormData(newFormData);
  };

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editFormData.date) {
      newErrors.date = 'Datum je povinné';
    }

    if (!editFormData.startTime) {
      newErrors.startTime = 'Čas začátku je povinný';
    }

    if (!editFormData.endTime) {
      newErrors.endTime = 'Čas konce je povinný';
    }

    if (editFormData.startTime && editFormData.endTime) {
      const hours = calculateHours(editFormData.startTime, editFormData.endTime);
      if (hours <= 0) {
        newErrors.endTime = 'Čas konce musí být po času začátku';
      } else if (hours > 24) {
        newErrors.endTime = 'Pracovní doba nemůže být delší než 24 hodin';
      }
    }

    if (!editFormData.projectId) {
      newErrors.projectId = 'Projekt je povinný';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm() || !editingEntry) return;

    try {
      await updateTimeEntry(editingEntry, {
        date: editFormData.date,
        startTime: editFormData.startTime,
        endTime: editFormData.endTime,
        hoursWorked: editFormData.hoursWorked,
        projectId: editFormData.projectId,
        description: editFormData.description.trim() || undefined
      });

      setEditingEntry(null);
      // Refresh data after successful update
      const [entriesData, projectsData, usersData] = await Promise.all([
        getTimeEntries(),
        getProjects(),
        getUsers()
      ]);
      setTimeEntries(entriesData);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error updating time entry:', error);
      alert('Nepodařilo se aktualizovat záznam. Zkuste to znovu.');
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditFormData({
      date: '',
      startTime: '',
      endTime: '',
      hoursWorked: 0,
      projectId: '',
      description: ''
    });
    setErrors({});
  };

  const handleDelete = async (id: string) => {
    // Enhanced confirmation dialog
    const confirmMessage = 'Opravdu chcete trvale smazat tento časový záznam?\n\nTato akce je nevratná a záznam bude odstraněn z databáze.';
    
    if (window.confirm(confirmMessage)) {
      try {
        console.log('Attempting to delete time entry with ID:', id);
        const success = await deleteTimeEntry(id);
        console.log('Delete operation result:', success);
        
        if (success) {
          // Show success feedback
          alert('Záznam byl úspěšně smazán.');
          
          // Refresh data after successful deletion
          try {
            const [entriesData, projectsData, usersData] = await Promise.all([
              getTimeEntries(),
              getProjects(),
              getUsers()
            ]);
            setTimeEntries(entriesData);
            setProjects(projectsData);
            setUsers(usersData);
          } catch (refreshError) {
            console.error('Error refreshing data after deletion:', refreshError);
            // Even if refresh fails, the deletion was successful
            alert('Záznam byl smazán, ale nepodařilo se obnovit seznam. Obnovte stránku.');
          }
        } else {
          console.error('Delete operation returned false');
          alert('Nepodařilo se smazat záznam. Možná nemáte dostatečná oprávnění nebo záznam již neexistuje.');
        }
      } catch (error) {
        console.error('Error deleting time entry:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Nepodařilo se smazat záznam. ';
        if (error instanceof Error) {
          if (error.message.includes('permission')) {
            errorMessage += 'Nemáte oprávnění k mazání tohoto záznamu.';
          } else if (error.message.includes('not found')) {
            errorMessage += 'Záznam nebyl nalezen.';
          } else {
            errorMessage += `Chyba: ${error.message}`;
          }
        } else {
          errorMessage += 'Zkuste to znovu nebo kontaktujte administrátora.';
        }
        
        alert(errorMessage);
      }
    }
  };

  const handleExport = () => {
    const exportData = filteredEntries.map(entry => {
      const entryUser = users.find(u => u.id === entry.userId);
      const project = projects.find(p => p.id === entry.projectId);
      const cost = entryUser ? (entry.hoursWorked * entryUser.hourlyRate) : 0;

      return {
        'Datum': format(new Date(entry.date), 'dd.MM.yyyy'),
        'Zaměstnanec': entryUser ? `${entryUser.firstName} ${entryUser.lastName}` : 'Neznámý',
        'Email': entryUser?.email || '',
        'Projekt': project?.name || 'Neznámý projekt',
        'Začátek': entry.startTime,
        'Konec': entry.endTime,
        'Hodiny': entry.hoursWorked,
        'Hodinová sazba': entryUser?.hourlyRate || 0,
        'Celková cena': cost,
        'Popis': entry.description || ''
      };
    });

    const filename = `historie-${selectedMonth}${selectedEmployee !== 'all' ? `-${users.find(u => u.id === selectedEmployee)?.firstName || 'employee'}` : ''}.csv`;
    exportToCSV(exportData, filename);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Historie všech zaměstnanců' : 'Moje historie'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {user?.role === 'admin' 
              ? 'Přehled časových záznamů všech zaměstnanců' 
              : 'Přehled všech vašich časových záznamů'
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          {user?.role === 'admin' && (
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Všichni zaměstnanci</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          )}
          
          <button
            onClick={handleExport}
            disabled={filteredEntries.length === 0}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Souhrn */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Celkem hodin</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Celkové náklady</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCost.toLocaleString('cs-CZ')} Kč
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Počet záznamů</p>
              <p className="text-2xl font-bold text-gray-900">{filteredEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              {user?.role === 'admin' ? <Users className="h-6 w-6 text-purple-600" /> : <Calendar className="h-6 w-6 text-purple-600" />}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {user?.role === 'admin' ? 'Zaměstnanci' : 'Průměr hodin/záznam'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.role === 'admin' 
                  ? uniqueEmployees
                  : filteredEntries.length > 0 ? (totalHours / filteredEntries.length).toFixed(1) + 'h' : '0h'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dodatečné statistiky pro administrátory */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Filter className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Detailní přehled</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Aktivní projekty</p>
              <p className="text-xl font-bold text-gray-900">{uniqueProjects}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Průměrná hodinová sazba</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredEntries.length > 0 
                  ? Math.round(filteredEntries.reduce((sum, entry) => {
                      const entryUser = users.find(u => u.id === entry.userId);
                      return sum + (entryUser?.hourlyRate || 0);
                    }, 0) / filteredEntries.length)
                  : 0
                } Kč/h
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Průměrné náklady/hodina</p>
              <p className="text-xl font-bold text-gray-900">
                {totalHours > 0 
                  ? Math.round(totalCost / totalHours).toLocaleString('cs-CZ')
                  : 0
                } Kč
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabulka záznamů */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Časové záznamy - {format(new Date(selectedMonth + '-01'), 'LLLL yyyy')}
            {user?.role === 'admin' && selectedEmployee !== 'all' && (
              <span className="text-base font-normal text-gray-600 ml-2">
                ({users.find(u => u.id === selectedEmployee)?.firstName} {users.find(u => u.id === selectedEmployee)?.lastName})
              </span>
            )}
          </h3>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné záznamy</h3>
            <p className="mt-1 text-sm text-gray-500">
              V tomto měsíci jste ještě nepřidali žádný záznam.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zaměstnanec
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Čas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projekt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hodiny
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Náklady
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Popis
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => {
                  const project = projects.find(p => p.id === entry.projectId);
                  const entryUser = users.find(u => u.id === entry.userId);
                  const entryCost = entryUser ? (entry.hoursWorked * entryUser.hourlyRate) : 0;
                  
                  if (editingEntry === entry.id) {
                    return (
                      <tr key={entry.id} className="bg-blue-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="date"
                            value={editFormData.date}
                            onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                            className={`w-full px-2 py-1 text-sm border rounded ${
                              errors.date ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
                        </td>
                        {user?.role === 'admin' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entryUser ? `${entryUser.firstName} ${entryUser.lastName}` : 'Neznámý'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-1">
                            <input
                              type="time"
                              value={editFormData.startTime}
                              onChange={(e) => handleTimeChange('startTime', e.target.value)}
                              className={`w-20 px-1 py-1 text-xs border rounded ${
                                errors.startTime ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            <span className="text-xs py-1">-</span>
                            <input
                              type="time"
                              value={editFormData.endTime}
                              onChange={(e) => handleTimeChange('endTime', e.target.value)}
                              className={`w-20 px-1 py-1 text-xs border rounded ${
                                errors.endTime ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          {(errors.startTime || errors.endTime) && (
                            <p className="text-xs text-red-600 mt-1">
                              {errors.startTime || errors.endTime}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={editFormData.projectId}
                            onChange={(e) => setEditFormData({ ...editFormData, projectId: e.target.value })}
                            className={`w-full px-2 py-1 text-sm border rounded ${
                              errors.projectId ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Vyberte projekt</option>
                            {projects.filter(p => p.isActive).map(proj => (
                              <option key={proj.id} value={proj.id}>{proj.name}</option>
                            ))}
                          </select>
                          {errors.projectId && <p className="text-xs text-red-600 mt-1">{errors.projectId}</p>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {editFormData.hoursWorked}h
                        </td>
                        {user?.role === 'admin' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entryCost.toLocaleString('cs-CZ')} Kč
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="Popis práce..."
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="text-green-600 hover:text-green-900 transition-colors duration-200"
                              title="Uložit změny"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                              title="Zrušit úpravy"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(new Date(entry.date), 'dd.MM.yyyy')}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs font-medium text-blue-600">
                                {entryUser?.firstName?.charAt(0)?.toUpperCase() || ''}{entryUser?.lastName?.charAt(0)?.toUpperCase() || ''}
                              </span>
                            </div>
                            {entryUser ? `${entryUser.firstName} ${entryUser.lastName}` : 'Neznámý'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.startTime} - {entry.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project?.name || 'Neznámý projekt'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.hoursWorked}h
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entryCost.toLocaleString('cs-CZ')} Kč
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {entry.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {(user?.role === 'employee' && entry.userId === user.id) || user?.role === 'admin' ? (
                            <>
                              <button
                                onClick={() => handleEdit(entry)}
                                className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                title="Upravit záznam"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                title="Smazat záznam"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">Pouze čtení</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
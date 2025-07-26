import React, { useState, useMemo } from 'react';
import { Plus, Download, Edit2, Trash2, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getTimeEntries,
  getUsers,
  deleteTimeEntry,
  exportToCSV
} from '../../utils/supabaseStorage';
import { format } from 'date-fns';
import { TimeEntryModal } from './TimeEntryModal';

export const TimesheetView: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [entriesData, usersData] = await Promise.all([
          getTimeEntries(),
          getUsers()
        ]);
        setTimeEntries(entriesData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const employees = users.filter(u => u.role === 'employee');

  const filteredEntries = useMemo(() => {
    let entries = timeEntries;
    
    // Filter by user role
    if (user?.role === 'employee') {
      entries = entries.filter(entry => entry.userId === user.id);
    }
    
    // Filter by selected employee (admin only)
    if (user?.role === 'admin' && selectedEmployee !== 'all') {
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
  const selectedEmployeeData = selectedEmployee !== 'all' ? users.find(u => u.id === selectedEmployee) : null;

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      deleteTimeEntry(id);
      window.location.reload();
    }
  };

  const handleExport = () => {
    const exportData = filteredEntries.map(entry => {
      const entryUser = users.find(u => u.id === entry.userId);
      return {
        Date: format(new Date(entry.date), 'yyyy-MM-dd'),
        Employee: entryUser?.name || 'Unknown',
        'Start Time': entry.startTime,
        'End Time': entry.endTime,
        'Hours Worked': entry.hoursWorked,
        Project: entry.projectName,
        Description: entry.description,
        'Hourly Rate': entryUser?.hourlyRate || 0,
        'Total Cost': ((entryUser?.hourlyRate || 0) * entry.hoursWorked)
      };
    });

    exportToCSV(exportData, `timesheet-${selectedMonth}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Docházka</h1>
          <p className="mt-1 text-sm text-gray-600">
            {user?.role === 'admin' ? 'Správa všech časových záznamů zaměstnanců' : 'Sledování vašich pracovních hodin'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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
          
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={filteredEntries.length === 0}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Download className="h-4 w-4" />
              <span>Exportovat CSV</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Přidat záznam</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {selectedEmployeeData ? `Hodiny - ${selectedEmployeeData.firstName} ${selectedEmployeeData.lastName}` : 'Celkem hodin'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalHours}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Počet záznamů</p>
              <p className="text-2xl font-bold text-gray-900">{filteredEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Průměr hodin/den</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredEntries.length > 0 ? (totalHours / filteredEntries.length).toFixed(1) : '0'}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Časové záznamy - {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
            {selectedEmployeeData && (
              <span className="text-base font-normal text-gray-600 ml-2">
                ({selectedEmployeeData.firstName} {selectedEmployeeData.lastName})
              </span>
            )}
          </h3>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné časové záznamy</h3>
            <p className="mt-1 text-sm text-gray-500">
              Začněte přidáním prvního časového záznamu.
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
                    Hodiny
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projekt
                  </th>
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
                  const entryUser = users.find(u => u.id === entry.userId);
                  
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(new Date(entry.date), 'dd.MM.yyyy')}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entryUser ? `${entryUser.firstName} ${entryUser.lastName}` : 'Neznámý'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.startTime} - {entry.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.hoursWorked}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.projectName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingEntry(entry.id);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Time Entry Modal */}
      {isModalOpen && (
        <TimeEntryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
          }}
          editingId={editingEntry}
        />
      )}
    </div>
  );
};
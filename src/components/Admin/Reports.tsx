import React, { useState, useMemo } from 'react';
import { Download, Filter, BarChart3, Users, Building2 } from 'lucide-react';
import { getUsers, getTimeEntries, getProjects, calculateGrossSalary, exportToCSV } from '../../utils/supabaseStorage';
import { getSettings } from '../../utils/storage';
import { format } from 'date-fns';

export const Reports: React.FC = () => {
  const [filters, setFilters] = useState({
    employeeId: 'all',
    startDate: '',
    endDate: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const settings = getSettings();

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersData, entriesData, projectsData] = await Promise.all([
          getUsers(),
          getTimeEntries(),
          getProjects()
        ]);
        setUsers(usersData);
        setTimeEntries(entriesData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const employees = users.filter(u => u.role === 'employee' && u.isActive);

  const filteredData = useMemo(() => {
    let entries = timeEntries;

    // Filtr podle zaměstnance
    if (filters.employeeId !== 'all') {
      entries = entries.filter(entry => entry.userId === filters.employeeId);
    }

    // Filtr podle data
    if (filters.startDate) {
      entries = entries.filter(entry => entry.date >= filters.startDate);
    }
    if (filters.endDate) {
      entries = entries.filter(entry => entry.date <= filters.endDate);
    }

    // Seřadit podle data
    entries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalCost = entries.reduce((sum, entry) => {
      const user = users.find(u => u.id === entry.userId);
      return user ? sum + calculateGrossSalary(entry.hours, user.hourlyRate) : sum;
    }, 0);

    return {
      entries,
      totalHours,
      totalCost,
      uniqueEmployees: [...new Set(entries.map(e => e.userId))].length,
      uniqueProjects: [...new Set(entries.map(e => e.projectId))].length
    };
  }, [timeEntries, users, filters]);

  const handleExport = () => {
    const exportData = filteredData.entries.map(entry => {
      const user = users.find(u => u.id === entry.userId);
      const project = projects.find(p => p.id === entry.projectId);
      const cost = user ? calculateGrossSalary(entry.hours, user.hourlyRate) : 0;

      return {
        'Datum': format(new Date(entry.date), 'dd.MM.yyyy'),
        'Zaměstnanec': user ? `${user.firstName} ${user.lastName}` : 'Neznámý',
        'Email': user?.email || '',
        'Projekt': project?.name || 'Neznámý projekt',
        'Hodiny': entry.hours,
        'Hodinová sazba': user?.hourlyRate || 0,
        'Celková cena': cost,
        'Popis': entry.description || ''
      };
    });

    const filename = `report-${filters.startDate || 'all'}-${filters.endDate || 'all'}.csv`;
    exportToCSV(exportData, filename);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporty a přehledy</h1>
          <p className="mt-1 text-sm text-gray-600">
            Detailní přehled docházky všech zaměstnanců
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredData.entries.length === 0}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <Download className="h-4 w-4" />
          <span>Exportovat CSV</span>
        </button>
      </div>

      {/* Filtry */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Filtry</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zaměstnanec
            </label>
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Všichni zaměstnanci</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Od data
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do data
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Souhrn */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Celkem hodin</p>
              <p className="text-2xl font-bold text-gray-900">{filteredData.totalHours}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Celkové náklady</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredData.totalCost.toLocaleString('cs-CZ')} Kč
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Zaměstnanci</p>
              <p className="text-2xl font-bold text-gray-900">{filteredData.uniqueEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Projekty</p>
              <p className="text-2xl font-bold text-gray-900">{filteredData.uniqueProjects}</p>
            </div>
          </div>
        </div>

        {/* Employer Contributions Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Příspěvky zaměstnavatele</p>
              <p className="text-2xl font-bold text-gray-900">
                {(filteredData.totalCost * 0.338).toLocaleString('cs-CZ')} Kč
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Employer Contributions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Detailní přehled příspěvků zaměstnavatele</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-700">Sociální pojištění</p>
              <p className="text-xl font-bold text-blue-900">{settings.socialInsuranceRate}%</p>
              <p className="text-sm text-blue-600">
                {(filteredData.totalCost * settings.socialInsuranceRate / 100).toLocaleString('cs-CZ')} Kč
              </p>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-green-700">Zdravotní pojištění</p>
              <p className="text-xl font-bold text-green-900">{settings.healthInsuranceRate}%</p>
              <p className="text-sm text-green-600">
                {(filteredData.totalCost * settings.healthInsuranceRate / 100).toLocaleString('cs-CZ')} Kč
              </p>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-purple-700">Celkové příspěvky</p>
              <p className="text-xl font-bold text-purple-900">
                {((settings.socialInsuranceRate + settings.healthInsuranceRate)).toFixed(1)}%
              </p>
              <p className="text-sm text-purple-600">
                {(filteredData.totalCost * (settings.socialInsuranceRate + settings.healthInsuranceRate) / 100).toLocaleString('cs-CZ')} Kč
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Poznámka:</strong> Příspěvky zaměstnavatele jsou vypočítány na základě nastavených sazeb v systému. 
            Sociální pojištění: {settings.socialInsuranceRate}%, Zdravotní pojištění: {settings.healthInsuranceRate}%. 
            Tyto sazby lze upravit v nastavení systému.
          </p>
        </div>
      </div>

      {/* Detailní tabulka */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailní výpis</h3>
        </div>

        {filteredData.entries.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné záznamy</h3>
            <p className="mt-1 text-sm text-gray-500">
              Pro zadané filtry nebyly nalezeny žádné záznamy.
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zaměstnanec
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projekt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hodiny
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Náklady
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Popis
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.entries.map((entry) => {
                  const user = users.find(u => u.id === entry.userId);
                  const project = projects.find(p => p.id === entry.projectId);
                  const cost = user ? calculateGrossSalary(entry.hours, user.hourlyRate) : 0;
                  
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(new Date(entry.date), 'dd.MM.yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user ? `${user.firstName} ${user.lastName}` : 'Neznámý'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project?.name || 'Neznámý projekt'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.hours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cost.toLocaleString('cs-CZ')} Kč
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {entry.description || '-'}
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
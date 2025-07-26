import React, { useMemo } from 'react';
import { Clock, DollarSign, Calendar, TrendingUp, ArrowLeft, ArrowRight, Filter, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getTimeEntries, getProjects, calculateGrossSalary, calculateNetSalary } from '../../utils/supabaseStorage';
import { getSettings } from '../../utils/storage';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfYear, endOfYear } from 'date-fns';
import { cs } from 'date-fns/locale';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  const [filterType, setFilterType] = React.useState<'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = React.useState('');
  const [customEndDate, setCustomEndDate] = React.useState('');
  const [timeEntries, setTimeEntries] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const settings = getSettings();
  
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [entriesData, projectsData] = await Promise.all([
          getTimeEntries(),
          getProjects()
        ]);
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

  const monthlyData = useMemo(() => {
    if (!user || user.role !== 'employee') return null;

    let periodStart: Date;
    let periodEnd: Date;

    switch (filterType) {
      case 'year':
        periodStart = startOfYear(selectedMonth);
        periodEnd = endOfYear(selectedMonth);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return null;
        periodStart = new Date(customStartDate);
        periodEnd = new Date(customEndDate);
        break;
      default: // month
        periodStart = startOfMonth(selectedMonth);
        periodEnd = endOfMonth(selectedMonth);
    }

    const monthEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entry.userId === user.id && 
             entryDate >= periodStart && 
             entryDate <= periodEnd;
    });

    const totalHours = monthEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const netSalary = totalHours * user.hourlyRate; // Čistá mzda = hodiny × sazba
    const grossSalary = netSalary + user.monthlyDeductions; // Hrubá mzda = čistá + příspěvky zaměstnavatele

    return {
      totalHours,
      grossSalary,
      netSalary,
      deductions: user.monthlyDeductions, // Odvody = příspěvky zaměstnavatele
      entriesCount: monthEntries.length,
      recentEntries: monthEntries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
    };
  }, [user, selectedMonth, timeEntries, filterType, customStartDate, customEndDate]);

  const adminData = useMemo(() => {
    if (!user || user.role !== 'admin') return null;

    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const monthEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    const totalHours = monthEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const activeEmployees = new Set(monthEntries.map(e => e.userId)).size;
    const activeProjects = new Set(monthEntries.map(e => e.projectId)).size;

    return {
      totalHours,
      activeEmployees,
      activeProjects,
      entriesCount: monthEntries.length
    };
  }, [user, selectedMonth, timeEntries, filterType, customStartDate, customEndDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (filterType === 'year') {
      setSelectedMonth(prev => {
        const newDate = new Date(prev);
        newDate.setFullYear(newDate.getFullYear() + (direction === 'prev' ? -1 : 1));
        return newDate;
      });
    } else {
      setSelectedMonth(prev => 
        direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
      );
    }
  };

  const getPeriodLabel = () => {
    switch (filterType) {
      case 'year':
        return format(selectedMonth, 'yyyy');
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(new Date(customStartDate), 'dd.MM.yyyy')} - ${format(new Date(customEndDate), 'dd.MM.yyyy')}`;
        }
        return 'Vlastní období';
      default:
        return format(selectedMonth, 'LLLL yyyy', { locale: cs });
    }
  };

  if (user?.role === 'employee') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Můj přehled</h1>
            <p className="mt-1 text-sm text-gray-600">
              Přehled odpracovaných hodin a výdělku
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Filter Type Selector */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'month' | 'year' | 'custom')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="month">Měsíc</option>
                <option value="year">Rok</option>
                <option value="custom">Vlastní období</option>
              </select>
            </div>

            {filterType === 'custom' ? (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg min-w-[150px] text-center">
                  <span className="font-medium text-gray-900">
                    {getPeriodLabel()}
                  </span>
                </div>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistické karty */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Odpracované hodiny</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyData?.totalHours || 0}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hrubá mzda (s příspěvky)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monthlyData?.grossSalary.toLocaleString('cs-CZ') || 0} Kč
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Čistá mzda (bez příspěvků)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monthlyData?.netSalary.toLocaleString('cs-CZ') || 0} Kč
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Příspěvky zaměstnavatele</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.monthlyDeductions.toLocaleString('cs-CZ') || 0} Kč
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Finanční přehled */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Finanční přehled za období</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Pole:</span>
                <span className="text-sm font-bold text-gray-900">Hodnoty</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Odpracované hodiny:</span>
                <span className="text-sm font-bold text-gray-900">{monthlyData?.totalHours || 0}h</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Hrubá mzda:</span>
                <span className="text-sm font-bold text-gray-900">{monthlyData?.grossSalary.toLocaleString('cs-CZ') || 0} Kč</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Čistá mzda:</span>
                <span className="text-sm font-bold text-gray-900">{monthlyData?.netSalary.toLocaleString('cs-CZ') || 0} Kč</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Odvody:</span>
                <span className="text-sm font-bold text-gray-900">{user?.monthlyDeductions.toLocaleString('cs-CZ') || 0} Kč</span>
              </div>
            </div>
            
            {/* Employer Contributions Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 py-2 border-b border-gray-100">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-bold text-gray-900">Příspěvky zaměstnavatele</span>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Sociální pojištění (0%):</span>
                  <span className="text-sm font-bold text-blue-800">
                    0 Kč
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Zdravotní pojištění (0%):</span>
                  <span className="text-sm font-bold text-blue-800">
                    0 Kč
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Měsíční odvody:</span>
                  <span className="text-sm font-bold text-blue-800">
                    {user?.monthlyDeductions.toLocaleString('cs-CZ') || 0} Kč
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-blue-800">Celkové příspěvky zaměstnavatele:</span>
                    <span className="text-base font-bold text-blue-900">
                      {user?.monthlyDeductions?.toLocaleString('cs-CZ') || 0} Kč
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nedávné záznamy */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nedávné záznamy</h3>
          {!monthlyData || monthlyData.recentEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné záznamy</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ve vybraném období jste ještě nepřidali žádný záznam.
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
                      Čas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projekt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hodiny
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Popis
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyData?.recentEntries.map((entry) => {
                    const project = projects.find(p => p.id === entry.projectId);
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {format(new Date(entry.date), 'dd.MM.yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.startTime} - {entry.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project?.name || 'Neznámý projekt'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.hoursWorked}h
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
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
  }

  // Admin dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Přehled systému</h1>
          <p className="mt-1 text-sm text-gray-600">
            Celkový přehled docházky všech zaměstnanců
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg">
            <span className="font-medium text-gray-900">
              {format(selectedMonth, 'LLLL yyyy', { locale: cs })}
            </span>
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Admin statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Celkem hodin</p>
              <p className="text-2xl font-bold text-gray-900">{adminData?.totalHours || 0}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktivní zaměstnanci</p>
              <p className="text-2xl font-bold text-gray-900">{adminData?.activeEmployees || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktivní projekty</p>
              <p className="text-2xl font-bold text-gray-900">{adminData?.activeProjects || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Počet záznamů</p>
              <p className="text-2xl font-bold text-gray-900">{adminData?.entriesCount || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
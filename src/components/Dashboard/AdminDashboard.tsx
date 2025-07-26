import React, { useMemo } from 'react';
import { Users, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { getUsers, getTimeEntries, getSettings, calculateGrossSalary } from '../../utils/storage';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const users = getUsers();
  const timeEntries = getTimeEntries();
  const settings = getSettings();

  const stats = useMemo(() => {
    const employees = users.filter(u => u.role === 'zamestnanec');
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const currentMonthEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    const totalHoursThisMonth = currentMonthEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    
    const totalCostThisMonth = currentMonthEntries.reduce((sum, entry) => {
      const user = users.find(u => u.id === entry.userId);
      if (user) {
        return sum + calculateGrossSalary(entry.hoursWorked, user.hourlyRate);
      }
      return sum;
    }, 0);

    return {
      totalEmployees: employees.length,
      totalHoursThisMonth,
      totalCostThisMonth,
      activeProjects: [...new Set(timeEntries.map(e => e.projectName))].length
    };
  }, [users, timeEntries]);

  const chartData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      });

      const totalCost = monthEntries.reduce((sum, entry) => {
        const user = users.find(u => u.id === entry.userId);
        if (user) {
          return sum + calculateGrossSalary(entry.hoursWorked, user.hourlyRate);
        }
        return sum;
      }, 0);

      return {
        month: format(month, 'MMM yyyy'),
        totalCost: Math.round(totalCost),
        hours: monthEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0)
      };
    });
  }, [timeEntries, users]);

  return (
    <div className="space-y-6">
      {/* Statistické karty */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Počet zaměstnanců</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hodiny tento měsíc</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHoursThisMonth}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Náklady tento měsíc</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCostThisMonth.toLocaleString()} {settings.currency}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktivní projekty</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graf měsíčních nákladů */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Měsíční náklady firmy</h3>
          <p className="text-sm text-gray-600">Celkové náklady za posledních 6 měsíců</p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value.toLocaleString()} ${settings.currency}`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()} ${settings.currency}`, 'Celkové náklady']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="totalCost" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                className="drop-shadow-sm"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nedávná aktivita */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Poslední časové záznamy</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zaměstnanec
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projekt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hodiny
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cena
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeEntries.slice(0, 5).map((entry) => {
                const user = users.find(u => u.id === entry.userId);
                const cost = user ? calculateGrossSalary(entry.hoursWorked, user.hourlyRate) : 0;
                
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user ? `${user.firstName} ${user.lastName}` : 'Neznámý'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(entry.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.projectName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.hoursWorked}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cost.toLocaleString('cs-CZ')} Kč
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
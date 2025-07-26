import React, { useMemo } from 'react';
import { Clock, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getTimeEntries, getSettings, calculateGrossSalary, calculateNetSalary } from '../../utils/storage';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const timeEntries = getTimeEntries();
  const settings = getSettings();

  const userEntries = timeEntries.filter(entry => entry.userId === user?.id);

  const stats = useMemo(() => {
    const currentDate = new Date();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const thisMonthEntries = userEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    const thisWeekEntries = userEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    const monthlyHours = thisMonthEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const weeklyHours = thisWeekEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    
    const grossSalary = user ? calculateGrossSalary(monthlyHours, user.hourlyRate) : 0;
    const netSalary = user ? calculateNetSalary(grossSalary, user.deductions, settings) : 0;

    return {
      monthlyHours,
      weeklyHours,
      grossSalary,
      netSalary,
      totalProjects: [...new Set(userEntries.map(e => e.projectName))].length
    };
  }, [userEntries, user, settings]);

  return (
    <div className="space-y-6">
      {/* Statistické karty */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tento týden</p>
              <p className="text-2xl font-bold text-gray-900">{stats.weeklyHours}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tento měsíc</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlyHours}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hrubá mzda</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.grossSalary.toLocaleString('cs-CZ')} Kč
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
              <p className="text-sm font-medium text-gray-600">Čistá mzda</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.netSalary.toLocaleString('cs-CZ')} Kč
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Měsíční finanční přehled */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Finanční přehled za měsíc</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Odpracované hodiny:</span>
              <span className="text-sm font-bold text-gray-900">{stats.monthlyHours}h</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Hodinová sazba:</span>
              <span className="text-sm font-bold text-gray-900">{user?.hourlyRate} Kč/h</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Hrubá mzda:</span>
              <span className="text-sm font-bold text-gray-900">{stats.grossSalary.toLocaleString('cs-CZ')} Kč</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Daň ({settings.taxRate}%):</span>
              <span className="text-sm text-red-600">-{(stats.grossSalary * settings.taxRate / 100).toLocaleString('cs-CZ')} Kč</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Sociální pojištění ({settings.socialInsuranceRate}%):</span>
              <span className="text-sm text-red-600">-{(stats.grossSalary * settings.socialInsuranceRate / 100).toLocaleString('cs-CZ')} Kč</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Zdravotní pojištění ({settings.healthInsuranceRate}%):</span>
              <span className="text-sm text-red-600">-{(stats.grossSalary * settings.healthInsuranceRate / 100).toLocaleString('cs-CZ')} Kč</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Další srážky:</span>
              <span className="text-sm text-red-600">-{user?.deductions.toLocaleString('cs-CZ')} Kč</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-emerald-50 rounded-lg px-3">
              <span className="text-base font-semibold text-emerald-800">Čistá mzda:</span>
              <span className="text-base font-bold text-emerald-800">{stats.netSalary.toLocaleString('cs-CZ')} Kč</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nedávné časové záznamy */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Poslední časové záznamy</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Popis
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userEntries.slice(0, 5).map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {format(new Date(entry.date), 'dd.MM.yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.hoursWorked}h
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {entry.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
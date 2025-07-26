import React, { useMemo, useState } from 'react';
import { BarChart3, Download, Calendar, DollarSign, Clock } from 'lucide-react';
import { getUsers, getTimeEntries, getSettings, calculateGrossSalary, exportToCSV } from '../../utils/storage'; // Import storage functions
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'; // Date utility functions
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  
  const users = getUsers();
  const timeEntries = getTimeEntries();
  const settings = getSettings();
  const employees = users.filter(u => u.role === 'employee');

  const periodData = useMemo(() => {
    const monthsBack = selectedPeriod === '3months' ? 2 : selectedPeriod === '6months' ? 5 : 11;
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), monthsBack),
      end: new Date()
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      });

      const totalHours = monthEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
      const totalCost = monthEntries.reduce((sum, entry) => {
        const user = users.find(u => u.id === entry.userId);
        return user ? sum + calculateGrossSalary(entry.hoursWorked, user.hourlyRate) : sum;
      }, 0);

      return {
        month: format(month, 'MMM yyyy'),
        hours: totalHours,
        cost: Math.round(totalCost),
        entries: monthEntries.length
      };
    });
  }, [timeEntries, users, selectedPeriod]);

  const employeeData = useMemo(() => {
    return employees.map(employee => {
      const employeeEntries = timeEntries.filter(entry => entry.userId === employee.id);
      const totalHours = employeeEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
      const totalCost = calculateGrossSalary(totalHours, employee.hourlyRate);

      return {
        firstName: employee.firstName,
        lastName: employee.lastName,
        hours: totalHours,
        cost: Math.round(totalCost),
        hourlyRate: employee.hourlyRate,
        entries: employeeEntries.length
      };
    }).sort((a, b) => b.cost - a.cost);
  }, [employees, timeEntries]);

  const projectData = useMemo(() => {
    const projectMap = new Map();
    
    timeEntries.forEach(entry => {
      const user = users.find(u => u.id === entry.userId);
      if (!user) return;
      
      const cost = calculateGrossSalary(entry.hoursWorked, user.hourlyRate);
      
      if (projectMap.has(entry.projectName)) {
        const existing = projectMap.get(entry.projectName);
        projectMap.set(entry.projectName, {
          ...existing,
          hours: existing.hours + entry.hoursWorked,
          cost: existing.cost + cost,
          entries: existing.entries + 1
        });
      } else {
        projectMap.set(entry.projectName, {
          name: entry.projectName,
          hours: entry.hoursWorked,
          cost: Math.round(cost),
          entries: 1
        });
      }
    });

    return Array.from(projectMap.values()).sort((a, b) => b.cost - a.cost);
  }, [timeEntries, users]);

  const totalStats = useMemo(() => {
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const totalCost = timeEntries.reduce((sum, entry) => {
      const user = users.find(u => u.id === entry.userId);
      return user ? sum + calculateGrossSalary(entry.hoursWorked, user.hourlyRate) : sum;
    }, 0);

    return {
      totalHours,
      totalCost: Math.round(totalCost),
      totalEntries: timeEntries.length,
      activeProjects: [...new Set(timeEntries.map(e => e.projectName))].length
    };
  }, [timeEntries, users]);

  const handleExportReport = () => {
    const reportData = [
      // Summary
      { Type: 'Summary', Name: 'Total Hours', Value: totalStats.totalHours },
      { Type: 'Summary', Name: 'Total Cost', Value: `${totalStats.totalCost} ${settings.currency}` },
      { Type: 'Summary', Name: 'Total Entries', Value: totalStats.totalEntries },
      { Type: 'Summary', Name: 'Active Projects', Value: totalStats.activeProjects },
      { Type: '', Name: '', Value: '' }, // Empty row
      
      // Monthly data
      ...periodData.map(data => ({
        Type: 'Monthly',
        Name: data.month,
        'Hours': data.hours,
        'Cost': `${data.cost} ${settings.currency}`,
        'Entries': data.entries
      })),
      { Type: '', Name: '', Value: '' }, // Empty row
      
      // Employee data
      ...employeeData.map(data => ({
        Type: 'Employee',
        Name: `${data.firstName} ${data.lastName}`,
        'Hours': data.hours,
        'Cost': `${data.cost} ${settings.currency}`,
        'Hourly Rate': `${data.hourlyRate} ${settings.currency}`,
        'Entries': data.entries
      })),
      { Type: '', Name: '', Value: '' }, // Empty row
      
      // Project data
      ...projectData.map(data => ({
        Type: 'Project',
        Name: data.name,
        'Hours': data.hours,
        'Cost': `${data.cost} ${settings.currency}`,
        'Entries': data.entries
      }))
    ];

    exportToCSV(reportData, `company-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporty a analýzy</h1>
          <p className="mt-1 text-sm text-gray-600">
            Komplexní analýza výkonu a nákladů společnosti
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3months">Posledních 3 měsíců</option>
            <option value="6months">Posledních 6 měsíců</option>
            <option value="12months">Posledních 12 měsíců</option>
          </select>

          <button
            onClick={handleExportReport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Download className="h-4 w-4" />
            <span>Exportovat report</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Celkem hodin</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalHours}h</p>
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
                {totalStats.totalCost.toLocaleString('cs-CZ')} Kč
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
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalEntries}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktivní projekty</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.activeProjects}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Costs Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Měsíční náklady firmy</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12}
                  tickFormatter={(value) => `${value.toLocaleString('cs-CZ')} Kč`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('cs-CZ')} Kč`, 'Náklady']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozdělení nákladů podle projektů</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectData.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cost"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {projectData.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('cs-CZ')} Kč`, 'Náklady']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Výkon zaměstnanců</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zaměstnanec
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Celkem hodin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Celkové náklady
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hodinová sazba
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Časové záznamy
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeeData.map((employee) => (
                <tr key={`${employee.firstName}-${employee.lastName}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {employee.firstName.charAt(0).toUpperCase()}{employee.lastName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.hours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.cost.toLocaleString('cs-CZ')} Kč
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.hourlyRate} Kč/h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.entries}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Výkon projektů</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Název projektu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Celkem hodin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Celkové náklady
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Časové záznamy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Průměr hodin/záznam
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectData.map((project) => (
                <tr key={project.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {project.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.hours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.cost.toLocaleString('cs-CZ')} Kč
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.entries}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(project.hours / project.entries).toFixed(1)}h
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
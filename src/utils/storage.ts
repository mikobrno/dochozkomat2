import { User, Project, TimeEntry } from '../types';

// Počáteční data
const initialUsers: User[] = [
  {
    id: 'admin-1',
    firstName: 'Admin',
    lastName: 'Systému',
    email: 'admin@firma.cz',
    password: 'admin123',
    role: 'admin',
    hourlyRate: 0,
    monthlyDeductions: 0,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'emp-1',
    firstName: 'Jan',
    lastName: 'Novák',
    email: 'jan.novak@firma.cz',
    password: 'heslo123',
    role: 'employee',
    hourlyRate: 450,
    monthlyDeductions: 8500,
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'emp-2',
    firstName: 'Marie',
    lastName: 'Svobodová',
    email: 'marie.svobodova@firma.cz',
    password: 'heslo123',
    role: 'employee',
    hourlyRate: 520,
    monthlyDeductions: 9200,
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z'
  }
];

const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-commerce platforma',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'proj-2',
    name: 'CRM systém',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'proj-3',
    name: 'Mobilní aplikace',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const initialTimeEntries: TimeEntry[] = [
  {
    id: 'time-1',
    userId: 'emp-1',
    date: '2024-12-01',
    startTime: '09:00',
    endTime: '17:00',
    hoursWorked: 8,
    projectId: 'proj-1',
    description: 'Vývoj frontendu obchodu',
    createdAt: '2024-12-01T09:00:00Z'
  },
  {
    id: 'time-2',
    userId: 'emp-1',
    date: '2024-12-02',
    startTime: '08:30',
    endTime: '16:00',
    hoursWorked: 7.5,
    projectId: 'proj-1',
    description: 'Opravy chyb a testování',
    createdAt: '2024-12-02T09:00:00Z'
  },
  {
    id: 'time-3',
    userId: 'emp-2',
    date: '2024-12-01',
    startTime: '08:00',
    endTime: '16:30',
    hoursWorked: 8.5,
    projectId: 'proj-2',
    description: 'Optimalizace databáze',
    createdAt: '2024-12-01T08:30:00Z'
  }
];

// Inicializace localStorage
const initializeStorage = () => {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(initialUsers));
  }
  if (!localStorage.getItem('projects')) {
    localStorage.setItem('projects', JSON.stringify(initialProjects));
  }
  if (!localStorage.getItem('timeEntries')) {
    localStorage.setItem('timeEntries', JSON.stringify(initialTimeEntries));
  }
};

export const getUsers = (): User[] => {
  initializeStorage();
  let users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

  // Explicitně zajistíme, že výchozí administrátorský účet je vždy aktivní a má správné údaje
  const defaultAdminId = 'admin-1';
  const defaultAdminData = initialUsers.find(u => u.id === defaultAdminId);

  if (defaultAdminData) {
    const adminIndex = users.findIndex(u => u.id === defaultAdminId);
    if (adminIndex !== -1) {
      users[adminIndex] = { ...users[adminIndex], ...defaultAdminData, isActive: true };
    } else {
      users.push(defaultAdminData);
    }
    saveUsers(users);
  }
  return users;
};

export const saveUsers = (users: User[]): void => {
  localStorage.setItem('users', JSON.stringify(users));
};

export const createUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  const users = getUsers();
  
  // Check if user with this email already exists
  const existingUser = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  const newUser: User = {
    ...user,
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

export const updateUser = (id: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return users[index];
};

export const deleteUser = (id: string): boolean => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== id);
  if (filteredUsers.length === users.length) return false;
  
  saveUsers(filteredUsers);
  return true;
};

// Operace s projekty
export const getProjects = (): Project[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem('projects') || '[]');
};

export const saveProjects = (projects: Project[]): void => {
  localStorage.setItem('projects', JSON.stringify(projects));
};

export const createProject = (project: Omit<Project, 'id' | 'createdAt'>): Project => {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: `proj-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  projects.push(newProject);
  saveProjects(projects);
  return newProject;
};

export const updateProject = (id: string, updates: Partial<Project>): Project | null => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  projects[index] = { ...projects[index], ...updates };
  saveProjects(projects);
  return projects[index];
};

// Operace s časovými záznamy
export const getTimeEntries = (): TimeEntry[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem('timeEntries') || '[]');
};

export const saveTimeEntries = (entries: TimeEntry[]): void => {
  localStorage.setItem('timeEntries', JSON.stringify(entries));
};

export const createTimeEntry = (entry: Omit<TimeEntry, 'id' | 'createdAt'>): TimeEntry => {
  const entries = getTimeEntries();
  const newEntry: TimeEntry = {
    ...entry,
    id: `entry-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  entries.push(newEntry);
  saveTimeEntries(entries);
  return newEntry;
};

export const updateTimeEntry = (id: string, updates: Partial<TimeEntry>): TimeEntry | null => {
  const entries = getTimeEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index === -1) return null;
  
  entries[index] = { ...entries[index], ...updates };
  saveTimeEntries(entries);
  return entries[index];
};

export const deleteTimeEntry = (id: string): boolean => {
  const entries = getTimeEntries();
  const filteredEntries = entries.filter(e => e.id !== id);
  if (filteredEntries.length === entries.length) return false;
  
  saveTimeEntries(filteredEntries);
  return true;
};

// Pomocné funkce
export const calculateGrossSalary = (hours: number, hourlyRate: number): number => {
  // Hrubá mzda = hodiny × sazba + příspěvky zaměstnavatele (33.8%)
  const baseSalary = hours * hourlyRate;
  const employerContributions = baseSalary * 0.338; // 25% sociální + 9% zdravotní pojištění
  return baseSalary + employerContributions;
};

export const calculateNetSalary = (hours: number, hourlyRate: number): number => {
  // Čistá mzda = hodiny × sazba (bez příspěvků)
  return hours * hourlyRate;
};

export const calculateHoursFromTime = (startTime: string, endTime: string): number => {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  // Handle overnight shifts
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  const diffMs = end.getTime() - start.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  
  return Math.round(hours * 100) / 100; // Round to 2 decimal places
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getSettings = () => {
  const settings = localStorage.getItem('settings');
  return settings ? JSON.parse(settings) : {
    id: 'settings-1',
    companyName: 'Moje Firma',
    taxRate: 15,
    socialInsuranceRate: 6.5,
    healthInsuranceRate: 4.5,
    currency: 'CZK',
    workingHoursPerDay: 8,
    workingDaysPerWeek: 5
  };
};

export const saveSettings = (settings: any) => {
  localStorage.setItem('settings', JSON.stringify(settings));
};
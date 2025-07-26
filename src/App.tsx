import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import { Login } from './components/Auth/Login';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AddTimeEntry } from './components/Employee/AddTimeEntry';
import { TimeHistory } from './components/Employee/TimeHistory';
import { Reports } from './components/Admin/Reports';
import { EmployeeManagement } from './components/Admin/EmployeeManagement';
import { ProjectManagement } from './components/Admin/ProjectManagement';
import { Settings } from './components/Settings/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="add-entry" element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <AddTimeEntry />
                </ProtectedRoute>
              } />
              <Route path="time-history" element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <TimeHistory />
                </ProtectedRoute>
              } />
              <Route path="reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="employees" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EmployeeManagement />
                </ProtectedRoute>
              } />
              <Route path="projects" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ProjectManagement />
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
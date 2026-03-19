import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AppointmentCalendar from './components/AppointmentCalendar';
import PatientSearch from './components/PatientSearch';
import PatientProfile from './components/PatientProfile';
import Layout from './components/Layout';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'hekim' | 'asistan' | 'admin'>('asistan');

  const handleLogin = (role: 'hekim' | 'asistan' | 'admin') => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Layout userRole={userRole} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/randevular" element={<AppointmentCalendar />} />
          <Route path="/hastalar" element={<PatientSearch />} />
          <Route path="/hasta/:id" element={<PatientProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

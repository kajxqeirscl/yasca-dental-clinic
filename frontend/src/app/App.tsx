import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, getUserRoleDisplay } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AppointmentCalendar from './components/AppointmentCalendar';
import PatientSearch from './components/PatientSearch';
import PatientProfile from './components/PatientProfile';
import Layout from './components/Layout';
import ClinicSettingsPage from './components/ClinicSettingsPage';

export default function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const userRole = getUserRoleDisplay(user.role);
  const isAdmin = user.role === 'admin';

  return (
    <BrowserRouter>
      <Layout userRole={userRole} onLogout={logout} isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/randevular" element={<AppointmentCalendar />} />
          <Route path="/hastalar" element={<PatientSearch />} />
          <Route path="/hasta/:id" element={<PatientProfile />} />
          <Route path="/ayarlar" element={<ClinicSettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}


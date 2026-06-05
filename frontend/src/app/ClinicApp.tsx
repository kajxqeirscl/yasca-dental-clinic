import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useAuth, getUserRoleDisplay } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AppointmentCalendar from './components/AppointmentCalendar';
import PatientSearch from './components/PatientSearch';
import PatientProfile from './components/PatientProfile';
import Layout from './components/Layout';
import ClinicSettingsPage from './components/ClinicSettingsPage';
import TreatmentTypesPage from './components/TreatmentTypesPage';
import AuditLogPage from './components/AuditLogPage';
import { setTenantSlug } from './services/api';
import { useLocation } from 'react-router-dom';

interface ClinicAppProps {
  tenantSlug: string; // 'ali', 'yildiz' vb. — boşsa lokal subdomain modu
}

/**
 * Klinik Yönetim Paneli
 */
export default function ClinicApp({ tenantSlug }: ClinicAppProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  // Tenant slug'ı api servisine bildir
  useEffect(() => {
    if (tenantSlug) {
      setTenantSlug(tenantSlug);
    }
  }, [tenantSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common:loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const userRole = getUserRoleDisplay(user.role);
  const isAdmin = user.role === 'admin';
  const userName = `${user.first_name} ${user.last_name}`.trim() || user.username;

  // Canlı ortamda basePath = '/app/ali', lokalde basePath = ''
  const basePath = tenantSlug ? `/app/${tenantSlug}` : '';

  return (
    <Layout userName={userName} userRole={userRole} onLogout={logout} isAdmin={isAdmin} basePath={basePath}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/randevular" element={<AppointmentCalendar />} />
        <Route path="/hastalar" element={<PatientSearch />} />
        <Route path="/hasta/:id" element={<PatientProfile />} />
        <Route path="/ayarlar" element={<ClinicSettingsPage />} />
        <Route path="/tedavi-turleri" element={<TreatmentTypesPage userRole={user.role} />} />
        {isAdmin && <Route path="/islem-gecmisi" element={<AuditLogPage />} />}
        <Route path="*" element={<Navigate to={basePath || '/'} replace />} />
      </Routes>
    </Layout>
  );
}

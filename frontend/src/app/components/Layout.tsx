import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, LogOut, LayoutDashboard, Settings, Stethoscope, Globe, Shield, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { fetchPublicClinicInfo } from '../services/api';
import PatientDialog from './PatientDialog';
import { useClinicNavigate } from '../hooks/useClinicNavigate';

interface LayoutProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  onLogout: () => void;
  isAdmin?: boolean;
  basePath?: string; // '/app/ali' gibi path tabanlı multi-tenant prefix
}

export default function Layout({ children, userName, userRole, onLogout, isAdmin, basePath = '' }: LayoutProps) {
  const location = useLocation();
  const { t, i18n } = useTranslation('common');
  const { user } = useAuth();
  const [clinicName, setClinicName] = useState('Yaşca');
  const [quickPatientOpen, setQuickPatientOpen] = useState(false);
  const navigate = useClinicNavigate();

  useEffect(() => {
    if (user?.clinic_name) {
      setClinicName(user.clinic_name);
      document.title = `${user.clinic_name} - Yaşca`;
      return;
    }

    const loadClinicName = async () => {
      try {
        const data = await fetchPublicClinicInfo();
        setClinicName(data.clinic_name);
        document.title = `${data.clinic_name} - Yaşca`;
      } catch (err) {
        setClinicName('Yaşca Dental');
        document.title = 'Yaşca Dental - Yaşca';
      }
    };
    loadClinicName();
  }, [user?.clinic_name]);

  const navItems = [
    { path: '', label: t('dashboard'), icon: LayoutDashboard, adminOnly: false },
    { path: '/randevular', label: t('appointments'), icon: Calendar, adminOnly: false },
    { path: '/hastalar', label: t('patients'), icon: Users, adminOnly: false },
    { path: '/tedavi-turleri', label: t('treatments'), icon: Stethoscope, adminOnly: false },
    { path: '/ayarlar', label: t('settings'), icon: Settings, adminOnly: false },
    { path: '/islem-gecmisi', label: t('audit_logs'), icon: Shield, adminOnly: true },
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('tr') ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold">{clinicName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{clinicName}</h1>
                <p className="text-sm text-gray-500 capitalize">{userName} <span className="opacity-75">({userRole})</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setQuickPatientOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                size="sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t('quick_add_patient', 'Hızlı Hasta Ekle')}
              </Button>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <select
                  aria-label={t('language_select_label', 'Dil seçimi')}
                  value={i18n.language.startsWith('tr') ? 'tr' : 'en'}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tr">🇹🇷 Türkçe</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
              <Button variant="ghost" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
              const Icon = item.icon;
              const fullPath = basePath + item.path;
              const isActive =
                item.path === ''
                  ? location.pathname === basePath || location.pathname === basePath + '/'
                  : location.pathname.startsWith(fullPath);
              return (
                <Link
                  key={item.path}
                  to={fullPath || '/'}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Floating Action Button - Hızlı Hasta Ekle */}
      <button
        onClick={() => setQuickPatientOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
        title={t('quick_add_patient', 'Hızlı Hasta Ekle')}
      >
        <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Global Hasta Ekleme Dialog */}
      <PatientDialog
        isOpen={quickPatientOpen}
        onClose={() => setQuickPatientOpen(false)}
        onSuccess={() => {
          setQuickPatientOpen(false);
          // Eğer hastalar sayfasındaysa listeyi yenile
          if (location.pathname.includes('/hastalar')) {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}

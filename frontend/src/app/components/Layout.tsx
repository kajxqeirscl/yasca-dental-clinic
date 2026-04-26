import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
  userRole: string;
  onLogout: () => void;
  isAdmin?: boolean;
}

export default function Layout({ children, userRole, onLogout, isAdmin }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Ana Sayfa', icon: LayoutDashboard, adminOnly: false },
    { path: '/randevular', label: 'Randevular', icon: Calendar, adminOnly: false },
    { path: '/hastalar', label: 'Hastalar', icon: Users, adminOnly: false },
    { path: '/ayarlar', label: 'Klinik Ayarları', icon: Settings, adminOnly: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white">Y</span>
              </div>
              <div>
                <h1 className="text-xl text-gray-900">Yaşça Dental Klinik</h1>
                <p className="text-sm text-gray-500 capitalize">{userRole}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
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
    </div>
  );
}

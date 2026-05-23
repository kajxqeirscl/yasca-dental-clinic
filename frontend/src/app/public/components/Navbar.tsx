import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation('landing');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.features'), path: '#features' },
    { name: t('nav.pricing'), path: '#pricing' },
  ];

  const getNavLinkHref = (path: string) => {
    if (path.startsWith('#')) {
      return location.pathname === '/' ? path : `/${path}`;
    }
    return path;
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('#') && location.pathname === '/') {
      e.preventDefault();
      const targetId = path.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">Y</div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Yasca Dental</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={getNavLinkHref(link.path)}
                onClick={(e) => handleNavClick(e, link.path)}
                className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
                  location.pathname === link.path ? 'text-indigo-600' : 'text-gray-600'
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <select
                value={i18n.language.startsWith('tr') ? 'tr' : 'en'}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="tr">🇹🇷 Türkçe</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">{t('nav.login')}</Link>
            <Link to="/register" className="text-sm font-medium px-5 py-2.5 rounded-full text-white bg-gray-900 hover:bg-indigo-600 shadow-md hover:shadow-lg hover:shadow-indigo-500/20 transition-all">{t('nav.start')}</Link>
          </div>

          <button className="md:hidden p-2 text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl py-4 px-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.path}
              href={getNavLinkHref(link.path)}
              onClick={(e) => {
                handleNavClick(e, link.path);
                setMobileMenuOpen(false);
              }}
              className="text-base font-medium text-gray-800 hover:text-indigo-600"
            >
              {link.name}
            </a>
          ))}
          <div className="h-px bg-gray-100"></div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <select
              value={i18n.language.startsWith('tr') ? 'tr' : 'en'}
              onChange={(e) => { i18n.changeLanguage(e.target.value); setMobileMenuOpen(false); }}
              className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tr">🇹🇷 Türkçe</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
          <div className="h-px bg-gray-100"></div>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-gray-800 hover:text-indigo-600">{t('nav.login')}</Link>
          <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-center text-base font-medium px-5 py-3 rounded-xl text-white bg-indigo-600">{t('nav.start')}</Link>
        </div>
      )}
    </header>
  );
}

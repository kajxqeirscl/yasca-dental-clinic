import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowRight, Globe } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { t, i18n } = useTranslation('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clinicName, setClinicName] = useState('Kliniğinize');

  useEffect(() => {
    // URL'den kliniğin adını çekip göstermek için (örn: yildiz.localhost -> YILDIZ)
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const subdomain = hostname.split('.')[0];
      if (subdomain) {
        setClinicName(subdomain.charAt(0).toUpperCase() + subdomain.slice(1));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('error_generic');
      if (msg.includes('No active account found') || msg.includes('Giriş başarısız') || msg.includes(t('error_generic'))) {
        setError(t('error_invalid_credentials'));
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert(t('forgot_password_alert'));
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left Panel - Branding/Greeting */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 relative flex-col justify-between p-16 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[130px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[130px] opacity-20 translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/30">
              {clinicName.charAt(0).toUpperCase()}
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">
              {clinicName} Dental
            </span>
          </div>
          
          <h1 className="text-5xl font-extrabold text-white leading-[1.15] mb-6 tracking-tight">
            {t('greeting')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              {t('welcome_back')}
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">
            {t('welcome_desc')}
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-sm text-gray-500">
          <p>{t('secure_cloud')}</p>
          <p>{t('copyright')}</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 bg-[#fafafa] relative">
        
        {/* Right Panel Header (Navbar-like) */}
        <div className="absolute top-0 left-0 w-full p-6 sm:p-8 flex items-center justify-between z-10">
          <a 
            href={`http://${window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') ? 'localhost' : 'yasca.com'}${window.location.port ? ':' + window.location.port : ''}`}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
          >
            {t('back_to_home')}
          </a>
          
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <select
              value={i18n.language.startsWith('tr') ? 'tr' : 'en'}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-transparent border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <option value="tr">🇹🇷 Türkçe</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>

        <div className="w-full max-w-md mt-10 lg:mt-0">

          <div className="mb-10 lg:hidden flex flex-col items-center text-center">
             <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4">
              {clinicName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{clinicName} Dental</h2>
          </div>

          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{clinicName} Dental</h2>
            <p className="text-gray-500 text-lg">{t('panel_login_desc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-semibold text-gray-700 ml-1">
                {t('username_label')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder={t('username_placeholder')}
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-medium placeholder-gray-400 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  {t('password_label')}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {t('forgot_password')}
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder={t('password_placeholder')}
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 font-medium placeholder-gray-400 shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-lg shadow-gray-900/20 hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t('login_loading')}</>
              ) : (
                <>
                  {t('login_button')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                {t('not_admin_info')}
              </p>
            </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { t } = useTranslation('landing');
  const [formData, setFormData] = useState({
    clinic_name: '',
    subdomain: '',
    admin_email: '',
    admin_password: '',
    admin_first_name: '',
    admin_last_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginUrl, setLoginUrl] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.name === 'subdomain') {
      value = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocal
        ? `http://${window.location.hostname}:8000`
        : 'https://yasca-dental-clinic-pbbo.onrender.com';
      
      const res = await fetch(`${apiBase}/api/public/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Kayıt olurken bir hata oluştu.');
      }
      
      setSuccess(data.message);
      setLoginUrl(data.login_url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex bg-white">
      {/* Left Panel - Marketing */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 relative flex-col justify-between p-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600 rounded-full blur-[120px] opacity-20 translate-y-1/3 -translate-x-1/3"></div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-900 font-bold text-xl">Y</div>
            <span className="text-xl font-bold text-white">Yasca Dental</span>
          </Link>
          
          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            {t('hero.title_1')} <br />{t('hero.title_2')}.
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-md">
            {t('hero.subtitle')}
          </p>

          <div className="space-y-6">
            {[t('register.benefit_1'), t('register.benefit_2'), t('register.benefit_3'), t('register.benefit_4')].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          © {new Date().getFullYear()} Yasca Dental. {t('footer.rights')}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {success ? (
             <div className="rounded-2xl bg-indigo-50 p-8 border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-center mb-6">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                 <CheckCircle2 className="w-8 h-8 text-green-600" />
               </div>
             </div>
             <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">{t('register.success_title')}</h3>
             <p className="text-center text-gray-600 mb-8">
               {t('register.success_subtitle')}
             </p>
             
             <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8 space-y-4 shadow-sm">
               <div>
                 <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('register.success_address')}</p>
                 <a href={loginUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-medium hover:underline break-all">
                   {loginUrl}
                 </a>
               </div>
               <div className="h-px bg-gray-100"></div>
               <div>
                 <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('register.success_login')}</p>
                 <p className="font-medium text-gray-900">{formData.admin_email}</p>
               </div>
             </div>

             <a href={loginUrl} className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-white bg-gray-900 hover:bg-indigo-600 transition-all font-medium group shadow-lg shadow-gray-900/20 hover:shadow-indigo-500/30">
               {t('register.success_cta')}
               <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </a>
           </div>
          ) : (
            <>
              <div className="text-center lg:text-left mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('register.title')}</h1>
                <p className="text-gray-500">{t('register.subtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t('register.first_name')}</label>
                    <input name="admin_first_name" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t('register.last_name')}</label>
                    <input name="admin_last_name" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('register.clinic_name')}</label>
                  <input name="clinic_name" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('register.subdomain')}</label>
                  <div className="relative flex items-center">
                    <input name="subdomain" value={formData.subdomain} required className={`w-full pl-4 pr-24 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all font-mono text-sm ${error && (error.includes('subdomain') || error.includes('adres')) ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'}`} onChange={handleChange} />
                    <span className="absolute right-4 text-gray-400 select-none text-sm font-medium">.yasca.com</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{t('register.subdomain_hint')}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('register.email')}</label>
                  <input name="admin_email" type="email" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('register.password')}</label>
                  <input name="admin_password" type="password" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" onChange={handleChange} />
                </div>

                <button type="submit" disabled={loading} className="w-full py-4 mt-4 bg-gray-900 text-white rounded-xl font-medium text-lg hover:bg-indigo-600 transition-all shadow-lg shadow-gray-900/20 hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {t('register.submitting')}</>
                  ) : (
                    t('register.submit')
                  )}
                </button>
              </form>
              
              <p className="text-center text-sm text-gray-500 mt-8">
                {t('register.have_account')} <Link to="/login" className="text-indigo-600 font-medium hover:underline">{t('register.login_link')}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

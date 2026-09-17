import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export default function SaaSLandingPage() {
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const apiBase = import.meta.env.VITE_API_URL
        ? (import.meta.env.VITE_API_URL as string).replace(/\/api\/?$/, '')
        : `http://${window.location.hostname}:8000`;
      
      const res = await fetch(`${apiBase}/api/public/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || t('saas_register.error_register', 'Kayıt olurken bir hata oluştu.'));
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{t('saas_register.page_title')}</title>
        <meta name="description" content={t('saas_register.page_desc')} />
      </Helmet>
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('saas_register.brand_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('saas_register.brand_subtitle')}
          </p>
        </div>
        
        {success ? (
          <div className="rounded-md bg-green-50 p-6 border border-green-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xl">✅</span>
              <h3 className="text-lg font-semibold text-green-800">{t('saas_register.success_title')}</h3>
            </div>
            <p className="text-sm text-green-700">{success}</p>
            
            <div className="bg-white rounded-lg p-4 border border-green-100 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('saas_register.credentials_title')}</p>
              <div className="text-sm text-gray-800">
                <p><span className="font-medium">{t('saas_register.address_label')}</span> <code className="bg-gray-100 px-1 rounded">{loginUrl}</code></p>
                <p><span className="font-medium">{t('saas_register.username_label')}</span> <code className="bg-gray-100 px-1 rounded">{formData.admin_email}</code></p>
                <p><span className="font-medium">{t('saas_register.password_label')}</span> {t('saas_register.password_hint')}</p>
              </div>
            </div>

            <a href={loginUrl} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              {t('saas_register.go_to_clinic')}
            </a>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>
            )}
            
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input name="clinic_name" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder={t('saas_register.placeholder_clinic')} onChange={handleChange} />
              </div>
              <div>
                <input name="subdomain" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder={t('saas_register.placeholder_subdomain')} onChange={handleChange} />
              </div>
              <div>
                <input name="admin_first_name" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder={t('saas_register.placeholder_first_name')} onChange={handleChange} />
              </div>
              <div>
                <input name="admin_last_name" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder={t('saas_register.placeholder_last_name')} onChange={handleChange} />
              </div>
              <div>
                <input name="admin_email" type="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder={t('saas_register.placeholder_email')} onChange={handleChange} />
              </div>
              <div>
                <input name="admin_password" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder={t('saas_register.placeholder_password')} onChange={handleChange} />
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                {loading ? t('saas_register.btn_loading') : t('saas_register.btn_submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

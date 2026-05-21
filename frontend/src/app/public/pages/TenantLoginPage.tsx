import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TenantLoginPage() {
  const { t } = useTranslation('landing');
  const [subdomain, setSubdomain] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain) return;
    
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol;
    
    const targetHost = isLocal ? `${subdomain}.localhost` : `${subdomain}.yasca.com`;
    const targetUrl = `${protocol}//${targetHost}${port}/`;
    
    window.location.href = targetUrl;
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(value);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#fafafa] px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-6 shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{t('tenant_login.title')}</h2>
          <p className="text-gray-500 text-lg">
            {t('tenant_login.subtitle')}
          </p>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">{t('tenant_login.label')}</label>
              <div className="relative flex items-center shadow-sm rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 border border-gray-200 transition-all bg-gray-50">
                <input
                  type="text"
                  required
                  value={subdomain}
                  onChange={handleSubdomainChange}
                  className="w-full pl-4 pr-24 py-4 bg-transparent outline-none text-gray-900 font-medium placeholder-gray-400"
                  autoFocus
                />
                <div className="absolute right-0 top-0 bottom-0 px-4 flex items-center bg-gray-100 border-l border-gray-200">
                  <span className="text-gray-500 font-medium text-sm">.yasca.com</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!subdomain}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-medium text-lg bg-gray-900 hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-md"
            >
              {t('tenant_login.button')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500">
          {t('tenant_login.no_account')}{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline">
            {t('tenant_login.register_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}

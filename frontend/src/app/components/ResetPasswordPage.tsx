import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { confirmPasswordReset, fetchPublicClinicInfo, setTenantSlug } from '../services/api';

export default function ResetPasswordPage() {
  const { slug, uid, token } = useParams<{ slug?: string; uid: string; token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('login');
  
  // Set tenant slug early so API calls use the correct schema
  useEffect(() => {
    if (slug) {
      setTenantSlug(slug);
    }
  }, [slug]);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [clinicName, setClinicName] = useState('Yaşca');

  useEffect(() => {
    const loadClinicName = async () => {
      try {
        const data = await fetchPublicClinicInfo();
        setClinicName(data.clinic_name);
        document.title = `${t('reset_password_title')} - ${data.clinic_name}`;
      } catch (err) {
        setClinicName('Yaşca Dental');
      }
    };
    loadClinicName();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }

    if (!uid || !token) {
      setError('Geçersiz bağlantı.');
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(uid, token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate(slug ? `/app/${slug}` : '/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || t('error_generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans selection:bg-indigo-500 selection:text-white items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4">
            {clinicName.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t('reset_password_title')}</h2>
          <p className="text-gray-500 text-sm mt-2">{clinicName}</p>
        </div>

        {success ? (
          <div className="text-center space-y-4 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">{t('reset_success')}</h3>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-4">
              <div className="bg-green-500 h-full animate-[progress_3s_ease-in-out_forwards]"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-600 items-start">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                {t('new_password')}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                {t('new_password_confirm')}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('reset_button')
              )}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate(slug ? `/app/${slug}` : '/')}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                {t('reset_cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

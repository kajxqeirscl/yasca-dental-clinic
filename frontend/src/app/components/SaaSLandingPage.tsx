import React, { useState } from 'react';

export default function SaaSLandingPage() {
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
      const res = await fetch(`http://${window.location.hostname}:8000/api/public/register/`, {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Yasca Dental SaaS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sisteme katılın, kliniğinizin veritabanı 1 saniyede otomatik kurulsun.
          </p>
        </div>
        
        {success ? (
          <div className="rounded-md bg-green-50 p-6 border border-green-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xl">✅</span>
              <h3 className="text-lg font-semibold text-green-800">Kayıt Başarılı!</h3>
            </div>
            <p className="text-sm text-green-700">{success}</p>
            
            <div className="bg-white rounded-lg p-4 border border-green-100 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Giriş Bilgileriniz</p>
              <div className="text-sm text-gray-800">
                <p><span className="font-medium">Adres:</span> <code className="bg-gray-100 px-1 rounded">{loginUrl}</code></p>
                <p><span className="font-medium">Kullanıcı Adı:</span> <code className="bg-gray-100 px-1 rounded">{formData.admin_email}</code></p>
                <p><span className="font-medium">Şifre:</span> Kayıt sırasında belirlediğiniz şifre</p>
              </div>
            </div>

            <a href={loginUrl} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              🏥 Kliniğime Git
            </a>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>
            )}
            
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input name="clinic_name" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Klinik Adı (Örn: Yıldız Diş)" onChange={handleChange} />
              </div>
              <div>
                <input name="subdomain" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Sistem Adresi (Örn: yildiz)" onChange={handleChange} />
              </div>
              <div>
                <input name="admin_first_name" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Yönetici Adı" onChange={handleChange} />
              </div>
              <div>
                <input name="admin_last_name" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Yönetici Soyadı" onChange={handleChange} />
              </div>
              <div>
                <input name="admin_email" type="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="E-Posta Adresi" onChange={handleChange} />
              </div>
              <div>
                <input name="admin_password" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Yönetici Şifresi" onChange={handleChange} />
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                {loading ? 'Klinik Kuruluyor...' : 'Hemen Başla'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicApp from './public/PublicApp';
import ClinicApp from './ClinicApp';

/**
 * Ana Uygulama Yönlendiricisi
 * 
 * - /              → Public SaaS Tanıtım Sitesi
 * - /app/:slug/*   → Klinik Yönetim Paneli (multi-tenant)
 * 
 * Lokal geliştirmede subdomain yapısı (ali.localhost) hâlâ çalışır.
 * Canlıda ise path tabanlı yapı kullanılır (vercel.app/app/ali).
 */
export default function App() {
  const hostname = window.location.hostname;

  // Lokal geliştirmede subdomain varsa (ali.localhost gibi) doğrudan klinik paneline git
  const isLocalSubdomain =
    (hostname.endsWith('.localhost') && hostname !== 'localhost') ||
    (hostname !== '127.0.0.1' && hostname !== 'localhost' && hostname.includes('.localhost'));

  if (isLocalSubdomain) {
    // Lokal subdomain: ali.localhost -> tenant bilgisi Host header ile otomatik gider
    return (
      <BrowserRouter>
        <ClinicApp tenantSlug="" />
      </BrowserRouter>
    );
  }

  // Canlı ortam + lokal ana sayfa: path tabanlı routing
  return (
    <BrowserRouter>
      <Routes>
        {/* /app/:slug altındaki her şey klinik paneline gider */}
        <Route path="/app/:slug/*" element={<ClinicAppWrapper />} />
        {/* Diğer her şey PublicApp (tanıtım sitesi) */}
        <Route path="/*" element={<PublicApp />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * URL'deki :slug parametresini ClinicApp'e aktarır
 */
function ClinicAppWrapper() {
  // useParams BrowserRouter içinde zaten olduğumuz için burada kullanılabilir
  // Ama Route element içinden params almak için bir wrapper lazım
  return <ClinicAppParamsReader />;
}

import { useParams } from 'react-router-dom';

function ClinicAppParamsReader() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/" replace />;
  return <ClinicApp tenantSlug={slug} />;
}

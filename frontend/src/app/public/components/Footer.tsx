import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                Y
              </div>
              <span className="text-lg font-bold text-gray-900">Yasca Dental</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Modern diş klinikleri için bulut tabanlı, yeni nesil yönetim platformu.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Ürün</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link to="/features" className="hover:text-indigo-600 transition-colors">Özellikler</Link></li>
              <li><Link to="/pricing" className="hover:text-indigo-600 transition-colors">Fiyatlandırma</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">Güncellemeler</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Şirket</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">Hakkımızda</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">Müşteri Hikayeleri</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">İletişim</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Yasal</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">Gizlilik Politikası</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">Kullanım Şartları</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">KVKK Aydınlatma Metni</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Yasca Dental Yazılım Teknolojileri. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Türkiye'de ❤️ ile geliştirildi</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

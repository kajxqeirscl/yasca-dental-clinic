import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('landing');

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm">Y</div>
              <span className="text-lg font-bold text-gray-900">Yasca Dental</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">{t('footer.tagline')}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t('footer.product')}</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">{t('nav.features')}</a></li>
              <li><a href="#pricing" className="hover:text-indigo-600 transition-colors">{t('nav.pricing')}</a></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">{t('footer.updates')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t('footer.company')}</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">{t('footer.about')}</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">{t('footer.stories')}</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">{t('footer.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">{t('footer.kvkk')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Yasca Dental. {t('footer.rights')}</p>
          <p className="text-sm text-gray-500">{t('footer.made_in')}</p>
        </div>
      </div>
    </footer>
  );
}

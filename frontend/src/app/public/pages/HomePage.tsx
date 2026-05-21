import { Link } from 'react-router-dom';
import { Shield, Zap, Users, Calendar, Cloud, Activity, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation('landing');

  const features = [
    { icon: <Cloud className="w-6 h-6 text-indigo-500" />, title: t('features.cloud.title'), desc: t('features.cloud.desc') },
    { icon: <Shield className="w-6 h-6 text-indigo-500" />, title: t('features.security.title'), desc: t('features.security.desc') },
    { icon: <Calendar className="w-6 h-6 text-indigo-500" />, title: t('features.calendar.title'), desc: t('features.calendar.desc') },
    { icon: <Users className="w-6 h-6 text-indigo-500" />, title: t('features.staff.title'), desc: t('features.staff.desc') },
    { icon: <Zap className="w-6 h-6 text-indigo-500" />, title: t('features.fast.title'), desc: t('features.fast.desc') },
    { icon: <Activity className="w-6 h-6 text-indigo-500" />, title: t('features.metrics.title'), desc: t('features.metrics.desc') },
  ];

  const pricing = [
    {
      title: t('pricing.standard.title'), price: '499₺', desc: t('pricing.standard.desc'),
      features: [t('pricing.standard.f1'), t('pricing.standard.f2'), t('pricing.standard.f3'), t('pricing.standard.f4')],
      popular: false,
    },
    {
      title: t('pricing.pro.title'), price: '999₺', desc: t('pricing.pro.desc'),
      features: [t('pricing.pro.f1'), t('pricing.pro.f2'), t('pricing.pro.f3'), t('pricing.pro.f4')],
      popular: true,
    },
    {
      title: t('pricing.enterprise.title'), price: t('pricing.custom'), desc: t('pricing.enterprise.desc'),
      features: [t('pricing.enterprise.f1'), t('pricing.enterprise.f2'), t('pricing.enterprise.f3'), t('pricing.enterprise.f4')],
      popular: false,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-3xl opacity-60 mix-blend-multiply"></div>
          <div className="absolute top-40 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-200/50 to-indigo-200/50 blur-3xl opacity-60 mix-blend-multiply"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            {t('hero.badge')}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.1]">
            {t('hero.title_1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{t('hero.title_2')}</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed">{t('hero.subtitle')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-full font-medium text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-gray-900/20 hover:shadow-indigo-500/30 hover:-translate-y-1">
              {t('hero.cta_primary')}
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-medium text-lg hover:bg-gray-50 transition-all hover:-translate-y-1 shadow-sm">
              {t('hero.cta_secondary')}
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('features.title')}</h2>
            <p className="text-lg text-gray-600">{t('features.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:shadow-indigo-100 transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-gray-50" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('pricing.title')}</h2>
            <p className="text-lg text-gray-600">{t('pricing.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((p, i) => (
              <div key={i} className={`relative p-8 rounded-3xl ${p.popular ? 'bg-gray-900 text-white shadow-2xl scale-105 z-10' : 'bg-white text-gray-900 border border-gray-200'}`}>
                {p.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                    {t('pricing.popular')}
                  </div>
                )}
                <h3 className={`text-xl font-semibold mb-2 ${p.popular ? 'text-gray-100' : 'text-gray-900'}`}>{p.title}</h3>
                <p className={`text-sm mb-6 ${p.popular ? 'text-gray-400' : 'text-gray-500'}`}>{p.desc}</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold">{p.price}</span>
                  {p.price !== t('pricing.custom') && <span className={`text-sm ${p.popular ? 'text-gray-400' : 'text-gray-500'}`}>{t('pricing.per_month')}</span>}
                </div>
                <ul className="space-y-4 mb-8">
                  {p.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <CheckCircle2 className={`w-5 h-5 ${p.popular ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <span className={`text-sm font-medium ${p.popular ? 'text-gray-300' : 'text-gray-700'}`}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block w-full py-3 px-6 text-center rounded-xl font-medium transition-colors ${p.popular ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                  {t('pricing.select')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">{t('cta.title_1')}<br />{t('cta.title_2')}</h2>
            <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto relative z-10">{t('cta.subtitle')}</p>
            <Link to="/register" className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-full font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg relative z-10 hover:-translate-y-1">
              {t('cta.button')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

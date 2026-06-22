import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// TR Locales
import trCommon from '../../locales/tr/common.json';
import trLogin from '../../locales/tr/login.json';
import trPatients from '../../locales/tr/patients.json';
import trAppointments from '../../locales/tr/appointments.json';
import trTreatments from '../../locales/tr/treatments.json';
import trPayments from '../../locales/tr/payments.json';
import trDashboard from '../../locales/tr/dashboard.json';
import trSettings from '../../locales/tr/settings.json';
import trLanding from '../../locales/tr/landing.json';

// EN Locales
import enCommon from '../../locales/en/common.json';
import enLogin from '../../locales/en/login.json';
import enPatients from '../../locales/en/patients.json';
import enAppointments from '../../locales/en/appointments.json';
import enTreatments from '../../locales/en/treatments.json';
import enPayments from '../../locales/en/payments.json';
import enDashboard from '../../locales/en/dashboard.json';
import enSettings from '../../locales/en/settings.json';
import enLanding from '../../locales/en/landing.json';

const resources = {
  tr: {
    common: trCommon,
    login: trLogin,
    patients: trPatients,
    appointments: trAppointments,
    treatments: trTreatments,
    payments: trPayments,
    dashboard: trDashboard,
    settings: trSettings,
    landing: trLanding,
  },
  en: {
    common: enCommon,
    login: enLogin,
    patients: enPatients,
    appointments: enAppointments,
    treatments: enTreatments,
    payments: enPayments,
    dashboard: enDashboard,
    settings: enSettings,
    landing: enLanding,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: 'common',
    lng: 'tr', // default language
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
  });

export default i18n;

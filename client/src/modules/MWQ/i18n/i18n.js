import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './en.json';
import arTranslations from './ar.json';

// Retrieve the saved language or default to English
const savedLanguage = localStorage.getItem('appLanguage') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values to prevent XSS
    }
  });

// Set the initial document direction and language attribute
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLanguage;
if (savedLanguage === 'ar') {
  document.documentElement.classList.add('font-arabic');
} else {
  document.documentElement.classList.remove('font-arabic');
}

// Listen for language changes and update the document accordingly
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('appLanguage', lng);
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  if (lng === 'ar') {
    document.documentElement.classList.add('font-arabic');
  } else {
    document.documentElement.classList.remove('font-arabic');
  }
});

export default i18n;

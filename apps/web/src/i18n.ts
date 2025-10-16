import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { ptBR } from './lang/pt-br';
import { enUS } from './lang/en-us';

export const defaultNS = 'translation';
export const fallbackLng = 'pt';
export const resources = {
  pt: ptBR,
  en: enUS,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['pt', 'en'],
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
  });

export default i18n;

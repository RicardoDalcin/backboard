import i18n from 'i18next';
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
  .use(initReactI18next)
  .init({ resources, lng: 'en', interpolation: { escapeValue: false } });

export default i18n;

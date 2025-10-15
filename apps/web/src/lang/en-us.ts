import { ptBR } from './pt-br';
type Resource = typeof ptBR;

export const enUS: Resource = {
  translation: {
    welcome: {
      title: 'Welcome to Backboard',
      aboutBackboard:
        'Backboard in an offline-first data visualization dashboard for exploring, analyzing and comparing NBA shot data.',
      offlineFirst:
        'Since this is an offline-first experience, if you choose to continue the app will download the data and save it locally in your browser.',
      connectionDisclaimer:
        "This process shouldn't take long, but please make sure you have a stable internet connection (download is about 150mb). You can delete the data at any time in the settings menu on the top right corner.",
      continue: 'Continue to the dashboard',
    },
  },
};

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation, Trans } from 'react-i18next';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex items-center justify-center flex-col gap-12 pb-[20vh]">
      <h1 className="text-4xl font-semibold">{t('about.title')}</h1>

      <div className="max-w-xl text-justify flex items-center justify-center flex-col gap-4 text-muted-foreground">
        <p className="text-lg">{t('welcome.aboutBackboard')}</p>

        <p className="text-lg">
          <Trans
            i18nKey="about.openSource"
            components={{
              anchor: (
                <a
                  href="https://github.com/RicardoDalcin/backboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-500 transition-colors"
                />
              ),
            }}
          />
        </p>
      </div>
    </div>
  );
}

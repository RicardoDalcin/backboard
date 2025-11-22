import { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type FormatterStore = {
  bigNumber: Intl.NumberFormat;
  percentage: Intl.NumberFormat;
};

const FormatterStoreContext = createContext<FormatterStore>({
  bigNumber: new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),
  percentage: new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
});

export function FormatterProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  const bigNumber = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [i18n.language],
  );

  const percentage = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [i18n.language],
  );

  return (
    <FormatterStoreContext.Provider value={{ bigNumber, percentage }}>
      {children}
    </FormatterStoreContext.Provider>
  );
}

export function useFormatter() {
  const context = useContext(FormatterStoreContext);
  if (context === undefined) {
    throw new Error('useFormatter must be used within a FormatterProvider');
  }
  return context;
}

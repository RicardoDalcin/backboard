import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { db } from '@/server/db';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { Trans, useTranslation } from 'react-i18next';

const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function SettingsDialog({
  isOpen,
  onOpenChange,
  children,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [fileSize, setFileSize] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const { t } = useTranslation();
  const location = useLocation();

  const fileSizeMB = useMemo(() => {
    return formatter.format(fileSize / 1024 / 1024) + 'mb';
  }, [fileSize]);

  useEffect(() => {
    db.getStorageSize().then((size) => {
      setFileSize(size);
    });
  }, [isOpen]);

  const deleteData = useCallback(async () => {
    try {
      setIsDeleting(true);
      await db.deleteData();
      localStorage.removeItem('backboard.hasOptedIn');
      window.location.reload();
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  }, []);

  const hasOptedIn = useMemo(
    () => location.pathname !== '/welcome',
    [location.pathname],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>

        {hasOptedIn ? (
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>
                <Trans
                  i18nKey="settings.storageUsage"
                  values={{ size: fileSizeMB }}
                  components={{
                    bold: <span className="font-semibold text-foreground" />,
                  }}
                />
              </p>
              <p className="text-xs">{t('settings.storageDisclaimer')}</p>
            </div>

            <Dialog
              open={isConfirmationOpen}
              onOpenChange={setIsConfirmationOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">{t('settings.clearStorage.title')}</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('settings.clearStorage.title')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t('settings.clearStorage.description')}
                  </p>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" size="sm">
                        {t('global.cancel')}
                      </Button>
                    </DialogClose>

                    <Button
                      onClick={deleteData}
                      loading={isDeleting}
                      disabled={isDeleting}
                      variant="destructive"
                      size="sm"
                    >
                      {t('settings.clearStorage.confirm')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>{t('settings.hasNotOptedIn')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

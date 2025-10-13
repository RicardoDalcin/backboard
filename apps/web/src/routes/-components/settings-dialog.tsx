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
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        {hasOptedIn ? (
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>
                NBA shot data is using{' '}
                <span className="font-semibold text-foreground">
                  {fileSizeMB}
                </span>{' '}
                of storage.
              </p>
              <p className="text-xs">
                This storage is used to make the offline-first experience
                possible.
              </p>
            </div>

            <Dialog
              open={isConfirmationOpen}
              onOpenChange={setIsConfirmationOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">Clear Storage</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear Storage</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete app data? This will only
                    affect data and it will not delete your custom filters.
                  </p>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" size="sm">
                        Cancel
                      </Button>
                    </DialogClose>

                    <Button
                      onClick={deleteData}
                      loading={isDeleting}
                      disabled={isDeleting}
                      variant="destructive"
                      size="sm"
                    >
                      Delete data
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>You have not opted in to download the data and use the app.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

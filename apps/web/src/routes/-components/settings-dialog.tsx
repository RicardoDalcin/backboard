import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { db } from '@/server/db';
import { useEffect, useState } from 'react';

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const [fileSize, setFileSize] = useState(0);

  useEffect(() => {
    db.getStorageSize().then((size) => {
      setFileSize(size);
    });
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">{fileSize}</div>
      </DialogContent>
    </Dialog>
  );
}

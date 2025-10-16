import { Button } from '@/components/ui/button';
import {
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const CreateFilterDialog = ({
  defaultName,
  onCreate,
}: {
  defaultName?: string;
  onCreate: (name: string) => void;
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultName ?? '');

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!name) {
        return;
      }

      onCreate(name);
      setName('');
    },
    [name, onCreate],
  );

  useEffect(() => {
    setName(defaultName ?? '');
  }, [defaultName]);

  return (
    <DialogContent className="w-[280px] sm:w-[400px]">
      <DialogHeader>
        <DialogTitle>
          {defaultName ? t('filters.editFilter') : t('filters.createFilter')}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={onSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {t('filters.name')}
            </Label>

            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('filters.filterExample')}
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit" disabled={!name}>
              {t('filters.saveChanges')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

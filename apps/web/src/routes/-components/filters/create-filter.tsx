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
import { useCallback, useState } from 'react';

export const CreateFilterDialog = ({
  onCreate,
}: {
  onCreate: (name: string) => void;
}) => {
  const [name, setName] = useState('');

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

  return (
    <DialogContent className="w-[280px] sm:w-[400px]">
      <DialogHeader>
        <DialogTitle>Create filter</DialogTitle>
      </DialogHeader>

      <form onSubmit={onSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>

            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "2023-24 Season"'
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit" disabled={!name}>
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

import { cn } from '@/lib/utils';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/solid';
import { Button } from './button';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './command';
import { FormControl } from './form';
import { Popover, PopoverTrigger, PopoverContent } from './popover';

interface ComboboxProps<T> {
  value: T;
  options: Array<{ label: string; value: T }>;
  onSelect: (value: T) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchEmptyMessage?: string;
  className?: string;
}

export function Combobox<T>({
  value,
  options,
  onSelect,
  placeholder,
  searchPlaceholder,
  searchEmptyMessage,
  className,
}: ComboboxProps<T>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              'justify-between',
              !value && 'text-muted-foreground',
              className,
            )}
          >
            {value
              ? options.find((option) => option.value === value)?.label
              : (placeholder ?? 'Select an option')}
            <ChevronUpDownIcon className="opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>

      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder ?? 'Search...'}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              {searchEmptyMessage ?? 'No results found'}
            </CommandEmpty>

            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  value={option.label}
                  key={String(option.value)}
                  onSelect={() => {
                    onSelect(option.value);
                  }}
                >
                  {option.label}
                  <CheckIcon
                    className={cn(
                      'ml-auto',
                      option.value === value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
  CommandSeparator,
} from './command';
import { FormControl } from './form';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { useCallback, useMemo } from 'react';

interface ComboboxProps<T> {
  values: T[];
  options: Array<{ label: string; value: T }>;
  onSelect: (values: T[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchEmptyMessage?: string;
  className?: string;
  multiSelectedMessage?: string;
}

export function MultiCombobox<T>({
  values,
  options,
  onSelect,
  placeholder,
  searchPlaceholder,
  searchEmptyMessage,
  multiSelectedMessage,
  className,
}: ComboboxProps<T>) {
  const valueFormatted = useMemo(() => {
    if (values.length === 0) {
      return placeholder ?? 'Select options';
    }

    if (values.length === 1) {
      return options.find((option) => option.value === values[0])?.label;
    }

    return `${values.length} ${multiSelectedMessage ?? 'options selected'}`;
  }, [multiSelectedMessage, options, placeholder, values]);

  const onChange = useCallback(
    (value: T) => {
      const newValues = values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];

      onSelect(newValues);
    },
    [onSelect, values],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              'justify-between',
              !values.length && 'text-muted-foreground',
              className,
            )}
          >
            {valueFormatted}
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

          <CommandGroup>
            <CommandItem
              key="clear"
              onSelect={() => onSelect([])}
              disabled={!values.length}
            >
              Clear all selected
            </CommandItem>
          </CommandGroup>

          <CommandList>
            <CommandEmpty>
              {searchEmptyMessage ?? 'No results found'}
            </CommandEmpty>

            <CommandSeparator />

            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  value={option.label}
                  key={String(option.value)}
                  onSelect={() => {
                    onChange(option.value);
                  }}
                >
                  {option.label}
                  <CheckIcon
                    className={cn(
                      'ml-auto',
                      values.includes(option.value)
                        ? 'opacity-100'
                        : 'opacity-0',
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

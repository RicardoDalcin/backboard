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
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ComboboxProps<T> {
  values: T[];
  options: Array<{ label: string; value: T }>;
  maxOptions?: number;
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
  maxOptions,
  className,
}: ComboboxProps<T>) {
  const [query, setQuery] = useState('');
  const { t } = useTranslation();

  const valueFormatted = useMemo(() => {
    if (values.length === 0) {
      return placeholder ?? t('select.selectOptions');
    }

    if (values.length === 1) {
      return options.find((option) => option.value === values[0])?.label;
    }

    return `${values.length} ${multiSelectedMessage ?? t('select.optionsSelected')}`;
  }, [multiSelectedMessage, options, placeholder, t, values]);

  const onChange = useCallback(
    (value: T) => {
      const newValues = values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];

      onSelect(newValues);
    },
    [onSelect, values],
  );

  const finalOptions = useMemo(() => {
    if (!maxOptions) {
      return options;
    }

    const list: { label: string; value: T }[] = [];

    for (const option of options) {
      if (option.label.toLowerCase().includes(query.toLowerCase())) {
        list.push(option);
      }

      if (list.length === maxOptions) {
        break;
      }
    }

    return list;
  }, [maxOptions, options, query]);

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
            placeholder={searchPlaceholder ?? t('select.search')}
            className="h-9"
            value={query}
            onValueChange={setQuery}
          />

          <CommandGroup>
            <CommandItem
              key="clear"
              onSelect={() => onSelect([])}
              disabled={!values.length}
            >
              {t('select.clearAllSelected')}
            </CommandItem>
          </CommandGroup>

          <CommandList>
            <CommandEmpty>
              {searchEmptyMessage ?? t('select.noResultsFound')}
            </CommandEmpty>

            <CommandSeparator />

            <CommandGroup>
              {finalOptions.map((option) => (
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

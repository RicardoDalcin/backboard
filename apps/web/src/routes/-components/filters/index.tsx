import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { FilterForm } from './form';
import { useFilters } from '@/stores/filters';

export const Filters = ({ className }: { className?: string }) => {
  const { filters, currentFilter, selectFilter } = useFilters();

  return (
    <Card
      className={clsx('flex flex-col gap-5 w-[350px] h-min px-5', className)}
    >
      <div className="w-full flex items-center justify-between ">
        <DropdownMenu>
          <DropdownMenuTrigger className="-ml-2" asChild>
            <Button variant="ghost">
              <p className="text-lg font-semibold">New filter</p>
              <ChevronDownIcon className="size-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-[280px]" align="start">
            <DropdownMenuItem>
              Create filter
              <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={String(currentFilter.id)}
              onValueChange={(newValue) => selectFilter(Number(newValue))}
            >
              {filters.map((filter) => (
                <DropdownMenuRadioItem
                  key={filter.id}
                  value={String(filter.id)}
                >
                  {filter.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" className="-mr-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-4.5"
          >
            <path
              d="M3.75 10.8331C3.95405 12.4532 4.74555 13.942 5.97437 15.0172C7.2032 16.0924 8.78389 16.6793 10.4167 16.6665C11.495 16.6653 12.557 16.4026 13.5116 15.9008C14.4661 15.3991 15.2847 14.6732 15.897 13.7856C16.5094 12.898 16.8973 11.8751 17.0275 10.8046C17.1577 9.73408 17.0262 8.64799 16.6444 7.63947C16.2626 6.63095 15.6419 5.73009 14.8354 5.01419C14.029 4.29828 13.0609 3.78869 12.0142 3.52913C10.9675 3.26957 9.87354 3.26779 8.82603 3.52394C7.77852 3.78009 6.80878 4.28652 6 4.9998L3.75 6.9998"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7.91667 7.4998L3.75 7.4998L3.75 3.33314"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Clear
        </Button>
      </div>

      <FilterForm />
    </Card>
  );
};

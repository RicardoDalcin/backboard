import { db } from '@/server/db';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { TEAMS } from '@nba-viz/data';
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

type StatsByTeam = Awaited<ReturnType<typeof db.getStatsByTeam>>;
type StatsByTeamWithTeam = StatsByTeam[number] & {
  teamName: string;
};

const bigFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function TeamStatsTable({ data }: { data: StatsByTeam }) {
  const { t } = useTranslation();

  const dataWithTeam = useMemo<StatsByTeamWithTeam[]>(() => {
    return data.map((item) => {
      const team = TEAMS.find((team) => team.id === item.teamId);
      return {
        ...item,
        teamName: team?.name ?? '',
      };
    });
  }, [data]);

  const columns = useMemo<ColumnDef<StatsByTeamWithTeam>[]>(() => {
    return [
      {
        header: t('basketball.stats.team'),
        accessorKey: 'teamName',
        enableSorting: false,
      },
      {
        header: t('basketball.stats.shots'),
        accessorKey: 'totalShots',
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const totalA =
            rowA.original.total2PtShots + rowA.original.total3PtShots;
          const totalB =
            rowB.original.total2PtShots + rowB.original.total3PtShots;

          return totalA - totalB;
        },
        cell: ({ row }) =>
          bigFormatter.format(
            row.original.total2PtShots + row.original.total3PtShots,
          ),
      },
      {
        header: '2pts',
        accessorKey: 'total2PtShots',
        enableSorting: true,
        cell: ({ row }) => bigFormatter.format(row.original.total2PtShots),
      },
      {
        header: 'FG2%',
        accessorKey: 'total2PtMade',
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const fg2A =
            rowA.original.total2PtMade / (rowA.original.total2PtShots || 1);
          const fg2B =
            rowB.original.total2PtMade / (rowB.original.total2PtShots || 1);
          return fg2A - fg2B;
        },
        cell: ({ row }) =>
          percentageFormatter.format(
            (row.original.total2PtMade / (row.original.total2PtShots || 1)) *
              100,
          ) + '%',
      },
      {
        header: '3pts',
        accessorKey: 'total3PtShots',
        enableSorting: true,
        cell: ({ row }) => bigFormatter.format(row.original.total3PtShots),
      },
      {
        header: 'FG3%',
        accessorKey: 'total3PtMade',
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const fg3A =
            rowA.original.total3PtMade / (rowA.original.total3PtShots || 1);
          const fg3B =
            rowB.original.total3PtMade / (rowB.original.total3PtShots || 1);
          return fg3A - fg3B;
        },
        cell: ({ row }) =>
          percentageFormatter.format(
            (row.original.total3PtMade / (row.original.total3PtShots || 1)) *
              100,
          ) + '%',
      },
      {
        header: 'eFG%',
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const totalShotsA =
            rowA.original.total2PtShots + rowA.original.total3PtShots || 1;
          const totalShotsB =
            rowB.original.total2PtShots + rowB.original.total3PtShots || 1;
          const efgA =
            (rowA.original.total2PtMade + 1.5 * rowA.original.total3PtMade) /
            totalShotsA;
          const efgB =
            (rowB.original.total2PtMade + 1.5 * rowB.original.total3PtMade) /
            totalShotsB;
          return efgA - efgB;
        },
        cell: ({ row }) => {
          const totalShots =
            row.original.total2PtShots + row.original.total3PtShots || 1;
          return (
            percentageFormatter.format(
              ((row.original.total2PtMade + 1.5 * row.original.total3PtMade) /
                totalShots) *
                100,
            ) + '%'
          );
        },
      },
    ];
  }, [t]);

  const table = useReactTable<StatsByTeamWithTeam>({
    data: dataWithTeam,
    columns,
    initialState: {
      sorting: [
        {
          id: 'totalShots',
          desc: true,
        },
      ],
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          canSort
                            ? 'flex items-center gap-1 cursor-pointer select-none hover:text-foreground'
                            : 'flex items-center'
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort && (
                          <span>
                            {sortDirection === 'asc' ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : sortDirection === 'desc' ? (
                              <ArrowDownIcon className="h-4 w-4" />
                            ) : null}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="truncate"
                    style={{
                      width:
                        cell.column.id === 'teamName' ? '160px' : undefined,
                      maxWidth:
                        cell.column.id === 'teamName' ? '160px' : undefined,
                      minWidth:
                        cell.column.id === 'teamName' ? '160px' : undefined,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {t('global.noResults')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

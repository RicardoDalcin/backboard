import { db } from '@/server/db';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { PLAYERS } from '@nba-viz/data';
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

type StatsByPlayer = Awaited<ReturnType<typeof db.getStatsByPlayer>>;
type StatsByPlayerWithPlayer = StatsByPlayer[number] & {
  playerName: string;
};

const bigFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function PlayerStatsTable({ data }: { data: StatsByPlayer }) {
  const { t } = useTranslation();

  const dataWithPlayer = useMemo<StatsByPlayerWithPlayer[]>(() => {
    return data.map((item) => {
      const player = PLAYERS.find((player) => player.id === item.playerId);
      return {
        ...item,
        playerName: player?.name ?? '',
      };
    });
  }, [data]);

  const columns = useMemo<ColumnDef<StatsByPlayerWithPlayer>[]>(() => {
    return [
      {
        header: t('basketball.stats.player'),
        accessorKey: 'playerName',
      },
      {
        header: t('basketball.stats.shots'),
        accessorKey: 'totalShots',
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
        cell: ({ row }) => bigFormatter.format(row.original.total2PtShots),
      },
      {
        header: 'FG2%',
        accessorKey: 'total2PtMade',
        cell: ({ row }) =>
          percentageFormatter.format(
            (row.original.total2PtMade / (row.original.total2PtShots || 1)) *
              100,
          ) + '%',
      },
      {
        header: '3pts',
        accessorKey: 'total3PtShots',
        cell: ({ row }) => bigFormatter.format(row.original.total3PtShots),
      },
      {
        header: 'FG3%',
        accessorKey: 'total3PtMade',
        cell: ({ row }) =>
          percentageFormatter.format(
            (row.original.total3PtMade / (row.original.total3PtShots || 1)) *
              100,
          ) + '%',
      },
      {
        header: 'eFG%',
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

  const table = useReactTable<StatsByPlayerWithPlayer>({
    data: dataWithPlayer,
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
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
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
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

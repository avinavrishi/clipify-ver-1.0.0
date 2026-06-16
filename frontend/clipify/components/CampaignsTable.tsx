"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Campaign, getCampaignType } from "../types/campaign";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TableContainer,
  Link,
  Typography,
} from "@mui/material";
import NextLink from "next/link";

type Props = {
  campaigns: Campaign[];
  baseHref: string;
};

export const CampaignsTable: React.FC<Props> = ({ campaigns, baseHref }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = React.useMemo<ColumnDef<Campaign>[]>(
    () => [
      {
        header: "Title",
        accessorKey: "title",
        cell: (info) => {
          const row = info.row.original;
          return (
            <Link
              component={NextLink}
              href={`${baseHref}/${row.id}`}
              color="primary"
              underline="hover"
              sx={{ fontWeight: 500 }}
            >
              {row.title}
            </Link>
          );
        },
      },
      { header: "Status", accessorKey: "status" },
      {
        header: "Target",
        id: "campaign_type",
        accessorFn: (row) => getCampaignType(row),
        cell: (info) => (info.getValue() === 1 ? "Faceless" : "Face"),
      },
      {
        header: "Platforms",
        accessorKey: "platforms",
        cell: (info) => {
          const platforms = info.row.original.platforms ?? [];
          return (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {platforms.length === 0
                ? "—"
                : platforms.map((p) => (
                    <Typography
                      key={p.id}
                      component="span"
                      variant="caption"
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: "rgba(255,255,255,0.08)",
                        color: "text.secondary",
                      }}
                    >
                      {p.name}
                    </Typography>
                  ))}
            </Box>
          );
        },
      },
      {
        header: "Participants",
        accessorKey: "participant_count",
        cell: (info) => {
          const n = info.row.original.participant_count;
          return n != null ? n : "—";
        },
      },
      { header: "Content", accessorKey: "content_type" },
      {
        header: "Total budget",
        accessorKey: "total_budget",
        cell: (info) => `$${Number(info.getValue()).toLocaleString()}`,
      },
      {
        header: "Used budget",
        accessorKey: "used_budget",
        cell: (info) => `$${Number(info.getValue()).toLocaleString()}`,
      },
      {
        header: "Rate / 1M views",
        accessorKey: "rate_per_million_views",
        cell: (info) => `$${Number(info.getValue()).toLocaleString()}`,
      },
      { header: "Start date", accessorKey: "start_date" },
      { header: "End date", accessorKey: "end_date" },
    ],
    [baseHref]
  );

  const table = useReactTable({
    data: campaigns,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <TableContainer component={Paper}>
      <Table size="small" stickyHeader>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                return (
                  <TableCell key={header.id}>
                    {canSort ? (
                      <TableSortLabel
                        active={!!sortDir}
                        direction={sortDir === "desc" ? "desc" : "asc"}
                        onClick={header.column.getToggleSortingHandler()}
                        sx={{ color: "text.secondary", fontWeight: 600 }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableSortLabel>
                    ) : (
                      <Typography variant="subtitle2" color="text.secondary">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </Typography>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} hover>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

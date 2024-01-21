"use client";

import { BaseDataTable } from "@/components/tables/BaseDataTable";
import { UsernameMapping } from "@core/db/types";
import {
  SortingState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { FC } from "react";
import { columns } from "./columns";

interface UsernamesTableProps {
  data: UsernameMapping[];
}

export const UsernamesTable: FC<UsernamesTableProps> = ({ data }) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "githubUsername",
      desc: false,
    },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <BaseDataTable<UsernameMapping> table={table}>
      <colgroup>
        {/* <col className="w-[40%]" /> */}
        <col />
        <col />
      </colgroup>
    </BaseDataTable>
  );
};

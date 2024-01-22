"use client";

import { BaseDataTable } from "@/components/tables/BaseDataTable";
import { fetchOrganizationMembers } from "@/lib/fetchers/organizations";
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

type OrganizationMember = (ReturnType<
  typeof fetchOrganizationMembers
> extends Promise<infer T>
  ? T
  : never)[number];

/**
 * A mapping between the members of the Github organization and our persisted
 * usernames in the database
 */
export interface GithubAndOptionalPersistedUsername extends OrganizationMember {
  mappedState: UsernameMapping | undefined;
}

interface UsernamesTableProps {
  data: GithubAndOptionalPersistedUsername[];
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
    <BaseDataTable<GithubAndOptionalPersistedUsername> table={table}>
      <colgroup>
        {/* <col className="w-[40%]" /> */}
        <col />
        <col />
      </colgroup>
    </BaseDataTable>
  );
};

import { DataTableColumnHeader } from "@/components/tables/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { GithubAndOptionalPersistedUsername } from "./UsernamesTable";

export const columns: ColumnDef<GithubAndOptionalPersistedUsername>[] = [
  {
    accessorKey: "githubUsername",
    accessorFn: (row) => row.login,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Github Username" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-3 py-2">
          <div className="max-w-[500px] flex gap-3 items-center">
            <Image
              className="rounded-full"
              src={row.original.avatar_url}
              height={36}
              width={36}
              alt={"avatar url"}
            />

            <div className="truncate font-semibold">{row.original.login}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "slackUserId",
    accessorFn: (row) => row.mappedState?.slackUserId,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Slack Username" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-3 py-2">
          <div className="max-w-[500px] truncate">
            {row.original.mappedState?.slackUserId ?? "Not mapped"}
          </div>
        </div>
      );
    },
  },
];

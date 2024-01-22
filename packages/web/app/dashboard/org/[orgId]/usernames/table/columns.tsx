import { DataTableColumnHeader } from "@/components/tables/DataTableColumnHeader";
import { UsernameMapping } from "@core/db/types";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<UsernameMapping>[] = [
  {
    accessorKey: "githubUsername",
    accessorFn: (row) => row.githubUsername,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Github Username" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-3 py-4">
          <div className="max-w-[500px] truncate">
            {row.original.githubUsername}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "slackUserId",
    accessorFn: (row) => row.slackUserId,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Slack Username" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-3 py-4">
          <div className="max-w-[500px] truncate">
            {row.original.slackUserId}
          </div>
        </div>
      );
    },
  },
];

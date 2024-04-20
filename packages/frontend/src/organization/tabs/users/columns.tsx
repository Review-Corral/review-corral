import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@components/table/DataTableColumnHeader";
import { Member } from "@core/dynamodb/entities/types";
import { cn } from "@shadcn/lib/utils";

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "avatarUrl",
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 px-3 py-4">
          <span className={cn("max-w-[500px] truncate font-semiBold")}>
            {row.original.avatarUrl && (
              <img
                className="rounded-full"
                src={row.original.avatarUrl}
                height={42}
                width={42}
              ></img>
            )}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Github Username" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 px-3 py-4">
          <span className={cn("max-w-[500px] truncate font-semiBold")}>
            {row.original.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "slackId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slack ID" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 px-3 py-4">
          <span className={cn("max-w-[500px] truncate")}>
            {row.original.slackId ?? "null"}
          </span>
        </div>
      );
    },
  },
];

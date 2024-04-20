import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@components/table/DataTableColumnHeader";
import { Member } from "@core/dynamodb/entities/types";
import { cn } from "@lib/utils";

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
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
];

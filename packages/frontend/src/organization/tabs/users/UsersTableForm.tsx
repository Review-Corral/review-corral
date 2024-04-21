import { DataTableColumnHeader } from "@components/table/DataTableColumnHeader";
import { Member } from "@core/dynamodb/entities/types";
import { cn } from "@shadcn/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { FC } from "react";
import { FieldArrayWithId, useFieldArray, useForm } from "react-hook-form";
import { UsersTable } from "./UsersTable";

interface UsersTableFormProps {
  data: Member[];
}

interface FormValues {
  members: Member[];
}

export const UsersTableForm: FC<UsersTableFormProps> = ({ data }) => {
  const { control, register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      members: data,
    },
  });

  const { fields } = useFieldArray({
    name: "members", // unique name for your Field Array
    control, // control props comes from useForm (optional: if you are using FormProvider)
  });

  const onSubmit = (data: FormValues) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <UsersTable columns={columns} data={fields} />
    </form>
  );
};

const columns: ColumnDef<FieldArrayWithId<FormValues, "members", "id">>[] = [
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
          <span className={cn("max-w-[500px] truncate font-semiBold")}>
            {row.original.slackId}
          </span>
        </div>
      );
    },
  },
];

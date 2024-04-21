import { Button } from "@components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/shadcn/select";
import { DataTableColumnHeader } from "@components/table/DataTableColumnHeader";
import { Member } from "@core/dynamodb/entities/types";
import { ColumnDef } from "@tanstack/react-table";
import { FC, useMemo } from "react";
import {
  FieldArrayWithId,
  UseFormRegister,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { cn } from "src/lib/utils";
import { SlackIntegrationUsers } from "../../../../../domain/slack/types";
import { UsersTable } from "./UsersTable";

interface UsersTableFormProps {
  data: Member[];
  slackUsers: SlackIntegrationUsers;
}

interface FormValues {
  members: Member[];
}

export const UsersTableForm: FC<UsersTableFormProps> = ({ data, slackUsers }) => {
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

  const columns = useMemo(
    () => getColumns(slackUsers, register),
    [slackUsers, register],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="flex flex-col gap-6 w-full">
        <UsersTable columns={columns} data={fields} />
        <div className="flex flex-row w-full justify-end">
          <Button>Save</Button>
        </div>
      </div>
    </form>
  );
};

const getColumns = (
  slackUsers: SlackIntegrationUsers,
  register: UseFormRegister<FormValues>,
): ColumnDef<FieldArrayWithId<FormValues, "members", "id">>[] => [
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
            {/* <Input {...register(`members.${row.index}.slackId`)}>
              {row.original.slackId}
            </Input> */}
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {slackUsers.map((user) => (
                    <SelectItem key={user.id!} value={user.id!}>
                      {user.real_name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </span>
        </div>
      );
    },
  },
];

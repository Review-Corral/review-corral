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
import { Member, SlackUser } from "@core/dynamodb/entities/types";
import { ColumnDef } from "@tanstack/react-table";
import { FC, useMemo } from "react";
import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFormRegister,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { UsersTable } from "./UsersTable";
import { cn } from "@/components/lib/utils";
import { useMutateOrganizationMembers } from "../../useOrganizationMembers";

interface UsersTableFormProps {
  orgId: number;
  data: Member[];
  slackUsers: SlackUser[];
}

interface FormValues {
  members: Member[];
}

export const UsersTableForm: FC<UsersTableFormProps> = ({
  orgId,
  data,
  slackUsers,
}) => {
  const updateOrgMember = useMutateOrganizationMembers(orgId);

  const { control, register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      members: data,
    },
  });

  const { fields } = useFieldArray({
    name: "members", // unique name for your Field Array
    control, // control props comes from useForm (optional: if you are using FormProvider)
  });

  const membersById: Record<string, Member> = useMemo(() => {
    return data.reduce(
      (acc, member) => {
        acc[member.memberId] = member;
        return acc;
      },
      {} as Record<string, Member>,
    );
  }, [data]);

  const onSubmit = (newMemebrs: FormValues) => {
    for (const newMember of newMemebrs.members) {
      if (newMember.slackId !== membersById[newMember.memberId].slackId) {
        updateOrgMember.mutate({
          orgId,
          memberId: newMember.memberId,
          slackId: newMember.slackId ?? null,
        });
      }
    }
  };

  const columns = useMemo(
    () => getColumns(slackUsers, register, control),
    [slackUsers, register, control],
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
  slackUsers: SlackUser[],
  register: UseFormRegister<FormValues>,
  control: Control<FormValues, unknown>,
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
                alt={`Avatar for ${row.original.name}`}
                className="rounded-full"
                src={row.original.avatarUrl}
                height={42}
                width={42}
              />
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Slack User" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 px-3 py-4">
          <span className={cn("max-w-[500px] truncate font-semiBold")}>
            <Controller
              control={control}
              name={`members.${row.index}.slackId`}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {slackUsers.map((user) => (
                        <SelectItem key={user.slackUserId} value={user.slackUserId}>
                          <div className="flex gap-2">
                            <img
                              alt={`Avatar for ${user.realNameNormalized}`}
                              src={user.image48}
                              height={8}
                              width={20}
                              className="rounded-full"
                            />
                            <span>{user.realNameNormalized}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </span>
        </div>
      );
    },
  },
];

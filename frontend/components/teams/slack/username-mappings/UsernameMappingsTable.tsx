import cntl from "cntl";
import { FC, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import Button from "../../../buttons/Button";
import { MemberWithMapping } from "./UsernameMappings";

interface UsernameMappingsTableProps {
  members: MemberWithMapping[];
}

export const UsernameMappingsTable: FC<UsernameMappingsTableProps> = ({
  members,
}) => {
  return (
    <div className="">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the users in your account including their name, title,
            email and role.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add user
          </button>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Github Username
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Slack ID
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {members.map((member) => (
                    <UsernameMappingsTableItem
                      key={member.id}
                      member={member}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface UsernameMappingsTableItemProps {
  member: MemberWithMapping;
}

type FormValues = { slackId: string };

const resolver: Resolver<FormValues> = async (values) => {
  return {
    values: values.slackId ? values : {},
    errors: !values.slackId
      ? {
          slackId: {
            type: "required",
            message: "This is required.",
          },
        }
      : values.slackId.length > 11
      ? {
          slackId: {
            type: "maxLength",
            message: "Should be exactly 11 characters",
          },
        }
      : values.slackId.length < 11
      ? {
          slackId: {
            type: "minLength",
            message: "Should be exactly 11 characters",
          },
        }
      : {},
  };
};

export const UsernameMappingsTableItem: FC<UsernameMappingsTableItemProps> = ({
  member,
}) => {
  const memberHasMapping = !!member.mapping;

  const [isEditable, setIsEditable] = useState<boolean>(!memberHasMapping);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({ resolver });

  const onSubmit = handleSubmit(async (data) => {
    console.log("Data");
  });

  console.log("Form errors: ", errors);

  const currentSlackIdValue = watch("slackId");

  return (
    <tr key={member.id}>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <img
              className="h-10 w-10 rounded-full"
              src={member.avatar_url}
              alt=""
            />
          </div>
          <div className="ml-4">
            <div className="font-semibold text-gray-900">{member.login}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 text-sm text-gray-500">
        {!isEditable ? (
          <>{member.mapping?.slack_user_id}</>
        ) : (
          <div className="">
            <input
              type="text"
              className={cntl`
                block 
                w-full 
                max-w-[13rem] 
                py-2 
                rounded-md border
                focus:outline-none
                border-gray-300
                ${
                  errors.slackId
                    ? `
                  border-red-300
                  focus:border-red-500
                  focus:ring-red-50
                  `
                    : `
                  focus:border-indigo-500
                  focus:ring-indigo-500
                  `
                }
                px-2
                
                sm:text-sm 
                `}
              placeholder="Slack ID"
              {...register("slackId", { required: true })}
            />
            {errors.slackId && (
              <div className=" inline-block text-[0.75rem] text-red-500 pl-1 mt-2">
                {errors.slackId.message}
              </div>
            )}
          </div>
        )}
      </td>

      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <Button
          variant="outline"
          // disabled={
          //   currentSlackIdValue == undefined || currentSlackIdValue.trim() == ""
          // }
          onClick={onSubmit}
        >
          <>Save</>
        </Button>
      </td>
    </tr>
  );
};

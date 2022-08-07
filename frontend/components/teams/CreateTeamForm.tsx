import { FC } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useCreateTeam } from "./useCreateTeam";

interface CreateTeamFormProps {}

export const CreateTeamForm: FC<CreateTeamFormProps> = () => {
  const createTeam = useCreateTeam();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>();

  const onSubmit = handleSubmit(async (data) => {
    createTeam.mutateAsync(data).then(() => toast.success("Team created!"));
  });

  return (
    <div className="space-y-6 max-w-md">
      <h2>Create a team</h2>
      <form className="space-y-6" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Team name
          </label>
          <div className="mt-1">
            <input
              id="name"
              type="text"
              {...register("name")}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

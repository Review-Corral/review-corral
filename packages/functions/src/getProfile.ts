import { Logger } from "@domain/logging";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";

const LOGGER = new Logger("profile:getProfile");

export const handler = ApiHandler(async (event, context) => {
  LOGGER.info("Getting user profile");

  const { user, error } = await useUser();

  if (error) {
    LOGGER.error("Error fetching user", { error });
  }

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(user),
  };
});

import { Logger } from "@domain/logging";
import { ApiHandler } from "@src/apiHandler";
import { useUser } from "src/utils/useUser";

const LOGGER = new Logger("profile:getProfile");

export const handler = ApiHandler(async (event, _context) => {
  LOGGER.info("Getting user profile");

  const { user, error } = await useUser(event, LOGGER);

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

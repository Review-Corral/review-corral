import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";
import { DB } from "../../core/db/db";
import { organizations } from "../../core/db/schema";
import { Logger } from "../../core/logging";
import { useUser } from "./utils/useUser";

const LOGGER = new Logger("functions:todo");

export const create = ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: "Todo created",
  };
});

export const list = ApiHandler(async (_evt) => {
  const result = await DB.select().from(organizations);
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
});

export const getUser = ApiHandler(async (_event) => {
  const session = useSession();

  console.log({ session });

  const { user, error } = await useUser();

  if (!user) {
    LOGGER.error("No user found in session", { error });
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

import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";
import { DB } from "../../core/db/db";
import { fetchUserById } from "../../core/db/fetchers/users";
import { organizations } from "../../core/db/schema";

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

const _getUser = ApiHandler(async (event, context) => {
  const session = useSession();

  if (session.type !== "user") {
    throw new Error("User not set in session");
  }

  const userId = session.properties.id;

  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "No context user Id" }),
    };
  }

  const user = await fetchUserById(userId);

  return {
    statusCode: 200,
    body: JSON.stringify(user),
  };
});

export const getUser = _getUser;

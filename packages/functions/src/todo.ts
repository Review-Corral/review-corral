import { ApiHandler } from "sst/node/api";
import { DB } from "../../core/db/db";
import { organizations } from "../../core/db/schema";

export const create = ApiHandler(async (_evt) => {
  // await Todo.create();

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

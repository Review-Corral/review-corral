import { ApiHandler } from "sst/node/api";
import { z } from "zod";
import {
  createOrg,
  insertOrgUser,
  insertPr,
  selectOrg,
  selectOrgPrs,
  selectPullRequest,
} from "../../core/dynamodb/selectors";

const orgPathSchema = z.object({
  orgId: z.string().transform(Number),
});

const userInsertBodySchema = z.object({
  user: z.object({
    userId: z.number(),
    email: z.string(),
    name: z.string(),
    avatarUrl: z.string(),
  }),
  orgs: z.array(
    z.object({
      orgId: z.number(),
      name: z.string(),
      avatarUrl: z.string(),
    })
  ),
});

export const createUserOrgs = ApiHandler(async (_evt) => {
  const { user, orgs } = userInsertBodySchema.parse(
    JSON.parse(_evt.body ?? "")
  );

  const createdOrgs = [];
  const createdUsers = [];

  for (const org of orgs) {
    const createdOrg = await createOrg({ ...org, type: "Organization" });
    const createdUser = await insertOrgUser({
      ...user,
      orgId: createdOrg.orgId,
    });

    createdOrgs.push(createdOrg);
    createdUsers.push(createdUser);
  }

  return {
    statusCode: 201,
    body: JSON.stringify({
      createdOrgs,
      createdUsers,
    }),
  };
});

const createPrBodySchema = z.array(
  z.object({
    prId: z.number(),
  })
);

export const createOrgPrs = ApiHandler(async (_evt) => {
  const { orgId } = orgPathSchema.parse(_evt.pathParameters);
  const prs = createPrBodySchema.parse(JSON.parse(_evt.body ?? ""));

  const createdPrs = [];

  for (const pr of prs)
    createdPrs.push(
      await insertPr({
        orgId,
        ...pr,
        threadTs: "123",
      })
    );

  return {
    statusCode: 201,
    body: JSON.stringify(createdPrs),
  };
});

export const getOrg = ApiHandler(async (_evt) => {
  const { orgId } = orgPathSchema.parse(_evt.pathParameters);

  const result = await selectOrg(orgId);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
});

export const getOrgPrs = ApiHandler(async (_evt) => {
  const { orgId } = orgPathSchema.parse(_evt.pathParameters);

  const result = await selectOrgPrs(orgId);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
});

const prSchema = z.object({
  prId: z.string().transform(Number),
});

export const getPr = ApiHandler(async (_evt) => {
  const { orgId } = orgPathSchema.parse(_evt.pathParameters);
  const { prId } = prSchema.parse(JSON.parse(_evt.body ?? ""));

  const result = await selectPullRequest(orgId, prId);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
});

export const updatePr = ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: "Updated",
  };
});

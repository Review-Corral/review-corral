import { ApiHandler } from "sst/node/api";
import { z } from "zod";
import {
  createOrg,
  createOrgUser,
  createPullRequest,
  getOrg,
} from "../../core/dynamodb/selectors";

export const create = ApiHandler(async (_evt) => {
  const baseUserProps = {
    userId: 123,
    email: "test@gmail.com",
    name: "user1",
    avatarUrl: "https://google.com",
    status: "standard",
  } as const;

  const org1 = await createOrg({
    orgId: 1234,
    name: "org1",
    avatarUrl: "https://google.com",
    type: "Organization",
  });

  const user1 = await createOrgUser({
    ...baseUserProps,
    orgId: org1.orgId,
  });

  const org2 = await createOrg({
    orgId: 5678,
    name: "org2",
    avatarUrl: "https://google.com",
    type: "Organization",
  });

  const user2 = await createOrgUser({
    ...baseUserProps,
    userId: 456,
    orgId: org2.orgId,
  });

  await createPullRequest({
    orgId: org1.orgId,
    prId: 1,
    threadTs: "123",
  });

  await createPullRequest({
    orgId: org1.orgId,
    prId: 2,
    threadTs: "1234",
  });

  await createPullRequest({
    orgId: org1.orgId,
    prId: 4,
    threadTs: "4",
  });

  await createPullRequest({
    orgId: org2.orgId,
    prId: 3,
    threadTs: "3",
  });

  return {
    statusCode: 200,
    body: "Created",
  };
});

const schema = z.object({
  orgId: z.string().transform(Number),
});

export const getOrganization = ApiHandler(async (_evt) => {
  const { orgId } = schema.parse(_evt.pathParameters);

  const result = await getOrg(Number(orgId));

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
});

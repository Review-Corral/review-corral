import { ApiHandler } from "sst/node/api";
import {
  createOrg,
  createOrgUser,
  createPullRequest,
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
    prId: 3,
    threadTs: "12345",
  });

  return {
    statusCode: 200,
    body: "Created",
  };
});

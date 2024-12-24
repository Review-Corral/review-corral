import { GithubAdapter } from "sst/auth/adapter";

import { auth, createSessionBuilder } from "sst/auth";
import { Resource } from "sst";

const session = createSessionBuilder<{
  user: {
    userId: number;
  };
}>();

export const handler = auth.authorizer({
  session,
  providers: {
    github: GithubAdapter({
      clientID: Resource.GithubClientId.value,
      clientSecret: Resource.GithubClientSecret.value,
      scope: "user",
    }),
  },
  callbacks: {
    auth: {
      async allowClient(_clientID: string, _redirect: string) {
        return true;
      },
      async success(ctx, input) {
        console.log("success");

        return ctx.session({
          type: "user",
          redirectUri: "https://www.google.com",
          properties: {
            userId: 134,
          },
        });
      },
    },
  },
});

import axios from "axios";
import * as nJwt from "njwt";
import { InstallationAccessResponse } from "./types";

export async function getJwt(): Promise<nJwt.Jwt> {
  const now = Math.floor(Date.now() / 1000) - 30;
  const expiration = now + 120; // JWT expiration time (10 minute maximum)
  const claims = {
    // issued at time, 60 seconds in the past to allow for clock drift
    iat: now,
    // JWT expiration time (10 minute maximum)
    exp: expiration,
    iss: process.env.GITHUB_APP_ID,
  };

  const jwt = nJwt.create(
    claims,
    Buffer.from(process.env.GITHUB_APP_JWT_SIGNING_SECRET, "base64"),
    "RS256",
  );

  return jwt.setExpiration(new Date().getTime() + 60 * 2);
}

export async function getInstallationAccessToken(
  installationId: string,
  jwt?: nJwt.Jwt,
): Promise<InstallationAccessResponse> {
  const jwtToken = jwt || (await getJwt());

  return (
    await axios.post<InstallationAccessResponse>(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      null,
      {
        headers: { Authorization: `Bearer ${jwtToken.compact()}` },
      },
    )
  ).data;
}

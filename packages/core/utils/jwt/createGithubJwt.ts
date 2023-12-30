import * as nJwt from "njwt";
import { assertVarExists } from "../assert";

/**
 * Creates a JWT to be used to get an installation access token from Github
 */
export async function getJwt(): Promise<nJwt.Jwt> {
  const now = Math.floor(Date.now() / 1000) - 30;
  const expiration = now + 120; // JWT expiration time (10 minute maximum)

  const ghClientId = assertVarExists("GH_CLIENT_ID");

  const ghEncodedPem = assertVarExists("GH_ENCODED_PEM");
  // The PEM is base64 encoded, so we need to decode it
  const ghDecodedPem = Buffer.from(ghEncodedPem, "base64");

  const claims = {
    // issued at time, 60 seconds in the past to allow for clock drift
    iat: now,
    // JWT expiration time (10 minute maximum)
    exp: expiration,
    iss: ghClientId,
  };

  const jwt = nJwt.create(claims, ghDecodedPem, "RS256");

  return jwt.setExpiration(new Date().getTime() + 60 * 2);
}

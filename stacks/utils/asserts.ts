/**
 * Throws an error if the given variable is not set in the environment.
 */
export const assertVarExists = <T extends string | number = string>(
  variable: string
): T => {
  if (process.env[variable]) {
    return process.env[variable] as T;
  }

  throw new Error(`Environment Variable '${variable}' is not set`);
};

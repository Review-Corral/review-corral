export const assertVarExists = <T extends string | number = string>(
  envName: string,
): T => {
  const variable = process.env[envName];

  if (variable !== undefined) {
    return variable as T;
  }

  throw new Error(`Environment variable '${envName}' is not set`);
};

export const assertVarExists = <T extends string | number = string>(
  variable: string
): T => {
  if (process.env[variable]) {
    return process.env[variable] as T;
  }

  const varToString = <T extends string | number>(
    varObj: Record<string, T | undefined>
  ) => Object.keys(varObj)[0];

  throw new Error(`Variable ${varToString({ variable })} is undefined`);
};

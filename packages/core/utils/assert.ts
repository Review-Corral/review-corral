export const assertVarExists = <T extends string | number = string>(
  variable: T | undefined
): T => {
  if (variable) {
    return variable;
  }

  const varToString = <T extends string | number>(
    varObj: Record<string, T | undefined>
  ) => Object.keys(varObj)[0];

  throw new Error(`Variable ${varToString({ variable })} is undefined`);
};

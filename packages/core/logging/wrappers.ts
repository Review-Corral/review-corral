import { Logger } from ".";

export const withLoggedFileOutput = async <T>(
  fn: (logFilepath: string) => T,
  filepath: string,
): Promise<T> => {
  Logger.configureOutput(filepath);
  try {
    return await fn(filepath);
  } finally {
    Logger.configureOutput();
  }
};

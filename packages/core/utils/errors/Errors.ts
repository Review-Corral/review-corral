import { StatusCode } from "../lambda/responses";

export class ConfigurationError extends Error {}

export class ValueError extends Error {}

export class HttpError extends Error {
  constructor(
    public readonly statusCode: StatusCode,
    message: string,
    public readonly expose = false
  ) {
    super(message);
  }
}

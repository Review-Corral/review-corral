// Types for the result object with discriminated union
export type Success<T> = { ok: true; data: T; error?: undefined };
export type Failure<E> = { ok: false; data?: undefined; error: E };
export type Result<T, E = unknown> = Success<T> | Failure<E>;

/**
 * Wraps a function in a try/catch block mimicing golang error handling behaviour
 */
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error as E };
  }
}

/**
 * Wraps a synchronous function in a try/catch block mimicing golang error handling
 * behaviour
 */
export function tryCatchSync<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    const data = fn();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error as E };
  }
}

/**
 * Creates a successful result object.
 *
 * @param data The successful value to encapsulate.
 * @returns A `Result` object indicating success, containing the provided data.
 */
export function ok<T>(data: T): Result<T, string> {
  return { ok: true, data };
}

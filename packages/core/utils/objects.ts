/**
 * Removes a property from an object and returns a new object without the specified property.
 *
 * @param obj - The object from which to remove the property.
 * @param k - The key of the property to remove.
 * @returns A new object without the specified property.
 */
export const omitPropFromObj = <T extends Record<string, any>>(obj: T, k: keyof T) => {
  if (!obj || !k || !obj.hasOwnProperty(k)) return obj;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [k]: _, ...rest } = obj;
  return rest;
};

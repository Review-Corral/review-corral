export function flattenParam(param?: string | string[] | null): string | null {
  if (!param) return null;

  return Array.isArray(param) ? param[0] : param;
}

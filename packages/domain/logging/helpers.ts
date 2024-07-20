import { InspectOptions, inspect as inspectUtil } from "node:util";
import { Color } from "./types";

/**
 * Colorize a string with ANSI escape codes
 */
export const colorize = (text: string, colors: Color | Color[]): string => {
  return `${Array.isArray(colors) ? colors.join("") : colors}${text}${Color.RESET}`;
};

/**
 * This will calculate a rough estimate of the size of an object in bytes. It won't be highly accurate
 *
 * Source: https://stackoverflow.com/a/11900218/2158871
 */
export function estimateSizeOfObject(object: any): number {
  const objectList = [];
  const stack = [object];
  let bytes = 0;

  while (stack.length) {
    const value = stack.pop();

    if (typeof value === "boolean") {
      bytes += 4;
    } else if (typeof value === "string") {
      bytes += value.length * 2;
    } else if (typeof value === "number") {
      bytes += 8;
    } else if (typeof value === "object" && objectList.indexOf(value) === -1) {
      objectList.push(value);

      for (const i in value) {
        stack.push(value[i]);
      }
    }
  }
  return bytes;
}

export const inspect = (data: any, inspectOptions?: InspectOptions) => {
  return inspectUtil(data, {
    breakLength: 110,
    sorted: true,
    depth: 4,
    ...inspectOptions,
  });
};

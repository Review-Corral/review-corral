export const getPropertyIfExists = (
  event: Object,
  property: string,
): unknown | null => {
  if (property in event) {
    // @ts-ignore
    return event[property];
  }

  return null;
};

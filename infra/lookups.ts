export const lookups = {
  alex: {
    table: {
      name: "alex-review-corral-main",
      import: "alex-review-corral-main",
    },
  },
} as const;

export const getStageLookups = (stage: string) => {
  if (!(stage in lookups)) {
    throw new Error(`Stage ${stage} not found in lookups`);
  }
  return lookups[stage];
};

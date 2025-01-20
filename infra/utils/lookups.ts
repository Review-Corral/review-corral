export const lookups = {
  alex: {
    table: {
      name: "alex-review-corral-main",
      import: "alex-review-corral-main",
    },
  },
  dev: {
    table: {
      name: "dev-review-corral-main",
      import: "dev-review-corral-main",
    },
  },
} as const;

export const getStageLookups = (stage: string) => {
  if (!(stage in lookups)) {
    throw new Error(`Stage ${stage} not found in lookups`);
  }

  // @ts-ignore
  return lookups[stage];
};

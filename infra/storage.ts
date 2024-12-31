export const table = new sst.aws.Dynamo("main", {
  // transform: {
  //   table: (args, opts) => {
  //     const tableLookup = getStageLookups($app.stage).table;
  //     args.name = tableLookup.name;
  //     opts.import = tableLookup.import;
  //   },
  // },
  fields: {
    pk: "string",
    sk: "string",
    lsi1sk: "string",
    gsi1pk: "string",
    gsi1sk: "string",
    gsi2pk: "string",
    gsi2sk: "string",
    gsi3pk: "string",
    gsi3sk: "string",
  },
  primaryIndex: {
    hashKey: "pk",
    rangeKey: "sk",
  },
  globalIndexes: {
    gsi1: {
      hashKey: "gsi1pk",
      rangeKey: "gsi1sk",
    },
    gsi2: {
      hashKey: "gsi2pk",
      rangeKey: "gsi2sk",
    },
    gsi3: {
      hashKey: "gsi3pk",
      rangeKey: "gsi3sk",
    },
  },
  localIndexes: {
    lsi1: {
      rangeKey: "lsi1sk",
    },
  },
  ttl: "expireAt",
});

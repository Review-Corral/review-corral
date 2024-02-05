import { StackContext, Table } from "sst/constructs";

export function StorageStack({ stack, app }: StackContext) {
  const table = new Table(stack, "db3", {
    fields: {
      pk: "string",
      sk: "string",
      lsi1sk: "string",
      gsi1pk: "string",
      gsi1sk: "string",
      gsi2pk: "string",
      gsi2sk: "string",
    },
    primaryIndex: {
      partitionKey: "pk",
      sortKey: "sk",
    },
    globalIndexes: {
      gsi1: {
        partitionKey: "gsi1pk",
        sortKey: "gsi1sk",
      },
      gsi2: {
        partitionKey: "gsi2pk",
        sortKey: "gsi2sk",
      },
    },
    localIndexes: {
      lsi1: {
        sortKey: "lsi1sk",
      },
    },
  });

  return { table };
}

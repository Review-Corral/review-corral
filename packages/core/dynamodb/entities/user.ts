import { Entity } from "electrodb";
import { Configuration } from "..";

export const UserEntity = new Entity(
  {
    model: {
      version: "1",
      entity: "User",
      service: "scratch",
    },
    attributes: {
      userId: {
        type: "number",
        required: true,
        readOnly: true,
        padding: {
          length: 20,
          char: "0",
        },
      },
      name: {
        type: "string",
        required: true,
      },
      email: {
        type: "string",
      },
      avatarUrl: {
        type: "string",
        required: false,
      },
      ghAccessToken: {
        type: "string",
        required: false,
      },
      status: {
        type: ["standard", "admin"] as const,
        default: "standard",
        required: true,
      },
      createdAt: {
        type: "string",
        readOnly: true,
        required: true,
        default: () => new Date().toISOString(),
        set: () => new Date().toISOString(),
      },
      updatedAt: {
        type: "string",
        watch: "*",
        required: true,
        default: () => new Date().toISOString(),
        set: () => new Date().toISOString(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: "pk",
          composite: [],
        },
        sk: {
          field: "sk",
          composite: ["userId"],
        },
      },
    },
  },
  Configuration
);

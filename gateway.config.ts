import { defineConfig, type GatewayPlugin } from "@graphql-hive/gateway";
import fs from "fs";
import { GraphQLError } from "graphql";

// Strict regex that requires full datetime with microseconds
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6}$/;

function validateDateValue(value: unknown, path: string): void {
  if (typeof value === "string" && !DATE_PATTERN.test(value)) {
    throw new GraphQLError(
      `Date must match format "YYYY-MM-DD HH:MM:SS.FFFFFF", got: "${value}"`,
      {
        extensions: {
          code: "BAD_USER_INPUT",
          path,
        },
      }
    );
  }
}

// Recursively find and validate any "date" fields in the variables
function validateDateFields(obj: any, path: string = ""): void {
  if (obj === null || obj === undefined) return;

  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Check if this is a "date" field (case-insensitive)
      if (key.toLowerCase() === "date") {
        validateDateValue(value, currentPath);
      }

      // Recurse into nested objects
      if (typeof value === "object" && value !== null) {
        validateDateFields(value, currentPath);
      }
    }
  }
}

// Plugin that validates Date inputs before execution
function useDateValidation(): GatewayPlugin {
  return {
    onExecute({ args }) {
      const variables = args.variableValues;
      if (variables) {
        validateDateFields(variables);
      }

      // Also check for inline values in the document
      // This is a simplified check - we validate any "date" field in variables
    },
  };
}

export const gatewayConfig = defineConfig({
  supergraph: async (): Promise<string> => {
    console.log(`[${new Date().toISOString()}]`, "Reading supergraph.graphql");
    return fs.promises.readFile("supergraph.graphql", "utf8");
  },
  pollingInterval: 10_000,
  plugins: () => [useDateValidation()],
});

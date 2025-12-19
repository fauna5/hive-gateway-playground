import { defineConfig } from "@graphql-hive/gateway";
import fs from "fs";

export const gatewayConfig = defineConfig({
  supergraph: async (): Promise<string> => {
    console.log(`[${new Date().toISOString()}]`, "Reading supergraph.graphql");
    return fs.promises.readFile("supergraph.graphql", "utf8");
  },
  pollingInterval: 10_000,
});

import { defineConfig } from "@graphql-hive/gateway";
import { Console } from "console";
import fs from "fs";

export const gatewayConfig = defineConfig({
  supergraph: async (): Promise<string> => {
    console.log(`[${new Date().toISOString()}]`, "Reading supergraph.graphql");
    return fs.promises.readFile("supergraph.graphql", "utf8");
  },
  pollingInterval: 5_000,
});

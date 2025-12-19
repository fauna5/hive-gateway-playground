import { defineConfig } from "@graphql-mesh/compose-cli";
import loadGraphQLSchemaFromOpenAPI from "@omnigraph/openapi";
import { readFileSync } from "fs";
import path from "path";

export const composeConfig = defineConfig({
  subgraphs: [
    {
      sourceHandler: (ctx) => {
        const openapiPath = path.join(ctx.cwd || process.cwd(), "openapi.json");
        const openapiDoc = JSON.parse(readFileSync(openapiPath, "utf8"));
        return {
          name: "OpenAPI",
          schema$: loadGraphQLSchemaFromOpenAPI("OpenAPI", {
            source: openapiDoc,
            fetch: ctx.fetch,
          }),
        };
      },
    },
  ],
});

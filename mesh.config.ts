import {
  camelCase,
  createEncapsulateTransform,
  createNamingConventionTransform,
  defineConfig,
  loadGraphQLHTTPSubgraph,
} from "@graphql-mesh/compose-cli";

export const composeConfig = defineConfig({
  subgraphs: [
    {
      sourceHandler: loadGraphQLHTTPSubgraph("Graph", {
        endpoint: "http://localhost:3000/graphql",
        source: "api.schema.graphql",
        operationHeaders: {
          Authorization: "{context.headers['authorization']}",
        },
      }),
      transforms: [
        createEncapsulateTransform({
          name: "api",
        }),
      ],
    },
  ],
});

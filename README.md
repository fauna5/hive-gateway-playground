# Date Scalar Coercion Bug

The API schema defines `Date` as a scalar that accepts string input, but Mesh coerces the string to a JavaScript `Date` object before it reaches the resolver, causing a validation error.

## Files

**package.json**

```json
{
  "name": "graphql-mesh-playground",
  "version": "1.0.0",
  "scripts": {
    "compose": "mesh-compose -o supergraph.graphql",
    "start": "hive-gateway supergraph",
    "start-api": "tsx api-server.ts"
  },
  "dependencies": {
    "@graphql-hive/gateway": "^1.16.3",
    "graphql": "^16.11.0"
  },
  "devDependencies": {
    "@graphql-mesh/compose-cli": "^1.4.14",
    "express": "^4.21.2",
    "express-graphql": "^0.12.0",
    "tsx": "^4.20.5"
  }
}
```

**api.schema.graphql**

```graphql
scalar Date

type Query {
  hello: String
}

type Mutation {
  updatePaymentDate(input: UpdatePaymentDateInput!): PaymentResponse
}

input UpdatePaymentDateInput {
  id: ID!
  date: Date!
}

type PaymentResponse {
  success: Boolean!
  newDate: String
}
```

**api-server.ts**

```typescript
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import fs from "fs";
import path from "path";

const app = express();

const schemaContent = fs.readFileSync(
  path.join(__dirname, "api.schema.graphql"),
  "utf8"
);

const root = {
  hello: () => "Hello world!",
  updatePaymentDate: ({ input }: { input: { id: string; date: string } }) => {
    console.log("Received input:", input);
    console.log("Type of date:", typeof input.date);
    return {
      success: true,
      newDate: input.date,
    };
  },
};

app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(schemaContent),
    rootValue: root,
    graphiql: true,
  })
);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000/graphql");
});
```

**mesh.config.ts**

```typescript
import {
  defineConfig,
  loadGraphQLHTTPSubgraph,
} from "@graphql-mesh/compose-cli";

export const composeConfig = defineConfig({
  subgraphs: [
    {
      sourceHandler: loadGraphQLHTTPSubgraph("Loans", {
        endpoint: "http://localhost:3000/graphql",
        source: "api.schema.graphql",
      }),
    },
  ],
});
```

**gateway.config.ts**

```typescript
import { defineConfig } from "@graphql-hive/gateway";
import fs from "fs";

export const gatewayConfig = defineConfig({
  supergraph: async (): Promise<string> => {
    return fs.promises.readFile("supergraph.graphql", "utf8");
  },
});
```

## Steps to Reproduce

```bash
npm install
npm run compose
npm run start-api   # Terminal 1
npm start           # Terminal 2
```

Go to http://localhost:4000/graphql and run:

```graphql
mutation {
  updatePaymentDate(input: { id: "123", date: "2024-12-17" }) {
    success
    newDate
  }
}
```

## Expected Behavior

```json
{
  "data": {
    "updatePaymentDate": {
      "success": true,
      "newDate": "2024-12-17"
    }
  }
}
```

## Actual Behavior

The gateway returns a validation error because the string `"2024-12-17"` is being coerced to a `Date` object.

## Workaround

Convert the input variable back to a string before processing.

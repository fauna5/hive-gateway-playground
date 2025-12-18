# Bug Report: Gateway rejects valid Date input due to scalar validation mismatch

## Issue workflow progress

Progress of the issue based on the Contributor Workflow

- [x] 1. The issue provides a reproduction available on [Github](https://github.com/rifat.alam/hive-gateway-playground)
- [ ] 2. A failing test has been provided
- [ ] 3. A local solution has been provided
- [ ] 4. A pull request is pending review

---

## Describe the bug

When a subgraph defines a custom `Date` scalar type, the gateway may apply stricter validation than the upstream subgraph expects. This causes valid date inputs (e.g., `"2024-12-17"`) to be rejected at the gateway level with a validation error, even though the subgraph would accept and process them correctly.

The issue occurs because:
1. The gateway composes the schema and creates its own `Date` scalar
2. The gateway's scalar validation (especially when derived from OpenAPI specs with `@regexp` directives) may enforce a stricter format than the subgraph
3. Input values are validated at the gateway before being forwarded to the subgraph
4. Valid inputs are rejected before they ever reach the subgraph

---

## To Reproduce

Steps to reproduce the behavior:

See: https://github.com/rifat.alam/hive-gateway-playground for an example recreation.

### 1. Subgraph schema (`api.schema.graphql`):

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

### 2. Gateway config with strict Date validation (`gateway.config.ts`):

```typescript
import { defineConfig, type GatewayPlugin } from "@graphql-hive/gateway";
import { GraphQLError } from "graphql";

// Strict regex that requires full datetime with microseconds
// This simulates what happens with OpenAPI-derived scalars
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6}$/;

function validateDateFields(obj: any, path: string = ""): void {
  if (obj === null || obj === undefined) return;
  
  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (key.toLowerCase() === "date") {
        if (typeof value === "string" && !DATE_PATTERN.test(value)) {
          throw new GraphQLError(
            `Date must match format "YYYY-MM-DD HH:MM:SS.FFFFFF", got: "${value}"`,
            { extensions: { code: "BAD_USER_INPUT", path: currentPath } }
          );
        }
      }
      
      if (typeof value === "object" && value !== null) {
        validateDateFields(value, currentPath);
      }
    }
  }
}

function useDateValidation(): GatewayPlugin {
  return {
    onExecute({ args }) {
      if (args.variableValues) {
        validateDateFields(args.variableValues);
      }
    },
  };
}

export const gatewayConfig = defineConfig({
  supergraph: async () => fs.promises.readFile("supergraph.graphql", "utf8"),
  plugins: () => [useDateValidation()],
});
```

### 3. Send mutation to gateway:

**Query:**
```graphql
mutation UpdatePayment($input: UpdatePaymentDateInput!) {
  updatePaymentDate(input: $input) {
    success
    newDate
  }
}
```

**Variables:**
```json
{
  "input": {
    "id": "123",
    "date": "2024-12-17"
  }
}
```

---

## Expected behavior

The mutation should succeed and return:

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

The subgraph accepts simple date strings like `"2024-12-17"` and processes them correctly.

---

## Actual behavior

The gateway rejects the input with a validation error:

```json
{
  "errors": [
    {
      "message": "Date must match format \"YYYY-MM-DD HH:MM:SS.FFFFFF\", got: \"2024-12-17\"",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "path": "input.date"
      }
    }
  ]
}
```

The request never reaches the subgraph.

---

## Workaround / Fix

Use a schema transform to change the input field type from the custom `Date` scalar to `String`, bypassing the gateway's scalar validation:

```typescript
import { GraphQLString } from "graphql";

const changeInputFieldType = (
  inputTypeName: string,
  fieldName: string,
  newType: GraphQLInputType
) => {
  return (schema: GraphQLSchema) => {
    const typeMap = schema.getTypeMap();
    const inputType = typeMap[inputTypeName];

    if (inputType && isInputObjectType(inputType)) {
      const fields = inputType.getFields();
      if (fields[fieldName]) {
        fields[fieldName] = {
          ...fields[fieldName],
          type: newType
        };
      }
    }

    return schema;
  };
};

// Apply the transform
changeInputFieldType(
  'UpdatePaymentDateInput',
  'date',
  GraphQLString
)
```

---

## Environment

- **OS:** macOS
- **@graphql-mesh/compose-cli:** 1.4.14
- **@graphql-hive/gateway:** 1.16.3
- **graphql:** 16.11.0
- **NodeJS:** 22

---

## Additional context

This issue commonly occurs when:

1. **OpenAPI-derived schemas** - The mesh generates scalars with `@regexp` directives for date/datetime formats from OpenAPI specs
2. **Different date format expectations** - The upstream API accepts flexible date formats, but the generated scalar enforces strict ISO8601 with microseconds
3. **Federation/composition** - Multiple subgraphs may have different `Date` scalar implementations

### Real-world example from production

In our Loans API integration, the upstream service accepts dates in `YYYY-MM-DD` format, but the OpenAPI spec generated a scalar with pattern `^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{6}$`. This caused all payment date update mutations to fail at the gateway.

### Impact

- Users cannot perform date-related mutations through the gateway
- The error message may be confusing as it suggests a format issue when the input is actually valid for the upstream service
- Requires manual schema transforms as a workaround


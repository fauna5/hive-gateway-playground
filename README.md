# Date Scalar Coercion Bug

## Steps to Reproduce

1. `nvm use 22`
2. `npm i --force`
3. `npm run compose`
4. `npm run start-api` (in one terminal)
5. `npm start` (in another terminal)
6. Go to http://localhost:4000/graphql
7. Run the following mutation:

```graphql
mutation {
  createLoan(amount: 100.50, date: "2024-12-17") {
    id
    amount
    date
  }
}
```

## Expected Behavior

The mutation succeeds and returns:

```json
{
  "data": {
    "createLoan": {
      "id": "1",
      "amount": 100.5,
      "date": "2024-12-17"
    }
  }
}
```

The API schema defines `Date` as a scalar that accepts string input (e.g., `"2024-12-17"`), and the subgraph processes it correctly.

## Actual Behavior

The gateway returns a validation error:

```json
{
  "errors": [
    {
      "message": "Variable \"$date\" got invalid value \"2024-12-17\"; Date cannot represent non-Date value: \"2024-12-17\"",
      "extensions": {
        "code": "BAD_USER_INPUT"
      }
    }
  ]
}
```

## The Problem

The input is a string in the API schema, but Mesh is coercing it as a `Date` type before it reaches the resolver, causing a validation error.

## Workaround

Convert the input variable back to a string before processing.

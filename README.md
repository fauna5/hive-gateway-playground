## Bug recreation: Missing types when using `createEncapsulateTransform`

Using this schema (in file [api.schema.graphql](api.schema.graphql)) 
```
interface Greeting {
  message: String!
}

type HelloGreeting implements Greeting {
  message: String!
}

type Query {
  hello: Greeting
}
```
when creating a supergraph using GraphQL Mesh and transforming it using `createEncapsulateTransform({ name: "api" })` the resulting schema (in file [supergraph.graphql](supergraph.graphql)) does not have the `HelloGreeting` type. As a result, query response for `Query.api.hello.__typename` returns the interface `Greeting` and it is not possible to do `... on HelloGreeting` in the query to get specific fields for that type. This makes encapsulation unusable for us.

## Instructions to recreate the bug

* `nvm use 22`
* `npm i --force` << mock uses an old version of `express-graphql`
* `npm run compose`
* `npm run start-api` (start the mock backend)
* `npm start` (start the server)
* Go to http://localhost:4000/graphql
* query for 
```
query Test{
  api {
    hello {
      message
      __typename
    }
  }
}
```

## Outcomes

### Expected 
```
{
  "data": {
    "api": {
      "hello": {
        "message": "Hello world!",
        "__typename": "HelloGreeting" << type returned by api-server.ts
      }
    }
  }
}
```

### Actual
An error
```
{
  "data": {
    "api": {
      "hello": {
        "message": "Hello world!",
        "__typename": "Greeting" << this is the interface, not the type and not what api-server.ts returned
      }
    }
  }
}
```

## The problem
type `HelloGreeting` is not in the generated schema at `supergraph.graphql` however it is in the source schema `api.schema.graphql`. 

### it works without encapsulation
When i remove the transform `createEncapsulateTransform` the mesh works as expected.
```
query Test{
  hello {
    message
    __typename
  }
}
```
returns
```
{
  "data": {
    "hello": {
      "message": "Hello world!",
      "__typename": "HelloGreeting"
    }
  }
}
```
## Instructions to recreate the bug

* `nvm use 22`
* `npm i --force` << mock uses an old version of `express-graphql`
* `npm run compose`
* `npm run start-api`
* `npm start`
* Go to http://localhost:4000/graphql
* query for 
```
query {
  hello
}
```

## Outcomes

### Expected 
A valid response

### Actual
An error
```
{
  "errors": [
    {
      "message": "The operation was aborted. reason: Error: Executor was disposed.",
      "path": [
        "hello"
      ],
      "extensions": {
        "code": "DOWNSTREAM_SERVICE_ERROR",
        "request": {
          "method": "POST",
          "body": "{\"query\":\"{__typename hello}\"}"
        }
      }
    }
  ],
  "data": {
    "hello": null
  }
}
```

## The problem
The request takes 20s to complete. During that time the schema is refreshed. Refreshing the schema disposes of the request and causes an error.

This only happens if:
* The schema refreshes during a live request
* Using a graphql connector - using a REST one does not exhibit the behavior
* Setting `operationHeaders` that use the `context` e.g. ```Authorization: "{context.headers['authorization']}",```, remvoing this does not show the bug

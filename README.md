## Instructions

`npm i --force` 
`npm run compose`
`npm run start-api`
`npm start`
Go to http://localhost:4000/graphql
query for 
```
query {
  hello
}
```

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

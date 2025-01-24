import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import fs from "fs";
import path from "path";

const app = express();
const port = 3000;

const schemaPath = path.join(__dirname, "api.schema.graphql");
const schemaContent = fs.readFileSync(schemaPath, "utf8");

let text = "Hello world!";
let isCurrent = true;

const root = {
  message: () => {
    console.log("message");
    return {
      text,
      isCurrent,
    };
  },
  updateMessage: ({ input }) => {
    console.log("updateMessage");
    text = input.text;
    isCurrent = input.isCurrent;
    return {
      text,
      isCurrent,
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/graphql`);
});

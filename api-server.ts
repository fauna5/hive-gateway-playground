import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import fs from "fs";
import path from "path";

const app = express();
const port = 3000;

const schemaPath = path.join(__dirname, "api.schema.graphql");
const schemaContent = fs.readFileSync(schemaPath, "utf8");

const root = {
  hello: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("Hello world!");
      }, 20000);
    });
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

app.get("/openapi.json", (_req, res) => {
  const specPath = path.join(__dirname, "openapi.json");
  res.type("application/json").send(fs.readFileSync(specPath, "utf8"));
});

app.get("/docs", (_req, res) => {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>API Docs</title>
    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css\" />
    <style>body{margin:0;padding:0;} .topbar{display:none}</style>
  </head>
  <body>
    <div id=\"swagger-ui\"></div>
    <script src=\"https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js\"></script>
    <script src=\"https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-standalone-preset.js\"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout'
        });
      };
    </script>
  </body>
</html>`;
  res.type("text/html").send(html);
});

app.get("/docs-redoc", (_req, res) => {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>API Docs (ReDoc)</title>
    <style>body{margin:0;padding:0;}</style>
    <script src=\"https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js\"></script>
  </head>
  <body>
    <redoc spec-url=\"/openapi.json\"></redoc>
  </body>
</html>`;
  res.type("text/html").send(html);
});

app.get("/data", (_req, res) => {
  res.json({
    field1: {
      subfield1: {
        leafNode1: null,
        leafNode2: "value-2",
        leafnode3: "value-3",
      },
    },
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/graphql`);
});

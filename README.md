# File Routes
Lightweight library for using file-based routing in AWS Lambda and Express.

## Installation
```bash
npm i @labyrinthos/file-routes
```

## Extra Request Properties
The follow props are added to both the `Request` object in express and the
`event` in lambda.

| Property | Description |
| --- | --- |
| sourceRoute | The source route that was matched in the request. Will have the same format as the file names (minus the extesions) so that it is the same between both types of deployment.

## Route Folder Structure
All routes should be in a single folder that will be passed into the
initialization function. Only files ending with `.js` or `.mjs` will be imported
and used as routes.

Any files starting with `-` will be ignored. Files or folders can take path
params by using [variable name] in the file (or folder) name.

Wildcard routes can be made by putting `+` at the end of a parameter route
inside the `[]` (ex: `[path+].mjs`).

Actions can be run in front of routes (think app.use in express) by defining
a `{actions}.mjs` (or `.js`) in the folder. These actions will be run in
top-down order (so `/{actions}.mjs` will go before `/wat/{actions.mjs}`).
Actions can send data back early to bail out of a route call the same way a
normal handler function would send a value. An actions file should have a
default export with an array of funtions in the order to be called, and each
function will have the same argument list as the handler functions, so requests
can be modified by an action before being passed to the handler.

> Action functions apply to every route in the same folder, and every folder
> under. To target specific routes with actions, you will need to check the path
> of a request and ignore any routes you dont want to trigger.

> Note: If using `.js` in route file names, `"type": "module"` needs to be in
> the `package.json` file or the import will fail.

> Pathing Note: If a relative path is passed to the function for loading routes,
> it will be relative to the current working directory (treat it as a file
> function, not as a specialized import).

## Handler Function
The handler functions need to export whichever HTTP verbs they will respond to
as objects with specific properties. The HTTP verb export should be all caps
(GET/POST/HEAD/etc.).

| Property | Description |
| --- | --- |
| handler | The handler function for the route
| description | A description of the route. Currently only supports basic strings (maybe markdown later?)
| type | The type the handler function returns. Will eventually use for something cool on auto documentation. Probably use the same format as schema.
| schema | Used when validating/masking the returned data. See `@axel669/joker` lib for details on schema validation.

> both examples will generate handlers for the routes
> `/thing`, `/:userID/info`, and `/overlay/:overlayID`.

### Handler & Response
file-routes abstracts away the response into a single API for both Lambda and
Express, meaning code can be converted from one to the other with minimal
effort.

The handler is given 2 arguments:
1. The Lambda Event or Express Request
2. The file-routes Response function

In order for a handler to return data, it must have a return value from the
Response function provided (even in Express).

#### Response
The Response function has 2 call signatures:
- `Response(data)`
- `Response(headers, data)`

The data is whatever data is going to be return in its raw form (the provided
extra types will convert it for sending).
The headers is an object with the keys in http header
form (i.e. `Content-Type`).

In order to set a custom status code for the response, use array access with the
status code as the index (`res[404]`, `res[204]`, etc). The default status code
is 200, except for the redirects which default to 301.

The default call (no type used) will attempt to use the `@axel669/joker` library
to validate and mask the returned data, using the `schema` defined on the route.
If no schema is defined and the default call is used it will return an error.

Response types:
- `.json`: JSON data that isn't validated
- `.text`: plain text response
- `.html`: html text response
- `.raw`: return raw data, using the headers to set the Content-Type
- `.redirect`: redirect, uses the content argument as the url to redirect to
- `.base64`: send base64 encoded data back from a Lambda function

In addition to the response types, the response object has its own set of funcs
to perform response formatting tasks for parts that are not the return data.

- `.setCookie(name, value[, options])`:
    See [cookie.serialize](https://www.npmjs.com/package/cookie) for details on
    the options available to cookies

#### Examples

```javascript
export const GET = {
    description: "Just returns some random data.",
    schema: {
        a: "int",
        wat: { text: "string" },
        c: { d: "string" },
    },
    handler: async (event, res) => {
        //  use validation and masking
        return res({
            a: 10,
            b: 12,
            wat: [
                { text: "woah" },
                { text: "first try!" }
            ],
            c: {
                d: "E",
                f: "g100",
                h: ["i", 9, "j"]
            }
        })
    }
}

export const POST = {
    handler: (event, res) => {
        if (Math.random() < 0.5) {
            //  json without validation/masking
            return res.json(
                { "X-Response": "Custom header!" },
                [1, 2, 3, 4]
            )
        }
        //  custom error code on text returned
        return res.text[404]("Not Found")
    }
}

export const PUT = {
    handler: (event, res) => {
        //  redirect
        res.redirect("https://google.com")
    }
}
```

## Lambda Usage

### API Gateway Setup
The APIG route that calls the lambda must use `{path+}` at the end so that the
Lambda function can identify which route to look for in the handlers.

### Lambda File Structure
```
lambda
│  index.mjs
│  package.json
├─ node_modules
├─ routes
│  │  thing.mjs
│  ├─ [userID]
│  │  │  -internal.mjs
│  │  │  info.mjs
│  ├─ overlay
│  │  │  [overlayID].js
```

### Lambda Function
```javascript
import lambdaService from "@labyrinthos/file-routes/lambda"

const service = await lambdaService("routes")

export async function handler(event) {
    return await service(event)
}
```


## Express Usage

### Express File Structure
```
project
│  server.mjs
│  package.json
├─ node_modules
├─ routes
│  │  thing.mjs
│  ├─ [userID]
│  │  │  -internal.mjs
│  │  │  info.mjs
│  ├─ overlay
│  │  │  [overlayID].js
```

### server.mjs
The return value from initialization is an `express.Router` object.
```javascript
import express from "express"

import fileRoutes from "@labyrinthos/file-routes/express"

const app = express()
const fileRouter = await fileRoutes("routes")

app.use(fileRouter)

//  Optionally put it under a route instead of the root of the routes
app.use("/api", fileRouter)
```

# File Routes
Lightweight library for using file-based routing in AWS Lambda and Express.

## Installation
```bash
npm i @labyrinthos/file-routes
```

## Route Folder Structure
All routes should be in a single folder that will be passed into the
initialization function. Only files ending with `.mjs` will be imported used as
routes. Any files starting with `-` will be ignored.

## Handler Function
The handler functions need to export whichever HTTP verbs they will respond to
as objects with specific properties.

| Property | Description |
| --- | --- |
| handler | The handler function for the route
| description | A description of the route. Currently only supports basic strings (maybe markdown later?)
| type | The type the handler function returns. Will eventually use for something cool on auto documentation
| mask | If given, will be used to mask json data returned by the `jsonMask` function. Will override type in doc stuff when that gets made, so only one of them needs to be present

## Lambda Usage
The example will generate handlers for the routes `thing` and `user/list`.

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
│  ├─ user
│  │  │  -internal.mjs
│  │  │  list.mjs
```

### Lambda Function
```javascript
import lambdaService from "@labyrinthos/file-routes/lambda"

const service = await lambdaService("routes")

export async function handler(event) {
    return await service(event)
}
```

### Lambda Handler Arguments
The handler is given 2 arguments:
1. The event object that is passed into the lambda
2. A response object to help format returns easier, documented below

```javascript
export const get = {
    description: "Just returns some random data.",
    mask: {
        a: "int",
        wat: { text: "string" },
        c: { d: "string" },
    },
    handler: async (event, res) => {
        return res.jsonMask({
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
```

#### Response Object
```javascript
//  Sets the response status code. Will be 200 if not explicitly set to a
//  different code.
res.status(code)

//  Sets the headers to pass back using an object. Calling this function more
//  than once will remove headers set in prevoious calls.
//  (recommend using object spreading to construct more complex header sets)
res.headers({
    "x-thing": "some value"
})

//  Sets the Content-Type header that is returned. This method's value is
//  not lost if .headers is called later, but is instead mixed in.
//  No default value is provided for content type.
res.type("text/plain")

//  Returns a response which automatically sets the type to "application/json".
res.json(data)

//  Returns a response which automatically sets the type to "application/json"
//  and will mask the return data based on the mask property of the route info.
res.jsonMask(data)

//  Returns a response which automatically sets the type to "text/plain".
res.text(data)

//  Returns a response which automatically sets the type to "text/html".
res.html(data)

//  Returns a response without automatically setting a type.
res.raw(data)

//  Returns a response without automatically setting a type that is also marked
//  as being base64 encoded (needed when returing things like buffer contents).
res.base64(data)
```
The `.status`, `.headers`, and `.type` functions can all be chained together
before a return type function is called. `res.status(404).headers({}).json({})`


## Express Usage
The example will generate handlers for the routes `thing` and `user/list`.

### Lambda File Structure
```
project
│  server.mjs
│  package.json
├─ node_modules
├─ routes
│  │  thing.mjs
│  ├─ user
│  │  │  -internal.mjs
│  │  │  list.mjs
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

### Express Handler Arguments
Since express provides a huge amount of functionality out of the box, there
was no need to make this library add much. The handler is passed the same
arguments as any express middleware (`request`, `response`, `next`) and follows
the same rules as middleware.

The `response` object has had the `jsonMask` function added to it, which is the
same as the normal `res.json()` function, but will mask the value based on the
`mask` property of the route info.

```javascript
export const post = {
    description: "",
    mask: {
        a: "int",
        wat: { text: "string" },
        c: { d: "string" },
    },
    handler: async (req, res, next) => {
        res.jsonMask({
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
```

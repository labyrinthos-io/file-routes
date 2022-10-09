import loadRoutes from "./load-routes.mjs"

const response = ({ code, headers, value, ...rest }) => ({
    ...rest,
    statusCode: code ?? 200,
    headers: headers ?? {},
    body: value,
})
const headerValues = (defaultType, opts) => ({
    code: opts.code,
    headers: {
        ...(opts.headers ?? {}),
        "Content-Type": defaultType ?? opts.type
    },
})

const res = (mask) => {
    let code = 200
    let headers = {}
    let type = undefined

    const done = (value, other = {}) => response({
        code,
        headers,
        value,
        ...other
    })

    const self = {
        code: (newCode) => {
            code = newCode
            return self
        },
        headers: (newHeaders) => {
            headers = {
                "Content-Type": type,
                ...newHeaders,
            }
            return self
        },
        type: (newType) => {
            type = newType
            headers = {
                "Content-Type": type,
                ...headers,
            }
            return self
        },

        json: (value) => {
            self.type("application/json")
            return JSON.stringify(
                mask(value)
            )
        },
        jsonMask: (value) => {
            self.type("application/json")
            return done(
                JSON.stringify(
                    mask(value)
                )
            )
        },
        text: (text) => {
            self.type("text/plain")
            return done(text)
        },
        html: (text) => {
            self.type("text/html")
            return done(text)
        },
        raw: (data) => done(data),
        base64: (opts) => done(data, { isBase64Encoded: true }),
    }

    return self
}

const lambdaService = async (dir) => {
    const routes = await loadRoutes(dir)

    return async (event) => {
        const method = event.requestContext.http.method.toLowerCase()
        const route = event.pathParameters.path

        if (route === "-docs") {
            return routes
        }

        const routeInfo = routes[route]?.[method]

        const handler = routeInfo?.handler ?? null
        if (handler === null || typeof (handler) !== "function") {
            return {
                statusCode: 404,
                headers: {
                    "Content-Type": "text/plain",
                },
                body: "Not Found"
            }
        }

        return await handler(event, res(routeInfo.maskFunc))
    }
}

export default lambdaService

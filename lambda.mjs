import wayfarer from "wayfarer"
import cookie from "cookie"

import loadRoutes from "./lib/load-routes.mjs"
import response from "./lib/response.mjs"

import { notFound, badHandler } from "./lib/lambda/constants.mjs"
import bodyParser from "./lib/lambda/body-parser.mjs"

const sendResponse = (info) => ({
    statusCode: info.code,
    headers: info.headers,
    cookies: Object.entries(info.cookies).map(
        ([name, { value, options }]) => cookie.serialize(name, value, options)
    ),
    body: info.body,
    isBase64Encoded: info.isBase64Encoded
})

const lambdaService = async (dir) => {
    const routes = await loadRoutes(dir)
    const router = wayfarer("/")

    router.on("/", () => notFound)

    for (const [route, method, routeInfo] of routes) {
        const fullRoute = `/${method}/${route}`

        router.on(
            fullRoute,
            async (params, event) => {
                const handler = routeInfo.handler ?? null
                if (handler === null || typeof (handler) !== "function") {
                    return badHandler
                }
                event.params = params
                event.query = event.queryStringParameters ?? {}
                event.sourceRoute = routeInfo.sourceRoute
                event.data = bodyParser(event)

                const resFunc = response(...routeInfo.processors)
                for (const action of routeInfo.actions) {
                    const value = await action(event, resFunc)
                    if (value !== undefined) {
                        return sendResponse(value)
                    }
                }

                return sendResponse(
                    await handler(event, resFunc)
                )
            }
        )
    }

    return async (event) => {
        const method = event.requestContext.http.method.toLowerCase()
        const route = event.pathParameters.path

        if (route === "-docs") {
            return routes
        }

        const fullRoute = `/${method}/${route}`
        return await router(fullRoute, event)
    }
}

export default lambdaService

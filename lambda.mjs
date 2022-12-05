import wayfarer from "wayfarer"

import loadRoutes from "./lib/load-routes.mjs"
import response from "./lib/response.mjs"

const notFound = {
    statusCode: 404,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({ error: "Not Found" })
}
const badHandler = {
    statusCode: 404,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        error: `
            .handler is not a function.
            Check the spelling of the exported object, I made that mistake
            a bunch when testing.
        `.trim().replace(/\s+/g, " ")
    })
}

const sendResponse = (info) => ({
    statusCode: info.code,
    headers: info.headers,
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

import wayfarer from "wayfarer"

import loadRoutes from "./load-routes.mjs"
import response from "./response.mjs"

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

const lambdaService = async (dir) => {
    const routes = await loadRoutes(dir)
    const router = wayfarer("/")

    console.log(routes)

    router.on("/", () => notFound)
    // router.on("/-docs", () => routes)

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
                return await handler(event, response(routeInfo.maskFunc))
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

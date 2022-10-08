import loadRoutes from "./load-routes.mjs"

const lambdaService = async (dir) => {
    const handlers = await loadRoutes(dir)

    return async (event) => {
        const method = event.requestContext.http.method.toLowerCase()
        const route = event.pathParameters.path

        if (route === "-docs") {
            return handlers
            // return {
            //     statusCode: 200,
            //     headers: {
            //     },
            // }
        }

        const handler = handlers[route]

        const func = handler?.[method] ?? null
        if (func === null || typeof (func) !== "function") {
            return {
                statusCode: 404,
                body: "Not Found"
            }
        }

        return await func(event)
    }
}

export default lambdaService

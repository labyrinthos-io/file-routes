import express from "express"

import loadRoutes from "./lib/load-routes.mjs"
import response from "./lib/response.mjs"

import testable from "./lib/express/testable.mjs"

const sendResponse = (res, info) => {
    for (const [key, value] of Object.entries(info.headers)) {
        res.set(key, value)
    }
    for (const [name, { value, options }] of Object.entries(info.cookies)) {
        res.cookie(name, value, options)
    }
    res.status(info.code)
        .send(info.body)
}
const renameWildcard = (req) => {
    if (req.params === undefined) {
        return
    }

    req.params.wildcard = req.params[0]
    delete req.params[0]
}

const expressService = async (dir) => {
    const routes = await loadRoutes(dir)
    const router = express.Router()

    router.use(
        "/-docs",
        (req, res) => res.json(routes)
    )

    for (const [route, method, routeInfo] of routes) {
        router[method](
            `/${route}`,
            async (req, res) => {
                if (typeof routeInfo.handler !== "function") {
                    res.status(404)
                        .send(`
                                Handler is not a function.
                                Check the spelling on your exports, that is
                                the most common mistake I made during testing.
                            `.trim().replace(/^\s+/g, ""))
                    return
                }

                const libRes = response(...routeInfo.processors)
                req.sourceRoute = routeInfo.sourceRoute
                renameWildcard(req)
                for (const action of routeInfo.actions) {
                    const intermediate = await action(req, libRes)
                    if (intermediate !== undefined) {
                        return sendResponse(res, intermediate)
                    }
                }
                sendResponse(
                    res,
                    await routeInfo.handler(req, libRes)
                )
            }
        )
    }

    return router
}
// expressService.testable = async (dir) => testable(
//     await expressService(dir)
// )

export default expressService

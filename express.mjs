import express from "express"

import loadRoutes from "./load-routes.mjs"

export default async (dir) => {
    const routes = await loadRoutes(dir)
    const router = express.Router()

    router.use(
        "/-docs",
        (req, res) => res.json(routes)
    )

    for (const [route, method, routeInfo] of routes) {
        router[method](
            `/${route}`,
            (req, res, next) => {
                if (typeof routeInfo.handler !== "function") {
                    res.status(404)
                        .send(`
                                Handler is not a function.
                                Check the spelling on your exports, that is
                                the most common mistake I made during testing.
                            `)
                    return
                }

                res.jsonMask = (data) => res.json(
                    routeInfo.maskFunc(data)
                )
                routeInfo.handler(req, res, next)
            }
        )
    }

    return router
}

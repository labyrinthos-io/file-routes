import glob from "fast-glob"
import path from "path"
import url from "url"
import createMask from "./mask.mjs"

const loadRoutes = async (dir) => {
    const handlers = []
    const sources = await glob(
        ["**/*.{mjs,js}", "!**/-*"],
        { cwd: dir }
    )
    const actions = sources.filter(
        (source) => {
            const file = path.basename(source)

            return (
                file === "{actions}.js"
                || file === "{actions}.mjs"
            )
        }
    )
    const actionsMap = {}
    for (const source of actions) {
        const routePath = path.dirname(source)
        const actions = await import(
            url.pathToFileURL(
                path.resolve(dir, source)
            )
        )
        actionsMap[routePath] = actions.default
    }

    const routeSources = sources.filter(
        (source) => actions.includes(source) === false
    )
    const findActions = (dir) => {
        const actions = actionsMap[dir] ?? []

        if (dir === ".") {
            return actions
        }

        return [
            ...findActions(
                path.dirname(dir)
            ),
            ...actions,
        ]
    }
    for (const source of routeSources) {
        const route =
            source
            .replace(/\.m?js$/, "")
            .replace(
                /\[(.+?)]/g,
                (_, name) => `:${name}`
            )
            .replace(/\/.+?\+$/, "/*")
        const info = await import(
            url.pathToFileURL(
                path.resolve(dir, source)
            )
        )

        handlers.push(
            ...Object.entries(info).map(
                ([method, info]) => [
                    route,
                    method.toLowerCase(),
                    {
                        ...info,
                        sourceRoute: source.replace(/\.m?js$/, ""),
                        actions: findActions(
                            path.dirname(source)
                        ),
                        maskFunc:
                            (info.mask === undefined)
                                ? (value) => value
                                : createMask(info.mask)
                    }
                ]
            )
        )
    }

    return handlers
}

export default loadRoutes

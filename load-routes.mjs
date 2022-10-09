import glob from "fast-glob"
import path from "path"
import url from "url"
import createMask from "./mask.mjs"

const loadRoutes = async (dir) => {
    const handlers = {}
    const sources = await glob(
        ["**/*.mjs", "!**/-*.mjs"],
        { cwd: dir }
    )
    for (const source of sources) {
        const route = source.slice(0, -4)
        const info = await import(
            url.pathToFileURL(
                path.resolve(dir, source)
            )
        )

        handlers[route] = Object.fromEntries(
            Object.entries(info)
            .map(
                ([method, info]) => [
                    method,
                    {
                        ...info,
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

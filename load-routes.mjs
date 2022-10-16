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
    for (const source of sources) {
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

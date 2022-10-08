import glob from "fast-glob"
import path from "path"
import url from "url"

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

        handlers[route] = info
    }

    return handlers
}

export default loadRoutes

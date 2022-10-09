// const checks = {
//     "int": (i) => typeof i === "number",
//     "string": (i) => typeof i === "string",
// }
const mismatch = Symbol("mismatch")
const bad = Symbol("wrong type")
const mask = (data, source) => {
    // if (typeof source !== "object" && source !== true) {
    //     return undefined
    // }

    if (data === null) {
        return null
    }

    if (typeof data !== "object") {
        if (typeof source !== "string") {
            return mismatch
        }
        // if (checks[source](data) === false) {
        //     return bad
        // }
        return data
    }

    if (Array.isArray(data) === true) {
        return data.map(
            (item) => mask(item, source)
        )
    }

    if (Array.isArray(source) === false) {
        return mismatch
    }
    return source.reduce(
        (dest, [key, value]) => {
            dest[key] = mask(data[key], value)
            return dest
        },
        {}
    )
}

const createFilter = (source) =>
    (typeof source === "string")
    ? source
    : Object.entries(source)
        .map(
            ([key, value]) => [
                key,
                (typeof value === "string")
                    ? value
                    : createFilter(value)
            ]
        )
const createMask = (source) => {
    const filter = createFilter(source)

    return (data) => mask(data, filter)
}

export default createMask

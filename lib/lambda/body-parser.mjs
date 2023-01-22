const parsers = {
    "application/json": (source) => JSON.parse(source.toString()),
    "application/x-www-form-urlencoded": (source) => Object.fromEntries(
        new URLSearchParams(source.toString()).entries()
    )
}

const bodyParser = (event) => {
    const parser = parsers[event.headers["content-type"]]

    if (parser === undefined) {
        return undefined
    }

    const body =
        (event.isBase64Encoded === true)
            ? Buffer.from(event.body, "base64")
            : event.body
    return parser(body)
}

export default bodyParser

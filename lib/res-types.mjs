const defaultType = Symbol("default handler")
const response = (code, headers, content, type) => ({
    code,
    headers: {
        ...headers,
        "Content-Type": type,
    },
    body: content,
})
const types = {
    [defaultType](code, headers, content) {
        return {
            ...response(code, headers, content, "application/json"),
            process: true,
        }
    },
    json(code, headers, content) {
        return response(
            code,
            headers,
            JSON.stringify(content),
            "application/json"
        )
    },
    text(code, headers, content) {
        return response(code, headers, content, "text/plain")
    },
    html(code, headers, content) {
        return response(code, headers, content, "text/html")
    },
    raw(code, headers, content) {
        return { code, headers, body: content }
    },
    redirect(code, headers, content) {
        return {
            code,
            headers: {
                ...headers,
                Location: content,
            },
            body: "Redirecting"
        }
    },
    base64(code, headers, content) {
        return { code, headers, body: content, isBase64Encoded: true }
    },
}
types.redirect.defaultCode = 301

export { defaultType, types }

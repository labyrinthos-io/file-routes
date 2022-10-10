const response = ({ code, headers, value, ...rest }) => ({
    ...rest,
    statusCode: code ?? 200,
    headers: headers ?? {},
    body: value,
})

const res = (mask) => {
    let code = 200
    let headers = {}
    let type = undefined

    const done = (value, other = {}) => response({
        code,
        headers,
        value,
        ...other
    })

    const self = {
        code: (newCode) => {
            code = newCode
            return self
        },
        headers: (newHeaders) => {
            headers = {
                "Content-Type": type,
                ...newHeaders,
            }
            return self
        },
        type: (newType) => {
            type = newType
            headers = {
                "Content-Type": type,
                ...headers,
            }
            return self
        },

        json: (value) => {
            self.type("application/json")
            return JSON.stringify(
                mask(value)
            )
        },
        jsonMask: (value) => {
            self.type("application/json")
            return done(
                JSON.stringify(
                    mask(value)
                )
            )
        },
        text: (text) => {
            self.type("text/plain")
            return done(text)
        },
        html: (text) => {
            self.type("text/html")
            return done(text)
        },
        raw: (data) => done(data),
        base64: (data) => done(data, { isBase64Encoded: true }),
    }

    return self
}

export default res

import express from "express"

const request = (path, options = {}) => {
    const {
        method = "get",
        host = "",
        cookies = {},
        query = {},
        headers = {},
    } = options
    return {
        host,
        cookies,
        query,
        headers,
        method: method.toUpperCase(),
        url: path,
    }
}
const response = (resolve) => {
    const headers = {}
    let code = 200

    const res = {
        statusMessage: "OK",
        finished: false,
        get statusCode() {
            return code
        },
        removeHeader() {},
        set(name, value) {
            headers[name] = value
            return res
        },
        status(status) {
            code = status
            return res
        },
        send(data) {
            res.finished = true
            resolve({
                code,
                headers,
                data,
            })
        }
    }
    res.setHeader = res.set
    res.end = res.send

    return res
}

export default async (service) => {
    const mockApp = express()
    mockApp.use(service)

    mockApp.emulate = (path, opts) => new Promise(
        (resolve, reject) => {
            const req = request(path, opts)
            const res = response(resolve)

            mockApp(req, res)
        }
    )

    return mockApp
}

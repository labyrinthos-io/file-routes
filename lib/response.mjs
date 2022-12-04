import { types, defaultType } from "./res-types.mjs"

const errorMessage = (message) => ({
    code: 500,
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(message)
})

const response = (validate, mask) => {
    let type = types[defaultType]
    let code = 200
    const res = new Proxy(
        (headers, data) => {
            [headers, data] = [
                data ? headers : {},
                data ?? headers,
            ]

            const info = type(code, headers, data)
            if (info.process === true) {
                if (validate === null) {
                    return errorMessage(
                        ".json needs to be used when no validation info is present"
                    )
                }

                const valid = validate(info.body)
                if (valid !== true) {
                    return errorMessage(
                        valid.map(r => r.message)
                    )
                }
                return {
                    ...info,
                    body: JSON.stringify(
                        mask(info.body)
                    )
                }
            }

            return info
        },
        {
            get(_, name) {
                if (types[name] !== undefined) {
                    type = types[name]
                    code = type.defaultCode ?? 200
                    return res
                }
                if (/^\d+$/.test(name) === true) {
                    code = parseInt(name)
                    return res
                }
                throw new Error(
                    `'${name}' is not a valid function or status code`
                )
            }
        }
    )
    return res
}

export default response

const notFound = {
    statusCode: 404,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({ error: "Not Found" })
}
const badHandler = {
    statusCode: 404,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        error: `
            .handler is not a function.
            Check the spelling of the exported object, I made that mistake
            a bunch when testing.
        `.trim().replace(/\s+/g, " ")
    })
}

export {
    notFound,
    badHandler
}

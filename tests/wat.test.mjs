import joker from "@axel669/joker"

import response from "../lib/response.mjs"

const tests = [
    res => res.text[204]("yup"),
    res => res.json([1, 2, 3, 4]),
    res => res("some data"),
    res => res.redirect[301]("url"),
    res => res({ wat: "hi" }, { a: 10, b: "hi" }),
    res => res.next(),
    res => res.raw({ "Content-Type": "wat" }, "wat")
]

const schema = {
    itemName: "value",
    root: {
        a: "int"
    }
}
const validate = joker.validator(schema)
const mask = joker.mask(schema)
for (const test of tests) {
    console.log(
        test(response(validate, mask))
    )
}

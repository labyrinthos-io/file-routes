import fs from "fs/promises"

import lambdaService from "./lambda.mjs"

const service = await lambdaService("routes")

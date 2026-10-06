import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { config } from "dotenv"
config({ path: ".env.local" })

const client = postgres(process.env.DATABASE_URL!, {prepare: false})
const db = drizzle(client)

export default db
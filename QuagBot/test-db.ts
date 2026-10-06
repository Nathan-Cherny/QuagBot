import postgres from "postgres"
import { config } from "dotenv"

config({ path: ".env.local" })

const sql = postgres(process.env.DATABASE_URL!, {
    prepare: false
})

const result = await sql`
    select
        current_database() as database,
        current_user as user,
        inet_server_addr() as server_address
`

console.log(result)

await sql.end()
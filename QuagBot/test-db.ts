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
        current_schema() as schema
`

console.log(result)

const tables = await sql`
    select table_schema, table_name
    from information_schema.tables
    where table_schema in ('public', 'drizzle')
    order by table_schema, table_name
`

console.log(tables)

await sql.end()
import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"
config({ path: ".env.local" })

console.log(process.env.DATABASE_URL)

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!
    }
})
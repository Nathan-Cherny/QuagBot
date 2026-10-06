import { pgTable, integer, varchar, timestamp } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
    id: integer("id")
        .primaryKey()
        .generatedAlwaysAsIdentity(),
    username: varchar("username", { length: 100 } )
        .notNull()
        .unique(),
    passwordHash: varchar("password_hash", { length : 255 })
        .notNull(),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow()
})
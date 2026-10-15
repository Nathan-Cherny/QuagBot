import {
    pgTable,
    pgEnum,
    varchar,
    text,
    timestamp,
    uuid,
    primaryKey
} from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", [
    "student",
    "teacher",
    "admin",
])

export const senderRoleEnum = pgEnum("sender_role", [
    "user",
    "assistant"
])

export const users = pgTable("users", {
    userId: uuid("user_id")
        .defaultRandom()
        .primaryKey(),

    username: varchar("username", { length: 100 } )
        .notNull()
        .unique(),

    email: varchar("email", { length: 255 })
        .notNull()
        .unique(),

    passwordHash: varchar("password_hash", { length : 255 })
        .notNull(),

    role: userRoleEnum("role")
        .notNull(),

    createdAt: timestamp("created_at", {
        withTimezone: true
    })
        .notNull()
        .defaultNow()
})

export const classrooms = pgTable("classrooms", {
    classId: uuid("class_id")
        .defaultRandom()
        .primaryKey(),

    name: varchar("name", {length: 100} )
        .notNull()
        .unique(),
    
    joinId: varchar("join_id", { length: 15 })
        .notNull()
        .unique(),
    
    ownerId: uuid("owner_id")
        .notNull()
        .references(() => users.userId),
    
    createdAt: timestamp("created_at", {
        withTimezone: true
    })
        .notNull()
        .defaultNow()
})

export const classroomMembers = pgTable(
    "classroom_members", {
    classId: uuid("class_id")
        .notNull()
        .references(() => classrooms.classId),

    userId: uuid("user_id")
        .notNull()
        .references(() => users.userId),

    joinedAt: timestamp("joined_at", {
        withTimezone: true
    })
        .notNull()
        .defaultNow()
    }, (table) => [
        primaryKey({
            columns: [table.classId, table.userId]
        })
    ]
)

export const chatSessions = pgTable("chat_sessions", {
    sessionId: uuid("session_id")
        .defaultRandom()
        .primaryKey(),

    userId: uuid("user_id")
        .notNull()
        .references(() => users.userId),

    classId: uuid("class_id")
        .references(() => classrooms.classId),

    title: varchar("title", { length: 255 })
        .notNull(),

    createdAt: timestamp("created_at", {
        withTimezone: true
    })
        .notNull()
        .defaultNow()
})

export const chatMessages = pgTable("chat_messages", {
    messageId: uuid("message_id")
        .defaultRandom()
        .primaryKey(),

    sessionId: uuid("session_id")
        .notNull()
        .references(() => chatSessions.sessionId),

    senderRole: senderRoleEnum("sender_role")
        .notNull(),

    messageContent: text("message_content")
        .notNull(),

    createdAt: timestamp("created_at", {
        withTimezone: true
    })
        .notNull()
        .defaultNow()
})
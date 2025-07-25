import {
  pgTable,
  serial,
  text,
  varchar,
  date,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  fullName: varchar('full_name', { length: 255 }),
  birthday: date('birthday'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

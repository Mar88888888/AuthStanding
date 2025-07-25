import { users } from '../db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;

export type NewUser = InferInsertModel<typeof users>;

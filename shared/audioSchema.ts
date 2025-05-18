import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { users } from "./schema";

// Audio completions table for tracking when users listen to educational audio content
export const audioCompletions = pgTable("audio_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  audioId: varchar("audio_id").notNull(), // Unique identifier for the audio file
  moduleId: integer("module_id"), // Optional module ID the audio is associated with
  audioTitle: varchar("audio_title").notNull(),
  pointsEarned: integer("points_earned").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertAudioCompletionSchema = createInsertSchema(audioCompletions).omit({
  id: true,
  completedAt: true,
});

export const audioCompletionsRelations = relations(audioCompletions, ({ one }) => ({
  user: one(users, {
    fields: [audioCompletions.userId],
    references: [users.id],
  }),
}));

export type AudioCompletion = typeof audioCompletions.$inferSelect;
export type InsertAudioCompletion = z.infer<typeof insertAudioCompletionSchema>;
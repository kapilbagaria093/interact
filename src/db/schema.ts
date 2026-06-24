import { pgTable, serial, text, integer, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Define the 'users' table using the Firebase UID as the unique key and ID
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull().unique(),
  name: text("name"),
  avatar: text("avatar"),
  points: integer("points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  impactScore: integer("impact_score").default(0).notNull(),
  reportedCount: integer("reported_count").default(0).notNull(),
  verifiedCount: integer("verified_count").default(0).notNull(),
  resolvedCount: integer("resolved_count").default(0).notNull(),
  fundingTotal: integer("funding_total").default(0).notNull(), // Total USD funded
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  contributions: jsonb("contributions").default({}).notNull(), // Stores date-string keys mapping to contribution counts: { "YYYY-MM-DD": number }
});

// Define the 'issues' table
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'Pothole', 'Garbage', etc.
  severity: text("severity").notNull(), // 'Low', 'Medium', 'High', 'Critical'
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  beforeImage: text("before_image").notNull(), // URL or base64
  afterImage: text("after_image"), // URL or base64
  afterDescription: text("after_description"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  locationName: text("location_name").notNull(),
  status: text("status").default("Reported").notNull(), // 'Reported', 'Verified', 'In Progress', 'Resolved'
  reporterId: text("reporter_id")
    .references(() => users.uid, { onDelete: "cascade" })
    .notNull(),
  reporterName: text("reporter_name").notNull(),
  reporterAvatar: text("reporter_avatar").notNull(),
  verificationCount: integer("verification_count").default(0).notNull(),
  trustScore: integer("trust_score").default(50).notNull(), // Calculated trust
  priorityScore: integer("priority_score").default(0).notNull(), // Calculated dynamically
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolverId: text("resolver_id").references(() => users.uid, { onDelete: "set null" }),
  resolverName: text("resolver_name"),
  fundingGoal: integer("funding_goal").default(0).notNull(),
  fundingCurrent: integer("funding_current").default(0).notNull(),
  volunteerCount: integer("volunteer_count").default(0).notNull(),
});

// Define the 'verifications' table
export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id")
    .references(() => issues.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.uid, { onDelete: "cascade" })
    .notNull(),
  userName: text("user_name").notNull(),
  type: text("type").notNull(), // 'Confirm', 'Reject', 'Fixed'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  reportedIssues: many(issues, { relationName: "reporter" }),
  resolvedIssues: many(issues, { relationName: "resolver" }),
  verifications: many(verifications),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  reporter: one(users, {
    fields: [issues.reporterId],
    references: [users.uid],
    relationName: "reporter",
  }),
  resolver: one(users, {
    fields: [issues.resolverId],
    references: [users.uid],
    relationName: "resolver",
  }),
  verifications: many(verifications),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  issue: one(issues, {
    fields: [verifications.issueId],
    references: [issues.id],
  }),
  user: one(users, {
    fields: [verifications.userId],
    references: [users.uid],
  }),
}));

// Define the 'user_missions' table to persist mission states
export const userMissions = pgTable("user_missions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.uid, { onDelete: "cascade" })
    .notNull(),
  missionId: text("mission_id").notNull(), // 'm-1', 'm-2', etc.
  status: text("status").notNull(), // 'active' | 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userMissionsRelations = relations(userMissions, ({ one }) => ({
  user: one(users, {
    fields: [userMissions.userId],
    references: [users.uid],
  }),
}));

export const userFundings = pgTable("user_fundings", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.uid, { onDelete: "cascade" })
    .notNull(),
  issueId: integer("issue_id")
    .references(() => issues.id, { onDelete: "cascade" })
    .notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userFundingsRelations = relations(userFundings, ({ one }) => ({
  user: one(users, {
    fields: [userFundings.userId],
    references: [users.uid],
  }),
  issue: one(issues, {
    fields: [userFundings.issueId],
    references: [issues.id],
  }),
}));


import { db } from "./index.ts";
import { users, issues, verifications } from "./schema.ts";
import { count, sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    console.log("Ensuring database tables exist...");
    
    // Ensure all tables exist with correct relations and constraints
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "uid" TEXT NOT NULL UNIQUE,
        "email" TEXT NOT NULL UNIQUE,
        "name" TEXT,
        "avatar" TEXT,
        "points" INTEGER DEFAULT 0 NOT NULL,
        "level" INTEGER DEFAULT 1 NOT NULL,
        "impact_score" INTEGER DEFAULT 0 NOT NULL,
        "reported_count" INTEGER DEFAULT 0 NOT NULL,
        "verified_count" INTEGER DEFAULT 0 NOT NULL,
        "resolved_count" INTEGER DEFAULT 0 NOT NULL,
        "funding_total" INTEGER DEFAULT 0 NOT NULL,
        "joined_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "contributions" JSONB DEFAULT '{}' NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "issues" (
        "id" SERIAL PRIMARY KEY,
        "category" TEXT NOT NULL,
        "severity" TEXT NOT NULL,
        "summary" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "before_image" TEXT NOT NULL,
        "after_image" TEXT,
        "after_description" TEXT,
        "latitude" DOUBLE PRECISION NOT NULL,
        "longitude" DOUBLE PRECISION NOT NULL,
        "location_name" TEXT NOT NULL,
        "status" TEXT DEFAULT 'Reported' NOT NULL,
        "reporter_id" TEXT NOT NULL REFERENCES "users" ("uid") ON DELETE CASCADE,
        "reporter_name" TEXT NOT NULL,
        "reporter_avatar" TEXT NOT NULL,
        "verification_count" INTEGER DEFAULT 0 NOT NULL,
        "trust_score" INTEGER DEFAULT 50 NOT NULL,
        "priority_score" INTEGER DEFAULT 0 NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "resolved_at" TIMESTAMP,
        "resolver_id" TEXT REFERENCES "users" ("uid") ON DELETE SET NULL,
        "resolver_name" TEXT,
        "funding_goal" INTEGER DEFAULT 0 NOT NULL,
        "funding_current" INTEGER DEFAULT 0 NOT NULL,
        "volunteer_count" INTEGER DEFAULT 0 NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "verifications" (
        "id" SERIAL PRIMARY KEY,
        "issue_id" INTEGER NOT NULL REFERENCES "issues" ("id") ON DELETE CASCADE,
        "user_id" TEXT NOT NULL REFERENCES "users" ("uid") ON DELETE CASCADE,
        "user_name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_missions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT NOT NULL REFERENCES "users" ("uid") ON DELETE CASCADE,
        "mission_id" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_fundings" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT NOT NULL REFERENCES "users" ("uid") ON DELETE CASCADE,
        "issue_id" INTEGER NOT NULL REFERENCES "issues" ("id") ON DELETE CASCADE,
        "amount" INTEGER NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log("Database tables verified/created successfully.");

    // Check if users already exist
    const usersCountRes = await db.select({ val: count() }).from(users);
    const usersCount = usersCountRes[0]?.val || 0;

    if (usersCount > 0) {
      console.log("Database already has users. Skipping seeding.");
      return;
    }

    console.log("Starting database seed with initial community data...");

    // 1. Seed community members
    const communityMembers = [
      {
        uid: "user-marcus",
        email: "marcus.vance@example.com",
        name: "Marcus Vance",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        points: 245,
        level: 3,
        impactScore: 85,
        reportedCount: 2,
        verifiedCount: 1,
        resolvedCount: 1,
        joinedAt: new Date("2026-01-15T08:00:00Z"),
        contributions: {
          "2026-06-20": 4,
          "2026-06-21": 2,
          "2026-06-22": 5,
          "2026-06-23": 3,
          "2026-06-24": 1,
        },
      },
      {
        uid: "user-elena",
        email: "elena.rostova@example.com",
        name: "Elena Rostova",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        points: 120,
        level: 2,
        impactScore: 45,
        reportedCount: 1,
        verifiedCount: 2,
        resolvedCount: 0,
        joinedAt: new Date("2026-03-10T11:30:00Z"),
        contributions: {
          "2026-06-18": 1,
          "2026-06-20": 3,
          "2026-06-22": 2,
          "2026-06-23": 4,
        },
      },
      {
        uid: "user-liam",
        email: "liam.chen@example.com",
        name: "Liam Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        points: 75,
        level: 1,
        impactScore: 25,
        reportedCount: 1,
        verifiedCount: 2,
        resolvedCount: 0,
        joinedAt: new Date("2026-05-02T14:45:00Z"),
        contributions: {
          "2026-06-19": 2,
          "2026-06-22": 1,
          "2026-06-23": 3,
        },
      },
    ];

    for (const member of communityMembers) {
      await db.insert(users).values(member);
    }

    // 2. Seed initial civic issues
    const initialIssues = [
      {
        id: 101,
        category: "Pothole",
        severity: "High",
        summary: "Large dangerous pothole in the middle of the northbound lane on Main Street, causing drivers to swerve.",
        description: "Deep pothole that can easily damage tires. It's located right after the intersection near the coffee shop.",
        beforeImage: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800",
        latitude: 37.7749,
        longitude: -122.4194,
        locationName: "102 Main Street, San Francisco",
        status: "Verified",
        reporterId: "user-marcus",
        reporterName: "Marcus Vance",
        reporterAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        verificationCount: 2,
        trustScore: 80,
        priorityScore: 72,
        createdAt: new Date("2026-06-22T09:00:00Z"),
        fundingGoal: 500,
        fundingCurrent: 120,
        volunteerCount: 3,
      },
      {
        id: 102,
        category: "Broken Streetlight",
        severity: "Medium",
        summary: "Streetlight bulb burned out or damaged on 4th Ave, making the corner dark at night.",
        description: "The street light has been flickering and is now completely out. Makes the crosswalk dark and feel unsafe.",
        beforeImage: "https://images.unsplash.com/photo-1508873696983-2df519f0397e?w=800",
        latitude: 37.7833,
        longitude: -122.4167,
        locationName: "450 4th Ave, San Francisco",
        status: "Reported",
        reporterId: "user-elena",
        reporterName: "Elena Rostova",
        reporterAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        verificationCount: 0,
        trustScore: 50,
        priorityScore: 35,
        createdAt: new Date("2026-06-23T19:45:00Z"),
        fundingGoal: 150,
        fundingCurrent: 0,
        volunteerCount: 1,
      },
      {
        id: 103,
        category: "Garbage",
        severity: "Critical",
        summary: "Illegal garbage dumping blocking the sidewalk near the public park entrance.",
        description: "Multiple plastic bags, a broken chair, and electronic waste dumped on the pavement. Emitting strong odors.",
        beforeImage: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800",
        latitude: 37.7699,
        longitude: -122.4468,
        locationName: "Buena Vista Park Entrance, San Francisco",
        status: "Resolved",
        reporterId: "user-liam",
        reporterName: "Liam Chen",
        reporterAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        verificationCount: 2,
        trustScore: 95,
        priorityScore: 10,
        createdAt: new Date("2026-06-20T08:15:00Z"),
        resolvedAt: new Date("2026-06-22T16:30:00Z"),
        resolverId: "user-marcus",
        resolverName: "Marcus Vance",
        afterImage: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800",
        afterDescription: "Our volunteer team cleaned up the sidewalk and transported the large items to the local recycling center.",
        fundingGoal: 100,
        fundingCurrent: 100,
        volunteerCount: 5,
      },
      {
        id: 104,
        category: "Water Leakage",
        severity: "Critical",
        summary: "Water main rupture on the sidewalk, spraying water onto the roadway and flooding the gutter.",
        description: "Water is bubbling up rapidly from a crack in the pavement. Thousands of gallons are being wasted.",
        beforeImage: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?w=800",
        latitude: 37.765,
        longitude: -122.422,
        locationName: "Valencia St & 18th, San Francisco",
        status: "In Progress",
        reporterId: "user-marcus",
        reporterName: "Marcus Vance",
        reporterAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        verificationCount: 3,
        trustScore: 99,
        priorityScore: 95,
        createdAt: new Date("2026-06-23T07:15:00Z"),
        fundingGoal: 1000,
        fundingCurrent: 450,
        volunteerCount: 2,
      },
    ];

    for (const issue of initialIssues) {
      await db.insert(issues).values(issue);
    }

    // 3. Seed verifications
    const seedVerifications = [
      {
        issueId: 101,
        userId: "user-elena",
        userName: "Elena Rostova",
        type: "Confirm",
        timestamp: new Date("2026-06-23T14:00:00Z"),
      },
      {
        issueId: 101,
        userId: "user-liam",
        userName: "Liam Chen",
        type: "Confirm",
        timestamp: new Date("2026-06-23T15:30:00Z"),
      },
      {
        issueId: 103,
        userId: "user-marcus",
        userName: "Marcus Vance",
        type: "Confirm",
        timestamp: new Date("2026-06-21T10:00:00Z"),
      },
      {
        issueId: 103,
        userId: "user-elena",
        userName: "Elena Rostova",
        type: "Confirm",
        timestamp: new Date("2026-06-21T11:15:00Z"),
      },
      {
        issueId: 104,
        userId: "user-elena",
        userName: "Elena Rostova",
        type: "Confirm",
        timestamp: new Date("2026-06-23T08:30:00Z"),
      },
      {
        issueId: 104,
        userId: "user-liam",
        userName: "Liam Chen",
        type: "Confirm",
        timestamp: new Date("2026-06-23T09:00:00Z"),
      },
    ];

    for (const v of seedVerifications) {
      await db.insert(verifications).values(v);
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}

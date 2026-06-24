import { db } from "./index.ts";
import { users } from "./schema.ts";
import { eq } from "drizzle-orm";

export async function getOrCreateUser(
  uid: string,
  email: string,
  name?: string,
  avatar?: string
) {
  try {
    const fallbackName = email.split("@")[0] || "User";
    const fallbackAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || fallbackName,
        avatar: avatar || fallbackAvatar,
        points: 0,
        level: 1,
        impactScore: 0,
        reportedCount: 0,
        verifiedCount: 0,
        resolvedCount: 0,
        contributions: {},
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          name: name || fallbackName,
          avatar: avatar || fallbackAvatar,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database upsert user failed:", error);
    throw new Error("Database upsert user failed. Please try again later.", {
      cause: error,
    });
  }
}

export async function getUserProfile(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid));
    return result[0] || null;
  } catch (error) {
    console.error("Database query user profile failed:", error);
    throw new Error("Database query user profile failed. Please try again later.", {
      cause: error,
    });
  }
}

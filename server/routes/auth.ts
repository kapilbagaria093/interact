import { Router } from "express";
import { requireAuth, AuthRequest } from "../../src/middleware/auth.ts";
import { getOrCreateUser, getUserProfile } from "../../src/db/users.ts";
import { db } from "../../src/db/index.ts";
import { users } from "../../src/db/schema.ts";
import { eq } from "drizzle-orm";

const router = Router();

// Sync user profile in PostgreSQL after login/registration on the frontend
router.post("/sync", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { email, uid, name, picture } = req.user!;
    if (!email) {
      return res.status(400).json({ error: "Email is required in Token" });
    }

    const displayName = req.body.name || name || email.split("@")[0];
    const displayAvatar =
      req.body.avatar ||
      picture ||
      `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;

    const user = await getOrCreateUser(uid, email, displayName, displayAvatar);
    res.json({ message: "User profile synchronized successfully", user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get the current authenticated user's Postgres profile
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const user = await getUserProfile(uid);
    if (!user) {
      return res.status(404).json({ error: "User profile not found in database." });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update the current authenticated user's profile info (name, avatar)
router.put("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const { name, avatar } = req.body;

    const updateData: Partial<{ name: string; avatar: string }> = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.uid, uid))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: "User profile not found in database." });
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

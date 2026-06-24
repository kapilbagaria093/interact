import { Router } from "express";
import {
  getAllUsersProfiles,
  getLeaderboardData,
  getCommunityStats,
} from "../../src/db/issues.ts";
import { getUserProfile } from "../../src/db/users.ts";

const router = Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const list = await getAllUsersProfiles();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard groups
router.get("/leaderboard", async (req, res) => {
  try {
    const data = await getLeaderboardData();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get community-wide statistics
router.get("/stats", async (req, res) => {
  try {
    const data = await getCommunityStats();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific user profile by UID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await getUserProfile(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

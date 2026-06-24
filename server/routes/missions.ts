import { Router } from "express";
import { requireAuth, AuthRequest } from "../../src/middleware/auth.ts";
import { db } from "../../src/db/index.ts";
import { userMissions, users, verifications, issues } from "../../src/db/schema.ts";
import { eq, and, or, count } from "drizzle-orm";
import { recalculateUserStats } from "../../src/db/issues.ts";

const router = Router();

export interface Mission {
  id: string;
  title: string;
  desc: string;
  points: number;
  total: number;
  category: 'verify' | 'report' | 'resolve';
}

export const STATIC_MISSIONS: Mission[] = [
  {
    id: 'm-1',
    title: 'Streetlight Watch',
    desc: 'Verify 5 Broken Streetlights in your local area to restore brightness and community safety.',
    points: 100,
    total: 5,
    category: 'verify',
  },
  {
    id: 'm-2',
    title: 'Clean Entrance Initiative',
    desc: 'Report 3 Illegal Dumping or Garbage issues near public park entrances.',
    points: 150,
    total: 3,
    category: 'report',
  },
  {
    id: 'm-3',
    title: 'First Responder',
    desc: 'Resolve any High or Critical priority community water leakage or pothole.',
    points: 250,
    total: 1,
    category: 'resolve',
  },
  {
    id: 'm-4',
    title: 'Civic Guardian',
    desc: 'Complete 15 total verification and report actions on the dashboard.',
    points: 500,
    total: 15,
    category: 'verify',
  },
];

// Helper to calculate progress for all missions for a given user UID
export async function getMissionsWithProgress(uid: string) {
  // 1. Streetlight Watch (m-1)
  const m1Query = await db
    .select({ val: count() })
    .from(verifications)
    .innerJoin(issues, eq(verifications.issueId, issues.id))
    .where(and(eq(verifications.userId, uid), eq(issues.category, "Broken Streetlight")));
  const m1Progress = m1Query[0]?.val || 0;

  // 2. Clean Entrance Initiative (m-2)
  const m2Query = await db
    .select({ val: count() })
    .from(issues)
    .where(and(
      eq(issues.reporterId, uid),
      or(eq(issues.category, "Garbage"), eq(issues.category, "Illegal Dumping"))
    ));
  const m2Progress = m2Query[0]?.val || 0;

  // 3. First Responder (m-3)
  const m3Query = await db
    .select({ val: count() })
    .from(issues)
    .where(and(
      eq(issues.resolverId, uid),
      eq(issues.status, "Resolved"),
      or(eq(issues.severity, "High"), eq(issues.severity, "Critical")),
      or(eq(issues.category, "Water Leakage"), eq(issues.category, "Pothole"))
    ));
  const m3Progress = (m3Query[0]?.val || 0) > 0 ? 1 : 0;

  // 4. Civic Guardian (m-4)
  const userProfile = await db
    .select()
    .from(users)
    .where(eq(users.uid, uid))
    .then((r) => r[0]);
  const m4Progress = userProfile ? (userProfile.reportedCount + userProfile.verifiedCount) : 0;

  // Get user mission records from DB
  const dbMissions = await db
    .select()
    .from(userMissions)
    .where(eq(userMissions.userId, uid));

  const statusMap = new Map<string, string>();
  dbMissions.forEach((m) => {
    statusMap.set(m.missionId, m.status);
  });

  return STATIC_MISSIONS.map((m) => {
    let progress = 0;
    if (m.id === "m-1") progress = m1Progress;
    else if (m.id === "m-2") progress = m2Progress;
    else if (m.id === "m-3") progress = m3Progress;
    else if (m.id === "m-4") progress = m4Progress;

    // Cap progress at total
    progress = Math.min(m.total, progress);

    const dbStatus = statusMap.get(m.id);
    let status: 'available' | 'active' | 'completed' = 'available';
    if (dbStatus === 'completed') {
      status = 'completed';
    } else if (dbStatus === 'active') {
      status = 'active';
    }

    return {
      ...m,
      progress,
      status,
    };
  });
}

// Get all missions decorated with progress/status
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const missions = await getMissionsWithProgress(uid);
    res.json(missions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Accept a mission
router.post("/:missionId/accept", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const { missionId } = req.params;

    const mission = STATIC_MISSIONS.find((m) => m.id === missionId);
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }

    // Check if record already exists
    const existing = await db
      .select()
      .from(userMissions)
      .where(and(eq(userMissions.userId, uid), eq(userMissions.missionId, missionId)))
      .then((r) => r[0]);

    if (existing) {
      return res.status(400).json({ error: `Mission is already in ${existing.status} status` });
    }

    // Insert active state
    await db.insert(userMissions).values({
      userId: uid,
      missionId,
      status: "active",
    });

    const updatedMissions = await getMissionsWithProgress(uid);
    res.json({ message: "Civic mission accepted on ledger", missions: updatedMissions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Claim a completed mission reward
router.post("/:missionId/claim", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;
    const { missionId } = req.params;

    const mission = STATIC_MISSIONS.find((m) => m.id === missionId);
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }

    // Check if the user has accepted it
    const existing = await db
      .select()
      .from(userMissions)
      .where(and(eq(userMissions.userId, uid), eq(userMissions.missionId, missionId)))
      .then((r) => r[0]);

    if (!existing) {
      return res.status(400).json({ error: "Mission has not been accepted yet" });
    }

    if (existing.status === "completed") {
      return res.status(400).json({ error: "Mission reward already claimed on ledger" });
    }

    // Verify progress
    const missionsWithProgress = await getMissionsWithProgress(uid);
    const updatedMission = missionsWithProgress.find((m) => m.id === missionId);
    if (!updatedMission || updatedMission.progress < updatedMission.total) {
      return res.status(400).json({ error: "Mission requirements have not been completed yet" });
    }

    // Update status to completed
    await db
      .update(userMissions)
      .set({ status: "completed" })
      .where(and(eq(userMissions.userId, uid), eq(userMissions.missionId, missionId)));

    // Recalculate stats which now includes completed mission XP
    await recalculateUserStats(uid);

    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .then((r) => r[0]);

    const finalMissions = await getMissionsWithProgress(uid);

    res.json({
      message: `Reward claimed! +${mission.points} XP added to your reputation profile`,
      user: userProfile,
      missions: finalMissions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import { db } from "./index.ts";
import { issues, verifications, users } from "./schema.ts";
import { eq, and, desc, count, sql } from "drizzle-orm";

// 2-Layer Error Helper
function handleDbError(operationName: string, error: any) {
  console.error(`Database operation '${operationName}' failed:`, error);
  throw new Error(`Database query failed for ${operationName}. Please try again later.`, {
    cause: error,
  });
}

// Recalculates user counts, points, level, and impact scores from DB state
export async function recalculateUserStats(uid: string) {
  try {
    // 1. Get counts
    const reportsRes = await db
      .select({ val: count() })
      .from(issues)
      .where(eq(issues.reporterId, uid));
    const reportedCount = reportsRes[0]?.val || 0;

    const resolvesRes = await db
      .select({ val: count() })
      .from(issues)
      .where(and(eq(issues.resolverId, uid), eq(issues.status, "Resolved")));
    const resolvedCount = resolvesRes[0]?.val || 0;

    const verifiesRes = await db
      .select({ val: count() })
      .from(verifications)
      .where(eq(verifications.userId, uid));
    const verifiedCount = verifiesRes[0]?.val || 0;

    // 2. Points formula: Report = 10pts, Verify = 5pts, Resolve = 50pts
    const points = reportedCount * 10 + verifiedCount * 5 + resolvedCount * 50;
    const level = Math.floor(points / 100) + 1;
    const impactScore = Math.round(points * 0.35 + resolvedCount * 25);

    // 3. Update user profile
    await db
      .update(users)
      .set({
        reportedCount,
        resolvedCount,
        verifiedCount,
        points,
        level,
        impactScore,
      })
      .where(eq(users.uid, uid));
  } catch (error) {
    handleDbError("recalculateUserStats", error);
  }
}

// Recalculates issue trust, verification count, and priority scores from DB state
export async function recalculateIssueScores(issueId: number) {
  try {
    const issue = await db
      .select()
      .from(issues)
      .where(eq(issues.id, issueId))
      .then((r) => r[0]);

    if (!issue) return;

    const issueVerifications = await db
      .select()
      .from(verifications)
      .where(eq(verifications.issueId, issueId));

    // Trust Score: Starts at 50, Confirm (+15), Reject (-25), Fixed (+20)
    let trust = 50;
    let confirmCount = 0;

    issueVerifications.forEach((v) => {
      if (v.type === "Confirm") {
        trust += 15;
        confirmCount++;
      }
      if (v.type === "Reject") trust -= 25;
      if (v.type === "Fixed") trust += 20;
    });

    const trustScore = Math.max(0, Math.min(100, trust));

    // Priority Score:
    // Severity Weight: Low=1, Medium=2, High=3, Critical=4
    let sevWeight = 1;
    if (issue.severity === "Medium") sevWeight = 2;
    if (issue.severity === "High") sevWeight = 3;
    if (issue.severity === "Critical") sevWeight = 4;

    // Age of issue in days (capped at 15 for scoring)
    const ageInDays = Math.min(
      15,
      (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    let priority = sevWeight * 18 + confirmCount * 12 + ageInDays * 2.5;

    // If resolved, priority drops dramatically
    if (issue.status === "Resolved") {
      priority = 10;
    }

    const priorityScore = Math.max(5, Math.min(100, Math.round(priority)));

    // Lifecycle status automatic upgrade: if 2+ confirmations and still 'Reported' -> 'Verified'
    let currentStatus = issue.status;
    if (currentStatus === "Reported" && confirmCount >= 2) {
      currentStatus = "Verified";
    }

    await db
      .update(issues)
      .set({
        verificationCount: confirmCount,
        trustScore,
        priorityScore,
        status: currentStatus,
      })
      .where(eq(issues.id, issueId));
  } catch (error) {
    handleDbError("recalculateIssueScores", error);
  }
}

// Get all issues with their verifications
export async function getIssues() {
  try {
    const rawIssues = await db.select().from(issues).orderBy(desc(issues.createdAt));
    
    // Fetch verifications for each issue
    const result = [];
    for (const issue of rawIssues) {
      const issueVerifications = await db
        .select()
        .from(verifications)
        .where(eq(verifications.issueId, issue.id));

      result.push({
        ...issue,
        // serialize ID as string for frontend backward compatibility
        id: String(issue.id),
        verifications: issueVerifications.map((v) => ({
          userId: v.userId,
          userName: v.userName,
          type: v.type as "Confirm" | "Reject" | "Fixed",
          timestamp: v.timestamp.toISOString(),
        })),
        createdAt: issue.createdAt.toISOString(),
        resolvedAt: issue.resolvedAt ? issue.resolvedAt.toISOString() : undefined,
      });
    }

    return result;
  } catch (error) {
    handleDbError("getIssues", error);
  }
}

// Get specific issue
export async function getIssueById(id: number) {
  try {
    const issue = await db.select().from(issues).where(eq(issues.id, id)).then(r => r[0]);
    if (!issue) return null;

    const issueVerifications = await db
      .select()
      .from(verifications)
      .where(eq(verifications.issueId, id));

    return {
      ...issue,
      id: String(issue.id),
      verifications: issueVerifications.map((v) => ({
        userId: v.userId,
        userName: v.userName,
        type: v.type as "Confirm" | "Reject" | "Fixed",
        timestamp: v.timestamp.toISOString(),
      })),
      createdAt: issue.createdAt.toISOString(),
      resolvedAt: issue.resolvedAt ? issue.resolvedAt.toISOString() : undefined,
    };
  } catch (error) {
    handleDbError("getIssueById", error);
  }
}

// Create a new issue report
export async function createIssue(data: {
  category: string;
  severity: string;
  summary: string;
  description?: string;
  beforeImage: string;
  latitude: number;
  longitude: number;
  locationName: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar: string;
}) {
  try {
    const defaultGoal =
      data.category === "Pothole"
        ? 400
        : data.category === "Water Leakage"
        ? 800
        : 200;

    const [newIssue] = await db
      .insert(issues)
      .values({
        category: data.category,
        severity: data.severity,
        summary: data.summary,
        description: data.description || "",
        beforeImage: data.beforeImage,
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName,
        reporterId: data.reporterId,
        reporterName: data.reporterName,
        reporterAvatar: data.reporterAvatar,
        status: "Reported",
        verificationCount: 0,
        trustScore: 50,
        priorityScore: 30,
        fundingGoal: defaultGoal,
        fundingCurrent: 0,
        volunteerCount: 0,
      })
      .returning();

    // Stagger user contribution record
    const dateStr = new Date().toISOString().split("T")[0];
    const user = await db
      .select()
      .from(users)
      .where(eq(users.uid, data.reporterId))
      .then((r) => r[0]);

    if (user) {
      const contributions = { ...(user.contributions as Record<string, number>) };
      contributions[dateStr] = (contributions[dateStr] || 0) + 1;
      await db
        .update(users)
        .set({ contributions })
        .where(eq(users.uid, data.reporterId));
    }

    await recalculateIssueScores(newIssue.id);
    await recalculateUserStats(data.reporterId);

    return await getIssueById(newIssue.id);
  } catch (error) {
    handleDbError("createIssue", error);
  }
}

// Verify an issue
export async function verifyIssue(
  issueId: number,
  userId: string,
  userName: string,
  type: "Confirm" | "Reject" | "Fixed"
) {
  try {
    // Check if duplicate verification
    const existing = await db
      .select()
      .from(verifications)
      .where(
        and(
          eq(verifications.issueId, issueId),
          eq(verifications.userId, userId)
        )
      );

    if (existing.length > 0) {
      throw new Error("You have already verified this report");
    }

    // Insert verification
    await db.insert(verifications).values({
      issueId,
      userId,
      userName,
      type,
    });

    // Record user contribution
    const dateStr = new Date().toISOString().split("T")[0];
    const user = await db
      .select()
      .from(users)
      .where(eq(users.uid, userId))
      .then((r) => r[0]);

    if (user) {
      const contributions = { ...(user.contributions as Record<string, number>) };
      contributions[dateStr] = (contributions[dateStr] || 0) + 1;
      await db
        .update(users)
        .set({ contributions })
        .where(eq(users.uid, userId));
    }

    await recalculateIssueScores(issueId);
    await recalculateUserStats(userId);

    const issue = await db.select().from(issues).where(eq(issues.id, issueId)).then(r => r[0]);
    if (issue) {
      // Also update the reporter's stats since their report got verified/resolved
      await recalculateUserStats(issue.reporterId);
    }

    return await getIssueById(issueId);
  } catch (error: any) {
    if (error.message === "You have already verified this report") {
      throw error;
    }
    handleDbError("verifyIssue", error);
  }
}

// Resolve an issue
export async function resolveIssue(
  issueId: number,
  resolverId: string,
  resolverName: string,
  afterImage: string,
  afterDescription?: string
) {
  try {
    const [updatedIssue] = await db
      .update(issues)
      .set({
        status: "Resolved",
        resolvedAt: new Date(),
        resolverId,
        resolverName,
        afterImage,
        afterDescription: afterDescription || "",
        fundingCurrent: sql`funding_goal`, // Fully funded
      })
      .where(eq(issues.id, issueId))
      .returning();

    if (!updatedIssue) {
      throw new Error("Issue not found");
    }

    // Record user contribution
    const dateStr = new Date().toISOString().split("T")[0];
    const user = await db
      .select()
      .from(users)
      .where(eq(users.uid, resolverId))
      .then((r) => r[0]);

    if (user) {
      const contributions = { ...(user.contributions as Record<string, number>) };
      contributions[dateStr] = (contributions[dateStr] || 0) + 1;
      await db
        .update(users)
        .set({ contributions })
        .where(eq(users.uid, resolverId));
    }

    await recalculateIssueScores(issueId);
    await recalculateUserStats(resolverId);

    // Also update the reporter's stats since their report got resolved!
    await recalculateUserStats(updatedIssue.reporterId);

    return await getIssueById(issueId);
  } catch (error: any) {
    if (error.message === "Issue not found") {
      throw error;
    }
    handleDbError("resolveIssue", error);
  }
}

// Support Volunteer to help
export async function volunteerForIssue(issueId: number) {
  try {
    const [issue] = await db
      .update(issues)
      .set({
        volunteerCount: sql`volunteer_count + 1`,
      })
      .where(eq(issues.id, issueId))
      .returning();

    if (!issue) {
      throw new Error("Issue not found");
    }

    return issue;
  } catch (error) {
    handleDbError("volunteerForIssue", error);
  }
}

// Support Crowdfunding contribution
export async function fundIssue(issueId: number, amount: number) {
  try {
    const issue = await db
      .select()
      .from(issues)
      .where(eq(issues.id, issueId))
      .then((r) => r[0]);

    if (!issue) {
      throw new Error("Issue not found");
    }

    const newFunding = Math.min(issue.fundingGoal, issue.fundingCurrent + amount);

    const [updated] = await db
      .update(issues)
      .set({
        fundingCurrent: newFunding,
      })
      .where(eq(issues.id, issueId))
      .returning();

    return updated;
  } catch (error) {
    handleDbError("fundIssue", error);
  }
}

// Get Leaderboard Data
export async function getLeaderboardData() {
  try {
    const allUsers = await db.select().from(users);

    // Top Reporters: Sorted by reportedCount
    const topReporters = [...allUsers]
      .sort((a, b) => b.reportedCount - a.reportedCount)
      .slice(0, 10)
      .map((u) => ({
        id: u.uid,
        name: u.name,
        avatar: u.avatar,
        count: u.reportedCount,
        score: u.impactScore,
      }));

    // Top Verifiers: Sorted by verifiedCount
    const topVerifiers = [...allUsers]
      .sort((a, b) => b.verifiedCount - a.verifiedCount)
      .slice(0, 10)
      .map((u) => ({
        id: u.uid,
        name: u.name,
        avatar: u.avatar,
        count: u.verifiedCount,
        score: u.impactScore,
      }));

    // Community Heroes: Sorted by impactScore
    const communityHeroes = [...allUsers]
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 10)
      .map((u) => ({
        id: u.uid,
        name: u.name,
        avatar: u.avatar,
        count: u.resolvedCount,
        score: u.impactScore,
        level: u.level,
      }));

    return { topReporters, topVerifiers, communityHeroes };
  } catch (error) {
    handleDbError("getLeaderboardData", error);
  }
}

// Get Community Statistics
export async function getCommunityStats() {
  try {
    const allIssues = await db.select().from(issues);
    const allUsers = await db.select().from(users);

    const totalIssues = allIssues.length;
    const resolvedIssues = allIssues.filter((i) => i.status === "Resolved").length;
    const activeIssues = totalIssues - resolvedIssues;

    // Verifications count
    const verificationsCountRes = await db
      .select({ val: count() })
      .from(verifications);
    const verificationCount = verificationsCountRes[0]?.val || 0;

    const communityImpactScore = allUsers.reduce((sum, u) => sum + u.impactScore, 0);

    // Category counts
    const categoryMap: Record<string, number> = {};
    allIssues.forEach((i) => {
      categoryMap[i.category] = (categoryMap[i.category] || 0) + 1;
    });

    const categoryStats = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      count: categoryMap[cat],
    }));

    // Monthly resolved statistics
    const monthlyResolved = [
      { month: "Jan", resolved: 2, reported: 4 },
      { month: "Feb", resolved: 5, reported: 7 },
      { month: "Mar", resolved: 8, reported: 9 },
      { month: "Apr", resolved: 12, reported: 15 },
      { month: "May", resolved: 18, reported: 20 },
      { month: "Jun", resolved: resolvedIssues, reported: totalIssues },
    ];

    return {
      totalIssues,
      resolvedIssues,
      activeIssues,
      verificationCount,
      communityImpactScore,
      categoryStats,
      monthlyResolved,
    };
  } catch (error) {
    handleDbError("getCommunityStats", error);
  }
}

// Get All Users
export async function getAllUsersProfiles() {
  try {
    return await db.select().from(users).orderBy(desc(users.points));
  } catch (error) {
    handleDbError("getAllUsersProfiles", error);
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), "data.json");

// Initial Mock Seed Data
export const defaultUsers = [
  {
    id: "user-1",
    name: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    points: 245,
    level: 3,
    impactScore: 85,
    reportedCount: 12,
    verifiedCount: 25,
    resolvedCount: 3,
    joinedAt: "2026-01-15T08:00:00Z",
    contributions: {
      "2026-06-20": 4,
      "2026-06-21": 2,
      "2026-06-22": 5,
      "2026-06-23": 3,
      "2026-06-24": 1
    }
  },
  {
    id: "user-2",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    points: 120,
    level: 2,
    impactScore: 45,
    reportedCount: 5,
    verifiedCount: 14,
    resolvedCount: 1,
    joinedAt: "2026-03-10T11:30:00Z",
    contributions: {
      "2026-06-18": 1,
      "2026-06-20": 3,
      "2026-06-22": 2,
      "2026-06-23": 4
    }
  },
  {
    id: "user-3",
    name: "Liam Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    points: 75,
    level: 1,
    impactScore: 25,
    reportedCount: 3,
    verifiedCount: 9,
    resolvedCount: 0,
    joinedAt: "2026-05-02T14:45:00Z",
    contributions: {
      "2026-06-19": 2,
      "2026-06-22": 1,
      "2026-06-23": 3
    }
  },
  {
    id: "current-user",
    name: "Alex Mercer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    points: 15,
    level: 1,
    impactScore: 5,
    reportedCount: 1,
    verifiedCount: 1,
    resolvedCount: 0,
    joinedAt: "2026-06-23T10:00:00Z",
    contributions: {
      "2026-06-23": 2,
      "2026-06-24": 1
    }
  }
];

export const defaultIssues = [
  {
    id: "issue-101",
    category: "Pothole",
    severity: "High",
    summary: "Large dangerous pothole in the middle of the northbound lane on Main Street, causing drivers to swerve.",
    description: "Deep pothole that can easily damage tires. It's located right after the intersection near the coffee shop.",
    beforeImage: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800",
    latitude: 37.7749,
    longitude: -122.4194,
    locationName: "102 Main Street, San Francisco",
    status: "Verified",
    reporterId: "user-1",
    reporterName: "Marcus Vance",
    reporterAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    verifications: [
      { userId: "user-2", userName: "Elena Rostova", type: "Confirm", timestamp: "2026-06-23T14:00:00Z" },
      { userId: "user-3", userName: "Liam Chen", type: "Confirm", timestamp: "2026-06-23T15:30:00Z" }
    ],
    verificationCount: 2,
    trustScore: 80,
    priorityScore: 72,
    createdAt: "2026-06-22T09:00:00Z",
    fundingGoal: 500,
    fundingCurrent: 120,
    volunteerCount: 3
  },
  {
    id: "issue-102",
    category: "Broken Streetlight",
    severity: "Medium",
    summary: "Streetlight bulb burned out or damaged on 4th Ave, making the corner dark at night.",
    description: "The street light has been flickering and is now completely out. Makes the crosswalk dark and feel unsafe.",
    beforeImage: "https://images.unsplash.com/photo-1508873696983-2df519f0397e?w=800",
    latitude: 37.7833,
    longitude: -122.4167,
    locationName: "450 4th Ave, San Francisco",
    status: "Reported",
    reporterId: "user-2",
    reporterName: "Elena Rostova",
    reporterAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    verifications: [],
    verificationCount: 0,
    trustScore: 50,
    priorityScore: 35,
    createdAt: "2026-06-23T19:45:00Z",
    fundingGoal: 150,
    fundingCurrent: 0,
    volunteerCount: 1
  },
  {
    id: "issue-103",
    category: "Garbage",
    severity: "Critical",
    summary: "Illegal garbage dumping blocking the sidewalk near the public park entrance.",
    description: "Multiple plastic bags, a broken chair, and electronic waste dumped on the pavement. Emitting strong odors.",
    beforeImage: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800",
    latitude: 37.7699,
    longitude: -122.4468,
    locationName: "Buena Vista Park Entrance, San Francisco",
    status: "Resolved",
    reporterId: "user-3",
    reporterName: "Liam Chen",
    reporterAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    verifications: [
      { userId: "user-1", userName: "Marcus Vance", type: "Confirm", timestamp: "2026-06-21T10:00:00Z" },
      { userId: "user-2", userName: "Elena Rostova", type: "Confirm", timestamp: "2026-06-21T11:15:00Z" }
    ],
    verificationCount: 2,
    trustScore: 95,
    priorityScore: 10, // low because resolved
    createdAt: "2026-06-20T08:15:00Z",
    resolvedAt: "2026-06-22T16:30:00Z",
    resolverId: "user-1",
    resolverName: "Marcus Vance",
    afterImage: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800",
    afterDescription: "Our volunteer team cleaned up the sidewalk and transported the large items to the local recycling center.",
    fundingGoal: 100,
    fundingCurrent: 100,
    volunteerCount: 5
  },
  {
    id: "issue-104",
    category: "Water Leakage",
    severity: "Critical",
    summary: "Water main rupture on the sidewalk, spraying water onto the roadway and flooding the gutter.",
    description: "Water is bubbling up rapidly from a crack in the pavement. Thousands of gallons are being wasted.",
    beforeImage: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?w=800",
    latitude: 37.7650,
    longitude: -122.4220,
    locationName: "Valencia St & 18th, San Francisco",
    status: "In Progress",
    reporterId: "user-1",
    reporterName: "Marcus Vance",
    reporterAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    verifications: [
      { userId: "user-2", userName: "Elena Rostova", type: "Confirm", timestamp: "2026-06-23T08:30:00Z" },
      { userId: "user-3", userName: "Liam Chen", type: "Confirm", timestamp: "2026-06-23T09:00:00Z" },
      { userId: "current-user", userName: "Alex Mercer", type: "Confirm", timestamp: "2026-06-23T11:10:00Z" }
    ],
    verificationCount: 3,
    trustScore: 99,
    priorityScore: 95,
    createdAt: "2026-06-23T07:15:00Z",
    fundingGoal: 1000,
    fundingCurrent: 450,
    volunteerCount: 2
  },
  {
    id: "issue-105",
    category: "Damaged Public Property",
    severity: "Low",
    summary: "Graffiti and damaged bench at the bus stop shelter.",
    description: "The wooden bench is cracked and there is freshly sprayed paint all over the glass shelter panel.",
    beforeImage: "https://images.unsplash.com/photo-1574945418949-01c3bfce0fcc?w=800",
    latitude: 37.7550,
    longitude: -122.4350,
    locationName: "24th St & Mission Transit Center, San Francisco",
    status: "Reported",
    reporterId: "current-user",
    reporterName: "Alex Mercer",
    reporterAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    verifications: [],
    verificationCount: 0,
    trustScore: 50,
    priorityScore: 20,
    createdAt: "2026-06-24T01:30:00Z",
    fundingGoal: 200,
    fundingCurrent: 10,
    volunteerCount: 0
  }
];

// Load or initialize data file
export function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const data = { users: defaultUsers, issues: defaultIssues };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return data;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (err) {
    console.error("Error reading data file. Resetting to defaults.", err);
    const data = { users: defaultUsers, issues: defaultIssues };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return data;
  }
}

export function saveData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Recalculate trust, priority score, and users statistics
export function recalculateScoresAndStats() {
  const data = loadData();
  const now = new Date();

  // Recalculate issue scores
  data.issues = data.issues.map((issue: any) => {
    // 1. Calculate Trust Score: Starts at 50, increases with Confirm (+15), decreases with Reject (-25), Fixed (+20)
    let trust = 50;
    issue.verifications.forEach((v: any) => {
      if (v.type === "Confirm") trust += 15;
      if (v.type === "Reject") trust -= 25;
      if (v.type === "Fixed") trust += 20;
    });
    issue.trustScore = Math.max(0, Math.min(100, trust));

    // 2. Calculate Priority Score
    // Severity Weight: Low=1, Medium=2, High=3, Critical=4
    let sevWeight = 1;
    if (issue.severity === "Medium") sevWeight = 2;
    if (issue.severity === "High") sevWeight = 3;
    if (issue.severity === "Critical") sevWeight = 4;

    // Age of issue in days (capped at 15 for scoring)
    const createdDate = new Date(issue.createdAt);
    const ageInDays = Math.min(15, (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    let priority = (sevWeight * 18) + (issue.verificationCount * 12) + (ageInDays * 2.5);
    
    // If resolved, priority drops dramatically
    if (issue.status === "Resolved") {
      priority = 10;
    }

    issue.priorityScore = Math.max(5, Math.min(100, Math.round(priority)));
    return issue;
  });

  // Recalculate user points and impact
  data.users = data.users.map((user: any) => {
    // Calculate based on their real activity on the platform
    const reports = data.issues.filter((i: any) => i.reporterId === user.id);
    const resolves = data.issues.filter((i: any) => i.resolverId === user.id);
    
    // Verifications count by reading all issues and checking if user is in verifications
    let verificationCount = 0;
    data.issues.forEach((i: any) => {
      const verifiedByUser = i.verifications.some((v: any) => v.userId === user.id);
      if (verifiedByUser) {
        verificationCount++;
      }
    });

    user.reportedCount = reports.length;
    user.resolvedCount = resolves.length;
    user.verifiedCount = verificationCount;

    // Scoring Formula: Report = 10pts, Verify = 5pts, Resolve = 50pts
    // Seed points can act as base
    const activityPoints = (user.reportedCount * 10) + (user.verifiedCount * 5) + (user.resolvedCount * 50);
    // Add activity points to base points if not already accounted
    if (user.id === "current-user") {
      user.points = 15 + activityPoints;
    } else {
      // Keep their high scores for leaderboard realism but scale with updates
      user.points = (user.points < 50 ? 50 : user.points);
    }

    user.level = Math.floor(user.points / 100) + 1;
    user.impactScore = Math.round(user.points * 0.35 + (user.resolvedCount * 25));

    return user;
  });

  saveData(data);
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory =
  | 'Pothole'
  | 'Garbage'
  | 'Water Leakage'
  | 'Broken Streetlight'
  | 'Damaged Public Property'
  | 'Illegal Dumping'
  | 'Road Obstruction';

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueStatus = 'Reported' | 'Verified' | 'In Progress' | 'Resolved';

export interface Verification {
  userId: string;
  userName: string;
  type: 'Confirm' | 'Reject' | 'Fixed';
  timestamp: string;
}

export interface Issue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  summary: string;
  description: string;
  beforeImage: string; // base64 or URL
  afterImage?: string; // base64 or URL
  afterDescription?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  status: IssueStatus;
  reporterId: string;
  reporterName: string;
  reporterAvatar: string;
  verifications: Verification[];
  verificationCount: number;
  trustScore: number; // calculated trust
  priorityScore: number; // calculated dynamically
  createdAt: string;
  resolvedAt?: string;
  resolverId?: string;
  resolverName?: string;
  
  // Future ready placeholders
  fundingGoal?: number;
  fundingCurrent?: number;
  volunteerCount?: number;
}

export interface User {
  id: number;
  uid: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  impactScore: number;
  reportedCount: number;
  verifiedCount: number;
  resolvedCount: number;
  fundingTotal?: number;
  joinedAt: string;
  contributions: { [dateStr: string]: number }; // date string "YYYY-MM-DD" -> count (for github-like grid)
}

export interface CommunityStats {
  totalIssues: number;
  resolvedIssues: number;
  activeIssues: number;
  verificationCount: number;
  communityImpactScore: number;
  categoryStats: { category: IssueCategory; count: number }[];
  monthlyResolved: { month: string; resolved: number; reported: number }[];
}

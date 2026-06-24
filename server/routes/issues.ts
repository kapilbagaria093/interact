import { Router } from "express";
import {
  getIssues,
  createIssue,
  verifyIssue,
  resolveIssue,
  volunteerForIssue,
  fundIssue,
} from "../../src/db/issues.ts";
import { analyzeImageAndDescription } from "../analyzer.ts";
import { broadcast } from "../ws.ts";
import { requireAuth, AuthRequest } from "../../src/middleware/auth.ts";

const router = Router();

// Get all issues
router.get("/", async (req, res) => {
  try {
    const list = await getIssues();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze Image (AI integration)
router.post("/analyze", async (req, res) => {
  const { imageBase64, description } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Image data is required" });
  }

  try {
    const analysis = await analyzeImageAndDescription(imageBase64, description);
    res.json(analysis);
  } catch (error: any) {
    console.error("Image Analysis failed:", error);
    res.status(500).json({ error: "Failed to analyze image with AI: " + error.message });
  }
});

// Create a new issue report
router.post("/", async (req, res) => {
  const {
    category,
    severity,
    summary,
    description,
    beforeImage,
    latitude,
    longitude,
    locationName,
    reporterId,
    reporterName,
    reporterAvatar,
  } = req.body;

  if (!category || !severity || !summary || !beforeImage || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: "Missing required report fields" });
  }

  try {
    const newIssue = await createIssue({
      category,
      severity,
      summary,
      description,
      beforeImage,
      latitude: Number(latitude),
      longitude: Number(longitude),
      locationName: locationName || "Custom Coordinates",
      reporterId: reporterId || "user-marcus",
      reporterName: reporterName || "Anonymous User",
      reporterAvatar: reporterAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    });

    broadcast("issue_created", newIssue);
    res.status(201).json(newIssue);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify an issue report
router.post("/:id/verify", async (req, res) => {
  const { id } = req.params;
  const { userId, userName, type } = req.body; // type: Confirm | Reject | Fixed

  if (!userId || !userName || !type) {
    return res.status(400).json({ error: "Missing verification parameters" });
  }

  try {
    const updatedIssue = await verifyIssue(Number(id), userId, userName, type);
    broadcast("issue_updated", updatedIssue);
    res.json({ message: "Verification recorded successfully", issue: updatedIssue });
  } catch (error: any) {
    if (error.message === "You have already verified this report") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Resolve an issue
router.post("/:id/resolve", async (req, res) => {
  const { id } = req.params;
  const { resolverId, resolverName, afterImage, afterDescription } = req.body;

  if (!resolverId || !resolverName || !afterImage) {
    return res.status(400).json({ error: "Missing resolution proof parameters" });
  }

  try {
    const updatedIssue = await resolveIssue(
      Number(id),
      resolverId,
      resolverName,
      afterImage,
      afterDescription
    );

    broadcast("issue_updated", updatedIssue);
    res.json({ message: "Resolution proof recorded successfully", issue: updatedIssue });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register volunteer interest
router.post("/:id/volunteer", async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await volunteerForIssue(Number(id));
    broadcast("issue_updated", updated);
    res.json({ message: "Registered interest to volunteer", volunteerCount: updated.volunteerCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Contribute crowdfunding
router.post("/:id/fund", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const { uid } = req.user!;

  if (!amount || isNaN(Number(amount))) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const updated = await fundIssue(Number(id), Number(amount), uid);
    broadcast("issue_updated", updated);
    res.json({ message: "Contribution successful", fundingCurrent: updated.fundingCurrent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

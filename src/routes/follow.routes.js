import express from "express";
import { followUser, unfollowUser } from "../controllers/follow.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Maps to /api/follow/:uid
router.post("/:uid", protect, followUser);
router.delete("/:uid", protect, unfollowUser);

export default router;
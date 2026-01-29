import express from "express";
import {
  searchAll,
  searchPosts,
  searchUsers,
} from "../controllers/search.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/posts", protect, searchPosts);
router.get("/users", protect, searchUsers);
router.get("/all", protect, searchAll);

// ✅ FIX: Add the /people route (mapped to searchUsers controller)
// This matches the call in explore_service.dart: '${ApiConfig.search}/people'
router.get("/people", protect, searchUsers);

export default router;
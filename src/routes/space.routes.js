import express from "express";
import {
    createEvent,
    getEvents,
    joinEvent,
    myEvents,
} from "../controllers/space.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/events", protect, createEvent);
router.get("/events", protect, getEvents);
router.post("/events/:id/join", protect, joinEvent);
router.get("/my-events", protect, myEvents);

export default router;

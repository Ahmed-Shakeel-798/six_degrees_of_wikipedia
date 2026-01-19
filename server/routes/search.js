import express from "express";
import { search, searchStream } from "../controllers/search-controller.js";

const router = express.Router();

// POST /api/search
router.post("/", search);

// GET /api/search/stream
router.get("/stream", searchStream);

export default router;

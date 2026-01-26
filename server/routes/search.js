import express from "express";
import { searchStream, addWorker } from "../controllers/search_controller.js";

const router = express.Router();

router.get("/stream", searchStream);
router.post("/add-worker", addWorker);

export default router;

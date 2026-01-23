import express from "express";
import { searchStream } from "../controllers/search_controller.js";

const router = express.Router();

router.get("/stream", searchStream);

export default router;

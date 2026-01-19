import express from "express";
import cors from "cors";
import 'dotenv/config';

import searchRoutes from "./routes/search.js";
import ArticleDB from "./services/db.js";

ArticleDB.getInstance();

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use("/api/search", searchRoutes);

app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});

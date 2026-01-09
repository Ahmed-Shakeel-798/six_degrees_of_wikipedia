import express from "express";
import cors from "cors";
import { normalizeTitle, formatDuration } from "./utils.js"
import { sixDegreesOfWikipediaUsingBFS }  from "./six-degrees-of-wikipedia.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/search", async (req, res) => {
  const { startArticle, targetArticle } = req.body;

  const startTime = process.hrtime.bigint();
  const { path, totalLinksExpanded } = await sixDegreesOfWikipediaUsingBFS(normalizeTitle(startArticle), normalizeTitle(targetArticle));

  const endTime = process.hrtime.bigint();
  const durationNs = endTime - startTime;

  const duration = formatDuration(durationNs);

  res.json({
    path,
    steps: path.length,
    totalLinksExpanded,
    timeTaken: duration
  });
});

app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});

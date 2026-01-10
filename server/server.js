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

app.get("/api/search/stream", async (req, res) => {
  const { startArticle, targetArticle } = req.query;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send({ status: "started" });

  try {
    const startTime = process.hrtime.bigint();

    const result = await sixDegreesOfWikipediaUsingBFS(
      normalizeTitle(startArticle),
      normalizeTitle(targetArticle),
      (progress) => {
        send({ status: "progress", ...progress });
      }
    );

    const endTime = process.hrtime.bigint();
    const duration = formatDuration(endTime - startTime);

    send({
      status: "done",
      ...result,
      timeTaken: duration,
    });
  } catch (err) {
    send({ status: "error", message: err.message });
  } finally {
    res.end();
  }
});


app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});

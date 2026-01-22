import { normalizeTitle, formatDuration } from "../utils/utils.js";
// import { sixDegreesOfWikipediaUsingBFS } from "../services/six-degrees-of-wikipedia.js";

import fs from "fs";

const cleanupScript = fs.readFileSync("./cleanup-job.lua", "utf8");

const cleanupSha = await redis.script("LOAD", cleanupScript);

async function cleanupJob(jobId) {
  console.log("'deleting: " + jobId);
  await redis.evalsha(cleanupSha, 1, jobId);
}

import { v4 as uuidv4 } from "uuid";

import redis from "../redis/redis.js";
import sub from "../redis/redis-sub.js";

async function reconstructPath(jobId, start, target) {
  const parentKey = `sixdeg:${jobId}:parent`;
  console.log(parentKey);
  const path = [];

  let current = target;

  while (current !== null) {
    path.push({
            [current]: "https://en.wikipedia.org/wiki/" + current
        });

    console.log(JSON.stringify(path));

    const parent = await redis.hget(parentKey, current);

    if (parent === "" || parent === null) {
      break;
    }

    current = parent;
  }

  return path.reverse();
}

export async function searchStream(req, res) {
  const jobId = uuidv4();
  const { startArticle, targetArticle } = req.query;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  req.on("close", async () => {
    await redis.set(`sixdeg:${jobId}:cancelled`, "1");
    await cleanupJob(jobId);
  });

  await redis.lpush(
    "sixdeg:queue",
    JSON.stringify({
      jobId,
      startArticle,
      targetArticle
    })
  );

  send({ status: "started", jobId });

  const channel = `sixdeg:events:${jobId}`;
  await sub.subscribe(channel);

  sub.on("message", async (_, msg) => {
    const event = JSON.parse(msg);

    if (event.type === "progress") {
      send({ status: "progress", ...event });
    }

    if (event.type === "found") {
      console.log(`searchStream: found | reconstructing path`);
      const path = await reconstructPath(jobId, startArticle, targetArticle);
      send({ status: "done", path, totalLinksExpanded: 0 });
      await cleanupJob(jobId);
      res.end();
    }

    if (event.type === "cancelled") {
      send({ status: "cancelled" });
      await cleanupJob(jobId);
      res.end();
    }

    if (event.type === "done") {
      send({ status: "done", path: [] });
      await cleanupJob(jobId);
      res.end();
    }
  });
}

export async function search(req, res) {
  const { startArticle, targetArticle } = req.body;

  try {
    const startTime = process.hrtime.bigint();

    const { path, totalLinksExpanded } = await sixDegreesOfWikipediaUsingBFS(
      normalizeTitle(startArticle),
      normalizeTitle(targetArticle)
    );

    const endTime = process.hrtime.bigint();
    const duration = formatDuration(endTime - startTime);

    res.json({
      path,
      steps: path.length,
      totalLinksExpanded,
      timeTaken: duration,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// export async function searchStream(req, res) {
//   const cancelSignal = { cancelled: false };
//   req.on("close", () => {
//     cancelSignal.cancelled = true;
//   });

//   const { startArticle, targetArticle } = req.query;

//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");
//   res.flushHeaders();

//   const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

//   send({ status: "started" });

//   try {
//     const startTime = process.hrtime.bigint();

//     const result = await sixDegreesOfWikipediaUsingBFS(
//       normalizeTitle(startArticle),
//       normalizeTitle(targetArticle),
//       (progress) => send({ status: "progress", ...progress }),
//       cancelSignal
//     );

//     const endTime = process.hrtime.bigint();
//     const timeTaken = formatDuration(endTime - startTime);

//     if (result.cancelled) {
//       send({ status: "cancelled", totalLinksExpanded: result.totalLinksExpanded });
//     } else {
//       send({ status: "done", ...result, timeTaken });
//     }
//   } catch (err) {
//     send({ status: "error", message: err.message });
//   } finally {
//     res.end();
//   }
// }

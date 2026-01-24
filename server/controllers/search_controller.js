import { v4 as uuidv4 } from "uuid";
import redis from "../redis/redis_client.js";
import sub from "../redis/redis_sub.js";
import { cleanupJob } from "../redis/redis_cleanup.js";
import { reconstructPath } from "../services/backtrack.js";
import { normalizeTitle, formatDuration } from "../utils/utils.js";

export async function searchStream(req, res) {
  const jobId = uuidv4();
  const startArticle = normalizeTitle(req.query.startArticle);
  const targetArticle = normalizeTitle(req.query.targetArticle);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const send = (data) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  async function cleanup() {
    sub.removeListener("message", messageHandler);
    await sub.unsubscribe(`sixdeg:events:${jobId}`);
    await cleanupJob(jobId);
  }

  req.on("close", async () => {
    console.log(`searchStream: job ${jobId} cancelled by client`);
    await redis.set(`sixdeg:${jobId}:cancelled`, "1");
  });

  const startTime = process.hrtime.bigint();
  // Enqueue job
  await redis.lpush("sixdeg:queue", JSON.stringify({ jobId, startArticle, targetArticle }));

  send({ status: "started", jobId });

  const channel = `sixdeg:events:${jobId}`;

  const messageHandler = async (msg) => {
    if (res.writableEnded) return;

    let event;
    try {
      event = JSON.parse(msg);
    } catch (err) {
      console.error(`Failed to parse event for job ${jobId}:`, err);
      return;
    }

    if (event.type === "progress") send({ status: "progress", ...event });

    if (event.type === "found") {
      console.log(`searchStream: job ${jobId} found target; reconstructing path...`);
      const path = await reconstructPath(jobId, startArticle, targetArticle);

      const endTime = process.hrtime.bigint();
      const duration = formatDuration(endTime - startTime);

      send({ status: "done", path, timeTaken: duration, totalLinksExpanded: event.totalLinksExpanded ?? 0, frontierSize: event.frontierSize });
      await cleanup();
      res.end();
    }

    if (event.type === "cancelled") {
      send({ status: "cancelled" });
      await cleanup();
      res.end();
    }

    if (event.type === "done") {
      const endTime = process.hrtime.bigint();
      const duration = formatDuration(endTime - startTime);

      send({ status: "done", path: [], timeTaken: duration, totalLinksExpanded: event.totalLinksExpanded ?? 0, frontierSize: event.frontierSize });
      await cleanup();
      res.end();
    }
  };

  await sub.subscribe(channel);
  sub.on("message", (ch, msg) => {
    if(ch !== channel){
      return;
    }
    messageHandler(msg);
  });
}

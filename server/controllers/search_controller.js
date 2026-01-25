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
    console.log(`searchStream => job ${jobId} | connection ended by client.`);
    await redis.del(`sixdeg:${jobId}:alive`);
    await cleanupJob(jobId);
  });

  const channel = `sixdeg:events:${jobId}`;

  await sub.subscribe(channel);
  sub.on("message", (ch, msg) => {
    if (ch !== channel) return;
    messageHandler(msg);
  });

  const startTime = process.hrtime.bigint();

  const numWorkers = 3;
  const assignedWorkers = [];

  for (let i = 0; i < numWorkers; i++) {
    const workerGuid = await redis.rpop("sixdeg:availableWorkers");
    if (workerGuid) {
      assignedWorkers.push(workerGuid);
    }
  }

  if (assignedWorkers.length === 0) {
    send({ status: "worker_unavailable" });
    res.end();
  } else {
    console.log(`searchStream => Assigning job ${jobId} to workers ${assignedWorkers.join(", ")}`);

    let timeout = 0;
    // mark job alive once per worker
    for (const workerGuid of assignedWorkers) {
      setTimeout(async () => {
        await redis.set(`sixdeg:${jobId}:alive`, 1);
        await redis.lpush(`sixdeg:worker:${workerGuid}`, JSON.stringify({ task: "start", data: { jobId, startArticle, targetArticle },}));
      }, timeout);
      timeout += 2000;
    }
  }

  send({ status: "started", jobId });

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
      console.log(`searchStream => job ${jobId} | found target.`);
      const path = await reconstructPath(jobId, startArticle, targetArticle);

      const endTime = process.hrtime.bigint();
      const duration = formatDuration(endTime - startTime);

      send({
        status: "done",
        path,
        timeTaken: duration,
        totalLinksExpanded: event.totalLinksExpanded ?? 0,
        frontierSize: event.frontierSize,
      });
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

      send({
        status: "done",
        path: [],
        timeTaken: duration,
        totalLinksExpanded: event.totalLinksExpanded ?? 0,
        frontierSize: event.frontierSize,
      });
      await cleanup();
      res.end();
    }
  };
}

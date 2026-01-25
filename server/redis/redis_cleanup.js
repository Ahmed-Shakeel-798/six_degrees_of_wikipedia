import fs from "fs";
import redis from "./redis_client.js";

const cleanupScript = fs.readFileSync("./redis/cleanup.lua", "utf8");
const flushAllScript = fs.readFileSync("./redis/flush_all.lua", "utf8"); // path matches file

async function loadScripts() {
  const cleanupSha = await redis.script("LOAD", cleanupScript);
  const flushAllSha = await redis.script("LOAD", flushAllScript);
  return { cleanupSha, flushAllSha };
}

const { cleanupSha, flushAllSha } = await loadScripts();

async function cleanupJob(jobId) {
  await redis.evalsha(cleanupSha, 1, jobId);
}

async function flushAll() {
  await redis.evalsha(flushAllSha, 0); // numKeys = 0
}

export { cleanupJob, flushAll };

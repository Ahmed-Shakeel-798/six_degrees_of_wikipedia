import fs from "fs";
import redis from "./redis_client.js";

const cleanupScript = fs.readFileSync("./redis/cleanup.lua", "utf8");

const cleanupSha = await redis.script("LOAD", cleanupScript);

async function cleanupJob(jobId) {
  await redis.evalsha(cleanupSha, 1, jobId);
}

export { cleanupJob }
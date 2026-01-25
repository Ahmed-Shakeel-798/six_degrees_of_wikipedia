import Redis from "ioredis";
import { registerLua } from "./redis-commands.js";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null, // IMPORTANT for BRPOP
  enableReadyCheck: true
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

registerLua(redis);

export default redis;

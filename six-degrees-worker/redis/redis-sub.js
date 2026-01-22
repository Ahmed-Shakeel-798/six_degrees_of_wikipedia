// redis-sub.js
import Redis from "ioredis";

const sub = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379
});

export default sub;

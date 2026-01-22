import redis from "./redis/redis.js";

async function test() {
  await redis.set("hello", "world");
  const value = await redis.get("hello");
  console.log("Redis says:", value);
  process.exit(0);
}

test();

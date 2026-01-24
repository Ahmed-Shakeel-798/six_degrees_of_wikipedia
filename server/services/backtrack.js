import redis from "../redis/redis_client.js";

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

export { reconstructPath }
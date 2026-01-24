import { fetchWikiLinks } from "./wiki.js";
import redis from "./redis/redis.js";

async function runWorker() {
  console.log("Worker started, waiting for jobs...");

  while (true) {
    const [, jobRaw] = await redis.brpop("sixdeg:queue", 0);
    const job = JSON.parse(jobRaw);

    await runBFS(job);
  }
}

async function runBFS({ jobId, startArticle, targetArticle }) {
  const frontierKey = `sixdeg:${jobId}:frontier`;
  const visitedKey = `sixdeg:${jobId}:visited`;
  const parentKey = `sixdeg:${jobId}:parent`;
  const depthKey = `sixdeg:${jobId}:depth`;
  const statsKey = `sixdeg:${jobId}:stats`;
  const cancelKey = `sixdeg:${jobId}:cancelled`;
  const channel = `sixdeg:events:${jobId}`;

  await redis.multi()
    .sadd(visitedKey, startArticle)
    .hset(parentKey, startArticle, "")
    .hset(depthKey, startArticle, 0)
    .lpush(frontierKey, startArticle)
    .hset(statsKey, "totalExpanded", 0)
    .exec();

  while (true) {
    if (await redis.exists(cancelKey)) {
      await redis.publish(channel, JSON.stringify({ type: "cancelled" }));
      return;
    }

    const currentArticle = await redis.rpop(frontierKey);
    if (!currentArticle) {
      await redis.publish(channel, JSON.stringify({ type: "done" }));
      return;
    }

    console.log(`runBFS => current article: ${currentArticle}`);

    const depth = Number(await redis.hget(depthKey, currentArticle));
    if (depth >= 6) continue;

    const links = await fetchWikiLinks(currentArticle);

    let expanded = await redis.hincrby(statsKey, "totalLinksExpanded", 1);

    for (const article of links) {
      if (await redis.sismember(visitedKey, article)) continue;

      await redis.multi()
        .sadd(visitedKey, article)
        .hset(parentKey, article, currentArticle)
        .hset(depthKey, article, depth + 1)
        .lpush(frontierKey, article)
        .exec();

      if (article === targetArticle) {
        await redis.set(`sixdeg:${jobId}:found`, article);
        const frontierSize = await redis.llen(frontierKey);
        await redis.publish(channel, JSON.stringify({ type: "found", totalLinksExpanded: expanded, frontierSize }));
        return;
      }
    }

    if (expanded % 2 === 0) {
      const frontierSize = await redis.llen(frontierKey);
      await redis.publish(
        channel,
        JSON.stringify({ type: "progress", totalLinksExpanded: expanded, frontierSize })
      );
    }
  }
}

runWorker().catch(console.error);

import { fetchWikiLinks } from "./wiki.js";
import ArticleDB from "./db.js";
import redis from "./redis/redis.js";
import { v4 as uuidv4 } from "uuid";

const db = ArticleDB.getInstance();

let localJobId = null;
let aliveKey, initializedKey, frontierKey, visitedKey, parentKey, depthKey, statsKey, channel;

const workerGuid = uuidv4(); // unique worker ID
const workerChannel = `sixdeg:worker:${workerGuid}`;

/**
 * Initialize worker: inform server of availability
 */
async function runWorker() {
  console.log(`Worker ${workerGuid} started.`);
  while (true) {
    // Inform server that this worker is available
    await redis.lpush("sixdeg:availableWorkers", workerGuid);

    // Wait for a task
    const [, itemRaw] = await redis.brpop(workerChannel, 0); // blocking pop
    const item = JSON.parse(itemRaw);

    console.log(`runWorker => worker: ${workerGuid} | item: ${JSON.stringify(item)}`);

    if(item.task === "start") {
      localJobId = item.data.jobId;
      updateJobKeys(localJobId);
      const { startArticle, targetArticle } = item.data;
      await runBFS(startArticle, targetArticle);
    }

    /**
     * cleanup
     */
    localJobId = null;
    updateJobKeys(null);
  }
}

/**
 * Process a single node of BFS for a job
 */
async function runBFS(startArticle, targetArticle) {
  const pushed = await redis.initJobData( aliveKey, initializedKey, visitedKey, parentKey, depthKey, frontierKey, statsKey, startArticle );
  if(pushed){
    console.log(`runBFS => ${localJobId} | worker: ${workerGuid} | initialized.`);
  }else{
    console.log(`runBFS => ${localJobId} | worker: ${workerGuid} | not initialized.`);
  }

  while(true) {
    const res = await redis.popFrontier(aliveKey, frontierKey, depthKey, statsKey);
    if (!res) return;

    const [currentArticle, depth, expanded] = res;
    if (Number(depth) >= 6) continue;

    console.log(`runBFS => job: ${localJobId} | worker: ${workerGuid} | depth: ${depth} | expanding: ${currentArticle}`);

    const links = await expandNode(currentArticle);

    for (const article of links) {
      const pushed = await redis.pushJobData(aliveKey, visitedKey, parentKey, depthKey, frontierKey, article, currentArticle, Number(depth) + 1);

      if (!pushed) continue;

      if (article === targetArticle) {
        const frontierSize = await redis.fetchFrontierSize(frontierKey);
        await redis.publish(channel, JSON.stringify({type: "found", totalLinksExpanded: expanded, frontierSize}));
        return;
      }
    }

    if (expanded % 2 === 0) {
      const frontierSize = await redis.fetchFrontierSize(frontierKey);
      await redis.publish(
        channel,
        JSON.stringify({ type: "progress", totalLinksExpanded: expanded, frontierSize })
      );
    }
  }
}

/**
 * Fetch links, either from local DB or live API
 */
async function expandNode(article) {
  let links = db.getLinks(article);
  if (!links || links.length === 0) {
    links = await fetchWikiLinks(article);
    db.insertLinks(article, links);
  }
  return links;
}

/**
 * Update Redis keys for a given job
 */
function updateJobKeys(jobId) {
  if (!jobId) {
     aliveKey = initializedKey = frontierKey = visitedKey = parentKey = depthKey = statsKey = channel = null;
    return;
  }

  aliveKey = `sixdeg:${jobId}:alive`;
  initializedKey = `sixdeg:${jobId}:initialized`
  frontierKey = `sixdeg:${jobId}:frontier`;
  visitedKey = `sixdeg:${jobId}:visited`;
  parentKey = `sixdeg:${jobId}:parent`;
  depthKey = `sixdeg:${jobId}:depth`;
  statsKey = `sixdeg:${jobId}:stats`;
  channel = `sixdeg:events:${jobId}`;
}

// Start the worker
runWorker().catch(console.error);

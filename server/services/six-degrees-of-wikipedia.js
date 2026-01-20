import { isValidWikiLink, backTrackToStart } from "../utils/utils.js";
import ArticleDB from "./db.js";
import PriorityQueue from "./priority-queue.js";

const WIKI_BASE = "https://en.wikipedia.org/wiki/";
const db = ArticleDB.getInstance();

const fetchWikiLinks = async (articleTitle) => {
    const url = `${WIKI_BASE}${articleTitle.replace(/ /g, "_")}`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const html = await res.text();

    const links = new Set();
    const regex = /href="(\/wiki\/[^"]+)"/g;

    for (const match of html.matchAll(regex)) {
        const href = match[1];

        if (isValidWikiLink(href)) {
            links.add(href.replace("/wiki/", ""));
        }
    }

    return [...links];
};

const sixDegreesOfWikipediaUsingBFS = async (startArticle, targetArticle, onProgress = null, cancelSignal = { cancelled: false }) => {
    
    /**
     * fetch target article's links, used for calculating priority
     */
    let targetArticleArray = db.getLinks(targetArticle);
    if(targetArticleArray.length <= 0) {
      targetArticleArray = await fetchWikiLinks(targetArticle);
      db.insertLinks(targetArticle, targetArticleArray);
    }
    const targetArticleLinks = new Set(targetArticleArray);

    const linkQueue = new PriorityQueue(true);
    const visitedSet = new Set([startArticle]); // contains a set of all visited links/nodes. 
    const parentMap = {}; // contains parent of each link/node.

    parentMap[startArticle] = null;
    
    let totalLinksExpanded = 0;

    linkQueue.push({
      article: startArticle,
      depth: 0,
      priority: 0
    });

    while (linkQueue.length > 0) {
      if (cancelSignal.cancelled) {
        return { path: [], totalLinksExpanded, cancelled: true };
      }
      
      const { article: currentArticle, depth, priority } = linkQueue.shift();

      console.log('sixDegreesOfWikipediaUsingBFS > level: ' + depth + ' | priority: ' + priority + ' | current article > ' + currentArticle);
       
      /**
       * If match, reconstruct and return
       */
      if(currentArticle == targetArticle){
        const path = backTrackToStart(currentArticle, parentMap);
        return { path, totalLinksExpanded }
      }

      if(depth === 6) {
        continue;
      }

      /**
       * fetch links of the current article
       */
      let articleList = db.getLinks(currentArticle);
      if(articleList.length <= 0) {
        articleList = await fetchWikiLinks(currentArticle);
        db.insertLinks(currentArticle, articleList);
      }

      totalLinksExpanded+=1;

      /**
       * Send updates to FE
       */
      if(onProgress) {
        onProgress?.({
          totalLinksExpanded
        })
      }

      for (const article of articleList) {
        if (cancelSignal.cancelled) {
          return { path: [], totalLinksExpanded, cancelled: true };
        }

        if (visitedSet.has(article)) continue;

        visitedSet.add(article); // mark visited
        parentMap[article] = currentArticle // set parent

        if (article === targetArticle) {
          const path = backTrackToStart(article, parentMap);
          return { path, totalLinksExpanded }
        }

        linkQueue.push({
          article,
          depth: depth + 1,
          priority: targetArticleLinks.has(article) ? 1 : 0
        });
      }
    }

    return { path: [], totalLinksExpanded };
}

export { sixDegreesOfWikipediaUsingBFS };
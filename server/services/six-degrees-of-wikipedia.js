import { isValidWikiLink, backTrackToStart, heuristicFunction } from "../utils/utils.js";
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
     * fetch target article's links, used for calculating heuristic
     */
    let targetArticleArray = db.getLinks(targetArticle);
    if(targetArticleArray.length <= 0) {
      targetArticleArray = await fetchWikiLinks(targetArticle);
      db.insertLinks(targetArticle, targetArticleArray);
    }
    const targetArticleLinks = new Set(targetArticleArray);

    const linkQueue = new PriorityQueue;
    const visitedSet = new Set([startArticle]); // contains a set of all visited links/nodes. 
    const parentMap = {}; // contains parent of each link/node.

    parentMap[startArticle] = null;
    
    let totalLinksExpanded = 0;

    linkQueue.push({
      article: startArticle,
      depth: 0,
      heuristic: 0
    });

    while (linkQueue.length > 0) {
      if (cancelSignal.cancelled) {
        return { path: [], totalLinksExpanded, cancelled: true };
      }
      
      const { article: currentArticle, depth, heuristic } = linkQueue.shift();

      console.log('sixDegreesOfWikipediaUsingBFS > level: ' + depth + ' | heuristic: ' + heuristic + ' | current article > ' + currentArticle);
       
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

        const heuristicValue = heuristicFunction(article, targetArticleLinks);

        linkQueue.push({
          article,
          depth: depth + 1,
          heuristic: heuristicValue
        });
      }
    }

    return { path: [], totalLinksExpanded };
}

export { sixDegreesOfWikipediaUsingBFS };
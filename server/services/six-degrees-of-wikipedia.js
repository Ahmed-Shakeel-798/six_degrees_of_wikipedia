import { isValidWikiLink } from "../utils/utils.js";
import ArticleDB from "./db.js";

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
    
    const parentMap = {}; // contains parent of each link/node.
    const depthMap = {}; // contains depth count of each link/node.
    
    const visitedSet = new Set([startArticle]); // contains a set of all visited links/nodes. 
    const linkQueue = [startArticle]; // contains.

    depthMap[startArticle] = 0;
    parentMap[startArticle] = null;

    let totalLinksExpanded = 0;

    const backTrackToStart = (article) => {
        const path = [];

        while (article) {
            path.push({
                [article]: "https://en.wikipedia.org/wiki/" + article
            });

            article = parentMap[article];
        }

        return path.reverse();
    }

    while (linkQueue.length > 0) {
      if (cancelSignal.cancelled) {
        return { path: [], totalLinksExpanded, cancelled: true };
      }
      
      const currentArticle = linkQueue.shift();

      console.log('sixDegreesOfWikipediaUsingBFS > current article > ' + currentArticle);
       
      if(currentArticle == targetArticle){
        // reconstuct path to parent and return
        const path = backTrackToStart(currentArticle);
        return { path, totalLinksExpanded }
      }

      if(depthMap[currentArticle] === 6) {
        continue;
      }

      let articleList = db.getLinks(currentArticle);

      if(articleList.length <= 0) {
        articleList = await fetchWikiLinks(currentArticle);
        db.insertLinks(currentArticle, articleList);
      }

      totalLinksExpanded+=1;

      if(onProgress) {
        onProgress?.({
          totalLinksExpanded
        })
      }

      for (const article of articleList) {
        if (cancelSignal.cancelled) {
          return { path: [], totalLinksExpanded, cancelled: true };
        }

        if(visitedSet.has(article)){
          continue;
        }

        visitedSet.add(article); // mark visited
        parentMap[article] = currentArticle // set parent
        depthMap[article] = depthMap[currentArticle] + 1; // set depth.

        if (article === targetArticle) {
          const path = backTrackToStart(article);
          return { path, totalLinksExpanded }
        }
        
        linkQueue.push(article);
      }
    }

    return { path: [], totalLinksExpanded };
}

export { sixDegreesOfWikipediaUsingBFS };
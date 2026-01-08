import readline from "readline";

const WIKI_BASE = "https://en.wikipedia.org/wiki/";

const normalizeTitle = (title) => {
    return title.replace(/ /g, "_");
}

const isValidWikiLink = (href) => {
    return href.startsWith("/wiki/") && !href.includes(":") && !href.includes("#");
}

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

const sixDegreesOfWikipediaUsingBFS = async (startArticle, targetArticle) => {

    const parentMap = {}; // contains parent of each link/node.
    const depthMap = {}; // contains depth count of each link/node.
    
    const visitedSet = new Set([startArticle]); // contains a set of all visited links/nodes. 
    const linkQueue = [startArticle]; // contains.

    depthMap[startArticle] = 0;
    parentMap[startArticle] = null;

    const backTrackToStart = (article, path = []) => {
      if(parentMap[article]) {
        path.push(parentMap[article]);
        return backTrackToStart(parentMap[article], path);
      }else{
        return path;
      }
    }

    while (linkQueue.length > 0) {
      
      const currentArticle = linkQueue.shift();

      console.log('sixDegreesOfWikipediaUsingBFS > current article > ' + currentArticle);
       
      if(currentArticle == targetArticle){
        // reconstuct path to parent and return
        const path = backTrackToStart(currentArticle, [currentArticle]);
        return path.reverse();
      }

      if(depthMap[currentArticle] === 6) {
        continue;
      }
      
      const articleList = await fetchWikiLinks(currentArticle);

      for (const article of articleList) {
        if(visitedSet.has(article)){
          continue;
        }

        visitedSet.add(article); // mark visited
        parentMap[article] = currentArticle // set parent
        depthMap[article] = depthMap[currentArticle] + 1; // set depth.

        if (article === targetArticle) {
          const path = backTrackToStart(article, [article]);
          return path.reverse();
        }
        
        linkQueue.push(article);
      }
    }

    return [];
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Start article: ", (startInput) => {
  rl.question("Target article: ", async (targetInput) => {
    rl.close();

    const startArticle = normalizeTitle(startInput.trim());
    const targetArticle = normalizeTitle(targetInput.trim());
    const path = await sixDegreesOfWikipediaUsingBFS(startArticle, targetArticle);
    console.log(path);
  });
});
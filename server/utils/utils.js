const normalizeTitle = (title) => {
    return title.replace(/ /g, "_");
}

const isValidWikiLink = (href) => {
    return href.startsWith("/wiki/") && !href.includes(":") && !href.includes("#");
}

const formatDuration = (durationNs) => {
    const ms = Number(durationNs / 1_000_000n);
    const milliseconds = ms % 1000;

    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;

    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;

    const hours = Math.floor(totalMinutes / 60);

    return {
        hours,
        minutes,
        seconds,
        milliseconds,
        formatted: hours > 0
            ? `${hours}h ${minutes}m ${seconds}s`
            : minutes > 0
            ? `${minutes}m ${seconds}s ${milliseconds}ms`
            : `${seconds}s ${milliseconds}ms`
    };
}

const backTrackToStart = (article, parentMap) => {
    const path = [];

    while (article) {
        path.push({
            [article]: "https://en.wikipedia.org/wiki/" + article
        });

        article = parentMap[article];
    }

     return path.reverse();
}

const heuristicFunction = (articleTitle, targetLinks) => {
  let score = 0;

  // H1: direct overlap with target
  if (targetLinks.has(articleTitle)) {
    score += 1000; // very strong signal
  }

  // more heuristics later

  return score;
}


export { normalizeTitle, isValidWikiLink, formatDuration, backTrackToStart, heuristicFunction };
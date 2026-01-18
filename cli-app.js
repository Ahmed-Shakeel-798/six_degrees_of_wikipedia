import readline from "readline";

import { normalizeTitle, formatDuration } from "./server/utils.js"
import { sixDegreesOfWikipediaUsingBFS }  from "./server/services/six-degrees-of-wikipedia.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Start article: ", (startInput) => {
  rl.question("Target article: ", async (targetInput) => {
    rl.close();

    const startArticle = normalizeTitle(startInput.trim());
    const targetArticle = normalizeTitle(targetInput.trim());

    const startTime = process.hrtime.bigint();

    const { path, totalLinksExpanded } = await sixDegreesOfWikipediaUsingBFS(startArticle, targetArticle);
    
    const endTime = process.hrtime.bigint();
    const durationNs = endTime - startTime;

    const duration = formatDuration(durationNs);
    
    const result = {
      path,
      steps: path.length,
      totalLinksExpanded,
      timeTaken: duration
    }
    
    console.log(JSON.stringify(result, null, 2));
  });
});
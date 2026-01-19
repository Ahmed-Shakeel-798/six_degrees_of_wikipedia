import { normalizeTitle, formatDuration } from "../utils/utils.js";
import { sixDegreesOfWikipediaUsingBFS } from "../services/six-degrees-of-wikipedia.js";

export async function search(req, res) {
  const { startArticle, targetArticle } = req.body;

  try {
    const startTime = process.hrtime.bigint();

    const { path, totalLinksExpanded } = await sixDegreesOfWikipediaUsingBFS(
      normalizeTitle(startArticle),
      normalizeTitle(targetArticle)
    );

    const endTime = process.hrtime.bigint();
    const duration = formatDuration(endTime - startTime);

    res.json({
      path,
      steps: path.length,
      totalLinksExpanded,
      timeTaken: duration,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function searchStream(req, res) {
  const cancelSignal = { cancelled: false };
  req.on("close", () => {
    cancelSignal.cancelled = true;
  });

  const { startArticle, targetArticle } = req.query;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  send({ status: "started" });

  try {
    const startTime = process.hrtime.bigint();

    const result = await sixDegreesOfWikipediaUsingBFS(
      normalizeTitle(startArticle),
      normalizeTitle(targetArticle),
      (progress) => send({ status: "progress", ...progress }),
      cancelSignal
    );

    const endTime = process.hrtime.bigint();
    const timeTaken = formatDuration(endTime - startTime);

    if (result.cancelled) {
      send({ status: "cancelled", totalLinksExpanded: result.totalLinksExpanded });
    } else {
      send({ status: "done", ...result, timeTaken });
    }
  } catch (err) {
    send({ status: "error", message: err.message });
  } finally {
    res.end();
  }
}

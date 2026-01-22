const WIKI_BASE = "https://en.wikipedia.org/wiki/";
// const db = ArticleDB.getInstance();

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

export {fetchWikiLinks};

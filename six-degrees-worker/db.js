import Database from 'better-sqlite3';
const dbPath = process.env.DATABASE_URL?.replace("file:", "") || ":memory:";

class ArticleDB {
  static instance = null;

  static getInstance() {
    if (!ArticleDB.instance) {
        console.log(dbPath);
      ArticleDB.instance = new ArticleDB(dbPath);
    }
    return ArticleDB.instance;
  }

  constructor(path) {
    this.db = new Database(path);
    this.db.pragma('foreign_keys = ON');
    this.initDb();
  }

  initDb() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        title TEXT PRIMARY KEY,
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS links (
        from_article TEXT,
        to_article TEXT,
        PRIMARY KEY (from_article, to_article)
      );

      CREATE INDEX IF NOT EXISTS idx_links_from ON links(from_article);
    `);
  }

  async insertArticle(title) {
    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO articles(title, fetched_at) VALUES (?, datetime('now'))`
    );
    return stmt.run(title);
  }

  async insertLink(fromArticle, toArticle) {
    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO links(from_article, to_article) VALUES (?, ?)`
    );
    return stmt.run(fromArticle, toArticle);
  }

  // Bulk insert links from a single article
  async insertLinks(fromArticle, linkedArticles) {
    if (!Array.isArray(linkedArticles) || linkedArticles.length === 0) return;

    const insert = this.db.prepare(
      `INSERT OR IGNORE INTO links(from_article, to_article) VALUES (?, ?)`
    );

    const insertMany = this.db.transaction((links) => {
      for (const toArticle of links) {
        insert.run(fromArticle, toArticle);
      }
    });

    insertMany(linkedArticles);
    return true;
  }

  getLinks = (fromArticle) => {
    const stmt = this.db.prepare(
      `SELECT to_article FROM links WHERE from_article = ?`
    );
    return stmt.all(fromArticle).map(row => row.to_article);
  }

  async getArticles() {
    const stmt = this.db.prepare(`SELECT title FROM articles`);
    return stmt.all().map(row => row.title);
  }
}

export default ArticleDB;
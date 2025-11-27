const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Use environment variable for database path (for Docker) or default to current directory
const dbPath = process.env.DB_PATH || path.join(__dirname, "urls.db");

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
    console.log("Database path:", dbPath);
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Create urls table
    db.run(
      `
      CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        access_count INTEGER DEFAULT 0,
        last_accessed_at DATETIME
      )
    `,
      (err) => {
        if (err) {
          console.error("Error creating urls table:", err.message);
        } else {
          console.log("URLs table ready");
        }
      }
    );

    // Create url_analytics table
    db.run(
      `
      CREATE TABLE IF NOT EXISTS url_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url_id INTEGER NOT NULL,
        accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address TEXT,
        referrer TEXT,
        FOREIGN KEY (url_id) REFERENCES urls(id)
      )
    `,
      (err) => {
        if (err) {
          console.error("Error creating url_analytics table:", err.message);
        } else {
          console.log("URL analytics table ready");
        }
      }
    );
  });
}

module.exports = db;

const express = require("express");
const cors = require("cors");
const { customAlphabet } = require("nanoid");
const db = require("./database");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// base URL يتاخد من env (في الكلاستر هتحطه = ELB)
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Generate short codes using nanoid (alphanumeric, 7 characters)
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// API: Shorten URL
app.post("/api/shorten", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  const shortCode = nanoid();
  const query = `INSERT INTO urls (short_code, original_url) VALUES (?, ?)`;

  db.run(query, [shortCode, url], function (err) {
    if (err) {
      console.error("Error inserting URL:", err.message);
      return res.status(500).json({ error: "Failed to create short URL" });
    }

    const shortUrl = `${BASE_URL.replace(/\/+$/, "")}/${shortCode}`;
    res.json({
      shortUrl,
      shortCode,
      originalUrl: url,
    });
  });
});

// Redirect short URL to original URL
app.get("/:shortCode", (req, res) => {
  const { shortCode } = req.params;

  // Skip API routes
  if (shortCode === "api") {
    return;
  }

  const query = `SELECT id, original_url FROM urls WHERE short_code = ?`;

  db.get(query, [shortCode], (err, row) => {
    if (err) {
      console.error("Error fetching URL:", err.message);
      return res.status(500).send("Server error");
    }

    if (!row) {
      return res.status(404).send("URL not found");
    }

    const updateQuery = `
      UPDATE urls 
      SET access_count = access_count + 1, 
          last_accessed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    db.run(updateQuery, [row.id], (err) => {
      if (err) {
        console.error("Error updating access count:", err.message);
      }
    });

    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = req.ip || req.connection.remoteAddress || "";
    const referrer = req.headers["referer"] || req.headers["referrer"] || "";

    const analyticsQuery = `
      INSERT INTO url_analytics (url_id, user_agent, ip_address, referrer)
      VALUES (?, ?, ?, ?)
    `;

    db.run(analyticsQuery, [row.id, userAgent, ipAddress, referrer], (err) => {
      if (err) {
        console.error("Error logging analytics:", err.message);
      }
    });

    res.redirect(row.original_url);
  });
});

// API: Get URL stats
app.get("/api/stats/:shortCode", (req, res) => {
  const { shortCode } = req.params;

  const query = `
    SELECT short_code, original_url, created_at, access_count, last_accessed_at
    FROM urls 
    WHERE short_code = ?
  `;

  db.get(query, [shortCode], (err, row) => {
    if (err) {
      console.error("Error fetching stats:", err.message);
      return res.status(500).json({ error: "Server error" });
    }

    if (!row) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.json(row);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`URL Shortener running on ${BASE_URL}`);
});

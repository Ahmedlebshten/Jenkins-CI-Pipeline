const express = require("express");
const cors = require("cors");
const { customAlphabet } = require("nanoid");
const db = require("./database");
const path = require("path");
const client = require("prom-client");

const app = express();
const PORT = 2020;

// Generate short codes using nanoid (alphanumeric, 7 characters)
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7
);

// ===== Prometheus Setup =====
const register = new client.Registry();

// Default metrics (CPU, Memory, etc.)
client.collectDefaultMetrics({ register });

// Custom Metrics
const urlCreationCounter = new client.Counter({
  name: 'shortlink_urls_created_total',
  help: 'Total number of shortened URLs created',
  registers: [register]
});

const redirectCounter = new client.Counter({
  name: 'shortlink_redirects_total',
  help: 'Total number of successful redirects',
  registers: [register]
});

const notFoundCounter = new client.Counter({
  name: 'shortlink_404_errors_total',
  help: 'Total number of 404 errors (failed lookups)',
  registers: [register]
});

const requestDuration = new client.Histogram({
  name: 'shortlink_request_duration_seconds',
  help: 'Request latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    console.error("Error collecting metrics:", err);
    res.status(500).send('Error collecting metrics');
  }
});
// ===== End Prometheus Setup =====

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// API: Shorten URL
app.post("/api/shorten", (req, res) => {
  const start = Date.now();

  const { url } = req.body;
  if (!url) {
    const duration = (Date.now() - start) / 1000;
    requestDuration.labels('POST', '/api/shorten', '400').observe(duration);
    return res.status(400).json({ error: "URL is required" });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (err) {
    const duration = (Date.now() - start) / 1000;
    requestDuration.labels('POST', '/api/shorten', '400').observe(duration);
    return res.status(400).json({ error: "Invalid URL format" });
  }

  const shortCode = nanoid();
  const query = `INSERT INTO urls (short_code, original_url) VALUES (?, ?)`;

  db.run(query, [shortCode, url], function (err) {
    const duration = (Date.now() - start) / 1000;

    if (err) {
      console.error("Error inserting URL:", err.message);
      requestDuration.labels('POST', '/api/shorten', '500').observe(duration);
      return res.status(500).json({ error: "Failed to create short URL" });
    }

    // Increment counter for successful URL creation
    urlCreationCounter.inc();
    requestDuration.labels('POST', '/api/shorten', '200').observe(duration);

    // use request host so link works behind LB/Ingress
    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.protocol || 'http';
    const shortUrl = `${protocol}://${host}/${shortCode}`;

    res.json({
      shortUrl,
      shortCode,
      originalUrl: url,
    });
  });
});

// Redirect short URL to original URL
app.get("/:shortCode", (req, res) => {
  const start = Date.now();

  const { shortCode } = req.params;

  // Skip API routes (if someone calls /api or /metrics directly)
  if (shortCode === "api" || shortCode === "metrics") {
    return res.status(404).send("Not found");
  }

  const query = `SELECT id, original_url FROM urls WHERE short_code = ?`;

  db.get(query, [shortCode], (err, row) => {
    const duration = (Date.now() - start) / 1000;

    if (err) {
      console.error("Error fetching URL:", err.message);
      requestDuration.labels('GET', '/:shortCode', '500').observe(duration);
      return res.status(500).send("Server error");
    }

    if (!row) {
      // Increment 404 counter
      notFoundCounter.inc();
      requestDuration.labels('GET', '/:shortCode', '404').observe(duration);
      return res.status(404).send("URL not found");
    }

    // Update access count and last accessed time
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

    // Log analytics
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

    // Increment redirect counter
    redirectCounter.inc();
    requestDuration.labels('GET', '/:shortCode', '302').observe(duration);

    // Redirect to original URL
    res.redirect(row.original_url);
  });
});

// API: Get URL stats (for Prometheus monitoring)
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
  console.log(`URL Shortener running on http://localhost:${PORT}`);
});
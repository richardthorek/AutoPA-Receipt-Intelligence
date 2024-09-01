const express = require("express");
const { join } = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const app = express();

// Middleware
app.use(morgan("dev"));
app.use(helmet());
app.use(express.static(join(__dirname, "public")));

// Serve auth_config.json
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// Serve Readme.md
app.get("/README.md", (req, res) => {
  res.sendFile(join(__dirname, "README.md"));
});

// Serve index.html for the root route
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Serve index.html for all other routes
app.get("/*", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Graceful shutdown
process.on("SIGINT", function() {
  process.exit();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

module.exports = app;
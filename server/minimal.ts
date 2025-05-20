import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// Serve index.html for root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/assessment-portal.html"));
});

// Assessment redirect endpoints
app.get("/basic-assessment", (req, res) => {
  res.redirect("https://docs.google.com/forms/d/e/1FAIpQLSfuKxxqApOXCZmQh5hO9V5-_4bWHgTsA-mxEtCmXHmQCscCdw/viewform");
});

app.get("/comprehensive-assessment", (req, res) => {
  res.redirect("https://docs.google.com/forms/d/e/1FAIpQLSdP7lDMU9AEVg_GOPe1mFm4BKr-N7Ro-ZJv5kEljkfv8NrXkA/viewform");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Minimal assessment server is running" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Assessment server running on port ${PORT}`);
});
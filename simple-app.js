import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files
app.use(express.static('public'));
app.use(express.static(__dirname));

// Main entry point - redirects to assessment portal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/assessment-portal.html'));
});

// Direct links to assessments
app.get('/basic', (req, res) => {
  res.redirect('https://docs.google.com/forms/d/e/1FAIpQLSfuKxxqApOXCZmQh5hO9V5-_4bWHgTsA-mxEtCmXHmQCscCdw/viewform');
});

app.get('/comprehensive', (req, res) => {
  res.redirect('https://docs.google.com/forms/d/e/1FAIpQLSdP7lDMU9AEVg_GOPe1mFm4BKr-N7Ro-ZJv5kEljkfv8NrXkA/viewform');
});

// Start server on port 5000 to match what Replit expects
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Assessment app running on port ${PORT}`);
});
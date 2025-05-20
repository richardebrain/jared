// Simple express server to serve the assessment page
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Serve the assessment page as the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Direct redirects to Google Forms assessments
app.get('/basic-assessment', (req, res) => {
  res.redirect('https://docs.google.com/forms/d/e/1FAIpQLSfuKxxqApOXCZmQh5hO9V5-_4bWHgTsA-mxEtCmXHmQCscCdw/viewform');
});

app.get('/comprehensive-assessment', (req, res) => {
  res.redirect('https://docs.google.com/forms/d/e/1FAIpQLSdP7lDMU9AEVg_GOPe1mFm4BKr-N7Ro-ZJv5kEljkfv8NrXkA/viewform');
});

// Start server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Assessment server running on port ${PORT}`);
});
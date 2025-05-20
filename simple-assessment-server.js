// Import required packages
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express application
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Root route - serve the assessment page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/assessment-portal.html'));
});

// Basic assessment redirect
app.get('/basic', (req, res) => {
  res.redirect('https://docs.google.com/forms/d/e/1FAIpQLSfuKxxqApOXCZmQh5hO9V5-_4bWHgTsA-mxEtCmXHmQCscCdw/viewform');
});

// Comprehensive assessment redirect
app.get('/comprehensive', (req, res) => {
  res.redirect('https://docs.google.com/forms/d/e/1FAIpQLSdP7lDMU9AEVg_GOPe1mFm4BKr-N7Ro-ZJv5kEljkfv8NrXkA/viewform');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Assessment server is running' });
});

// Start the server on port 3000
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Assessment server running on port ${PORT}`);
});
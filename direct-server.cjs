// Simple direct server for assessments
const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the public directory
app.use(express.static('public'));

// Basic route handling
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Direct links to Google Forms assessments
app.get('/basic', (req, res) => {
  res.redirect('https://docs.google.com/forms/d/e/1FAIpQLSfuKxxqApOXCZmQh5hO9V5-_4bWHgTsA-mxEtCmXHmQCscCdw/viewform');
});

app.get('/full', (req, res) => {
  res.redirect('https://docs.google.com/forms/d/e/1FAIpQLSdP7lDMU9AEVg_GOPe1mFm4BKr-N7Ro-ZJv5kEljkfv8NrXkA/viewform');
});

// Start server - must use port 5000 for Replit to detect it
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple assessment server running on port ${PORT}`);
});
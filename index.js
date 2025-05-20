// Simple express server to serve static files
const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve assessment page
app.get('/assessment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'simple-googleform-assessment.html'));
});

// Catch-all route to redirect to Google Forms directly if needed
app.get('/quick-assessment', (req, res) => {
  res.redirect('https://forms.gle/W8vgp6UTt2PXpCE67');
});

// Start server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Assessment server running on port ${PORT}`);
});
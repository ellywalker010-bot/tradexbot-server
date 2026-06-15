const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

// Allow both JSON and raw text
app.use(cors());
app.use(express.json());
app.use(express.text()); // Add this to accept raw text

// File storage
const DATA_FILE = 'balance.json';
let currentBalance = 0;
let currentCurrency = 'USD';

// Load saved data
if (fs.existsSync(DATA_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    currentBalance = saved.balance || 0;
    currentCurrency = saved.currency || 'USD';
  } catch(e) {}
}

// EA endpoint - accepts BOTH JSON and plain text
app.post('/api/ea/update', (req, res) => {
  console.log('📥 Raw body type:', typeof req.body);
  console.log('📥 Raw body:', req.body);
  
  let balance = 0;
  let currency = 'USD';
  
  // Handle JSON
  if (typeof req.body === 'object' && req.body !== null) {
    balance = req.body.balance || 0;
    currency = req.body.currency || 'USD';
  }
  // Handle plain text/string
  else if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      balance = parsed.balance || 0;
      currency = parsed.currency || 'USD';
    } catch(e) {
      // If not JSON, try to extract numbers
      const match = req.body.match(/balance[:\s]*([0-9.]+)/);
      if (match) balance = parseFloat(match[1]);
    }
  }
  
  if (balance > 0) {
    currentBalance = balance;
    currentCurrency = currency;
    fs.writeFileSync(DATA_FILE, JSON.stringify({ balance, currency }));
    console.log(`💰 UPDATED: ${currency} ${balance}`);
    res.json({ success: true, balance });
  } else {
    console.log(`⚠️ No valid balance found`);
    res.json({ success: false, balance: currentBalance });
  }
});

// App endpoint
app.get('/api/live-data', (req, res) => {
  res.json({
    success: true,
    balance: currentBalance,
    currency: currentCurrency,
    lastUpdate: new Date()
  });
});

app.get('/api/status', (req, res) => {
  res.json({ running: true, balance: currentBalance, currency: currentCurrency });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}, balance: ${currentBalance}`));
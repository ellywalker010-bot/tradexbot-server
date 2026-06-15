const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
app.use(cors());
app.use(express.json());

// File to store data permanently
const DATA_FILE = 'balance.json';

// Load saved data from file
let currentBalance = 0;
let currentCurrency = 'USD';
let currentEquity = 0;

if (fs.existsSync(DATA_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    currentBalance = saved.balance || 0;
    currentCurrency = saved.currency || 'USD';
    currentEquity = saved.equity || 0;
    console.log(`📂 Loaded saved balance: ${currentCurrency} ${currentBalance}`);
  } catch(e) { console.log('No saved data'); }
}

// Save data to file
function saveData() {
  const data = { balance: currentBalance, equity: currentEquity, currency: currentCurrency, lastUpdate: new Date() };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`💾 Saved: ${currentCurrency} ${currentBalance}`);
}

// EA sends data here - THIS IS THE CRITICAL ENDPOINT
app.post('/api/ea/update', (req, res) => {
  console.log('📥 EA DATA RECEIVED:', req.body);
  
  if (req.body.balance !== undefined && req.body.balance > 0) {
    currentBalance = req.body.balance;
    currentEquity = req.body.equity || req.body.balance;
    currentCurrency = req.body.currency || 'USD';
    saveData();
    console.log(`💰✅ UPDATED TO: ${currentCurrency} ${currentBalance}`);
    res.json({ success: true, balance: currentBalance });
  } else {
    console.log('⚠️ Invalid data received');
    res.json({ success: false, error: 'Invalid data' });
  }
});

// App reads data here
app.get('/api/live-data', (req, res) => {
  console.log(`📤 Sending to app: ${currentCurrency} ${currentBalance}`);
  res.json({
    success: true,
    balance: currentBalance,
    equity: currentEquity,
    currency: currentCurrency,
    lastUpdate: new Date()
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    running: true, 
    balance: currentBalance,
    currency: currentCurrency
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Current balance: ${currentCurrency} ${currentBalance}`);
});
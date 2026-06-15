const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Global storage - one place for all data
let currentBalance = 0;
let currentCurrency = 'USD';
let currentEquity = 0;
let lastUpdate = null;

// EA sends data here
app.post('/api/ea/update', (req, res) => {
  console.log('📥 RAW BODY:', req.body);
  console.log('📥 Balance from request:', req.body.balance);
  
  if (req.body.balance !== undefined && req.body.balance > 0) {
    currentBalance = req.body.balance;
    currentEquity = req.body.equity || req.body.balance;
    currentCurrency = req.body.currency || 'USD';
    lastUpdate = new Date();
    console.log(`💰 UPDATED: ${currentCurrency} ${currentBalance}`);
  }
  
  res.json({ success: true, balance: currentBalance });
});

// App reads data here
app.get('/api/live-data', (req, res) => {
  console.log(`📤 Sending to app: ${currentCurrency} ${currentBalance}`);
  res.json({
    success: true,
    balance: currentBalance,
    equity: currentEquity,
    currency: currentCurrency,
    lastUpdate: lastUpdate
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    running: true, 
    balance: currentBalance,
    currency: currentCurrency,
    lastUpdate: lastUpdate
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
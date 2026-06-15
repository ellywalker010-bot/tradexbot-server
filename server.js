const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Global storage
let liveAccountData = {
  balance: 0,
  equity: 0,
  currency: 'USD',
  positions: [],
  lastUpdate: null
};

// EA sends data here
app.post('/api/ea/update', (req, res) => {
  console.log('📥 EA Data Received:', req.body);
  
  if (req.body.balance !== undefined) {
    liveAccountData.balance = req.body.balance;
    liveAccountData.equity = req.body.equity || req.body.balance;
    liveAccountData.currency = req.body.currency || 'USD';
    liveAccountData.lastUpdate = new Date();
    console.log(`💰 UPDATED: ${liveAccountData.currency} ${liveAccountData.balance}`);
  }
  
  res.json({ success: true, data: liveAccountData });
});

// App reads data here
app.get('/api/live-data', (req, res) => {
  console.log(`📤 Sending to app: ${liveAccountData.currency} ${liveAccountData.balance}`);
  res.json({
    success: true,
    balance: liveAccountData.balance,
    equity: liveAccountData.equity,
    currency: liveAccountData.currency,
    positions: liveAccountData.positions,
    lastUpdate: liveAccountData.lastUpdate
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    running: true, 
    balance: liveAccountData.balance,
    currency: liveAccountData.currency,
    lastUpdate: liveAccountData.lastUpdate
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
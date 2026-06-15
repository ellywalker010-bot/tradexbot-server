const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Global data storage - ONE place for all data
let liveAccountData = {
  balance: 0,
  equity: 0,
  currency: 'USD',
  positions: [],
  lastUpdate: null
};

// ============================================
// EA SENDS DATA HERE (No user ID needed)
// ============================================
app.post('/api/ea/update', (req, res) => {
  console.log('📥 EA Data Received:', req.body);
  
  if (req.body.balance !== undefined) {
    liveAccountData.balance = req.body.balance;
    liveAccountData.equity = req.body.equity || req.body.balance;
    liveAccountData.currency = req.body.currency || 'USD';
    liveAccountData.lastUpdate = new Date();
    console.log(`💰 Updated: ${liveAccountData.currency} ${liveAccountData.balance}`);
  }
  
  if (req.body.positions) {
    liveAccountData.positions = req.body.positions;
  }
  
  res.json({ success: true, data: liveAccountData });
});

// ============================================
// APP READS DATA HERE (No user ID needed)
// ============================================
app.get('/api/live-data', (req, res) => {
  res.json({
    success: true,
    balance: liveAccountData.balance,
    equity: liveAccountData.equity,
    currency: liveAccountData.currency,
    positions: liveAccountData.positions,
    lastUpdate: liveAccountData.lastUpdate
  });
});

// ============================================
// TEST ENDPOINT
// ============================================
app.get('/api/status', (req, res) => {
  res.json({ 
    running: true, 
    balance: liveAccountData.balance,
    currency: liveAccountData.currency
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║     🚀 TradeXbot Live Server Running             ║
║     Port: ${PORT}                                  ║
║     Endpoint: /api/live-data                     ║
║     EA Endpoint: /api/ea/update                  ║
╚══════════════════════════════════════════════════╝
  `);
});
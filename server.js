const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Global data storage - PERSISTENT
let liveAccountData = {
  balance: 0,
  equity: 0,
  currency: 'USD',
  positions: [],
  lastUpdate: null
};

// ============================================
// EA SENDS DATA HERE
// ============================================
app.post('/api/ea/update', (req, res) => {
  console.log('📥 EA Data Received:', req.body);
  
  // Update ALL fields
  if (req.body.balance !== undefined) {
    liveAccountData.balance = req.body.balance;
    liveAccountData.equity = req.body.equity || req.body.balance;
    liveAccountData.currency = req.body.currency || 'USD';
    liveAccountData.lastUpdate = new Date();
    console.log(`💰 UPDATED: ${liveAccountData.currency} ${liveAccountData.balance}`);
  }
  
  if (req.body.positions) {
    liveAccountData.positions = req.body.positions;
  }
  
  // Send back current data
  res.json({ success: true, data: liveAccountData });
});

// ============================================
// APP READS DATA HERE
// ============================================
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

// ============================================
// STATUS ENDPOINT
// ============================================
app.get('/api/status', (req, res) => {
  res.json({ 
    running: true, 
    balance: liveAccountData.balance,
    currency: liveAccountData.currency,
    lastUpdate: liveAccountData.lastUpdate
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║     🚀 TradeXbot Server Running                  ║
║     Port: ${PORT}                                  ║
║     Current Balance: ${liveAccountData.balance} ${liveAccountData.currency}
║     API: /api/live-data                         ║
╚══════════════════════════════════════════════════╝
  `);
});
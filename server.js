const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Store each user's data separately
const users = {};

// User connects their MT5 account
app.post('/api/connect', (req, res) => {
  const { userId, mt5Login, mt5Password, mt5Server } = req.body;
  
  // Create unique storage for this user
  users[userId] = {
    mt5Login,
    mt5Server,
    balance: 0,
    equity: 0,
    currency: 'USD',
    positions: [],
    trades: [],
    connectedAt: new Date()
  };
  
  console.log(`✅ User ${userId} connected (MT5: ${mt5Login})`);
  res.json({ success: true, userId });
});

// Get user's account data
app.get('/api/account/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (!user) {
    return res.json({ success: false, error: 'User not found' });
  }
  
  res.json({
    success: true,
    balance: user.balance,
    equity: user.equity,
    currency: user.currency,
    positions: user.positions,
    trades: user.trades
  });
});

// Update user's data (called by the user's app)
app.post('/api/update/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (user) {
    user.balance = req.body.balance || user.balance;
    user.equity = req.body.equity || user.equity;
    user.currency = req.body.currency || user.currency;
    user.positions = req.body.positions || user.positions;
    user.trades = req.body.trades || user.trades;
    console.log(`📊 Updated ${req.params.userId}: Balance ${user.currency} ${user.balance}`);
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// User updates their MT5 data (they send their real balance)
app.post('/api/sync/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (user) {
    user.balance = req.body.balance;
    user.equity = req.body.equity;
    user.currency = req.body.currency;
    console.log(`💰 User ${req.params.userId} balance updated to ${user.currency} ${user.balance}`);
    res.json({ success: true, balance: user.balance });
  } else {
    res.json({ success: false, error: 'User not found' });
  }
});
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║     TradeXbot Server Running                     ║
║     Port: ${PORT}                                ║
║     Users can now connect                        ║
╚══════════════════════════════════════════════════╝
  `);
});
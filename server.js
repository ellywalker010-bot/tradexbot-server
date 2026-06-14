const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Store users data
const users = {};

// Root route (working)
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'TradeXbot Server is running!',
    endpoints: ['/api/status', '/api/connect', '/api/account/:userId']
  });
});

// API Status endpoint (MISSING from your deployment)
app.get('/api/status', (req, res) => {
  res.json({ 
    running: true, 
    message: 'TradeXbot Server is running',
    activeUsers: Object.keys(users).length 
  });
});

// User connection endpoint
app.post('/api/connect', (req, res) => {
  const { userId, mt5Login, mt5Password, mt5Server } = req.body;
  users[userId] = {
    mt5Login,
    mt5Server,
    balance: 0,
    equity: 0,
    currency: 'USD',
    positions: [],
    connectedAt: new Date()
  };
  res.json({ success: true, userId });
});

// Get user account data
app.get('/api/account/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (!user) return res.json({ success: false, error: 'User not found' });
  res.json({ success: true, balance: user.balance, equity: user.equity, currency: user.currency });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`TradeXbot Server Running on port ${PORT}`);
});
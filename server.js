const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Store users data
const users = {};

// Root route
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'TradeXbot Server is running!',
    endpoints: ['/api/status', '/api/connect', '/api/account/:userId', '/api/sync/:userId']
  });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    running: true, 
    message: 'TradeXbot Server is running',
    activeUsers: Object.keys(users).length 
  });
});

// User registration/connection
app.post('/api/connect', (req, res) => {
  const { userId, mt5Login, mt5Password, mt5Server } = req.body;
  
  console.log(`📱 Registering user: ${userId}`);
  
  users[userId] = {
    mt5Login,
    mt5Server,
    balance: 0,
    equity: 0,
    currency: 'USD',
    positions: [],
    connectedAt: new Date()
  };
  
  res.json({ success: true, userId, message: 'User registered successfully' });
});

// Sync user balance (called after registration)
app.post('/api/sync/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (!user) {
    console.log(`❌ User not found: ${req.params.userId}`);
    return res.json({ success: false, error: 'User not found' });
  }
  
  user.balance = req.body.balance;
  user.equity = req.body.equity;
  user.currency = req.body.currency;
  
  console.log(`💰 User ${req.params.userId} balance updated to ${user.currency} ${user.balance}`);
  res.json({ success: true, balance: user.balance });
});

// Get user account data
app.get('/api/account/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (!user) {
    console.log(`❌ User not found: ${req.params.userId}`);
    return res.json({ success: false, error: 'User not found' });
  }
  
  res.json({
    success: true,
    balance: user.balance,
    equity: user.equity,
    currency: user.currency,
    positions: user.positions
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║     TradeXbot Server Running                     ║
║     Port: ${PORT}                                  ║
║     Users can now connect                        ║
╚══════════════════════════════════════════════════╝
  `);
});
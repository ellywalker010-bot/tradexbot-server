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



// Add after your existing code

// Store EA instances and trading status
const userEAs = {};

// Start EA for a user
app.post('/api/ea/:userId/start', (req, res) => {
  const user = users[req.params.userId];
  if (!user) {
    return res.json({ success: false, error: 'User not found' });
  }
  
  // Mark EA as running for this user
  user.eaRunning = true;
  userEAs[req.params.userId] = { status: 'running', startTime: new Date() };
  
  console.log(`🤖 EA STARTED for user ${req.params.userId} (MT5: ${user.mt5Login})`);
  
  // Here your actual EA would start trading on user's account
  // For now, we'll simulate trading
  
  res.json({ success: true, message: 'EA started', eaRunning: true });
});

// Stop EA for a user
app.post('/api/ea/:userId/stop', (req, res) => {
  const user = users[req.params.userId];
  if (!user) {
    return res.json({ success: false, error: 'User not found' });
  }
  
  user.eaRunning = false;
  delete userEAs[req.params.userId];
  
  console.log(`🛑 EA STOPPED for user ${req.params.userId}`);
  
  res.json({ success: true, message: 'EA stopped', eaRunning: false });
});

// Get EA status
app.get('/api/ea/:userId/status', (req, res) => {
  const user = users[req.params.userId];
  if (!user) {
    return res.json({ success: false, error: 'User not found' });
  }
  
  res.json({
    success: true,
    eaRunning: user.eaRunning || false,
    lastUpdate: user.lastTradeTime || null
  });
});

// Simulate trading (would be your actual EA logic)
function simulateTrading(userId) {
  const user = users[userId];
  if (!user || !user.eaRunning) return;
  
  // Simulate a trade (in real app, this would connect to MT5)
  const profit = (Math.random() * 50 - 25).toFixed(2);
  user.balance += parseFloat(profit);
  user.equity = user.balance;
  user.lastTradeTime = new Date();
  
  console.log(`💰 User ${userId} trade: ${profit > 0 ? '+' : ''}$${profit}`);
  
  // Simulate next trade in 30-60 seconds
  setTimeout(() => simulateTrading(userId), Math.random() * 30000 + 30000);
}

// Start simulated trading when EA starts (temporary for demo)
// In real app, this would be your actual EA




// Get trading signal for EA
app.get('/api/signal/:userId', (req, res) => {
  const user = users[req.params.userId];
  // Your trading logic here
  const signal = Math.random() > 0.5 ? "BUY" : "SELL";
  res.json({ signal: signal, confidence: 75 });
});

// Receive trade notifications from EA
app.post('/api/trade/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (user) {
    user.lastTrade = req.body;
    console.log(`📊 New trade for ${req.params.userId}:`, req.body);
  }
  res.json({ success: true });
});





// Add this to your server.js
// Add to server.js
app.post('/api/ea/:userId/status', (req, res) => {
  const user = users[req.params.userId];
  if (user) {
    user.lastUpdate = new Date();
    user.eaRunning = req.body.running || false;
    console.log(`🤖 EA status update from ${req.params.userId}`);
    res.json({ success: true });
  } else {
    // Auto-register the user if EA sends data
    users[req.params.userId] = {
      mt5Login: 'EA_User',
      mt5Server: 'EA_Server',
      balance: req.body.balance || 0,
      equity: req.body.equity || 0,
      currency: 'USD',
      positions: [],
      connectedAt: new Date(),
      eaRunning: true
    };
    console.log(`✅ Auto-registered user ${req.params.userId} from EA`);
    res.json({ success: true });
  }
});

app.post('/api/update/:userId', (req, res) => {
  console.log(`💰 Balance update from ${req.params.userId}:`, req.body);
  const user = users[req.params.userId];
  if (user) {
    user.balance = req.body.balance;
    user.equity = req.body.equity;
  }
  res.json({ success: true });
});

app.post('/api/trade/:userId', (req, res) => {
  console.log(`📊 Trade from ${req.params.userId}:`, req.body);
  res.json({ success: true });
});



// Add to server.js

// Receive positions from EA
app.post('/api/positions/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (user) {
    user.positions = req.body;
    console.log(`📊 Positions updated for ${req.params.userId}: ${req.body.length} positions`);
  }
  res.json({ success: true });
});

// Receive balance from EA
app.post('/api/sync/:userId', (req, res) => {
  let user = users[req.params.userId];
  
  // Auto-create user if doesn't exist
  if (!user) {
    user = {
      mt5Login: 'EA_User',
      mt5Server: 'EA_Server',
      balance: req.body.balance,
      equity: req.body.equity,
      currency: req.body.currency,
      positions: [],
      connectedAt: new Date()
    };
    users[req.params.userId] = user;
    console.log(`✅ Auto-created user ${req.params.userId} from EA`);
  } else {
    user.balance = req.body.balance;
    user.equity = req.body.equity;
    user.currency = req.body.currency;
  }
  
  console.log(`💰 Balance updated for ${req.params.userId}: ${user.currency} ${user.balance}`);
  res.json({ success: true });
});
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// PERSISTENT STORAGE - Save users to file
// ============================================
const USERS_FILE = 'users.json';

// Load users from file on startup
let users = {};
if (fs.existsSync(USERS_FILE)) {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    users = JSON.parse(data);
    console.log(`✅ Loaded ${Object.keys(users).length} users from file`);
  } catch(e) { 
    console.log('Error loading users, starting fresh');
  }
}

// Save users to file
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`💾 Saved ${Object.keys(users).length} users to file`);
  } catch(e) {
    console.log('Error saving users:', e.message);
  }
}

// ============================================
// GLOBAL DATA (NO USER ID NEEDED)
// ============================================
let globalBalance = 0;
let globalEquity = 0;
let globalCurrency = 'USD';
let globalPositions = [];
let globalLastUpdate = null;

// EA sends data here (no user ID required)
app.post('/api/ea/update', (req, res) => {
  if (req.body.balance !== undefined) globalBalance = req.body.balance;
  if (req.body.equity !== undefined) globalEquity = req.body.equity;
  if (req.body.currency !== undefined) globalCurrency = req.body.currency;
  if (req.body.positions !== undefined) globalPositions = req.body.positions;
  globalLastUpdate = new Date();
  
  console.log(`💰 EA Updated: ${globalCurrency} ${globalBalance}`);
  res.json({ success: true });
});

// App reads from here (no user ID required)
app.get('/api/global/account', (req, res) => {
  res.json({
    success: true,
    balance: globalBalance,
    equity: globalEquity,
    currency: globalCurrency,
    positions: globalPositions,
    lastUpdate: globalLastUpdate
  });
});

// ============================================
// ROOT ROUTE
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'TradeXbot Server is running!',
    endpoints: [
      '/api/status',
      '/api/global/account (NO USER ID NEEDED)',
      '/api/ea/update (EA sends here)'
    ]
  });
});

// ============================================
// STATUS ENDPOINT
// ============================================
app.get('/api/status', (req, res) => {
  res.json({ 
    running: true, 
    message: 'TradeXbot Server is running',
    activeUsers: Object.keys(users).length,
    globalBalance: globalBalance,
    globalCurrency: globalCurrency
  });
});

// ============================================
// USER REGISTRATION (Keep for backward compatibility)
// ============================================
app.post('/api/connect', (req, res) => {
  const { userId, mt5Login, mt5Password, mt5Server } = req.body;
  
  if (users[userId]) {
    console.log(`♻️ User already exists: ${userId}`);
    users[userId].mt5Login = mt5Login;
    users[userId].mt5Server = mt5Server;
    users[userId].lastActive = new Date();
  } else {
    console.log(`📱 Registering new user: ${userId}`);
    users[userId] = {
      mt5Login,
      mt5Server,
      balance: 0,
      equity: 0,
      currency: 'USD',
      positions: [],
      trades: [],
      eaRunning: false,
      connectedAt: new Date(),
      lastActive: new Date()
    };
  }
  
  saveUsers();
  res.json({ success: true, userId, message: 'User registered successfully' });
});

// ============================================
// SYNC BALANCE (EA to Server) - Keep for backward compatibility
// ============================================
app.post('/api/sync/:userId', (req, res) => {
  let user = users[req.params.userId];
  const userId = req.params.userId;
  
  if (!user) {
    console.log(`🆕 Auto-creating user from EA: ${userId}`);
    user = {
      mt5Login: 'EA_User',
      mt5Server: 'EA_Server',
      balance: req.body.balance || 0,
      equity: req.body.equity || 0,
      currency: req.body.currency || 'USD',
      positions: [],
      trades: [],
      eaRunning: true,
      connectedAt: new Date(),
      lastActive: new Date(),
      source: 'EA'
    };
    users[userId] = user;
  }
  
  if (req.body.balance !== undefined) user.balance = req.body.balance;
  if (req.body.equity !== undefined) user.equity = req.body.equity;
  if (req.body.currency !== undefined) user.currency = req.body.currency;
  user.lastActive = new Date();
  
  console.log(`💰 Balance updated for ${userId}: ${user.currency} ${user.balance}`);
  saveUsers();
  res.json({ success: true, balance: user.balance });
});

// ============================================
// GET USER ACCOUNT DATA - Keep for backward compatibility
// ============================================
app.get('/api/account/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (!user) {
    console.log(`❌ User not found: ${req.params.userId}`);
    return res.json({ success: false, error: 'User not found', balance: 0, equity: 0, currency: 'USD' });
  }
  
  res.json({
    success: true,
    balance: user.balance,
    equity: user.equity,
    currency: user.currency,
    positions: user.positions || [],
    trades: user.trades || []
  });
});

// ============================================
// UPDATE POSITIONS (from EA)
// ============================================
app.post('/api/positions/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (user) {
    user.positions = req.body;
    console.log(`📊 Positions updated for ${req.params.userId}: ${Array.isArray(req.body) ? req.body.length : 0} positions`);
    saveUsers();
  }
  res.json({ success: true });
});

// ============================================
// RECEIVE TRADE NOTIFICATIONS
// ============================================
app.post('/api/trade/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (user) {
    if (!user.trades) user.trades = [];
    user.trades.unshift({
      ...req.body,
      receivedAt: new Date()
    });
    if (user.trades.length > 100) user.trades = user.trades.slice(0, 100);
    console.log(`📊 New trade for ${req.params.userId}: ${req.body.type || 'unknown'}`);
    saveUsers();
  }
  res.json({ success: true });
});

// ============================================
// EA CONTROL (Start/Stop)
// ============================================
const userEAs = {};

app.post('/api/ea/:userId/start', (req, res) => {
  const user = users[req.params.userId];
  if (!user) {
    return res.json({ success: false, error: 'User not found' });
  }
  
  user.eaRunning = true;
  userEAs[req.params.userId] = { status: 'running', startTime: new Date() };
  
  console.log(`🤖 EA STARTED for user ${req.params.userId}`);
  saveUsers();
  res.json({ success: true, message: 'EA started', eaRunning: true });
});

app.post('/api/ea/:userId/stop', (req, res) => {
  const user = users[req.params.userId];
  if (!user) {
    return res.json({ success: false, error: 'User not found' });
  }
  
  user.eaRunning = false;
  delete userEAs[req.params.userId];
  
  console.log(`🛑 EA STOPPED for user ${req.params.userId}`);
  saveUsers();
  res.json({ success: true, message: 'EA stopped', eaRunning: false });
});

app.get('/api/ea/:userId/status', (req, res) => {
  const user = users[req.params.userId];
  if (!user) {
    return res.json({ success: false, eaRunning: false, error: 'User not found' });
  }
  
  res.json({
    success: true,
    eaRunning: user.eaRunning || false,
    lastUpdate: user.lastActive || null
  });
});

// EA Status Update (from EA)
app.post('/api/ea/:userId/status', (req, res) => {
  const user = users[req.params.userId];
  if (user) {
    user.lastActive = new Date();
    if (req.body.running !== undefined) user.eaRunning = req.body.running;
    console.log(`🤖 EA status update from ${req.params.userId}, running: ${user.eaRunning}`);
    saveUsers();
    res.json({ success: true });
  } else {
    users[req.params.userId] = {
      mt5Login: 'EA_User',
      mt5Server: 'EA_Server',
      balance: req.body.balance || 0,
      equity: req.body.equity || 0,
      currency: 'USD',
      positions: [],
      trades: [],
      eaRunning: req.body.running || true,
      connectedAt: new Date(),
      lastActive: new Date(),
      source: 'EA'
    };
    saveUsers();
    console.log(`✅ Auto-registered user ${req.params.userId} from EA`);
    res.json({ success: true });
  }
});

// ============================================
// SIGNAL GENERATION (for EA)
// ============================================
app.get('/api/signal/:userId', (req, res) => {
  const signal = Math.random() > 0.5 ? "BUY" : "SELL";
  const confidence = Math.floor(Math.random() * 30) + 60;
  res.json({ signal: signal, confidence: confidence });
});

// ============================================
// UPDATE USER DATA (from App)
// ============================================
app.post('/api/update/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (user) {
    if (req.body.balance !== undefined) user.balance = req.body.balance;
    if (req.body.equity !== undefined) user.equity = req.body.equity;
    if (req.body.currency !== undefined) user.currency = req.body.currency;
    console.log(`📝 User ${req.params.userId} updated: balance ${user.currency} ${user.balance}`);
    saveUsers();
  }
  res.json({ success: true });
});

// ============================================
// START SERVER
// ============================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║     🚀 TradeXbot Server Running                  ║
║     Port: ${PORT}                                  ║
║     Global Balance: ${globalBalance} ${globalCurrency}   ║
║     Users in DB: ${Object.keys(users).length}      ║
║     Data persistence: ENABLED ✅                  ║
╚══════════════════════════════════════════════════╝
  `);
});
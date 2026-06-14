const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
app.use(cors());
app.use(express.json());

// Add raw body parsing for debugging
app.use(express.raw({ type: 'application/json', limit: '10mb' }));

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

// EA sends data here (no user ID required) - WITH BETTER ERROR HANDLING
app.post('/api/ea/update', (req, res) => {
  console.log('📥 Raw body received:', req.body);
  
  // Handle both JSON and text/plain
  let balance = 0, equity = 0, currency = 'USD';
  
  if (typeof req.body === 'object' && req.body !== null) {
    balance = req.body.balance || 0;
    equity = req.body.equity || 0;
    currency = req.body.currency || 'USD';
  }
  
  if (balance > 0 || req.body.balance) {
    globalBalance = balance;
    globalEquity = equity;
    globalCurrency = currency;
    globalLastUpdate = new Date();
    console.log(`💰 EA Updated: ${globalCurrency} ${globalBalance}`);
    res.json({ success: true, message: 'Balance updated' });
  } else {
    console.log('⚠️ Invalid data received from EA');
    res.json({ success: false, message: 'Invalid data' });
  }
});

// Alternative endpoint for text/plain
app.post('/api/ea/update/text', (req, res) => {
  console.log('📥 Raw text:', req.body);
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

// Test endpoint for EA
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is reachable' });
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
      '/api/test - Test if server is reachable',
      '/api/global/account - Get global balance',
      '/api/ea/update - EA sends balance here',
      '/api/ea/update/text - Alternative text endpoint'
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
// START SERVER
// ============================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║     🚀 TradeXbot Server Running                  ║
║     Port: ${PORT}                                  ║
║     Global Balance: ${globalBalance} ${globalCurrency}   ║
║     Test URL: https://tradexbot-server.onrender.com/api/test
║     EA Endpoint: https://tradexbot-server.onrender.com/api/ea/update
╚══════════════════════════════════════════════════╝
  `);
});
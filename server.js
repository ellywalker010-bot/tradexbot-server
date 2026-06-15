const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Simple storage
let currentBalance = 0;
let currentCurrency = 'USD';

// EA sends data here
app.post('/api/ea/update', (req, res) => {
  console.log('📥 EA Data:', req.body);
  
  const balance = req.body.balance;
  if (balance && balance > 0) {
    currentBalance = balance;
    currentCurrency = req.body.currency || 'USD';
    console.log(`✅ Balance updated to: ${currentCurrency} ${currentBalance}`);
    res.status(200).json({ success: true, balance: currentBalance });
  } else {
    res.status(200).json({ success: false, message: 'No balance received' });
  }
});

// App reads data here
app.get('/api/live-data', (req, res) => {
  res.json({
    success: true,
    balance: currentBalance,
    currency: currentCurrency,
    lastUpdate: new Date()
  });
});

// Status check
app.get('/api/status', (req, res) => {
  res.json({ running: true, balance: currentBalance, currency: currentCurrency });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Current balance: ${currentCurrency} ${currentBalance}`);
});
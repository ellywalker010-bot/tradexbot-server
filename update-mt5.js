// C:\tradexbot-server\update-mt5.js
// Run this manually to update your account data
const axios = require('axios');

// Update with your actual MT5 data
const accountData = {
  balance: 275830,
  equity: 275830,
  positions: [
    { symbol: 'EURUSD', volume: 0.5, profit: 45 },
    { symbol: 'GBPUSD', volume: 0.3, profit: -12 }
  ]
};

axios.post('http://localhost:3000/api/update', accountData)
  .then(() => console.log('✅ Account data updated'))
  .catch(err => console.error('❌ Error:', err.message));
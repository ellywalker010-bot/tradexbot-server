const axios = require('axios');

// Update with your actual MT5 account info
const accountData = {
  balance: 275830,  // Your actual balance
  equity: 275830,
  positions: [
    { symbol: 'EURUSD', volume: 0.5, profit: 45 },
    { symbol: 'GBPUSD', volume: 0.3, profit: -12 }
  ]
};

axios.post('http://localhost:3000/api/update', accountData)
  .then(() => console.log('✅ Account data updated!'))
  .catch(err => console.error('❌ Error:', err.message));
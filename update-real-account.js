// update-real-account.js
// Run this with your actual MT5 account data
const axios = require('axios');

// YOUR ACTUAL EXNESS ACCOUNT DATA (replace with your real numbers)
const userId = 'user_1781436211495_gtttuahhb'; // Your user ID from the logs

const accountData = {
  balance: 275830,     // YOUR REAL BALANCE
  equity: 275830,      // YOUR REAL EQUITY
  margin: 0,
  freeMargin: 275830,
  marginLevel: 0,
  currency: 'UGX',
  positions: [
    // Add any open positions if you have them
    // { symbol: 'EURUSD', type: 'buy', volume: 0.5, open_price: 1.09250, current_price: 1.09300, profit: 25 }
  ],
  trades: []
};

async function updateAccount() {
  try {
    const response = await axios.post(`http://localhost:3000/api/update/${userId}`, accountData);
    console.log('✅ Account updated:', response.data);
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  }
}

updateAccount();
import api from './axios';

export const marketApi = {
  // Get all market data (crypto, forex, commodities)
  getAll: () => api.get('/market/all'),

  // Crypto prices (BTC, ETH, etc.)
  getCrypto: () => api.get('/market/crypto'),

  // Forex rates (USD/VND, EUR/VND)
  getForex: () => api.get('/market/forex'),

  // Commodity prices (gold, silver, oil)
  getCommodities: () => api.get('/market/commodities'),

  // Fuel prices
  getFuel: () => api.get('/market/fuel'),

  // Refresh/force update
  refresh: () => api.post('/market/refresh'),
};

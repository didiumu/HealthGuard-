// API Configuration
const API_CONFIG = {
  // Backend URL - can be overridden by environment variable
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  // API endpoints
  ENDPOINTS: {
    CHECK_SYMPTOMS: '/check-symptoms',
    ASSESSMENTS: '/assessments',
    HEALTH: '/'
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
  
  // Default headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export default API_CONFIG;
// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Custom error classes
export class APIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.response = response;
  }
}

export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Utility function to create fetch with timeout
const fetchWithTimeout = (url, options = {}, timeout = API_CONFIG.TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new TimeoutError('Request timeout')), timeout)
    )
  ]);
};

// Utility function for retry logic
const retryFetch = async (url, options, attempts = API_CONFIG.RETRY_ATTEMPTS) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      if (i === attempts - 1) throw error;
      if (error instanceof TimeoutError || error.name === 'TypeError') {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (i + 1)));
        continue;
      }
      throw error;
    }
  }
};

// Base API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await retryFetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorData = null;
      
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
      }
      
      throw new APIError(errorMessage, response.status, errorData);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      return data;
    }
    
    return await response.text();
    
  } catch (error) {
    console.error('❌ API Error:', error);
    
    if (error instanceof APIError || error instanceof TimeoutError) {
      throw error;
    }
    
    // Network or other fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new NetworkError('Unable to connect to server. Please check your internet connection.');
    }
    
    throw new NetworkError(`Network error: ${error.message}`);
  }
};

// API service methods
export const apiService = {
  // Health check
  healthCheck: async () => {
    return await apiRequest('/health');
  },

  // Check symptoms and get risk assessment
  checkSymptoms: async (symptoms) => {
    // Validation
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      throw new Error('Symptoms array is required and cannot be empty');
    }

    if (symptoms.length > 10) {
      throw new Error('Maximum 10 symptoms allowed');
    }

    // Valid symptoms list
    const validSymptoms = ['fever', 'cough', 'headache', 'fatigue', 'breathing'];
    const invalidSymptoms = symptoms.filter(symptom => !validSymptoms.includes(symptom));
    
    if (invalidSymptoms.length > 0) {
      throw new Error(`Invalid symptoms: ${invalidSymptoms.join(', ')}`);
    }

    const response = await apiRequest('/check-symptoms', {
      method: 'POST',
      body: JSON.stringify({ symptoms })
    });
    
    // Validate response structure
    if (!response.score || !response.riskLevel || !response.recommendation) {
      throw new APIError('Invalid response format from server', 500, response);
    }
    
    return response;
  }
};

export default apiService;
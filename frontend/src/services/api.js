import API_CONFIG from '../config/api';

// Custom error classes for better error handling
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

// Create fetch with timeout
const fetchWithTimeout = (url, options = {}, timeout = API_CONFIG.TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new TimeoutError('Request timeout')), timeout)
    )
  ]);
};

// Base API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      ...API_CONFIG.HEADERS,
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetchWithTimeout(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new APIError(
        `API Error: ${response.status} ${response.statusText}`,
        response.status,
        errorText
      );
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
    
  } catch (error) {
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
  // Check symptoms and get risk assessment
  checkSymptoms: async (symptoms, patientName = null) => {
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      throw new Error('Symptoms array is required and cannot be empty');
    }
    
    const payload = { symptoms };
    if (patientName && patientName.trim()) {
      payload.name = patientName.trim();
    }
    
    const response = await apiRequest(API_CONFIG.ENDPOINTS.CHECK_SYMPTOMS, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    // Validate response structure
    if (!response.risk || typeof response.normalizedScore !== 'number') {
      throw new APIError('Invalid response format from server', 500, response);
    }
    
    return response;
  },
  
  // Get all patient assessments
  getAssessments: async () => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.ASSESSMENTS);
    
    if (!Array.isArray(response)) {
      throw new APIError('Invalid assessments response format', 500, response);
    }
    
    return response;
  },
  
  // Health check
  healthCheck: async () => {
    return await apiRequest(API_CONFIG.ENDPOINTS.HEALTH);
  }
};

export default apiService;
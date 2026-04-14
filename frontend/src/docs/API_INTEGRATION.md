# API Integration Guide

## CORS Configuration

The backend already includes CORS middleware (`cors()`) which allows cross-origin requests from the frontend. This handles:

- Preflight OPTIONS requests
- Cross-origin GET/POST requests
- Headers like Content-Type and Accept

## Environment Configuration

### Development
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:5000`
- CORS allows all origins in development

### Production
Set the `REACT_APP_API_URL` environment variable:

```bash
# For production deployment
REACT_APP_API_URL=https://your-backend-domain.com
```

## API Service Features

### Error Handling
- **NetworkError**: Connection issues, offline status
- **TimeoutError**: Request timeout (10 seconds default)
- **APIError**: HTTP errors with status codes

### Request Configuration
- Automatic JSON parsing
- Request timeout protection
- Centralized error handling
- Response validation

### Usage Examples

```javascript
import apiService from './services/api';

// Check symptoms
try {
  const result = await apiService.checkSymptoms(['fever', 'cough'], 'John Doe');
  console.log(result); // { risk: 'high', normalizedScore: 75, ... }
} catch (error) {
  // Handle specific error types
}

// Get assessments
const assessments = await apiService.getAssessments();
```

## Deployment Checklist

1. ✅ Set `REACT_APP_API_URL` environment variable
2. ✅ Ensure backend CORS is configured for production domain
3. ✅ Test API connectivity in production environment
4. ✅ Monitor error logs for API failures
5. ✅ Verify timeout settings are appropriate for network conditions
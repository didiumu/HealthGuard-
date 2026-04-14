const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:80',
    'http://localhost',
    'http://frontend:80',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HealthGuard API',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'HealthGuard API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      checkSymptoms: 'POST /check-symptoms'
    }
  });
});

// Risk calculation function
function calculateRisk(symptoms) {
  const symptomCount = symptoms.length;
  let score, riskLevel, recommendation;

  if (symptomCount === 1) {
    // Low risk: 0-30
    score = Math.floor(Math.random() * 31); // 0-30
    riskLevel = 'Low';
    recommendation = 'Your symptoms appear mild. Rest, stay hydrated, and monitor your condition. Consider consulting a healthcare provider if symptoms worsen.';
  } else if (symptomCount >= 2 && symptomCount <= 3) {
    // Medium risk: 30-70
    score = Math.floor(Math.random() * 41) + 30; // 30-70
    riskLevel = 'Medium';
    recommendation = 'Monitor your symptoms closely and consult a healthcare provider if they worsen or persist. Consider seeking medical attention if you develop additional symptoms.';
  } else {
    // High risk: 70-100
    score = Math.floor(Math.random() * 31) + 70; // 70-100
    riskLevel = 'High';
    recommendation = 'Please seek medical attention immediately. Your symptoms indicate a high risk level that requires professional medical evaluation.';
  }

  return { score, riskLevel, recommendation };
}

// Main symptom checking endpoint
app.post('/check-symptoms', (req, res) => {
  try {
    const { symptoms } = req.body;

    // Validation
    if (!symptoms) {
      return res.status(400).json({
        error: 'Missing required field: symptoms',
        message: 'Please provide a symptoms array'
      });
    }

    if (!Array.isArray(symptoms)) {
      return res.status(400).json({
        error: 'Invalid data type',
        message: 'Symptoms must be an array'
      });
    }

    if (symptoms.length === 0) {
      return res.status(400).json({
        error: 'Empty symptoms array',
        message: 'Please provide at least one symptom'
      });
    }

    if (symptoms.length > 10) {
      return res.status(400).json({
        error: 'Too many symptoms',
        message: 'Maximum 10 symptoms allowed'
      });
    }

    // Validate symptom types
    const validSymptoms = ['fever', 'cough', 'headache', 'fatigue', 'breathing'];
    const invalidSymptoms = symptoms.filter(symptom => 
      typeof symptom !== 'string' || !validSymptoms.includes(symptom.toLowerCase())
    );

    if (invalidSymptoms.length > 0) {
      return res.status(400).json({
        error: 'Invalid symptoms',
        message: `Invalid symptoms: ${invalidSymptoms.join(', ')}. Valid symptoms are: ${validSymptoms.join(', ')}`
      });
    }

    // Calculate risk
    const result = calculateRisk(symptoms);

    // Log the assessment
    console.log(`Assessment completed: ${symptoms.length} symptoms, ${result.riskLevel} risk (${result.score})`);

    // Return response
    res.json({
      score: result.score,
      riskLevel: result.riskLevel,
      recommendation: result.recommendation,
      symptomsAnalyzed: symptoms.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing symptom check:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while processing your request'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on our end'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 HealthGuard API Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
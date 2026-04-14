# HealthGuard - Complete Setup Instructions

## 🚀 Quick Start (Docker - Recommended)

### Prerequisites
- Docker Desktop installed and running
- Git (optional, for cloning)

### 1. Navigate to Project Directory
```bash
cd healthguard-demo
```

### 2. Build and Start Services
```bash
# Build and start both frontend and backend
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### 4. Test the Application
1. Open http://localhost:3000 in your browser
2. Select one or more symptoms (fever, cough, headache, fatigue, breathing)
3. Click "Analyze Risk"
4. View the risk assessment results

### 5. Stop Services
```bash
docker-compose down
```

---

## 🛠 Manual Development Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

4. **Verify backend is running**
   - Visit: http://localhost:5000
   - Health check: http://localhost:5000/health

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Visit: http://localhost:3000

---

## 🧪 Testing the API

### Using curl
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test symptom assessment
curl -X POST http://localhost:5000/check-symptoms \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["fever", "cough"]}'
```

### Expected Response
```json
{
  "score": 45,
  "riskLevel": "Medium",
  "recommendation": "Monitor your symptoms closely and consult a healthcare provider if they worsen or persist.",
  "symptomsAnalyzed": 2,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📋 Risk Calculation Logic

The backend calculates risk based on symptom count:

- **1 symptom**: Low risk (0-30 score)
- **2-3 symptoms**: Medium risk (30-70 score)  
- **4+ symptoms**: High risk (70-100 score)

Valid symptoms: `fever`, `cough`, `headache`, `fatigue`, `breathing`

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
```

**Frontend**
```
REACT_APP_API_URL=http://localhost:5000
```

### Docker Configuration
- Backend runs on port 5000
- Frontend runs on port 3000 (mapped to 80 in container)
- Services communicate via Docker network

---

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on ports 3000 or 5000
   npx kill-port 3000 5000
   ```

2. **Docker build fails**
   ```bash
   # Clean Docker cache
   docker system prune -a
   docker-compose build --no-cache
   ```

3. **CORS errors**
   - Ensure backend CORS is configured for frontend URL
   - Check that both services are running

4. **API connection fails**
   - Verify backend is running on port 5000
   - Check `REACT_APP_API_URL` environment variable
   - Test backend health endpoint

### Logs
```bash
# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
```

---

## 🏗 Project Structure

```
healthguard-demo/
├── backend/
│   ├── server.js          # Main backend server
│   ├── package.json       # Backend dependencies
│   └── Dockerfile         # Backend container config
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styles
│   │   └── services/
│   │       └── apiService.js  # API integration
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   ├── Dockerfile         # Frontend container config
│   └── nginx.conf         # Nginx configuration
├── docker-compose.yml     # Docker orchestration
└── .env                   # Environment variables
```

---

## 🎯 Production Deployment

### For Production
1. Update `REACT_APP_API_URL` to your production backend URL
2. Configure proper CORS origins in backend
3. Use environment-specific Docker Compose files
4. Set up proper SSL/TLS certificates
5. Configure monitoring and logging

### Security Considerations
- Backend includes rate limiting and security headers
- Frontend uses Nginx with security headers
- Both services run as non-root users in containers
- Input validation on all API endpoints

---

## ✅ Verification Checklist

- [ ] Backend starts successfully on port 5000
- [ ] Frontend starts successfully on port 3000
- [ ] Health check endpoints respond correctly
- [ ] Symptom selection works in UI
- [ ] Risk analysis button triggers API call
- [ ] Results display correctly with score and recommendation
- [ ] Error handling works when backend is down
- [ ] Docker containers build and run successfully
- [ ] CORS is properly configured

---

**🎉 Your HealthGuard application is now ready for production!**
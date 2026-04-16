@echo off
echo Testing HealthGuard Application...
echo.

echo 1. Starting Backend Server...
start "HealthGuard Backend" cmd /k "cd backend && npm start"

echo 2. Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo 3. Testing backend health check...
curl -s http://localhost:5000/health
echo.

echo 4. Starting Frontend Server...
start "HealthGuard Frontend" cmd /k "cd frontend && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to continue...
pause > nul
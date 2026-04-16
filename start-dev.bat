@echo off
echo Starting HealthGuard Development Environment...
echo.

echo Installing dependencies if needed...
call npm install
cd backend && call npm install
cd ../frontend && call npm install
cd ..

echo.
echo Starting both frontend and backend servers...
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

npm run dev
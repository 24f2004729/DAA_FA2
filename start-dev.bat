@echo off
echo ============================================
echo   BANK-OPT Algorithm Laboratory
echo   Starting development servers...
echo ============================================
echo.

REM Start backend server in new window
echo Starting backend server (http://localhost:3001)...
start "BANK-OPT Backend" cmd /k "node_modules\.bin\ts-node --project server\tsconfig.json server\src\index.ts"

REM Wait 2 seconds
timeout /t 2 /nobreak > nul

REM Start frontend dev server in new window
echo Starting frontend dev server (http://localhost:5173)...
start "BANK-OPT Frontend" cmd /k "cd client && ..\node_modules\.bin\vite --host"

echo.
echo Both servers are starting...
echo.
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:3001
echo  API Test: http://localhost:3001/api/algorithms
echo.
echo Press any key to exit this window (servers keep running in their windows)
pause > nul

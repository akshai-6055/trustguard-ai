@echo off
start /b node db_helper.js > db_helper.log 2>&1
timeout /t 2 /nobreak > nul

npx newman run TrustGuard.postman_collection.json -e TrustGuard.postman_environment.json --reporters cli,htmlextra,json --reporter-htmlextra-export reports/run.html --reporter-json-export results/run.json

for /f "tokens=5" %%a in ('netstat -aon ^| find "LISTENING" ^| findstr :5001') do taskkill /F /PID %%a > nul 2>&1

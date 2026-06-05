@echo off
echo ============================================
echo   ScreenAI – AI Candidate Screening
echo ============================================

echo [1/4] Setting up backend...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate

pip install -r requirements.txt -q

if not exist .env (
    copy .env.example .env
    echo WARNING: Created backend\.env – add your ANTHROPIC_API_KEY or OPENAI_API_KEY
)

if not exist data\books mkdir data\books
if not exist uploads mkdir uploads
if not exist chroma_db mkdir chroma_db

echo [2/4] Setting up frontend...
cd ..\frontend
npm install --silent

echo [3/4] Starting backend on port 8000...
cd ..\backend
start /B uvicorn app.main:app --reload --port 8000

timeout /t 5 /nobreak > nul

echo [4/4] Starting frontend on port 3000...
cd ..\frontend
start /B npm run dev

echo.
echo ============================================
echo   System is running!
echo   Frontend  -^> http://localhost:3000
echo   Backend   -^> http://localhost:8000
echo   API docs  -^> http://localhost:8000/docs
echo ============================================
echo.
echo Press any key to stop all services...
pause > nul

taskkill /F /IM uvicorn.exe 2>nul
taskkill /F /IM node.exe    2>nul
echo Services stopped.

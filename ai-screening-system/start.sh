#!/bin/bash
# ============================================================
#  AI Screening System – Quick Start (Linux / macOS)
# ============================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   ScreenAI – AI Candidate Screening       ${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Prerequisite checks
command -v python3 &>/dev/null || { echo -e "${RED}Python 3 is required.${NC}"; exit 1; }
command -v node   &>/dev/null || { echo -e "${RED}Node.js is required.${NC}";   exit 1; }

# Backend
echo -e "${GREEN}[1/4] Setting up backend…${NC}"
cd backend

[ ! -d "venv" ] && python3 -m venv venv

# shellcheck disable=SC1091
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠  Created backend/.env – add your ANTHROPIC_API_KEY or OPENAI_API_KEY${NC}"
fi

mkdir -p data/books uploads chroma_db

# Frontend
echo -e "${GREEN}[2/4] Setting up frontend…${NC}"
cd ../frontend
npm install --silent

# Start backend
echo -e "${GREEN}[3/4] Starting backend on :8000…${NC}"
cd ../backend
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo -n "Waiting for backend"
for i in $(seq 1 20); do
  sleep 1
  curl -sf http://localhost:8000/health >/dev/null && break
  echo -n "."
done
echo ""

# Start frontend
echo -e "${GREEN}[4/4] Starting frontend on :3000…${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✅  System is running!${NC}"
echo -e "   Frontend  → http://localhost:3000"
echo -e "   Backend   → http://localhost:8000"
echo -e "   API docs  → http://localhost:8000/docs"
echo -e "   Health    → http://localhost:8000/health"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup on exit
trap "echo ''; echo 'Stopping services…'; kill \$BACKEND_PID \$FRONTEND_PID 2>/dev/null; echo 'Done.'" INT TERM
wait

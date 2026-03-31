#!/bin/bash

# TradeLens Unified Startup Script
# This script starts the Backend, Frontend, and Chatbot (Streamlit)

PROJECT_ROOT=$(pwd)

echo "🚀 Starting TradeLens Workspace..."

# 1. Clear existing ports
echo "🧹 Clearing existing processes on ports 3000, 5000, 8501..."
lsof -t -i:3000,5000,8501 | xargs kill -9 2>/dev/null || true
pkill -f "python3.*backend/app.py" 2>/dev/null || true
pkill -f "streamlit run" 2>/dev/null || true

# 2. Start Backend (Flask)
echo "📦 Starting Backend (Port 5000)..."
cd "$PROJECT_ROOT/backend"
../.venv/bin/python3 app.py > ../backend.log 2>&1 &

# 3. Start Frontend (React)
echo "💻 Starting Frontend (Port 3000)..."
cd "$PROJECT_ROOT/frontend"
npm start > ../frontend.log 2>&1 &

# 4. Start Ancillary Agent (Streamlit)
echo "🤖 Starting Standalone Chatbot (Port 8501)..."
cd "$PROJECT_ROOT/rag chatbot"
../.venv/bin/python3 -m streamlit run chatbot.py --server.port 8501 --server.headless true --browser.gatherUsageStats false > ../streamlit.log 2>&1 &

echo "✅ All services initiated!"
echo "------------------------------------------------"
echo "Main Dashboard:    http://localhost:3000"
echo "Backend API:       http://localhost:5000"
echo "Standalone Chat:   http://localhost:8501"
echo "------------------------------------------------"
echo "Logs are being saved to backend.log, frontend.log, and streamlit.log"
echo "Press Ctrl+C to stop this script and stop the services."

# Wait for background processes
wait

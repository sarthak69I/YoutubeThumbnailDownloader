#!/bin/bash

# E-LEAKxDOWN Startup Script for Render

echo "🚀 Starting E-LEAKxDOWN services..."

# Start Flask backend on port 5000
echo "📡 Starting Flask backend..."
export FLASK_ENV=production
python main.py &
FLASK_PID=$!
echo "✅ Flask backend started (PID: $FLASK_PID)"

# Wait a moment for Flask to initialize
sleep 5

# Start Next.js frontend on port 3000 (or Render's assigned port)
echo "🎨 Starting Next.js frontend..."
export NODE_ENV=production
export PORT=${PORT:-3000}
npm start &
NEXT_PID=$!
echo "✅ Next.js frontend started (PID: $NEXT_PID)"

echo "🌐 E-LEAKxDOWN is now running!"
echo "📱 Frontend: http://localhost:$PORT"
echo "🔧 Backend: http://localhost:5000"

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down E-LEAKxDOWN..."
    kill $FLASK_PID $NEXT_PID 2>/dev/null
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
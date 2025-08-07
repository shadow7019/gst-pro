#!/bin/bash

echo "🚀 Starting GST Pro Desktop App (Development Mode)..."

# Start the standalone backend in the background
echo "🔧 Starting backend server..."
cd backend
python server_standalone.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start the Electron frontend
echo "🖥️  Starting Electron app..."
cd ../frontend
yarn electron-dev &
FRONTEND_PID=$!

echo ""
echo "✅ GST Pro Desktop App is running!"
echo "🔧 Backend PID: $BACKEND_PID"
echo "🖥️  Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for user interrupt
wait

# Clean up processes
echo "🛑 Stopping services..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null

echo "👋 GST Pro Desktop App stopped."
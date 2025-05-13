#!/bin/bash
set -e

# Start Flask backend on internal port 5000
cd backend
pip install -r requirements.txt
gunicorn app:app --bind 127.0.0.1:5000 &
cd ..

# Start Next.js frontend on Heroku's $PORT
cd frontend
npm install
npm run build
PORT=$PORT npm start

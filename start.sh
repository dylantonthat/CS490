#!/bin/bash

# Exit on error
set -e

# Start Flask backend on port 5000
cd backend
pip install -r requirements.txt
gunicorn app:app --bind 0.0.0.0:5000 &
cd ..

# Start Next.js frontend
cd frontend
npm install
npm run build
npm start

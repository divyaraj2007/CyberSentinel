#!/usr/bin/env bash
set -e

echo "Setting up CyberSentinel environment..."

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

cd frontend
npm install
cd ..

export PYTHONPATH=backend
python backend/app/seed.py

echo "CyberSentinel setup complete! Launch using docker-compose up or uvicorn backend."

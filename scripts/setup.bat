@echo off
echo Setting up CyberSentinel development environment...

python -m venv venv
call .\venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r backend\requirements.txt

cd frontend
npm install
cd ..

set PYTHONPATH=backend
python backend\app\seed.py

echo Setup complete! Launch with scripts\run_dev.bat

# Quick Setup Guide

1. Install Git in the server

sudo apt update

sudo apt install git -y

git --version

2. Clone your repository

git clone https://github.com/avinavrishi/bims-BE.git

3. Install Python 3.12.3

sudo apt update

sudo apt install -y wget build-essential

curl https://pyenv.run | bash

echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc
source ~/.bashrc

sudo apt install -y make build-essential libssl-dev zlib1g-dev \
libbz2-dev libreadline-dev libsqlite3-dev curl git \
libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev \
libffi-dev liblzma-dev

pyenv install 3.12.3

pyenv global 3.12.3

python --version


Create virtual environment

python -m venv my-venv

source my-venv/bin/activate

pip install -r requirements.txt

Create FastAPI systemd Service:
=================================================================
sudo nano /etc/systemd/system/fastapi.service

[Unit]
Description=FastAPI Application
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/myproject

ExecStart=/home/ubuntu/myproject/venv/bin/gunicorn \
-k uvicorn.workers.UvicornWorker \
-w 4 \
-b 127.0.0.1:8000 \
app.main:app

Restart=always

[Install]
WantedBy=multi-user.target
=================================================================


sudo systemctl start fastapi

sudo systemctl enable fastapi

sudo systemctl status fastapi

**Create service for the worker**

sudo nano /etc/systemd/system/worker.service

==============================================
[Unit]
Description=Background Worker
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/myproject

ExecStart=/home/ubuntu/myproject/venv/bin/python -m worker.main

Restart=always

[Install]
WantedBy=multi-user.target
==============================================
 
 sudo systemctl daemon-reload

 sudo systemctl start worker

 sudo systemctl enable worker

 journalctl -u worker -f

 



6. **Access the API**:
   - API: http://localhost:8000
   - Interactive Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## First Steps

1. **Register a Brand User**:
   ```bash
   POST /api/v1/auth/register
   {
     "email": "brand@example.com",
     "username": "branduser",
     "password": "password123",
     "role": "brand"
   }
   ```

2. **Register an Influencer User**:
   ```bash
   POST /api/v1/auth/register
   {
     "email": "influencer@example.com",
     "username": "influenceruser",
     "password": "password123",
     "role": "influencer"
   }
   ```

3. **Login**:
   ```bash
   POST /api/v1/auth/login
   # Use form data: username=email, password=password
   ```

4. **Create Profiles**:
   - Brand: `POST /api/v1/brands`
   - Influencer: `POST /api/v1/influencers`

## Development Notes

- Database file: `brandfluence.db` (SQLite)
- All models are in `app/models/`
- All schemas are in `app/schemas/`
- API endpoints are in `app/api/v1/endpoints/`
- Configuration is in `app/core/config.py`

## Environment variables – where to keep them

Use **one `.env` file in the project root** for both the FastAPI app and the Instagram verification worker.

| What                | Where to put env        | How it's loaded |
|---------------------|-------------------------|------------------|
| **FastAPI app**     | `.env` in project root  | `app/core/config.py` (pydantic-settings) reads `.env` when the app starts. |
| **Worker**          | Same `.env` in project root | When you run `python -m worker.main` from the project root, the worker loads `.env` from the project root. |

**Steps:** Put all variables in `.env` at the project root (same folder as `app/`, `worker/`, `requirements.txt`). Run both the app and the worker from the project root so they find the same file. See `.env.example` for a list of variables. Do not commit `.env`.

## 🗄️ Database Migration to PostgreSQL

When ready to migrate to PostgreSQL:

1. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/brandfluence
   ```

2. Install PostgreSQL adapter (if needed):
   ```bash
   pip install psycopg2-binary
   ```

3. The SQLAlchemy setup is already compatible - just change the URL!


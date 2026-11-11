# Production Deployment & Maintenance Guide

## 1. Overview
The **NIFTY 50 DMA Scanner** is packaged as a unified full-stack application:
- **Backend**: FastAPI + Uvicorn + SQLAlchemy + WebSocket streaming.
- **Frontend**: React + TypeScript + Tailwind CSS (compiled into `frontend/dist` and served statically by FastAPI or hosted separately on Vercel/Netlify).
- **Database**: PostgreSQL with automatic schema creation and relational persistence.

---

## 2. Environment Variables

Create `.env` in the root or set in your cloud provider's dashboard:

| Variable | Description | Default / Example |
|---|---|---|
| `APP_NAME` | Display name of the application | `NIFTY 50 DMA Scanner` |
| `APP_ENV` | Environment (`development` or `production`) | `production` |
| `DEBUG` | Enable debug logs | `False` |
| `PORT` | Listening port | `8000` |
| `HOST` | Bind host address | `0.0.0.0` |
| `CORS_ORIGINS` | Allowed origins | `https://your-domain.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@host:5432/nifty50_dma` |
| `UPSTOX_API_KEY` | Upstox V3 API Key | Personal Broker App Key |
| `UPSTOX_API_SECRET` | Upstox V3 API Secret | Personal Broker App Secret |
| `UPSTOX_REDIRECT_URI` | OAuth callback URI | `https://your-domain.com/api/v1/auth/upstox/callback` |

---

## 3. Deploy Option A: Docker Compose (Self-Hosted / VPS)

1. Clone repository to server:
   ```bash
   git clone <repo_url>
   cd nifty50-dma-scanner
   ```
2. Launch database and application container:
   ```bash
   docker-compose up -d --build
   ```
3. Verify running services:
   ```bash
   docker-compose ps
   curl http://localhost:8000/api/v1/health
   ```

---

## 4. Deploy Option B: Cloud PaaS (Render / Railway)

1. Create a **PostgreSQL Database** on Render/Railway.
2. Create a **Web Service** pointing to this Git repository:
   - **Build Command**:
     ```bash
     cd frontend && npm install && npm run build && cd .. && pip install -r backend/requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend
     ```
3. Set Environment Variable:
   - Set `DATABASE_URL` from the created PostgreSQL instance.
   - Set `PYTHONPATH` = `backend`.

---

## 5. Market Data Accuracy & Licensing Reminder
- Historical prices are ingested from official NSE Bhavcopy and exchange sessions with strict OHLC validation.
- Live Upstox tick data is streamed strictly for personal stock screening and technical analysis.
- Live intraday signals are explicitly labeled **PROVISIONAL** until the official NSE daily closing session completes.

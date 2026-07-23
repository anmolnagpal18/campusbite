# CampusBite AI - Operations Runbook

## 1. Architecture Overview
**Frontend**: Vercel (React + Vite, SSG/SPA)  
**Backend**: Render (Daphne ASGI + Django REST Framework)  
**Database**: Neon Serverless PostgreSQL  
**Cache/Channels**: Render Managed Redis  

## 2. CI/CD & Deployment
We utilize GitHub Actions. Every push to a `v*.*.*` tag triggers:
1. `pip-audit` & `npm audit`
2. `flake8` Linting
3. Django Unit tests
4. If successful, Webhooks fire to Vercel and Render for zero-downtime deployment.
5. Render utilizes `scripts/build.sh` to run `python manage.py migrate` before switching Traffic via Blue/Green deployment.

## 3. Disaster Recovery (RTO: 1 Hour, RPO: 1 Day)
### Database Failure
- Neon automatically creates Daily Snapshots with Point-in-Time Recovery (PITR). 
- **Action**: Navigate to Neon Console -> Branches -> Restore to Point-in-Time.

### Redis Failure
- Redis acts entirely as an ephemeral cache and websocket pub/sub message broker.
- **Action**: Rebooting Redis causes temporary websocket disconnections. The frontend `useWebSocket.js` hook automatically initiates exponential backoff and will successfully reconnect when the broker returns. No persistent data is lost.

## 4. Monitoring & Logs
- All Django logs output in **JSON** via `pythonjsonlogger`.
- Render Log Streams automatically parse this JSON to make `level: ERROR` easily queryable via DataDog/LogDNA.
- The Load Balancer hits `GET /health/ready/` every 10 seconds. If PostgreSQL drops, the node returns 503 and is removed from the pool automatically.

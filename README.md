# CampusBite AI 🚀

## Project Overview
CampusBite AI is an enterprise-grade AI-powered food pre-booking SaaS platform. It enables students to seamlessly order food from campus vendors across multiple universities via a responsive Web App, WhatsApp, and Telegram. 

## Features
- **Omnichannel Ordering**: Place orders via Web, WhatsApp, or Telegram.
- **Role-Based Access Control (RBAC)**: Secure isolation between Students, Vendors, University Admins, and Super Admins.
- **Smart Menus & Cart**: Browse vendors, search food, and schedule pickups.
- **QR Code System**: Secure cryptographic QR codes for order redemption (preventing duplication).
- **AI Integration**: Powered by Google Gemini and LangChain for food recommendations and dynamic chatbots.
- **Multi-Tenant Architecture**: Strict university data isolation.

## Architecture
Built on a scalable, decoupled client-server model following **Clean Architecture**:
- **Clients**: React 19 SPA, Meta Cloud API (WhatsApp), Telegram Bot API.
- **Backend API Gateway**: Django REST Framework serving unified business logic.
- **Async Workers**: Celery + Redis for real-time processing and messaging.
- **Database**: PostgreSQL with UUID primary keys and soft-delete support.

## Folder Structure
```text
campusbite-ai/
├── backend/          # Django App (apps: common, accounts, universities...)
├── frontend/         # React 19 App (Tailwind v3, Vite, Axios, React Query)
├── README.md
├── CHANGELOG.md
└── .env.example
```

## Technology Stack
- **Frontend**: React 19, JavaScript, Vite, Tailwind CSS v3.4.x, React Router, Axios, TanStack React Query, React Hook Form, Zod.
- **Backend**: Python, Django, DRF, Simple JWT, PostgreSQL.
- **Third Party**: Razorpay (Payments), Cloudinary (Media), Upstash Redis (Caching).

## Installation & Running Locally (No Docker)

### 1. PostgreSQL Setup
Ensure PostgreSQL is installed locally. Create a database for the project (e.g., `campusbite_db`). 

### 2. Environment Variables
Copy `.env.example` to `backend/.env` and fill in your DB credentials and secret keys.

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\Activate.ps1
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Documentation
Once the Django server is running, explore the interactive documentation:
- **Swagger**: `http://localhost:8000/api/docs/swagger/`
- **ReDoc**: `http://localhost:8000/api/docs/redoc/`

## Deployment Overview
- **Frontend**: Vercel.
- **Backend**: Render (Native Python runtime).
- **Database**: Neon Serverless PostgreSQL.

## Coding Standards
- **Backend**: PEP 8 compliance, Clean Architecture (Services/Repositories mapping in future phases). All models inherit from `BaseModel` (UUIDs).
- **Frontend**: ESLint + Prettier. Functional components only. Custom hooks for reusable logic.

## License
Proprietary software. All rights reserved.

## Future Roadmap
- Phase 2: Razorpay Order Engine & Cart flow.
- Phase 3: QR Code cryptographic generation.
- Phase 4: WhatsApp & Telegram Bot integrations.
- Phase 5: RAG-powered AI food recommendation system.

# Changelog

All notable changes to this project will be documented in this file.

## [Refactor] - Remove Frontend Form/State Libraries
- Uninstalled `@tanstack/react-query`, `react-hook-form`, `zod`, and `@hookform/resolvers`.
- Refactored `App.jsx` to remove all instances of `QueryClient` and `QueryClientProvider`.
- Refactored `LoginPage.jsx` to use standard React `useState` and native form validation.
- Refactored `RegisterPage.jsx` to use standard React `useState` and native form validation (with password matching).
- Verified build and routing still work correctly via Axios interceptors.

## [Phase 1] - Initial SaaS Foundation & Architecture

### Added
- **Monorepo Architecture**: Created clean separation between `frontend/` and `backend/` without Docker dependencies.
- **Backend Infrastructure**: 
  - Django + DRF setup with native PostgreSQL connectivity.
  - Implemented `common.BaseModel` enforcing UUIDs, Soft Deletion, and Audit fields (`created_by`, `version`, etc.).
  - Implemented Custom `User` model with strict `Role` enum (STUDENT, VENDOR, UNIVERSITY_ADMIN, SUPER_ADMIN).
  - Scaffolded placeholders for all 11 future apps (payments, orders, chatbot, etc.).
- **Authentication**: 
  - JWT integration using `SimpleJWT`.
  - Registration logic strictly enforced to create `STUDENT` roles only (Admins/Vendors are created internally).
  - Implemented Login, Refresh, Logout, and Profile retrieval APIs.
- **University Hierarchy**: Designed a 3-tier database model (`University` → `Building` → `Block`) to map physical campuses.
- **Frontend Infrastructure**: 
  - React 19 + Vite initialized.
  - Tailwind CSS configured (v3.4.x for maximum stability).
  - Configured global Axios instance with JWT request/response interceptors for automatic token refreshing.
- **UI & Routing**: 
  - Created distinct, decoupled layouts for each role: `StudentLayout`, `VendorLayout`, `UniAdminLayout`, `SuperAdminLayout`.
  - Built protected role-based routing prohibiting cross-role access.
  - Created Professional Glassmorphism Landing Page, Zod-validated Login/Register pages, and dedicated role dashboards.
- **Documentation**: 
  - Integrated `drf-spectacular` for Swagger/OpenAPI docs.
  - Generated comprehensive `README.md` and `.env.example`.

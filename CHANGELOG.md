# Changelog

All notable changes to this project will be documented in this file.

## [Phase 4] - Cart & Food Pre-Booking System
### Backend
- Implemented `orders` app with `Cart`, `CartItem`, `PickupSlot`, `PreBooking`, and `BookingItem`.
- Developed robust transactional logic utilizing `select_for_update()` to absolutely prevent race conditions when securing limited Pickup Slot capacities.
- Built server-side cart pricing engine to secure mathematical parity during checkout (Base + Variants + Addons).
- Created `BookingItem` snapshot architecture so historical orders freeze prices and names, preventing historical data mutation if a vendor later changes a menu item.
- Enforced single-vendor cart isolation logic directly in the API.

### Frontend
- Created `CheckoutPage.jsx` where students can natively review their active cart, select available pickup slots, and lock in their PreBooking without relying on external state libraries.
- Designed `VendorOrdersDashboard.jsx` featuring an `OrderTimeline` component, allowing vendors to view real-time incoming orders and transition their state (`PREPARING` -> `READY_FOR_PICKUP` -> `COMPLETED`).


### Backend
- Implemented `menus` app containing `Category`, `MenuItem`, `MenuVariant`, and `AddOn` models.
- Added support for comprehensive dietary flags, spice levels, scheduling (available_from/until), and minimum/maximum AddOn limits.
- Established strict `VendorOwnershipPermission` RBAC policies limiting CRUD operations to menu owners.
- Optimized REST ViewSets using `select_related` and `prefetch_related` across deeply nested hierarchical catalog payloads.
- Added comprehensive searching and filtering by availability, category, price, and dietary logic.

### Frontend
- Scaffolded robust UI components (`MenuCard`, `CategoryCard`, `PriceBadge`, `AvailabilityBadge`, `FilterSidebar`).
- Created `StudentMenuBrowser` dashboard allowing Students to drill down from Universities -> Vendors -> Menus with live dynamic filtering.
- Created `VendorMenuDashboard` giving Vendors total catalog management control.


### Backend
- Upgraded `University`, `Building`, and `Block` models with new fields (`slug`, `logo`, `is_active`, `city`, `state`, `country`).
- Created `Vendor` model with strict workflow fields (`status`, `approved_by`, `approval_notes`, `rejection_reason`).
- Implemented robust RBAC permissions (`IsSuperAdmin`, `IsUniversityAdmin`, `IsVendor`, `IsStudent`).
- Built optimized DRF ViewSets using `select_related` and `prefetch_related`.
- Implemented API filtering, searching, and pagination.

### Frontend
- Developed robust Reusable UI Components: `Table`, `Modal`, `SearchBox`, `Pagination`, `StatusBadge`, `Loader`, `EmptyState`, `ConfirmationDialog`.
- Rebuilt `SuperAdminDashboard` to list and manage multiple Universities natively.
- Rebuilt `UniAdminDashboard` featuring the Vendor application directory and interactive Approval/Rejection/Suspension modals.


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

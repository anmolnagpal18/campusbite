# Changelog

All notable changes to this project will be documented in this file.

## [Phase 10] - Real-Time Notifications & Live Updates
### Backend
- Migrated server infrastructure from purely WSGI to ASGI utilizing Daphne, Django Channels, and `channels_redis`.
- Built `apps.notifications` to persist WebSocket alerts via `Notification` and `NotificationPreference` databases.
- Deployed a centralized Event Bus (`RealtimePublisher`) decoupled from consumers, allowing services (like Order Management) to push synchronous JSON payloads that are instantly bridged into asynchronous WebSocket broadcasts via Redis channel layers.

### Frontend
- Developed robust `useWebSocket.js` hook with exponential backoff and JWT authentication via query parameters.
- Implemented `NotificationCenter.jsx` to render live connectivity status and trigger native Toasts immediately upon receiving server events (e.g. `KITCHEN_READY`).


### Backend
- Developed `apps.ai` module utilizing LangChain and Google Gemini APIs to construct a conversational Chatbot.
- Configured a `ContextTools` library allowing the LLM to execute RAG (Retrieval-Augmented Generation) against real-time `PreBooking` arrays and `MenuItem` databases securely.
- Built explicit `Conversation` and `ConversationMessage` SQL stores with `token_count` and `latency` heuristics for audit and cost analysis.

### Frontend
- Created `AIChatPage.jsx` granting an uninterrupted chat interface capable of rendering real-time AI context with smooth scrolling and typing indicators.


### Backend
- Developed `apps.communication` app containing `CommunicationChannel` and `MessageLog` databases for highly accurate, stateful outbound message tracking.
- Implemented decoupled `MessageDispatcher` service that hooks into the Order State Machine to fire automated SMS/Telegram templates upon status updates (e.g. `CONFIRMED`, `PREPARING`, `READY`).
- Constructed webhook processors for both Meta (WhatsApp) and Telegram.
- Integrated stringent `X-Hub-Signature-256` HMAC validation for incoming Meta webhooks to strictly reject replay and spoofing attacks.

### Frontend
- Built `CommunicationSettingsPage.jsx` providing a unified dashboard for users to attach their WhatsApp Phone Numbers or Telegram Chat IDs and opt-in to system notifications.


### Backend
- Upgraded `orders.PreBooking` model to handle kitchen state variables (`queue_position`, `priority`, `estimated_preparation_time`, `actual_preparation_start`).
- Developed `OrderStatusLog` model to enforce a strict immutable audit trail of all state machine transitions.
- Developed `/api/v1/orders/kitchen/` APIs wrapped in `select_for_update()` to natively compute wait-times and strictly reject illegal backwards state transitions (e.g. `READY` to `PREPARING`).

### Frontend
- Built `KitchenQueuePage.jsx` granting vendors a dynamic list of active orders with 1-click status bumps (`Start Preparing`, `Mark Ready`).
- Built `StudentOrderTrackingPage.jsx` granting students a real-time progress timeline detailing their Queue Position and computed `Estimated Ready Time`.


### Backend
- Upgraded `orders.PreBooking` model to handle native QR lifecycles (`qr_token`, `qr_status`, `qr_expires_at`).
- Built `PickupLog` model to enforce a strict immutable audit trail of all physical order handoffs.
- Developed `/api/v1/qr/generate/` endpoint producing cryptographically secure JSON tokens isolating sensitive database IDs.
- Developed `/api/v1/qr/verify/` endpoint utilizing `select_for_update()` and `transaction.atomic()` to definitively prevent concurrent duplicate scan attacks.

### Frontend
- Installed `qrcode.react` to generate dynamic SVG codes on the Student Dashboard.
- Installed `html5-qrcode` to interface natively with the Vendor's physical camera hardware in `VendorQRScannerPage.jsx`.
- Implemented robust error handling across the Scanner UI to surface exact failure reasons (e.g. Expired, Used, Invalid Signature) without crashing the camera stream.


### Backend
- Implemented `payments` app containing `Payment` and `PaymentLog` tables for auditability.
- Augmented the `orders.PreBooking` model to enforce a strict state machine (`status` cannot become `CONFIRMED` until `payment_status` is `PAID`).
- Developed `create_order` API generating a secure server-side financial total, completely ignoring client-provided amounts.
- Developed `verify_payment` API utilizing `hmac` SHA256 to cryptographically verify Razorpay signatures.
- Built a fallback `RazorpayWebhookView` to guarantee booking confirmation even if the student closes the browser window prematurely.

### Frontend
- Scaffolded dynamic `useRazorpay` React hook for async script injection.
- Developed `PaymentPage.jsx` providing a seamless bridge from the Checkout flow directly into the native Razorpay modal overlay.


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

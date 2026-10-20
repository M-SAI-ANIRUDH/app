# Bless to Art — PRD

## Original problem statement
Premium handmade-products e-commerce prototype for the Instagram brand "Bless to Art"
(https://www.instagram.com/bless_to_art/). Two experiences: customer storefront (browse dynamic
collections, cart with quantities, Instagram order-enquiry message flow — no payments, no customer
auth) and an admin dashboard (dynamic sections + product CRUD with image uploads). Warm
ivory/terracotta palette, editorial serif + clean sans typography, Awwwards-level polish
(kinetic masked hero reveal, slow marquee, framer-motion reveals, lenis smooth scroll).

## User personas
- Customer: browses collections, adds to basket, sends an order enquiry manually via Instagram DM.
- Owner: manages sections and products (name, description, image upload, price INR, availability,
  stock, featured, display order) via /admin with a SIMULATED prototype login.

## Architecture
- FastAPI backend (/app/backend/server.py) + MongoDB (motor). All routes under /api.
- React (CRA/craco) frontend, Tailwind + shadcn/ui, framer-motion, lenis.
- Object storage (platform objstore via EMERGENT_LLM_KEY) for admin product image uploads;
  images served back through GET /api/files/{path}. Swappable for S3 later.
- Simulated admin auth: password vs ADMIN_PASSWORD env, opaque bearer token in MongoDB
  admin_sessions (12h). Clearly labelled as not production security.

## Data model (single source of truth)
- Section: id (uuid), name, description, display_order, is_active, created_at, updated_at
- Product: id (uuid), section_id, name, description, price (INR), image_url, is_available,
  stock_quantity (nullable), is_featured, display_order, created_at, updated_at
- Section delete with products requires explicit choice: move to another section or delete products.

## Implemented (2026-10-20)
- Storefront: kinetic hero w/ parallax, marquee, dynamic collections (from DB), featured products,
  brand story, Instagram band, dynamic footer.
- Shop: search + section chips + sorting + empty states; unavailable products labelled + disabled.
- Product detail: large image, qty selector, availability, back-to-shop.
- Cart drawer: add/increase/decrease/remove/clear, stock caps, localStorage persistence,
  live count + INR subtotal, delivery-charges note.
- Order enquiry page: draft reference BTA-XXXXXXXX, generated message from real cart, truthful
  clipboard copy with manual fallback, Open Instagram button, enquiry-not-purchase labelling.
- About page with placeholder copy.
- Admin: two-panel (sections sidebar + product grid), section CRUD w/ duplicate-name guard,
  safe section deletion (move/delete choices), product CRUD w/ device image upload + preview +
  URL paste, search + availability filter, toasts, mobile section selector.
- Brand logo (user-supplied BA mark) applied to navbar, footer, admin, login, empty states, favicon.
- Seed: 4 sections + 8 products (runs only when DB empty).

## Simulated / prototype limitations
- Admin login is simulated (env password + token), not production authorization.
- No payments, no customer accounts, no automated Instagram messaging (by design).
- Cart persists per-browser only (localStorage). Catalogue persists in MongoDB.

## Backlog
- P0: none blocking.
- P1: full visual QA pass at 390/768/1280/1440; owner-editable brand story copy; per-section
  custom cover image field.
- P2: order enquiry history for owner; stock decrement on confirmed orders; S3 swap for uploads;
  production-grade auth when going live.

## Next tasks
- Run acceptance flows A–H end-to-end via screenshots/curl and fix any findings.
- Consider Angular + FastAPI + PostgreSQL rebuild notes + AWS cost-controlled deployment
  (single ECS/Fargate or EC2 + RDS free tier, S3+CloudFront for frontend) when user asks.

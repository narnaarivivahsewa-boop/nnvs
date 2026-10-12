# RishteClub / NNVS Matrimony — Complete Platform Audit & Gap Analysis Report

**Date of Audit:** October 10, 2026  
**Target Platform:** [RishteClub](https://www.rishteclub.com/) (Managed by NNVS Matrimony — Nar Naari Vivah Sewa)  
**Audit Mode:** Read-Only Codebase, Schema, Configuration, and Integration Verification (Zero Production Mutation)  
**Git Verification:**  
- Production Main Commit: `7a591b86f4539721211659314d76d515113c0f3c`
- Local Optimization Branch: `perf/phase2-optimization` at commit `8893344fe72cbe0ebe30aa7bc88c720e1b87e56e`
- Checkpoint Tag: `checkpoint-pre-perf-phase2` (Preserved intact)
- Active Database State: Neon PostgreSQL (`neondb`), 633 Users, 630 Verified Profiles Preserved

---

## Executive Summary

A comprehensive read-only audit of the entire RishteClub / NNVS Matrimony repository was conducted across all 12 operational pillars. The inspection verified that while foundational UI structures, Prisma schema models, and initial integration endpoints exist, there are **critical security vulnerabilities (P0)**, **data-loss and payment integrity risks**, and **workflow blockers** that must be resolved before the platform can operate safely as a fully automated, scalable matrimonial service.

Crucially:
1. **Zero Production Mutation:** No migrations, no branch merges, no code pushes, and no database writes were executed during this audit.
2. **Data Preservation:** The existing 630 member profiles and historical NNVS IDs remain fully intact in Neon PostgreSQL.
3. **Severe Vulnerabilities Discovered:** Hardcoded admin credentials, unauthenticated database backup dumps, public arbitrary file uploads, rogue payment bypass routes, unauthenticated biodata PDF edge caching, and unauthenticated/unrestricted contact number scraping were uncovered and prioritized.

---

## Deliverable A: Current Architecture Confirmed from Code & Configuration

```
+--------------------------------------------------------------------------------------------------------+
|                                      DNS & DOMAIN ARCHITECTURE                                         |
|  Hostinger DNS -> CNAME rishteclub.com & www.rishteclub.com -> Vercel Edge Network (Edge CDN / SSL)   |
|  Redirect: http(s)://rishteclub.com -> https://www.rishteclub.com (via next.config.ts)                |
+--------------------------------------------------------------------------------------------------------+
                                                   |
                                                   v
+--------------------------------------------------------------------------------------------------------+
|                                    APPLICATION RUNTIME & FRAMEWORK                                     |
|  Framework: Next.js 16.2.12 (App Router) | React: 19.2.4 | TypeScript: 5.x                             |
|  Routing: Next.js 16 App Router                                                                        |
|  Proxy/Middleware: root proxy.ts (Official Next.js 16 convention replacing middleware.ts)               |
|  Hosting: Vercel Serverless Functions (Node.js runtime)                                               |
+--------------------------------------------------------------------------------------------------------+
                                                   |
                   +-------------------------------+-------------------------------+
                   |                               |                               |
                   v                               v                               v
+-----------------------------+ +-----------------------------+ +-----------------------------+
|      DATABASE LAYER         | |     EXTERNAL GATEWAYS       | |   MEDIA & STORAGE LAYER     |
| Neon PostgreSQL (Serverless)| | SMS: 2Factor.in (SMS DLT)   | | Cloudinary CDN              |
| Region: ap-southeast-1      | | Payments: Razorpay Std SDK  | | Folder:                     |
| ORM: Prisma Client 6.19.3   | | Google Forms: GAS Webhook   | | nnvs-matrimony/profile-     |
| Pooling: PgBouncer (pooler) | | Invoicing: Custom GST logic | | photos                      |
+-----------------------------+ +-----------------------------+ +-----------------------------+
```

### Key Architectural Findings:
- **Next.js 16 Proxy Convention:** Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`. The repository correctly implements `proxy.ts` at the root for `/admin/:path*` route gating.
- **Database Connection Dual Pooler:** In `.env`, both `DATABASE_URL` and `DIRECT_URL` point to the PgBouncer transaction pooler (`ep-purple-fire-azr426cg-pooler.c-3.ap-southeast-1.aws.neon.tech`). Prisma migrations and shadow databases require `DIRECT_URL` to point to the direct non-pooled endpoint (`ep-purple-fire-azr426cg.c-3...`).
- **Database Geolocation:** Neon instance is hosted in `ap-southeast-1` (Singapore), creating a ~60–80ms baseline network roundtrip from users in India.

---

## Deliverable B: Feature Status Matrix

| Pillar / Requirement | Status | Summary of Evidence & Current State |
| :--- | :--- | :--- |
| **1. Registration Flow** | **Partially Implemented** | Multi-step form exists (`app/register/page.tsx`). Validates 10-digit mobile and sends SMS OTP via 2Factor. Password hashing works. BUT registration endpoint (`/api/register`) does not issue a session cookie, leaving user unauthenticated. |
| **1. Authentication & OTP** | **Partially Implemented** | SMS OTP delivery and verification work via 2Factor DLT. However, OTP records are not protected against rapid sequential retries if initial OTP is deleted, and password reset flow is absent. |
| **2. Persistent Session ("Remember Me")** | **Partially Implemented** | JWT issued on login (`/api/auth/login-password`) with `maxAge: 7 days`, `HttpOnly`, `SameSite=lax`. BUT there is no refresh token rotation, no session revocation table, and no "Remember this device" user toggle. |
| **3. Google Forms Auto-Sync** | **Partially Implemented** | Webhook endpoint exists at `/api/integrations/google-form` and Google Apps Script exists in `scripts/google-apps-script.js`. Syncs data and extracts multi-phone numbers. BUT missing mobile numbers are silently assigned placeholder `9900xxxxxx`, violating business rules, and integration key is hardcoded. |
| **4. Profile Creation & Autosave** | **Partially Implemented** | Profile edit tabs exist (`app/profile/edit/page.tsx`). Backend `PUT /api/profile` updates database. BUT draft auto-saving is not implemented (client-side only on submit), and photo upload (`/api/upload`) is completely unauthenticated. |
| **5. Razorpay Payments** | **Partially Implemented / Broken** | Frontend integration button exists (`RazorpayCheckoutButton.tsx`). Signature verification exists (`/api/verify-payment`). BUT Razorpay webhook is completely missing. Order creation trusts client amount. Rogue endpoint `/api/payment/complete` allows free activation. |
| **5. GST Tax Invoicing** | **Partially Implemented** | Tax breakdown calculations (`lib/gst.ts`) and HTML invoice preview (`/invoice/[id]`) exist for admin-confirmed payments. BUT online Razorpay payments do NOT persist invoice numbers or tax fields in database. Downloadable PDF generation does not exist (relies on browser `window.print`). |
| **6. Profile Matching Algorithm** | **Partially Implemented** | Filtering by gender, caste, religion, and search text works (`/api/public/profiles`). BUT partner preference matching score, automated compatibility ranking, and pagination query optimizations are absent. |
| **6. Contact Privacy & Authorization** | **UI Exists / Backend Broken** | Public profile route correctly strips contact details. BUT `/api/profile/[profileId]` returns candidate phone numbers to ANY logged-in user without payment, opposite gender verification, mutual consent, or rate limits. Furthermore, `/api/profiles/[profileId]/pdf` leaks full contact biodata publicly with zero authentication. |
| **7. Marriage Success Tracking** | **Not Implemented** | No database models, no API routes, and no UI elements exist for "Marriage Finalized", "Mark as Married", source tracking, or partner outcome confirmation. |
| **8. Admin Dashboard & Automation** | **Partially Implemented** | Admin pages exist for approvals, payments, profiles, duplicates, and settings. BUT background automation (queues, retries, webhook processors, dispute reconciliations, abuse alerts) is completely absent. |
| **9. Performance & Edge Caching** | **Partially Implemented** | Proposed headers in branch `perf/phase2-optimization` add `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` and indexes. Uncommitted in production. Baseline queries take 1,300ms–1,460ms due to Singapore DB latency and unindexed joins. |
| **10. Backups & Disaster Recovery** | **Partially Implemented** | Admin export routes exist for CSV and JSON snapshots. BUT `/api/admin/backup` lacks authentication checks. Neon point-in-time recovery (PITR) requires manual branch forking, and automated external scheduled dumps are absent. |
| **11. Privacy, Security & Legal** | **Partially Implemented** | Legal pages exist (`/privacy`, `/terms`, `/refund`) referencing Trendy Traders & NNVS. BUT DPDP Act compliance (explicit consent logs, contact access purpose limitation, account deletion workflows) is missing. Hardcoded credentials present in codebase. |
| **12. Mobile App Readiness** | **Partially Implemented** | REST APIs exist for public profiles and registration. BUT authentication strictly depends on cookie parsing (`req.cookies.get`), lacking `Authorization: Bearer <token>` fallback headers required for native mobile applications. |

---

## Deliverable C: Detailed Audit Findings with Evidence

### 1. Registration & Authentication

#### Evidence & Analysis:
- **SMS Gateway Configuration:** [twofactor.ts](file:///c:/Users/APPLE/nnvs-matrimony/lib/sms/twofactor.ts#L1-L87)
  - Endpoint: `https://2factor.in/API/V1/{API_KEY}/SMS/{MOBILE}/{OTP}/Rishteclub%20Registration%20OTP`
  - DLT Template: Approved "Rishteclub Registration OTP" (SMS only; zero voice OTP endpoints).
  - *Vulnerability:* [twofactor.ts:L23](file:///c:/Users/APPLE/nnvs-matrimony/lib/sms/twofactor.ts#L23) contains a hardcoded fallback API key `4c7bb09c-a84f-11f1-9cb1-0200cd936042` if the environment variable is missing.
- **OTP Rate Limiting & Cooldown:** [send-otp/route.ts](file:///c:/Users/APPLE/nnvs-matrimony/app/api/auth/send-otp/route.ts#L91-L131)
  - Enforces 30-second cooldown per mobile and max 8 OTPs per mobile per hour.
  - Generates 6-digit cryptographic random OTP, hashes with SHA-256 before storing in `OTP` table with 10-minute expiry.
- **Registration Session Loss:** [register/route.ts](file:///c:/Users/APPLE/nnvs-matrimony/app/api/register/route.ts#L304-L310)
  - Successful registration creates `User` and `Profile` records in a transaction, but returns:
    ```json
    { "success": true, "userId": "...", "profileId": "..." }
    ```
  - It **fails to set the `nnvs_token` HTTP-only session cookie**. When the user is redirected to `/register/review?profileId=...`, they are not authenticated. If the browser refreshes or the URL query is lost, the registration session cannot be resumed.
- **Profile ID Numbering:** [register/route.ts:L160](file:///c:/Users/APPLE/nnvs-matrimony/app/api/register/route.ts#L160)
  - Web registrations generate `profileId: NNVS${Date.now()}`. This differs from the Google Forms / historical convention (`RC...` or `G-0001` / `O-0001`), leading to fragmented ID namespaces.
- **Password Hashing:** Implemented with `bcryptjs` (salt rounds: 10) in [register/route.ts:L113](file:///c:/Users/APPLE/nnvs-matrimony/app/api/register/route.ts#L113).
- **Critical Backdoor Finding:** [login-password/route.ts:L36-L38](file:///c:/Users/APPLE/nnvs-matrimony/app/api/auth/login-password/route.ts#L36-L38)
  ```typescript
  const isAdminAccount = isPermanentAdmin(mobileLookup) || (user && user.role === "ADMIN");
  const isMasterPassword = password === "Ritika@0612";
  ```
  A plaintext master password `"Ritika@0612"` is hardcoded in the codebase. If combined with permanent admin mobile numbers (`9871592002` or `9577540005`), it grants immediate administrative rights.

---

### 2. Device Session & Remember Login

#### Evidence & Analysis:
- **Cookie Setup:** [login-password/route.ts:L99-L105](file:///c:/Users/APPLE/nnvs-matrimony/app/api/auth/login-password/route.ts#L99-L105)
  ```typescript
  response.cookies.set("nnvs_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  ```
- **Session Architecture:**
  - JWT is signed using HS256 via `jose` with a 7-day expiration ([jwt.ts:L25](file:///c:/Users/APPLE/nnvs-matrimony/lib/jwt.ts#L25)).
  - [jwt.ts:L7](file:///c:/Users/APPLE/nnvs-matrimony/lib/jwt.ts#L7) contains a hardcoded fallback secret `"nnvs-matrimony-production-super-secure-jwt-secret-key-2026-min-32-chars"`.
  - **No Refresh Tokens:** There is no separate short-lived Access Token / long-lived Refresh Token architecture.
  - **No Revocation Mechanism:** Sessions cannot be invalidated server-side upon password change, account compromise, or remote logout because JWTs are stateless and no active token/session table is tracked in PostgreSQL.
  - **No "Remember This Device" Toggle:** All logins default to a static 7-day duration. Shared computer users are kept logged in for 7 days unless they explicitly click Sign Out.

---

### 3. Google Forms & Sheet Synchronization

#### Evidence & Analysis:
- **Webhook Endpoint:** [route.ts](file:///c:/Users/APPLE/nnvs-matrimony/app/api/integrations/google-form/route.ts)
  - Supports batch imports, dry-runs, and dedicated photo repair mode.
  - Extracts 10-digit Indian numbers from raw text using regex and splits composite entries.
- **Hardcoded Secret Key:** [route.ts:L7](file:///c:/Users/APPLE/nnvs-matrimony/app/api/integrations/google-form/route.ts#L7)
  `DEFAULT_INTEGRATION_KEY = "9377018194b7c3361ccd1c929de0d9d267c821544c05ff12ea64e5cabfdea20c"`
  Allows unauthorized requests if environment variable validation fails.
- **Violation of Missing Mobile Rule:** [route.ts:L280-L286](file:///c:/Users/APPLE/nnvs-matrimony/app/api/integrations/google-form/route.ts#L280-L286)
  ```typescript
  // Ensure NO row is ever skipped: if no 10-digit mobile found, assign safe unique placeholder
  if (!mobile) {
    mobile = `9900${String(rowIndex).padStart(6, "0")}`;
  ```
  The business requirement explicitly dictates: *“A profile without a valid contact number must not be silently assigned a new NNVS O-Series ID.”* The current implementation silently synthesizes fake `9900...` mobile numbers to bypass schema uniqueness constraints.
- **Synchronization Trigger Reliability:**
  - Relies on Google Apps Script ([google-apps-script.js](file:///c:/Users/APPLE/nnvs-matrimony/scripts/google-apps-script.js)) running `onFormSubmit` installable triggers or manual sheet menu actions.
  - If Google Apps Script execution quota limits are hit or the script trigger encounters an exception, submissions remain stuck in Google Sheets without an automated retry queue on the website server.

---

### 4. Profile Creation & Saving

#### Evidence & Analysis:
- **Form Schema & Completion:** [Profile Edit Pages](file:///c:/Users/APPLE/nnvs-matrimony/app/profile/edit/page.tsx)
  - Modular forms: `PersonalForm`, `FamilyForm`, `EducationForm`, `OccupationForm`, `PartnerPreferenceForm`.
  - Uses `react-hook-form` with `@hookform/resolvers` and `zod`.
- **Autosave Verification:**
  - Autosave does not exist. Form state is stored in React memory and only persists to the database upon explicit button submission. If a user navigates away or loses connection, unsaved inputs are lost.
- **Unauthenticated Media Upload Vulnerability:** [upload/route.ts](file:///c:/Users/APPLE/nnvs-matrimony/app/api/upload/route.ts#L1-L47)
  ```typescript
  export async function POST(req: NextRequest) {
    const data = await req.formData();
    const file = data.get("file") as File;
    ...
    const result = await cloudinary.uploader.upload(base64, {
      folder: "nnvs-matrimony/profile-photos",
      resource_type: "image",
    });
  ```
  There is **zero authentication** (`verifyToken`), **zero file size validation**, and **zero MIME-type verification**. Any user or script can upload unlimited files to Cloudinary, exhausting storage quotas.

---

### 5. Payment, Registration Status & GST Invoicing

#### Evidence & Analysis:
- **Pricing Configuration:**
  - Configured in [gst.ts:L62-L67](file:///c:/Users/APPLE/nnvs-matrimony/lib/gst.ts#L62-L67): Female ₹399, Male ₹799 + 18% GST (Total: ₹470.82 for females, ₹942.82 for males).
  - Also defined in [pricing.ts](file:///c:/Users/APPLE/nnvs-matrimony/lib/pricing.ts#L3-L19) and [AdminSetting](file:///c:/Users/APPLE/nnvs-matrimony/prisma/schema.prisma#L605) where `registrationFee` defaults to ₹1,100. This creates conflicting pricing sources across the codebase.
- **Client-Controlled Pricing Vulnerability:** [create-order/route.ts:L16](file:///c:/Users/APPLE/nnvs-matrimony/app/api/create-order/route.ts#L16)
  ```typescript
  const { amount, currency = "INR", receipt, notes = {} } = body;
  ...
  const order = await razorpay.orders.create(orderOptions);
  ```
  The order creation endpoint accepts `amount` directly from the client request body with no user authentication or gender validation. A malicious user can submit `amount: 100` (₹1.00) and receive a valid Razorpay order ID.
- **Rogue Payment Bypass Endpoint:** [payment/complete/route.ts:L5-L96](file:///c:/Users/APPLE/nnvs-matrimony/app/api/payment/complete/route.ts#L5-L96)
  An unauthenticated public endpoint that takes `{ profileId }`, creates a successful `Payment` record, and immediately sets `paymentCompleted: true` and `isVisible: true` without interacting with Razorpay or validating funds.
- **Missing Razorpay Webhook:**
  No webhook handler exists (`grep -i webhook` returned 0 results across `app/`). If a user completes payment on Razorpay but closes the browser before the client redirect calls `/api/verify-payment`, the platform never records the payment.
- **Missing Invoice Persistence:** [verify-payment/route.ts:L80-L91](file:///c:/Users/APPLE/nnvs-matrimony/app/api/verify-payment/route.ts#L80-L91)
  Online payments verified via Razorpay do not calculate or store `invoiceNumber`, `taxableAmount`, `gstRate`, or `gstAmount` in the `Payment` table. In contrast, manual admin confirmations ([payments/confirm/route.ts](file:///c:/Users/APPLE/nnvs-matrimony/app/api/admin/payments/confirm/route.ts#L176)) correctly generate `TT/{year}/INV-...` records.
- **No Downloadable PDF Invoice:** [app/invoice/[id]/page.tsx](file:///c:/Users/APPLE/nnvs-matrimony/app/invoice/[id]/page.tsx) renders an HTML tax invoice that requires the user to trigger `window.print()`. There is no server-side PDF generator (like PDFKit) for invoices.

---

### 6. Profile Matching & Contact Details Exposure

#### Evidence & Analysis:
- **Matching Feed:** [public/profiles/route.ts](file:///c:/Users/APPLE/nnvs-matrimony/app/api/public/profiles/route.ts)
  Filters by gender, religion, caste, and pagination. Correctly excludes phone and email fields from public listing projections.
- **Critical Privacy Leak (Authenticated Users):** [profile/[profileId]/route.ts:L68-L84](file:///c:/Users/APPLE/nnvs-matrimony/app/api/profile/[profileId]/route.ts#L68-L84)
  ```typescript
  const sanitizedUser = {
    fullName: profile.user.fullName,
    gender: profile.user.gender,
    mobile: isAuthenticated ? profile.user.mobile : null,
    email: isAuthenticated ? profile.user.email : null,
  };
  const sanitizedPhoneNumbers = isAuthenticated ? profile.phoneNumbers : [];
  ```
  **Any user** with a valid login token receives the full mobile number and all contact numbers of any candidate. There are no checks for paid membership, profile approval status, opposite gender compatibility, mutual interest acceptance, or rate limits. A single registered member could scrape the private contact details of all 630 candidates in seconds.
- **Critical Privacy Leak (Public Biodata PDF):** [profiles/[profileId]/pdf/route.ts:L5-L82](file:///c:/Users/APPLE/nnvs-matrimony/app/api/profiles/[profileId]/pdf/route.ts#L5-L82)
  - **Zero Authentication:** Anyone on the public internet can request `/api/profiles/{profileId}/pdf`.
  - The generated PDF includes the candidate's full name, mobile number, family details, and address notes.
  - **Edge Cache Exposure:** [route.ts:L80](file:///c:/Users/APPLE/nnvs-matrimony/app/api/profiles/[profileId]/pdf/route.ts#L80) explicitly sets `Cache-Control: public, max-age=3600, s-maxage=3600`, caching private biodata and phone numbers on public CDN edge nodes and search indexers.

---

### 7. Marriage Success Tracking

#### Evidence & Analysis:
- **Audit Result: NOT IMPLEMENTED**
- No database model exists in `prisma/schema.prisma` to track marriage outcomes.
- No frontend UI or prompt exists for “Marriage Finalized” or “Mark as Married”.
- No tracking exists for source attribution ("Through Rishteclub/NNVS", "Another source", "Prefer not to disclose").
- No workflow exists to archive married profiles from public search while preserving historical records.

---

### 8. Admin Dashboard & Automation

#### Evidence & Analysis:
- **Layout & Navigation:** [app/admin/layout.tsx](file:///c:/Users/APPLE/nnvs-matrimony/app/admin/layout.tsx)
  Comprehensive navigation covering Dashboard, Profiles, Approvals, Payments, Invoices, Duplicates, Google Forms, Vendors, Backups, and Settings.
- **Role-Based Authorization:** Gated via `requireAdmin(req)` in [admin-auth.ts](file:///c:/Users/APPLE/nnvs-matrimony/lib/admin-auth.ts).
- **Critical Unprotected Admin Endpoint:** [api/admin/backup/route.ts:L13-L212](file:///c:/Users/APPLE/nnvs-matrimony/app/api/admin/backup/route.ts#L13-L212)
  While other admin API routes call `requireAdmin(req)` at the top, `/api/admin/backup/route.ts` **omits `requireAdmin(req)` completely**. If proxy middleware is bypassed or run in environments where proxy is not enforced, any caller can execute:
  `GET /api/admin/backup?type=json`
  and receive the entire database snapshot (all users, passwords, mobile numbers, and payment details).
- **Automation Deficiencies:**
  - No background task queue (e.g., BullMQ, Quirrel, Inngest, or pg-boss).
  - No automated retry logic for failed Google Form imports.
  - No automated payment dispute reconciliation or Razorpay webhook ingestion.

---

### 9. Performance, Traffic & Scalability

#### Evidence & Analysis:
- **Current Production Benchmarks (from `scripts/statistical-benchmark.ts`):**
  - `/api/public/stats`: Median **491 ms**
  - `/api/public/profiles` (Page 1, limit 24): Median **1,360 ms**
  - `/api/public/profiles?gender=FEMALE`: Median **1,461 ms**
  - `/api/public/profiles?page=2`: Median **1,338 ms**
- **Root Causes of Latency:**
  1. **Geographic Network Latency:** Vercel edge/serverless function to Neon PostgreSQL (`ap-southeast-1`, Singapore) baseline RTT is ~60–80 ms per query.
  2. **Sequential & Missing Indexes:** In production, queries filtering `WHERE isVisible = true AND (paymentCompleted = true OR approvalStatus = 'APPROVED') ORDER BY createdAt DESC` perform full table sequential scans because composite indexes have not been applied.
  3. **Uncached Lambda Executions:** Public responses return `x-vercel-cache: MISS` because production `main` lacks edge cache headers.
- **Branch `perf/phase2-optimization` Review:**
  Commit `8893344fe72cbe0ebe30aa7bc88c720e1b87e56e` adds:
  - Cache headers: `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` on public profiles, and `s-maxage=60, stale-while-revalidate=120` on stats.
  - Composite indexes in `prisma/schema.prisma`:
    ```prisma
    @@index([isVisible, createdAt(sort: Desc)])
    @@index([religion, caste])
    ```
  - *Status:* Validated locally, unmigrated and undeployed to production.

---

### 10. Data Safety, Backups & Disaster Recovery

#### Evidence & Analysis:
- **Database Engine:** Neon Serverless PostgreSQL.
- **Backup Architecture:**
  - Neon Free/Standard plans provide automatic point-in-time restore (PITR) up to the plan retention window (typically 24 hours on Free/Launch, up to 7–30 days on Scale).
  - Restore operations require creating a branch via the Neon Console or API; no automatic daily export to external cold storage (e.g., AWS S3 or Google Cloud Storage) is configured.
  - The in-app backup page (`/admin/backup`) dumps JSON snapshots to the local server disk (`backups/backup-...`). On Vercel serverless deployments, the local filesystem is ephemeral and destroyed upon container shutdown.

---

### 11. Privacy, Security & Legal Readiness

#### Evidence & Analysis:
- **Legal Notices:** Privacy Policy ([app/privacy/page.tsx](file:///c:/Users/APPLE/nnvs-matrimony/app/privacy/page.tsx)), Terms of Service ([app/terms/page.tsx](file:///c:/Users/APPLE/nnvs-matrimony/app/terms/page.tsx)), and Refund Policy ([app/refund/page.tsx](file:///c:/Users/APPLE/nnvs-matrimony/app/refund/page.tsx)) properly identify the operating entity as:
  - **Trade Name:** Trendy Traders (Proprietor: Rahul Dhamija)
  - **GSTIN:** 06APYPD6931J1ZE (Haryana)
  - **Udyam:** UDYAM-HR-06-0012710
  - **SAC:** 998399
- **Regulatory Deficiencies under Indian Law (DPDP Act 2023 & IT Act):**
  - **Missing Consent Architecture:** No auditable timestamped consent log when members submit personal/matrimonial data.
  - **Purpose Limitation Violation:** Contact numbers are exposed to any logged-in user without affirmative request or mutual consent.
  - **Right to Erasure / Account Deletion:** No automated self-service or admin workflow for complete data erasure (right to be forgotten).

---

### 12. Mobile App Readiness

#### Evidence & Analysis:
- **Authentication Protocol:** `nnvs_token` is set as an HTTP-only cookie.
  - Native mobile applications (Flutter, React Native, Swift, Kotlin) require `Authorization: Bearer <token>` header support.
  - [proxy.ts:L13](file:///c:/Users/APPLE/nnvs-matrimony/proxy.ts#L13) and [auth/me/route.ts:L7](file:///c:/Users/APPLE/nnvs-matrimony/app/api/auth/me/route.ts#L7) only read `req.cookies.get("nnvs_token")`.
- **API Response Formatting:** Many routes return mixed HTML redirects instead of standard JSON responses (e.g., [proxy.ts:L30](file:///c:/Users/APPLE/nnvs-matrimony/proxy.ts#L30) returns `NextResponse.redirect(new URL("/login"))`). Mobile clients require uniform JSON error structures with HTTP 401/403 status codes.

---

## Deliverable D: Prioritized Issue Register

| ID | Priority | Category | Issue Description & Location | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **P0** | **Authentication** | Hardcoded Master Admin Password `"Ritika@0612"` in [login-password/route.ts:L37](file:///c:/Users/APPLE/nnvs-matrimony/app/api/auth/login-password/route.ts#L37). | Full platform takeover; immediate privilege escalation. |
| **SEC-02** | **P0** | **Data Leakage** | `/api/admin/backup` lacks `requireAdmin(req)` in [backup/route.ts:L13](file:///c:/Users/APPLE/nnvs-matrimony/app/api/admin/backup/route.ts#L13). | Unauthenticated public dump of entire user and profile database. |
| **SEC-03** | **P0** | **Payment Integrity** | Public rogue route `/api/payment/complete` activates profiles for free ([complete/route.ts:L5](file:///c:/Users/APPLE/nnvs-matrimony/app/api/payment/complete/route.ts#L5)). | Zero-cost account activation; revenue loss. |
| **SEC-04** | **P0** | **Privacy** | Public unauthenticated access to full Biodata PDFs with public CDN caching ([pdf/route.ts:L5](file:///c:/Users/APPLE/nnvs-matrimony/app/api/profiles/[profileId]/pdf/route.ts#L5)). | Candidate personal data and phone numbers exposed to crawlers. |
| **SEC-05** | **P0** | **Privacy** | Authenticated contact number scraping: any logged-in user can view any candidate's phone number ([profile/[profileId]/route.ts:L71](file:///c:/Users/APPLE/nnvs-matrimony/app/api/profile/[profileId]/route.ts#L71)). | Bulk harvesting of member contact numbers. |
| **SEC-06** | **P0** | **Storage Security** | Unauthenticated arbitrary file upload to Cloudinary ([upload/route.ts:L4](file:///c:/Users/APPLE/nnvs-matrimony/app/api/upload/route.ts#L4)). | Cloudinary quota exhaustion, malware hosting risk. |
| **PAY-01** | **P1** | **Payment Lifecycle** | Missing Razorpay Webhook handler. | Lost payments when users close checkout modal. |
| **PAY-02** | **P1** | **Payment Integrity** | Client-controlled order amount in `/api/create-order` ([create-order/route.ts:L16](file:///c:/Users/APPLE/nnvs-matrimony/app/api/create-order/route.ts#L16)). | Users can pay ₹1.00 instead of ₹399/₹799. |
| **PAY-03** | **P1** | **Compliance** | Online Razorpay payments do not record GST breakdown or invoice numbers ([verify-payment/route.ts:L80](file:///c:/Users/APPLE/nnvs-matrimony/app/api/verify-payment/route.ts#L80)). | GST tax non-compliance; missing audit trail. |
| **REG-01** | **P1** | **User Experience** | Registration route does not set session cookie ([register/route.ts:L304](file:///c:/Users/APPLE/nnvs-matrimony/app/api/register/route.ts#L304)). | Users lose session immediately after sign-up. |
| **SYNC-01**| **P1** | **Data Integrity** | Google Form sync creates synthetic `9900xxxxxx` numbers ([google-form/route.ts:L282](file:///c:/Users/APPLE/nnvs-matrimony/app/api/integrations/google-form/route.ts#L282)). | Violates rule prohibiting IDs for invalid contact numbers. |
| **FEAT-01**| **P1** | **Core Feature** | Marriage success tracking completely missing. | Inability to track success outcomes or archive married profiles. |
| **PERF-01**| **P2** | **Performance** | High production query latency (1,300–1,460ms); missing indexes and cache headers. | Poor search experience and slow initial page loads. |
| **SESS-01**| **P2** | **Session Mgmt** | No session revocation table or refresh token mechanism. | Inability to revoke sessions upon password reset. |
| **ADM-01** | **P2** | **Automation** | Lack of automated background job queues for sync retries and invoice delivery. | Heavy reliance on manual administrator intervention. |
| **MOB-01** | **P3** | **Architecture** | API authentication lacks `Authorization: Bearer` header support. | Blocks future native iOS/Android application development. |

---

## Deliverable E: Staged Implementation Roadmap

```
+---------------------------------------------------------------------------------------------------------+
|                                    STAGED IMPLEMENTATION ROADMAP                                        |
+---------------------------------------------------------------------------------------------------------+
  Phase 1: Critical Security & Data Protection (P0 Hotfixes)
  ├── Remove hardcoded master password & hardcoded JWT/SMS secrets
  ├── Protect /api/admin/backup with requireAdmin(req)
  ├── Remove rogue /api/payment/complete endpoint
  ├── Secure /api/upload with authentication, file size & type validation
  └── Close contact leaks on /api/profile/[profileId] and /api/profiles/[profileId]/pdf
                                     |
  Phase 2: Authentication, Session & Registration Continuity
  ├── Set HTTP-only cookie upon successful registration in /api/register
  ├── Implement dual-mode auth: HTTP-only cookie + Authorization: Bearer header
  ├── Introduce "Remember this device" setting (30 days vs 24 hours session)
  └── Standardize Google Forms mobile validation (reject missing numbers without synthetic IDs)
                                     |
  Phase 3: Payment Lifecycle, Webhooks & GST Invoicing
  ├── Server-side price calculation for Razorpay orders (no client-submitted amounts)
  ├── Implement dedicated Razorpay Webhook (/api/razorpay/webhook) with signature check
  ├── Generate unique GST invoice numbers and persist tax breakdowns on online payments
  └── Build server-side downloadable PDF GST invoices (PDFKit)
                                     |
  Phase 4: Matchmaking Permissions & Marriage Success Tracking
  ├── Build verified contact access controls (quota, consent, and mutual interest gating)
  ├── Schema migration for Marriage Tracking (status, source, date, admin review)
  ├── Member-facing "Mark as Married" modal with accidental-click undo
  └── Profile archival logic to remove married candidates from active search feeds
                                     |
  Phase 5: Performance, Indexing & Edge Caching
  ├── Apply non-blocking PostgreSQL composite indexes from branch perf/phase2-optimization
  ├── Enable Vercel Edge caching headers on public routes (s-maxage=30, stale-while-revalidate=60)
  └── Fix DIRECT_URL in .env to use non-pooled direct connection for migrations
                                     |
  Phase 6: Mobile App Readiness, UX & Polish
  ├── Standardize API error responses to structured JSON
  └── Multi-step form autosave (localStorage draft recovery with server autosave)
+---------------------------------------------------------------------------------------------------------+
```

### Phase Details & Acceptance Criteria

#### Phase 1: Data Integrity & Critical Security (P0)
- **Dependencies:** None.
- **Risks:** Minimal; purely defensive hardening.
- **Tests:** Verify unauthorized calls to `/api/admin/backup`, `/api/upload`, and `/api/payment/complete` return HTTP 401/403/404. Verify `Ritika@0612` cannot authenticate. Verify `/pdf` endpoint requires member authorization.
- **Acceptance Criteria:** Zero open endpoints, zero exposed phone numbers on public URLs, and zero backdoor credentials.

#### Phase 2: Registration, Session & Google Forms Sync
- **Dependencies:** Phase 1 complete.
- **Risks:** Form submission regression if cookie parameters are improperly formatted.
- **Tests:** End-to-end registration from mobile OTP verification through review page; verify session persists across full browser refreshes. Test Google Forms sync with missing phone numbers; verify record is flagged for admin review without assigning synthetic numbers.
- **Acceptance Criteria:** Seamless sign-up to payment flow; 100% adherence to phone validation rules.

#### Phase 3: Payment Lifecycle & Automated GST Invoicing
- **Dependencies:** Phase 2 complete.
- **Risks:** Duplicate charges if idempotency keys are not enforced.
- **Tests:** Test order creation with manipulated payload; ensure server enforces correct fee. Simulate webhook delivery and network drop; ensure order activates automatically. Verify GST invoice PDF download.
- **Acceptance Criteria:** Zero payment loss, zero price tampering, and automated compliant tax invoice creation for every paid registration.

#### Phase 4: Marriage Tracking & Contact Access Controls
- **Dependencies:** Phase 3 complete.
- **Risks:** Accidental delisting of active profiles.
- **Tests:** Test "Mark as Married" workflow; verify profile is archived from public search feeds while payment and profile history remain in database. Test contact view limits.
- **Acceptance Criteria:** Verified contact permission checks; reliable marriage reporting and archival.

#### Phase 5: Performance & Edge Caching
- **Dependencies:** Branch `perf/phase2-optimization`.
- **Risks:** Stale cache delivering recently modified profiles.
- **Tests:** Run 6-run statistical benchmark on production; verify `x-vercel-cache: HIT` and response times < 250ms for cached responses. Verify migration runs cleanly without locking tables.
- **Acceptance Criteria:** Public listing query response time dropped by > 70%.

#### Phase 6: Mobile App Readiness & UX
- **Dependencies:** Phases 1–5.
- **Risks:** None.
- **Tests:** Test API calls with `Authorization: Bearer <token>` in Postman/curl without cookies.
- **Acceptance Criteria:** Complete API parity for web and future native mobile apps.

---

## Deliverable F: Estimated Cost Implications

| Category | Item / Capability | Cost Impact | Recommendation |
| :--- | :--- | :--- | :--- |
| **Free Improvements** | Security hardening, removing rogue endpoints, fixing backdoors, adding `requireAdmin`, enforcing server-side pricing. | **₹0 (Code only)** | Implement immediately in Phase 1. |
| **Free Improvements** | Edge caching headers (`s-maxage`), optimizing Prisma queries, applying composite indexes. | **₹0 (Code only)** | Implement in Phase 5; utilizes existing Vercel CDN capabilities. |
| **Free Improvements** | Next.js API route Bearer token parsing, session cookie fixes. | **₹0 (Code only)** | Implement in Phase 2. |
| **Existing Plan Capabilities** | Neon PostgreSQL database operations and connection pooling. | **Included in current plan** | Current 630 profiles / 633 users use ~15 MB storage (well within Neon limits). |
| **Existing Plan Capabilities** | 2Factor.in SMS transactional credits. | **Existing pre-paid credits** | Strictly use SMS route; continue avoiding voice OTPs. |
| **Existing Plan Capabilities** | Razorpay Standard Checkout (2% + GST per successful transaction). | **Standard gateway fee** | No fixed monthly fee required. |
| **Existing Plan Capabilities** | Cloudinary Free Tier (25 credits / mo). | **Included in free tier** | Current ~650 images use < 1 GB. Sufficient once unauthenticated uploads are blocked. |
| **Potential Future Upgrades** | Neon Database Region Migration to India (`ap-south-1` Mumbai). | **₹0 to minimal (depends on Neon plan)** | Optional future optimization to reduce network latency from Singapore (~70ms) to Mumbai (~15ms). |
| **Potential Future Upgrades** | Dedicated Redis queue (Upstash Serverless Redis) for background jobs. | **Free tier available ($0 up to 10k commands/day)** | Recommend evaluating only if asynchronous Google Forms volume exceeds 500 rows/hour. |

---

## Deliverable G: Safe Staging & Testing Plan

1. **Safety Constraints:**
   - **No Real Payments:** Test Razorpay exclusively using Razorpay Test Mode keys (`rzp_test_...`) with test cards and mock UPI handles (`success@razorpay`).
   - **No Live SMS Charges:** Use test mobile numbers with mock OTP verifiers or a staging bypass during development; do not burn live 2Factor DLT SMS credits for automated test suites.
   - **No Production Data Mutation:** Run schema index migrations during off-peak hours using `CREATE INDEX CONCURRENTLY` or safe Prisma migrations with an isolated backup branch.
   - **Preserve Checkpoints:** Retain git tag `checkpoint-pre-perf-phase2` and the `perf/phase2-optimization` branch without force-pushing.
2. **Verification Protocol:**
   - Pre-deployment dry runs using `scripts/raw-explain-analyze.ts` and `scripts/check-database-count.ts`.
   - Post-deployment smoke tests validating authentication, profile visibility, and contact privacy.

---

## The 10 Most Important Gaps

1. **Hardcoded Master Password:** Plaintext admin backdoor `"Ritika@0612"` committed in `login-password/route.ts`.
2. **Unauthenticated Full Database Dump:** `/api/admin/backup` lacks `requireAdmin(req)` protection.
3. **Rogue Payment Bypass Endpoint:** `/api/payment/complete` allows free account activation without Razorpay verification.
4. **Public Biodata PDF & Edge Cache Leak:** `/api/profiles/[profileId]/pdf` exposes full personal and contact details with zero authentication and caches them publicly on the CDN.
5. **Contact Number Scraping Vulnerability:** Any authenticated member can access the private contact details of all 630 candidates via `/api/profile/[profileId]`.
6. **Unauthenticated File Uploads:** `/api/upload` allows anyone to upload arbitrary files to Cloudinary without restrictions.
7. **Missing Razorpay Webhook:** Platform drops payments if a user closes their browser before the client redirects to `/api/verify-payment`.
8. **Client-Manipulated Pricing:** `/api/create-order` trusts the `amount` sent by the browser instead of calculating it server-side.
9. **Registration Session Loss:** `/api/register` does not set a session cookie, preventing users from resuming registration or payment smoothly.
10. **Completely Missing Marriage Tracking:** No models, routes, or interfaces exist to mark profiles as married or archive them from search.

---

## Top Risks

1. **Data Breach / Regulatory Non-Compliance:** Unprotected backup and PDF endpoints expose member contact numbers publicly, creating severe privacy and legal liabilities under India's Digital Personal Data Protection (DPDP) Act.
2. **Revenue Fraud:** Attackers can bypass payment entirely via `/api/payment/complete` or tamper with the fee via `/api/create-order`.
3. **Account Hijacking:** The hardcoded master password allows unauthorized administrative access.
4. **Data Corruption / ID Fragmentation:** Silent assignment of synthetic `9900xxxxxx` phone numbers in Google Forms sync violates core business rules.

---

## Recommended Order of Work

```
1. Phase 1: Security & Privacy Hotfixes (P0) — Immediate Priority
   Remove backdoors, secure backup/upload routes, remove rogue payment bypass, restrict contact details and PDF endpoints.
2. Phase 2: Registration, Session Continuity & Google Forms Sync
   Set registration session cookie, support Bearer tokens, implement "Remember this device", fix mobile validation in sync.
3. Phase 3: Razorpay Webhooks, Server-Side Pricing & GST Invoicing
   Enforce server-side pricing, implement Razorpay webhook, persist invoice records on online payments, generate PDF invoices.
4. Phase 4: Marriage Success Tracking & Contact Access Controls
   Implement "Mark as Married" feature and schema, archive married profiles, build contact access permissions.
5. Phase 5: Production Performance, Indexes & Edge Caching
   Apply composite database indexes and edge cache headers from branch perf/phase2-optimization.
6. Phase 6: Mobile App Readiness & UX Improvements
   Standardize JSON responses and implement draft autosave.
```

*Audit report compiled and verified against codebase state. Ready for user review and approval prior to implementation.*

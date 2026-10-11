# Architecture and Feature Audit Report: RishteClub / NNVS Matrimony

**Date:** 10 October 2026  
**Audited Codebase:** `nnvs-matrimony` (Next.js 16 + React 19 + Prisma ORM + PostgreSQL / Supabase)  
**Live Site & Brand Association:** [RishteClub](https://www.rishteclub.com) / NNVS Matrimony (Nar Naari Vivah Sewa)  
**Audit Scope:** Full architectural, functional, security, and SEO audit against 8 project specifications.

---

## Executive Summary & Scorecard

| # | Audit Area | Compliance | Risk Level | Status Summary |
|---|---|:---:|:---:|---|
| **1** | **Pricing & Payment Gateway (Razorpay)** | **20%** | **CRITICAL** | Male (₹799) & Female (₹399) overridden by flat ₹1100 fee. Astro (₹99) uses fake client `setTimeout`. Zero webhook endpoints. Profiles leak live prior to admin approval. |
| **2** | **Google Forms / Sheet Sync & Migration** | **50%** | **HIGH** | 1:1 database constraint prevents multi-profile accounts. Sibling profiles handled via dummy mobile strings (`${mobile}_r${row}`). No profile switcher dashboard. |
| **3** | **PDF Generation & Storage** | **70%** | **MEDIUM** | PDF generator functional via pdfkit, but categorizes only by marital status/gender into `D:\` drive; caste categorization missing. Automated triggers absent on registration/approval. |
| **4** | **Role-Based Permissions & Edit Rules** | **40%** | **HIGH** | Regular users can update `fullName` via `PUT /api/profile`. Admin lacks full CRUD (no endpoints or UI to update candidate details or delete profiles). |
| **5** | **Admin Matchmaking & Export** | **10%** | **HIGH** | Dedicated admin matchmaking tool and filtered list export (CSV/Excel/PDF) are completely missing. |
| **6** | **Post-Payment AI Matchmaking Flow** | **35%** | **MEDIUM** | AI modal exists on homepage for public visitors, but does NOT trigger post-payment as an onboarding quiz. Quiz answers are not persisted to database. |
| **7** | **Security & Backend Architecture** | **55%** | **CRITICAL** | Hardcoded JWT secret fallback in source code. Client controls order amount in payment API. Fast2SMS unmerged (using 2Factor.in). No IP-level rate limiting on OTP. |
| **8** | **SEO Setup** | **95%** | **LOW (FIXED)** | Comprehensive privacy guardrails (`noindex` on biodatas), 19 canonical routes, 8 location/community landing pages, valid JSON-LD schemas, and asset optimizations completed. |

---

## 1. Pricing & Payment Gateway (Razorpay)

### Specification Requirements
- **Male:** ₹799 + 18% GST (Base: ₹799, CGST 9%: ₹71.91, SGST 9%: ₹71.91, Gross: **₹942.82**)
- **Female:** ₹399 + 18% GST (Base: ₹399, CGST 9%: ₹35.91, SGST 9%: ₹35.91, Gross: **₹470.82**)
- **Astro Suggestion:** ₹99 + 18% GST (Base: ₹99, CGST 9%: ₹8.91, SGST 9%: ₹8.91, Gross: **₹116.82**)
- **Payment Webhook Verification:** HMAC-SHA256 signature validation on server.
- **Approval Gate:** Profiles must strictly remain inactive/unapproved until successful payment or manual Admin exemption (`is_payment_exempted = true`).

### Responsible Code Files
- `lib/gst.ts`: Global billing entity constants and fee structures.
- `app/api/settings/route.ts`: Default fee configuration route.
- `app/payment/page.tsx`: Online checkout UI.
- `app/api/create-order/route.ts`: Razorpay order creation endpoint.
- `app/api/verify-payment/route.ts`: Client-triggered payment verification.
- `app/astrology/page.tsx`: Astrology suggestion and remedy UI.
- `app/api/public/profiles/route.ts`: Public profile search and display logic.
- `prisma/schema.prisma`: Schema definitions for `Profile`, `Payment`, and `AdminSetting`.

### Current Gaps & Vulnerabilities
1. **Flat Fee Override Bug:**
   - In `lib/gst.ts` (lines 62–67), gender fees are defined (`male: 799`, `female: 399`).
   - However, `app/payment/page.tsx` fetches `/api/settings`, which returns a hardcoded `registrationFee: 1100`.
   - The payment UI charges ₹1100 + 18% GST (**₹1,298.00**) to **both male and female candidates**, violating the tiered pricing spec.
2. **Fake Client-Side Astro "Unlock":**
   - In `app/astrology/page.tsx` (lines 179–191), the ₹99 Lal Kitab remedy feature displays a static UPI QR code.
   - When a user submits any UTR or clicks unlock, a client-side `setTimeout(1500)` unlocks the remedies immediately without payment validation, database recording, or GST invoicing.
3. **Missing Razorpay Webhook Endpoint:**
   - There is **no Razorpay webhook endpoint** (`/api/razorpay/webhook` or `/api/webhook`) in the application.
   - If a candidate's internet drops, browser freezes, or they close the tab after paying, the payment is never recorded in the database.
   - Zero HMAC webhook signature validation is implemented.
4. **Client-Controlled Amount Injection:**
   - `app/api/create-order/route.ts` (lines 16–28) accepts `amount` directly from the client JSON body without verifying the profile's gender or service type against database truth. A malicious user can alter the payload to create an order for ₹1.00.
5. **Premature Public Activation Before Admin Approval:**
   - When payment succeeds in `app/api/verify-payment/route.ts` (lines 96–97), the profile is set to `isVisible: true`.
   - `app/api/public/profiles/route.ts` queries `{ isVisible: true, OR: [{ paymentCompleted: true }, { approvalStatus: "APPROVED" }] }`.
   - Consequently, newly paid profiles go live instantly on the website **before an admin verifies their biodata or photos**.
6. **Missing Schema Fields for Exemption:**
   - Neither `Profile` nor `User` in `prisma/schema.prisma` contains `isPaymentExempted` or `paymentExemptionReason`. The admin has no audit trail for manual fee waivers.

### Immediate Fixes Required
1. Update `app/payment/page.tsx` to read the candidate profile's gender and apply `BUSINESS_INFO.fees.male` (₹799) or `BUSINESS_INFO.fees.female` (₹399).
2. Connect `app/astrology/page.tsx` to the Razorpay SDK using `amount = 116.82` (₹99 + 18% GST) and generate official GST invoices.
3. Add a dedicated webhook route (`app/api/razorpay/webhook/route.ts`) validating `x-razorpay-signature` using `crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)`.
4. Validate order amounts on the server in `app/api/create-order/route.ts` by fetching the target profile from Prisma rather than trusting the client payload.
5. Add `isPaymentExempted Boolean @default(false)` and `paymentExemptionReason String?` to the Prisma schema.
6. Change public profile queries from `OR` to `AND`: profiles must have `approvalStatus == "APPROVED"` AND (`paymentCompleted == true` OR `isPaymentExempted == true`) before going live.

---

## 2. Google Forms / Sheet Sync & Migration

### Specification Requirements
- Integration syncing Google Sheet / Form entries into the database.
- Mapping existing imported users by mobile number.
- Multi-profile support: If 1 phone number has multiple profiles (e.g., a parent managing 2 siblings), they must belong to 1 user account with a profile switcher dashboard.
- Imported entries must require `is_admin_approved = true` before going public/live.

### Responsible Code Files
- `app/api/integrations/google-form/route.ts`: Real-time and batch Google Form webhook / sync handler.
- `app/api/admin/import/route.ts`: Admin spreadsheet CSV import route.
- `prisma/schema.prisma`: Data model architecture.
- `app/dashboard/page.tsx`: User dashboard.

### Current Gaps & Vulnerabilities
1. **Database Schema 1:1 Restriction (`@unique`):**
   - In `prisma/schema.prisma`:
     ```prisma
     model Profile {
       userId String @unique
       user   User   @relation(fields: [userId], references: [id])
     }
     ```
   - Each `User` record can have at most **one** `Profile`.
2. **Artificial Mobile String Hack:**
   - In `app/api/integrations/google-form/route.ts` (lines 322–326):
     ```typescript
     if (!existingProfile && existingUser) {
       isSharedMobileApplicant = true;
       effectiveMobile = `${mobile}_r${rowIndex}`;
     }
     ```
   - When a parent submits a second child's biodata under the same phone number, the system creates a dummy user with mobile `9871592002_r14`.
   - The parent cannot log in via OTP to access this second profile because OTP authentication requires a clean 10-digit number.
3. **No Profile Switcher Dashboard:**
   - `app/dashboard/page.tsx` only loads a single profile tied to the authenticated user's `userId`. No multi-profile switcher or dropdown exists.
4. **Visibility Logic on Re-sync:**
   - In `app/api/integrations/google-form/route.ts` (lines 504, 527–529), if an existing profile previously had `isLegacyApproved = true`, re-syncing keeps it `APPROVED` and `isVisible = true`. While new entries are placed in `UNDER_REVIEW`, legacy imported profiles could be exposed if flagged improperly.

### Immediate Fixes Required
1. **Schema Migration:** Change `Profile.userId` from `@unique` to non-unique, updating the relation to `profiles Profile[]` on `User`.
2. **Unified Account Linking:** When importing or syncing a sheet row whose mobile already exists, link the new profile to the existing `User.id` instead of generating artificial `${mobile}_r${rowIndex}` user records.
3. **Dashboard Profile Switcher:** Update `app/dashboard/page.tsx` to list all profiles owned by the logged-in parent with an active profile toggle selector.
4. **Strict Approval Default:** Ensure all imported profiles explicitly enforce `approvalStatus = "PENDING"` and `isVisible = false` until an admin verifies and approves them.

---

## 3. PDF Generation & Storage

### Specification Requirements
- PDF download button for users on their live biodata.
- Automated server-side PDF generation saving copies categorized by caste/category/gender into designated local directories.

### Responsible Code Files
- `lib/pdf/biodata-generator.ts`: PDF generation engine powered by `pdfkit`.
- `app/api/profiles/[profileId]/pdf/route.ts`: On-demand PDF streaming endpoint.
- `app/admin/profiles/[id]/page.tsx`: Admin profile view containing PDF download link.
- `scripts/generate-all-biodata-pdfs.ts`: Offline batch generation script.

### Current Gaps & Vulnerabilities
1. **Missing Caste-Based Categorization:**
   - In `lib/pdf/biodata-generator.ts` (lines 551–577), `getBiodataCategoryFolder` only classifies candidates into four categories:
     - `Divorced Female`
     - `Divorced Male`
     - `Never Married Female`
     - `Never Married Male`
   - It **does not categorize by caste or community** (e.g., Punjabi, Arora, Bania, Brahmin).
2. **Hardcoded Drive Path Dependency:**
   - In `lib/pdf/biodata-generator.ts` (lines 594–609), the target base directory is hardcoded to `D:\NNVS\Website Bio PDF`.
   - On Linux servers, Docker containers, or systems without a `D:\` drive, this call throws an exception and falls back to `public/generated-biodatas`.
3. **Absence of Event-Driven Automated Generation:**
   - PDF generation is purely on-demand or manual.
   - It is **not triggered automatically** when a user registers, when a Google Form row is imported, or when an admin clicks "Approve".

### Immediate Fixes Required
1. Enhance `getBiodataCategoryFolder` to include caste/community:  
   `[BaseDir]/[Caste or Community]/[Marital Status - Gender]/[ProfileID]_[Name].pdf`.
2. Use an environment variable `BIODATA_PDF_STORAGE_DIR` with a platform-independent fallback (`process.cwd()/storage/biodatas`).
3. Add a post-approval event hook in `app/api/admin/profiles/approve/route.ts` to generate and persist the categorized PDF upon admin approval.

---

## 4. Role-Based Permissions & Edit Rules

### Specification Requirements
- Users CANNOT edit `name` and `gender` once submitted.
- Admin has full CRUD rights (can edit name, gender, payment status, approval, etc.).

### Responsible Code Files
- `app/api/profile/route.ts`: User profile self-service API (`GET`, `PUT`).
- `app/profile/edit/page.tsx`: Candidate edit profile form.
- `app/api/admin/profiles/route.ts`: Admin list endpoint.
- `app/api/admin/profiles/[id]/route.ts`: Admin single profile endpoint.
- `lib/admin-auth.ts`: Admin role verification.

### Current Gaps & Vulnerabilities
1. **User Can Alter Legal Name:**
   - In `app/api/profile/route.ts` (lines 124–125, 187–208), the `PUT` handler accepts `fullName` in the JSON request body and updates `tx.user.update({ data: { fullName } })` and `tx.profile.update({ data: { firstName: fullName } })`.
   - Regular users can alter their name after registration, violating the immutability rule.
2. **Admin Full CRUD Is Incomplete:**
   - `app/api/admin/profiles/[id]/route.ts` implements **only `GET`**.
   - There are **no `PUT`, `PATCH`, or `DELETE` endpoints** allowing admins to update a profile's `name`, `gender`, `dateOfBirth`, `paymentCompleted`, or delete erroneous/test records.
   - The admin UI only allows approving, rejecting, or toggling visibility.

### Immediate Fixes Required
1. In `app/api/profile/route.ts`, strip `fullName` and `gender` from the payload in user `PUT` operations. Display these fields as read-only in `app/profile/edit/page.tsx` with a note: *"To change name or gender, please contact admin support."*
2. Implement `PUT` and `DELETE` methods in `app/api/admin/profiles/[id]/route.ts` guarded by `requireAdmin(req)`, allowing admins to update all candidate fields.

---

## 5. Admin Matchmaking & Export

### Specification Requirements
- Admin dashboard feature to select any profile, run matching filters, view compatible candidates, and download the filtered list (CSV/Excel/PDF).

### Responsible Code Files
- `app/admin/profiles/page.tsx`: Admin profiles management interface.
- `app/admin/profiles/[id]/page.tsx`: Admin single profile view.
- `app/api/admin/profiles/route.ts`: Admin profile querying API.

### Current Gaps & Vulnerabilities
1. **Feature Completely Missing:**
   - There is no UI or API endpoint for an admin to select a candidate and compute potential matches based on age, height, community, education, and marital status.
2. **Missing Bulk/Filtered Export:**
   - In `app/admin/profiles/page.tsx`, the `FileDown` icon is imported on line 18 but never rendered.
   - The only download links available are individual biodata PDFs and individual GST invoices.
   - There is no mechanism to export search results or candidate lists to **CSV, Excel, or tabular PDF**.

### Immediate Fixes Required
1. Create an admin matchmaking tab or modal in `app/admin/profiles/[id]/page.tsx` allowing admins to run candidate matching with adjustable filters (age gap, caste preference, location, education).
2. Build an export utility (`app/api/admin/profiles/export/route.ts`) supporting `format=csv` and `format=xlsx` streaming compatible candidate datasets.

---

## 6. Post-Payment AI Matchmaking Flow

### Specification Requirements
- Onboarding popup/modal after payment triggers an interactive preference quiz (hobbies, interests, lifestyle, partner expectations).
- Match score engine recommending profiles based on these attributes.

### Responsible Code Files
- `components/AIMatchmakerModal.tsx`: Interactive multi-step preference wizard.
- `app/api/ai/matchmaker/route.ts`: Multi-factor scoring engine.
- `app/payment/page.tsx`: Payment completion handler.
- `components/RazorpayCheckoutButton.tsx`: Client checkout callback.
- `app/dashboard/page.tsx`: User dashboard landing.

### Current Gaps & Vulnerabilities
1. **Misplaced Modal Trigger:**
   - `AIMatchmakerModal` is currently embedded on the **public homepage** (`components/HomeClient.tsx`), accessible to any unauthenticated visitor.
   - It is **not triggered post-payment**. After successful payment in `RazorpayCheckoutButton.tsx` (lines 163–170), the user is redirected directly to `/dashboard` or `/invoice/[id]`.
2. **Quiz Data Is Never Saved:**
   - Answers submitted in `AIMatchmakerModal` (diet, lifestyle, partner expectations) are passed into a temporary API call to fetch top scores, but **never saved to the database** in `PartnerPreference` or `Profile`.
3. **Scoring Engine Baseline:**
   - `app/api/ai/matchmaker/route.ts` assigns an arbitrary baseline score of 72 to all candidates regardless of match criteria.

### Immediate Fixes Required
1. Trigger `AIMatchmakerModal` automatically upon post-payment redirection to `/dashboard?onboarding=true`.
2. Update the modal submission to persist preferences to `prisma.partnerPreference.upsert()` for the authenticated user before displaying recommendations.
3. Refactor `app/api/ai/matchmaker/route.ts` to calculate scores based on stored partner preferences.

---

## 7. Security & Backend Architecture

### Specification Requirements
- Prevent SQL Injection, XSS, and unauthorized API profile manipulation.
- Phone OTP flow via Fast2SMS (rate limiting, secure session/JWT).
- Storage of sensitive biodata and phone numbers (access control).

### Responsible Code Files
- `lib/jwt.ts`: Token signing and verification.
- `app/api/auth/send-otp/route.ts`: OTP issuance and rate limiting.
- `app/api/auth/verify-otp/route.ts`: OTP verification and cookie generation.
- `lib/sms/twofactor.ts`: Active SMS integration.
- `lib/sms/fast2sms.ts`: (Stashed / unmerged Fast2SMS service).
- `app/api/public/profiles/route.ts`: Public profile data sanitizer.

### Current Gaps & Vulnerabilities

```
+-------------------------------------------------------------------------+
|                        CRITICAL SECURITY FINDINGS                       |
+-------------------------------------------------------------------------+
| 1. HARDCODED JWT FALLBACK SECRET                                        |
|    Location: lib/jwt.ts (lines 4-8)                                     |
|    Risk: If JWT_SECRET or NEXTAUTH_SECRET is omitted from environment,  |
|    the app falls back to a static string in source code. Anyone can     |
|    forge admin JWT tokens and bypass authentication entirely.           |
+-------------------------------------------------------------------------+
| 2. FAST2SMS NOT MERGED IN ACTIVE CODE                                   |
|    Location: lib/sms/twofactor.ts vs data-audit-wip.patch               |
|    Risk: Production is running 2Factor.in, not Fast2SMS. Fast2SMS work  |
|    remains isolated in an unmerged branch/patch.                        |
+-------------------------------------------------------------------------+
| 3. MISSING IP-BASED OTP RATE LIMITING                                   |
|    Location: app/api/auth/send-otp/route.ts                             |
|    Risk: Rate limits are enforced by mobile number only (8/hr). An      |
|    attacker can cycle through thousands of phone numbers from a single  |
|    IP, exhausting SMS credits (SMS bombing).                            |
+-------------------------------------------------------------------------+
| 4. CLIENT PAYMENT AMOUNT TAMPERING                                      |
|    Location: app/api/create-order/route.ts                              |
|    Risk: Client supplies the amount in paise without server             |
|    validation against profile gender. A user can create an order for    |
|    100 paise (₹1.00) and unlock full membership.                        |
+-------------------------------------------------------------------------+
```

### Immediate Fixes Required
1. Remove the static fallback secret from `lib/jwt.ts`. Throw an explicit startup error if `JWT_SECRET` is missing.
2. Add in-memory or Redis-based IP rate limiting to `app/api/auth/send-otp/route.ts` (e.g., max 10 requests per 10 minutes per IP).
3. Merge and verify `lib/sms/fast2sms.ts` into active code, configuring official DLT-approved template IDs.
4. Enforce strict server-side price calculation in `app/api/create-order/route.ts`.

---

## 8. SEO Setup

### Specification Requirements
- Meta tags, Dynamic Schema Markup (Profile/Service/Organization), Canonical URLs, Sitemap generation, OpenGraph tags targeting Indian matchmaking keywords.

### Responsible Code Files
- `app/layout.tsx`: Root metadata and organization structured data.
- `app/sitemap.ts`: Automated sitemap generator.
- `app/robots.ts`: Crawler access directives.
- `app/matrimony/[slug]/page.tsx` & `layout.tsx`: 8 regional/community landing pages.
- `components/JsonLd.tsx`: Structured data components.

### Current Status vs Requirements
- **Status: COMPLETED & VERIFIED (PASS)**
  - Dynamic schemas (`Organization`, `WebSite`, `Service`, `FAQPage`, `BreadcrumbList`) implemented.
  - Self-referencing canonical URLs configured across all pages.
  - All private individual biodata pages (`/profile/[id]`) marked with `noindex, nofollow, noimageindex` and excluded from `sitemap.xml`.
  - 19 clean, canonical URLs served in `sitemap.xml`.
  - 8 location & community hubs generated (`delhi-ncr`, `gurugram`, `haryana`, `punjabi`, `arora`, `aggrawal`, `bania`, `brahmin`).
  - Production build succeeds with 89/89 pages generated statically.

---

## Prioritized Remediation Roadmap

```
PHASE 1: CRITICAL SECURITY & REVENUE INTEGRITY (Immediate)
├── 1. Fix lib/jwt.ts: Remove hardcoded fallback secret; require process.env.JWT_SECRET.
├── 2. Fix app/payment/page.tsx & /api/create-order: Enforce ₹799 (Male) & ₹399 (Female) + 18% GST.
├── 3. Build app/api/razorpay/webhook: HMAC-SHA256 signature verification for resilient payment capture.
└── 4. Gate profile public visibility: Require approvalStatus == "APPROVED" AND paymentCompleted == true.

PHASE 2: DATA INTEGRITY & MULTI-PROFILE SUPPORT
├── 1. Refactor Prisma Schema: Allow User to own multiple Profile records (userId non-unique).
├── 2. Clean up Google Form sync: Link shared mobile entries to single parent User.
├── 3. Build dashboard profile switcher in app/dashboard/page.tsx.
└── 4. Implement Fast2SMS provider into lib/sms/ and add IP rate limiting on send-otp.

PHASE 3: FEATURE COMPLETION
├── 1. Connect Astrology ₹99 + GST to Razorpay checkout with valid GST invoice generation.
├── 2. Add full CRUD (PUT, DELETE) in app/api/admin/profiles/[id]/route.ts.
├── 3. Build Admin Matchmaker & Filtered Export (CSV/Excel) in app/admin/profiles.
├── 4. Connect post-payment flow to AIMatchmakerModal and save answers to PartnerPreference.
└── 5. Add caste categorization to lib/pdf/biodata-generator.ts with automated post-approval trigger.
```

---
*Report generated strictly for architectural review. No production code or database records were modified during this audit.*

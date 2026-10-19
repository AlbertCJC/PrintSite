# PrintSite — E2E Testing Plan

**Date:** 2026-10-18  
**Status:** Proposed  
**Stack:** Vercel + Vite + vanilla JS + Supabase Storage  
**Production URL:** https://maritess-printing.vercel.app

## 1. Purpose

Verify PrintSite works end-to-end as intended per the design spec (`docs/superpowers/specs/2026-10-18-printsite-design.md`):

> Manual end-to-end: local edit → upload → admin list → convert → print → delete  
> API endpoints tested with curl/Postman  
> Client editing (canvas merge, pdf-lib page removal) verified in browser

## 2. Known deployment note (Vercel security checkpoint)

The deployed Vercel project is behind `vercel_authentication` / a security checkpoint. Non-browser clients (`curl`, `vercel curl`) are served a JS bot-checkpoint page and **do not reach the API functions**. Therefore:

- **API endpoint tests MUST be run from a real browser** (the frontend's own API calls from `/` and `/admin` run in-browser and pass the checkpoint).
- `curl`-based API testing only works locally via `vercel dev` (unauthenticated) or after disabling the deployment checkpoint in the Vercel dashboard.

## 3. Test environment

- Local: `npm run build` then serve `packages/web/dist`, or `npm run dev` (runs `cd packages/web && npm run dev` → Vite on :5173).
- Deployed: https://maritess-printing.vercel.app (customer at `/`, admin at `/admin`).
- Supabase bucket: `PrintSite` (empty at start of each E2E run).

## 4. Test cases

### 4.1 Frontend page loads

| # | Step | Expected |
|---|------|----------|
| 4.1.1 | Open `https://maritess-printing.vercel.app/` | Customer upload page renders (file picker, edit section hidden, upload button disabled) |
| 4.1.2 | Open `https://maritess-printing.vercel.app/admin` | Admin page renders (empty uploads table, Refresh button) |

### 4.2 Customer upload

| # | Step | Expected |
|---|------|----------|
| 4.2.1 | Select an image file (e.g. a small PNG/JPG) | File name + size shown; edit section shown; upload button enabled |
| 4.2.2 | Click "Upload to Server" | Message "Uploaded: <filename> (<id>)"; form resets; file stored in Supabase Storage |

API: `POST /api/upload` (multipart `file`) → JSON `{ id, filename, size, type }`.

### 4.3 Admin list

| # | Step | Expected |
|---|------|----------|
| 4.3.1 | Open `/admin` (or click Refresh) | Table lists the uploaded file with filename, size, type, uploaded date |
| 4.3.2 | Image row shows "Convert to PDF" + "Print" + "Delete" | Buttons present and enabled |

API: `GET /api/admin/list` → JSON `{ uploads: [{ id, filename, size, type, uploadedAt, url }] }`.

### 4.4 Convert image → PDF

| # | Step | Expected |
|---|------|----------|
| 4.4.1 | Click "Convert to PDF" on an image row | Message "Converted to PDF: <pdfUrl>"; table refreshes |
| 4.4.2 | The PDF is stored in Supabase Storage under `<id>.pdf` | `pdfUrl` points to `.../storage/v1/object/public/PrintSite/<id>.pdf` |

API: `POST /api/admin/convert` (JSON `{ id }`) → JSON `{ id: <id>.pdf, pdfUrl }`. Server fetches image → pdf-lib embeds → uploads PDF.

### 4.5 Print PDF

| # | Step | Expected |
|---|------|----------|
| 4.5.1 | Click "Print" on an image row | Browser opens the PDF in a new tab and triggers `window.print()` |

Admin JS: `window.open('/api/admin/download/<id>')` then `win.print()`.

### 4.6 Download original (non-image)

| # | Step | Expected |
|---|------|----------|
| 4.6.1 | Upload a non-image file (e.g. .txt/.docx) | Row shows a "Download" link (Convert disabled) |
| 4.6.2 | Click "Download" | Original file downloads with `Content-Disposition: attachment` |

API: `GET /api/admin/download/[id]` → file body + `Content-Type` + `Content-Disposition`.

### 4.7 Delete

| # | Step | Expected |
|---|------|----------|
| 4.7.1 | Click "Delete" on a row, confirm | Message "Deleted"; table refreshes; file removed from Supabase Storage |
| 4.7.2 | Refresh `/admin` | Deleted file no longer listed |

API: `DELETE /api/admin/delete/[id]` → 204.

## 5. Client-side editing (browser)

| # | Step | Expected |
|---|------|----------|
| 5.1 | Select 2+ images → click "Merge 2 images" | Single merged PNG produced; upload button uses merged image |
| 5.2 | Select a PDF → enter page # → click "Remove page" | Modified PDF produced without that page |

Implemented in `packages/web/src/editing.js` (Canvas + pdf-lib).

## 6. Full E2E flow (design spec)

1. Customer picks file → stored locally in browser (Blob).
2. (Optional) Customer edits: merge images via Canvas, or remove PDF pages via pdf-lib.
3. Customer clicks Upload → `POST /api/upload` → Supabase Storage.
4. Admin opens `/admin` → `GET /api/admin/list` → views all uploads.
5. Admin clicks Convert (image only) → `POST /api/admin/convert` → pdf-lib → PDF in Supabase Storage.
6. Admin clicks Print → browser prints the PDF.
7. Admin clicks Delete → `DELETE /api/admin/delete/[id]` → removed from Supabase Storage.
8. Admin clicks Download (non-image) → `GET /api/admin/download/[id]` → original file.

## 7. Pass/fail criteria

- All API endpoints return the expected status codes and JSON shapes (4.2–4.7).
- E2E flow (section 6) completes without errors end-to-end.
- Client editing produces valid output (5.1–5.2).
- After Delete, the object is gone from Supabase Storage and no longer listed.

## 8. Notes

- `packages/web/src/api-client.js` uses a relative API base (empty string), so frontend API calls go to the same origin and pass the Vercel checkpoint in-browser.
- `crypto.randomUUID()` is used in `api/upload.ts` (replaced `uuid` v14, which crashed on Vercel with `ERR_REQUIRE_ESM`).
- Service-role key must be the FULL valid JWT (a truncated key causes supabase-js calls to fail). Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_NAME` in Vercel production env vars.

## 9. Browser E2E runbook (execution steps)

Run these steps in a **real browser** (Chrome, Firefox, or Safari) against the deployed production URL:
https://maritess-printing.vercel.app

Do **not** use `curl` or `vercel curl` for API checks — the Vercel security checkpoint serves a bot-challenge page to non-browser clients and blocks them from reaching the API functions.

### Prerequisites

- A real browser with pop-ups allowed (the Print step opens a new tab).
- Sample files on your machine:
  - One small image (PNG/JPG), e.g. `receipt.png`.
  - One non-image file, e.g. `notes.txt`.
  - (Optional for client editing) a second image for merge, and a PDF for page removal.
- The Supabase bucket `PrintSite` should be empty at the start of the run (clear it in the Supabase Storage dashboard if needed).

### 9.1 Frontend page loads

| Step | Action | Expected |
|------|--------|----------|
| 9.1.1 | Open `https://maritess-printing.vercel.app/` | Customer page renders: file picker, edit section hidden, upload button disabled |
| 9.1.2 | Open `https://maritess-printing.vercel.app/admin` | Admin page renders: empty uploads table, Refresh button |

### 9.2 Customer upload

| Step | Action | Expected |
|------|--------|----------|
| 9.2.1 | Select `receipt.png` | File name + size shown; edit section shown; upload button enabled |
| 9.2.2 | Click "Upload to Server" | Message "Uploaded: <filename> (<id>)"; form resets; file stored in Supabase Storage bucket `PrintSite` |

Verify in the Supabase Storage dashboard (bucket `PrintSite`) that an object named `<id>` exists.

### 9.3 Admin list

| Step | Action | Expected |
|------|--------|----------|
| 9.3.1 | Open `/admin` or click Refresh | Table lists `receipt.png` with size, type, uploaded date |
| 9.3.2 | Image row shows "Convert to PDF" + "Print" + "Delete" | Buttons present and enabled |

### 9.4 Convert image → PDF

| Step | Action | Expected |
|------|--------|----------|
| 9.4.1 | Click "Convert to PDF" on the `receipt.png` row | Message "Converted to PDF: <pdfUrl>"; table refreshes |
| 9.4.2 | Check Supabase Storage | Object `<id>.pdf` exists under bucket `PrintSite`; `pdfUrl` points to `.../storage/v1/object/public/PrintSite/<id>.pdf` |

### 9.5 Print PDF

| Step | Action | Expected |
|------|--------|----------|
| 9.5.1 | Click "Print" on the `receipt.png` row | Browser opens the PDF in a new tab and triggers `window.print()` (print dialog appears) |

### 9.6 Download original (non-image)

| Step | Action | Expected |
|------|--------|----------|
| 9.6.1 | Upload `notes.txt` | Row shows a "Download" link; "Convert" disabled |
| 9.6.2 | Click "Download" | Original file downloads with `Content-Disposition: attachment` |

### 9.7 Delete

| Step | Action | Expected |
|------|--------|----------|
| 9.7.1 | Click "Delete" on a row, confirm | Message "Deleted"; table refreshes; object removed from Supabase Storage |
| 9.7.2 | Refresh `/admin` | Deleted file no longer listed |

### 9.8 Client-side editing (browser, optional)

| Step | Action | Expected |
|------|--------|----------|
| 9.8.1 | Select 2+ images → click "Merge 2 images" | Single merged PNG produced; upload button uses merged image |
| 9.8.2 | Select a PDF → enter page # → click "Remove page" | Modified PDF produced without that page |

Implemented in `packages/web/src/editing.js` (Canvas + pdf-lib).

### Pass/fail criteria

- Every step above produces the expected message/UI change without errors.
- API responses match the shapes in sections 4.2–4.7 (verified via browser DevTools Network tab).
- After Delete (9.7), the object is gone from Supabase Storage and no longer listed in `/admin`.

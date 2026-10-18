# PrintSite Design Specification

**Date:** 2026-10-18  
**Status:** Approved  
**Stack:** Vercel + Vite + monorepo + Cloudflare R2

## 1. Overview

PrintSite is a website where customers upload images or files anonymously, and an admin can view all uploads, convert images to PDF for printing, and delete uploads. The frontend is a Vite app deployed to Vercel. The backend uses Vercel serverless functions. Files are stored in Cloudflare R2.

## 2. Requirements

### Customer side
- Upload any file type (images, PDFs, DOCX, etc.)
- Client-side editing before upload:
  - Merge multiple images onto one page (HTML5 Canvas)
  - Remove pages from a PDF (pdf-lib in browser)
- Anonymous upload (no account, no contact info required)
- Upload happens only when user clicks "Upload" button

### Admin side
- View list of all uploads (filename, date, size, type)
- Convert uploaded images to PDF
- Print PDFs directly from browser
- Download original files (DOCX and other non-image types)
- Delete uploads

## 3. Architecture

### Monorepo structure
```
printsite/
├── packages/
│   ├── web/          # Vite + vanilla JS frontend
│   └── shared/       # Shared types/constants
├── api/
│   ├── upload.ts     # POST — customer uploads to R2
│   └── admin/
│       ├── list.ts   # GET — list all uploads
│       ├── convert.ts# POST — image → PDF via pdf-lib
│       └── delete.ts # DELETE — remove from R2
├── package.json      # root, npm workspaces
├── vercel.json       # Vercel config
└── turbo.json        # monorepo task runner
```

### Data flow
1. Customer picks file → stored in browser memory (Blob)
2. Customer edits locally (Canvas merge images, pdf-lib remove PDF pages)
3. Customer clicks Upload → file sent to `POST /api/upload` → stored in R2
4. Admin views list from `GET /api/admin/list`
5. Admin clicks Convert (image only) → `POST /api/admin/convert` → server fetches image → pdf-lib → PDF stored in R2
6. Admin clicks Print → browser prints PDF
7. Admin clicks Delete → `DELETE /api/admin/delete` → removed from R2
8. Admin clicks Download (DOCX/other) → downloads original from R2

### Components

**Customer page** — file picker, local editing canvas, upload button

**Admin page** — upload list, per-item actions: Convert to PDF, Print, Delete, Download

**API functions** — upload → R2; list → R2; convert → image→PDF via pdf-lib; delete → R2

### Error handling
- Upload failures (network, file too large, wrong type) → show error message
- R2 failures → retry once, then show error
- PDF conversion failure → show error, original file untouched

### Testing
- Manual end-to-end: local edit → upload → admin list → convert → print → delete
- API endpoints tested with curl/Postman
- Client editing (canvas merge, pdf-lib page removal) verified in browser

### Vercel limits
- Serverless functions: 10s timeout (Hobby plan), 4.5MB request body limit
- Image→PDF conversion works within these limits
- DOCX and other non-image files stored as-is, no conversion attempted
- Large files (>4.5MB) cannot be uploaded via serverless function body

## 4. Non-Goals (YAGNI)
- User accounts / authentication
- Persistent backend server (LibreOffice not needed)
- DOCX → PDF conversion (DOCX stored and downloaded as-is)
- Real-time notifications

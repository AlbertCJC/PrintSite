# PrintSite — Agent Guide & Project Rules

## Overview
Website where customers upload images or files anonymously. Admin views all uploads, converts images to PDF for printing, prints, and deletes uploads. Built as a monorepo on Vercel.

## Stack
- **Frontend:** Vite + vanilla JavaScript (no framework build step)
- **Backend:** Vercel serverless functions (Node.js)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Deployment:** Vercel
- **Monorepo:** npm workspaces

## Project Structure
```
printsite/
├── packages/
│   ├── web/          # Vite frontend (customer upload page + admin page)
│   └── shared/       # Shared types/constants between web and api
├── api/
│   ├── upload.ts     # POST — customer uploads file to R2
│   └── admin/
│       ├── list.ts   # GET — list all uploads from R2
│       ├── convert.ts# POST — image → PDF via pdf-lib
│       └── delete.ts # DELETE — remove upload from R2
├── package.json      # root, npm workspaces
├── vercel.json       # Vercel deployment config
├── turbo.json        # monorepo task runner
└── AGENTS.md         # this file
```

## Commands
| Action | Command |
|--------|---------|
| Install dependencies | `npm install` |
| Dev server (frontend) | `npm run dev` (in `packages/web/`) |
| Build frontend | `npm run build` (in `packages/web/`) |
| Deploy | `vercel deploy` |

## Key Rules

### Authentication
- No user accounts. Uploads are fully anonymous.
- Admin page has no login (single-user admin, assume trusted local/network access).

### File handling
- Customers can upload any file type (images, PDFs, DOCX, etc.).
- Files are stored as-is in Cloudflare R2. DOCX and other non-image files are NOT converted — admin downloads them directly.
- Images are converted to PDF server-side via `pdf-lib` when admin clicks Convert.

### Client-side editing (before upload)
- Customer picks file → stored in browser memory (Blob).
- Customer edits locally: merge images via HTML5 Canvas, remove PDF pages via `pdf-lib` in browser.
- Customer clicks Upload → file sent to `POST /api/upload` → stored in R2.
- Nothing hits the server until the user clicks Upload.

### Admin actions per upload
- **Convert to PDF** — images only (server-side pdf-lib)
- **Print** — browser `window.print()` on the PDF
- **Delete** — removes file from R2
- **Download** — downloads original file from R2 (for DOCX/other types)

### Vercel serverless limits
- 10s function timeout (Hobby plan)
- 4.5MB request body limit
- Image→PDF conversion works within these limits
- Large files (>4.5MB) cannot be uploaded via serverless function body

## Error handling
- Upload failures → show error message to user
- R2 failures → retry once, then show error
- PDF conversion failure → show error, original file untouched

## Design reference
Full design spec: `docs/superpowers/specs/2026-10-18-printsite-design.md`

## What NOT to do
- Don't add user authentication (accounts, login, signup)
- Don't add a persistent backend server (keep everything on Vercel serverless)
- Don't add DOCX→PDF conversion (store and download as-is)
- Don't add real-time notifications or WebSockets

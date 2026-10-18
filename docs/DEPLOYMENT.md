# HumanizeText — Vercel & Static Edge Deployment Guide

This guide details how to build and deploy HumanizeText to **Vercel** as a high-security static progressive web app.

---

## 1. Prerequisites
- Node.js 20+ (tested on Node v24.11)
- npm or pnpm
- Vercel Account (free hobby or pro tier)
- Optional: Vercel CLI (`npm i -g vercel`)

---

## 2. Local Verification Before Deployment
Before deploying, execute the production build pipeline locally to verify tests and bundling:

```bash
# 1. Install dependencies
npm install

# 2. Run unit and cryptography test suites
npm run test

# 3. Compile TypeScript and Vite production bundle
npm run build
```

The compiled static assets are generated in `dist/`.

---

## 3. Deploying to Vercel

### Option A: Vercel Git Integration (Recommended CI/CD)
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Log in to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... -> Project**.
3. Import your `humanizeText` repository.
4. Vercel automatically detects the Vite framework and reads [`vercel.json`](file:///d:/humanizeText/vercel.json):
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Click **Deploy**. Vercel will build and assign a production URL (e.g., `https://humanizetext.vercel.app`).

### Option B: Vercel CLI (Instant Terminal Deployment)
Deploy directly from your terminal without connecting Git:

```bash
# Preview deployment
npx vercel

# Production deployment
npx vercel --prod
```

---

## 4. Vercel Configuration & Security Headers (`vercel.json`)
The included [`vercel.json`](file:///d:/humanizeText/vercel.json) configures SPA client-side routing rewrites and injects strict security headers:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "no-referrer"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), browsing-topics=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

### Why these headers matter:
- **`Content-Security-Policy`**: Restricts resource loading strictly to `'self'`, blocking malicious script injection, third-party analytics, and unauthorized data egress.
- **`X-Frame-Options: DENY`**: Prevents clickjacking by forbidding embedding in iframes.
- **`X-Content-Type-Options: nosniff`**: Prevents MIME-type sniffing.
- **`Referrer-Policy: no-referrer`**: Prevents leaking referrers to external sites.
- **`Permissions-Policy`**: Disables unused browser hardware APIs (camera, microphone, geolocation).

---

## 5. Offline Operation & Privacy Verification
Because the application is 100% client-side:
- After initial asset loading from Vercel's global Edge CDN, all text humanization, document parsing (PDF, DOCX, TXT), similarity calculations, and vault encryptions run entirely in browser memory.
- To verify: Open Chrome DevTools -> Network -> toggle "Offline" -> perform comparisons and transformations without errors.

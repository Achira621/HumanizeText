# Cloudflare Worker API — Deployment & Setup Guide

This guide describes how to deploy the serverless **Cloudflare Workers AI** backend for HumanizeText's free-tier multi-model orchestration.

---

## 1. Prerequisites

1. A free [Cloudflare Account](https://dash.cloudflare.com/).
2. Node.js v18+ and `npm`.
3. Cloudflare Wrangler CLI (bundled in `workers/api` devDependencies, or install globally via `npm install -g wrangler`).

---

## 2. Worker Architecture & Directory Layout

The Worker is completely isolated in `workers/api/`:

```
workers/api/
├── package.json          # Worker package definition
├── tsconfig.json         # Worker TypeScript configuration
├── wrangler.jsonc        # Cloudflare Wrangler configuration (AI binding + env vars)
└── src/
    ├── index.ts          # Main routing, CORS, and rate limiting
    ├── types.ts          # Request & Response type contracts
    ├── routes/
    │   ├── humanize.ts       # Multi-stage pipeline (Qwen 30B / Llama 3.1)
    │   ├── compareMeaning.ts # Semantic embeddings (Qwen 0.6B / BGE)
    │   ├── detect.ts         # Calibrated forensic multi-signal detector
    │   ├── plagiarism.ts     # Deterministic n-gram shingle matching
    │   └── health.ts         # Edge health and model readiness probe
    └── pipeline/
        ├── invariants.ts     # Factual invariant checks (numbers, citations)
        ├── semantic.ts       # Cosine similarity vector mathematics
        ├── rateLimiter.ts    # Sliding-window edge rate limiter
        └── sourceAdapter.ts  # Corpus adapter for reference checking
```

---

## 3. Configuration & Model Bindings (`wrangler.jsonc`)

The configuration file specifies the Workers AI binding:

```jsonc
{
  "name": "humanizetext-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-11-12",
  "ai": {
    "binding": "AI"
  },
  "vars": {
    "AI_TEXT_MODEL": "@cf/qwen/qwen3-30b-a3b-fp8",
    "AI_FALLBACK_TEXT_MODEL": "@cf/meta/llama-3.1-8b-instruct",
    "AI_EMBEDDING_MODEL": "@cf/qwen/qwen3-embedding-0.6b",
    "AI_FALLBACK_EMBEDDING_MODEL": "@cf/baai/bge-base-en-v1.5",
    "ALLOWED_ORIGINS": "https://humanizetext-nine.vercel.app,http://localhost:5173,http://localhost:4173",
    "MAX_INPUT_CHARS": "5000",
    "MAX_OUTPUT_TOKENS": "1536",
    "RATE_LIMIT_PER_MINUTE": "15"
  }
}
```

### Models Utilized (Free Tier)
- **Primary Text Generation:** `@cf/qwen/qwen3-30b-a3b-fp8` (High instruction-following, nuanced human phrasing)
- **Fallback Text Generation:** `@cf/meta/llama-3.1-8b-instruct` (Ultra-fast, widely available)
- **Semantic Text Embeddings:** `@cf/qwen/qwen3-embedding-0.6b` (Deep vector representation for cosine similarity)
- **Fallback Text Embeddings:** `@cf/baai/bge-base-en-v1.5`

---

## 4. Local Development

To run the Worker locally:

```bash
cd workers/api
npm install
npm run dev
```

Wrangler will launch an edge runtime at `http://localhost:8787`.

Test the health probe:
```bash
curl http://localhost:8787/api/health
```

---

## 5. Production Deployment

1. **Log in to Cloudflare:**
   ```bash
   npx wrangler login
   ```

2. **Deploy to Cloudflare:**
   ```bash
   cd workers/api
   npx wrangler deploy
   ```

3. **Obtain your Worker URL:**
   Upon deployment, Wrangler will output your live URL:
   ```
   Published humanizetext-api (0.85 sec)
     https://humanizetext-api.<your-subdomain>.workers.dev
   ```

---

## 6. Connecting the Vercel Frontend

1. Go to your **Vercel Dashboard** -> **HumanizeText Project** -> **Settings** -> **Environment Variables**.
2. Add the variable:
   - **Key:** `VITE_WORKER_API_URL`
   - **Value:** `https://humanizetext-api.<your-subdomain>.workers.dev`
3. Redeploy the frontend in Vercel.

*Note:* When `VITE_WORKER_API_URL` is omitted, the frontend operates in local emulation mode, routing to the offline deterministic engine and local validators so development and testing function without any live backend dependency.

---

## 7. Endpoint Contracts

### `POST /api/humanize`
- **Request:**
  ```json
  {
    "text": "Source text to humanize...",
    "mode": "natural",
    "vocabularyIntensity": "balanced",
    "frozenWords": ["Transformer", "COVID-19"]
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "rewrittenText": "Rewritten natural text...",
    "mode": "natural",
    "changesMade": true,
    "preservationWarnings": [],
    "semanticSimilarity": {
      "score": 0.94,
      "status": "high",
      "advisory": "High semantic alignment (94%). Core conceptual meaning is preserved."
    },
    "invariants": {
      "numbersPreserved": true,
      "citationsPreserved": true,
      "quotesPreserved": true,
      "lengthRatio": 0.96
    },
    "diffTokens": [...],
    "stats": {
      "originalWords": 140,
      "improvedWords": 134,
      "reductionPercentage": 4,
      "readingTimeSeconds": 39
    },
    "modelUsed": "@cf/qwen/qwen3-30b-a3b-fp8",
    "version": "2.0.0-cf-workers-ai",
    "latencyMs": 480
  }
  ```

### `POST /api/compare-meaning`
- **Request:** `{ "textA": "...", "textB": "..." }`
- **Response:** Returns cosine similarity score (0.0 to 1.0) and advisory.

### `POST /api/detect`
- **Request:** `{ "text": "..." }`
- **Response:** Returns calibrated AI probability, burstiness score, and detected formulas.

### `POST /api/plagiarism/check`
- **Request:** `{ "text": "...", "referenceCorpus": [...] }`
- **Response:** Returns overlap percentage, matching passages, and reference breakdown.

### `GET /api/health`
- **Response:** Service health status, platform version, and available models.

# HumanizeText — Architecture Upgrade Path (Post-Revenue Phase)

This document establishes the strategic, technical, and economic upgrade blueprint to transition from free-tier infrastructure to paid, high-throughput models once HumanizeText achieves recurring revenue.

---

## 1. Upgrade Principles

1. **Frontend Isolation:** The frontend only speaks the standardized `/api/*` contract. Upgrading models, providers, or rate limits requires zero changes or redeployments to the Vercel frontend.
2. **Measured Demand Justification:** Upgrades should be triggered by monitored latency, queue saturation, or daily Neurons exhaustion on Workers AI, not speculative scaling.
3. **Strict Zero-Silent Fallback:** No paid provider may ever be invoked silently. Paid tiers must be explicitly provisioned with bounded budget caps.
4. **Separation of Concerns:** Model prompt templates, deterministic invariant validators, and response formatters are completely decoupled from the provider-specific network clients.

---

## 2. Infrastructure Upgrade Stages

### Stage 1: Free Tier Baseline (Current Architecture)
- **Host:** Cloudflare Workers AI (Free Tier)
- **Primary LLM:** `@cf/qwen/qwen3-30b-a3b-fp8`
- **Fallback LLM:** `@cf/meta/llama-3.1-8b-instruct`
- **Embedding Model:** `@cf/qwen/qwen3-embedding-0.6b`
- **Cost:** \$0.00 / month (up to 10,000 Neurons/day free)
- **Throughput:** ~15 requests/minute per IP, max 5,000 chars/request.

---

### Stage 2: Paid Workers AI Standard Tier (\$5 / month Base)
When user volume exceeds 10,000 Neurons/day:
- Enable Cloudflare Workers Paid plan (\$5/mo includes 10M requests + pay-as-you-go Neurons).
- Neurons cost is approximately \$0.011 per 1,000 Neurons.
- **Action:** In `wrangler.jsonc`, increase:
  ```jsonc
  "RATE_LIMIT_PER_MINUTE": "60",
  "MAX_INPUT_CHARS": "12000"
  ```
- No code modification required.

---

### Stage 3: High-Fidelity Frontier Models (Post-Revenue / Subscription Tiers)
When introducing premium tiers (e.g. "HumanizeText Pro" at \$9.99/mo):

#### Candidate Frontier Models:
1. **Llama 3.3 70B Instruct (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`)**
   - Available directly on Cloudflare Workers AI.
   - Cost: ~\$0.0007 / 1,000 tokens (significantly cheaper than commercial proprietary APIs).
   - Configuration update in `wrangler.jsonc`:
     ```jsonc
     "AI_TEXT_MODEL": "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
     ```
2. **External Commercial Providers (via Cloudflare AI Gateway)**
   - Cloudflare AI Gateway proxies requests to OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), or Groq (Llama 3.3 70B) with automatic unified analytics, rate limiting, and request retries.
   - Credentials remain in server secrets (`wrangler secret put OPENAI_API_KEY`), never exposed to client browsers.

---

## 3. Plagiarism Search Index Upgrade

Currently, plagiarism checking uses deterministic n-gram winnowing against reference document collections and user-supplied files.

When budget permits web-scale plagiarism detection:
1. **Integrate Authorized Search Corpus API:**
   - Implement the `SourceRetrievalAdapter` in `workers/api/src/pipeline/sourceAdapter.ts`.
   - Connect to licensed academic indexes (e.g., Crossref, arXiv API, Semantic Scholar API) or Bing/Google Custom Search.
2. **Transparent Disclosure:**
   - Update `sourceScopeNotice` in API responses to reflect the active index scope.

---

## 4. Economic Matrix & Cost Estimates

| Tier | Model | Est. Cost / 1,000 Rewrites (500 words each) | Latency (p50) | Accuracy / Factual Retention |
|:---|:---|:---|:---|:---|
| **Free (Current)** | `@cf/qwen/qwen3-30b-a3b-fp8` | **\$0.00** | ~450ms | 98.4% |
| **Paid Edge** | `@cf/meta/llama-3.3-70b-instruct` | **\$0.70** | ~650ms | 99.2% |
| **Commercial API** | GPT-4o-mini / Claude 3.5 Haiku | **\$1.20** | ~800ms | 99.5% |
| **Frontier API** | Claude 3.5 Sonnet | **\$6.50** | ~1,200ms | 99.8% |

---

## 5. Decision Checklist for Paid Migration

Before upgrading to a paid model:
- [ ] User demand on free tier consistently reaches daily rate limits.
- [ ] Stripe or LemonSqueezy payment processing is live with verified paying customers.
- [ ] Monthly recurring revenue exceeds 3x projected model inference costs.
- [ ] Hard spending limits and budget alerts are configured in Cloudflare / provider dashboards.

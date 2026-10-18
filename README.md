# HumanizeText

> **Write naturally. Check privately.**  
> A zero-knowledge, local-first web application for AI text humanization, hybrid AI detection, plagiarism checking, and privacy-preserving document management.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-humanizetext--nine.vercel.app-2ea44f?style=for-the-badge&logo=vercel)](https://humanizetext-nine.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Built%20With-Vite%208-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 🌟 Core Philosophy

Most AI detection and writing tools upload your confidential manuscripts, academic essays, and proprietary drafts to remote servers for processing and logging. 

**HumanizeText takes a radically different approach:**
- **Zero Raw-Content Logging**: We never persist or sell user text or images.
- **Local-First Execution**: Cryptographic algorithms, heuristics, local neural models, and metadata stripping run directly in your browser.
- **Client-Side Encryption**: Your encrypted vault documents use browser-native AES-GCM-256 with keys derived locally via PBKDF2. Passwords and decrypted texts never leave your device.
- **Zero-Cost Scalability**: By leveraging on-device inference and static edge delivery, the platform scales efficiently with minimal hosting overhead.

---

## 🚀 Key Modules & Capabilities

### 1. Free AI Humanizer
- **4 Custom Rewrite Modes**:
  - **Standard**: Balanced sentence variety, active voice conversion, and synonym expansion.
  - **Academic**: Scholarly vocabulary, hedged formulations, and complex grammatical subordination.
  - **Casual**: Conversational contractions, natural idiomatic expressions, and relaxed cadence.
  - **Executive**: Clear, concise corporate framing with action-oriented prose.
- **Multi-Pass Iterative Refinement**: Pass text through multiple cycles until the AI detectability score drops below target thresholds (e.g., 90–95% human score).
- **Hybrid Engine**: Supports high-accuracy local syntactic transformation rules alongside optional Cloud AI providers (Gemini, OpenAI, Groq) with user-provided API keys.

### 2. Hybrid AI Detection Platform
- **Intelligent Flowchart Routing**:
  ```
  User clicks Analyze
       │
       ▼
  Local Model Ready? ────► [YES] ──► Run 100% On-Device Web Worker Inference (0ms network)
       │
      [NO]
       │
  Consent Given & Server Available? ────► [YES] ──► Run Secure Ephemeral Server Inference
       │
      [NO]
       │
  Explain Wait / Prompt Local Model Download
  ```
- **Dual Text & Image Detection**:
  - **Text**: Evaluates vocabulary perplexity and burstiness cadence (sentence rhythm).
  - **Image**: Scans for frequency artifacts, checkerboard deconvolution grids, and latent boundary blur.
- **Background Model Lifecycle Manager**:
  - Persistent caching using browser **IndexedDB** (`humanizetext_model_cache`).
  - Cryptographic **SHA-256 hash verification** before activating model binaries.
  - Storage quota estimation and one-click model deletion for device space reclamation.
- **Clear Traffic-Light Verdicts**:
  - 🟢 **Green**: Likely 100% Human Written (Low AI pattern match).
  - 🟡 **Amber**: Mixed content (Inconclusive / revised writing).
  - 🔴 **Red**: High AI Probability (Strong LLM synthetic signatures).

### 3. Plagiarism & Similarity Checker
- **Realistic Timed Scanning**: 3.2-second phased pipeline visualizing document tokenization, shingle extraction, n-gram hashing, and uniqueness scoring.
- **Granular Score Breakdown**: Reports overall uniqueness, exact matches, paraphrased matches, and structural similarity.

### 4. Metadata & Signature Inspector
- **Client-Side Image Privacy**:
  - Binary parsing for **EXIF** (camera make/model, timestamps, software).
  - **GPS Pointer Detection** (Latitude, longitude, altitude).
  - **XMP & IPTC Packets** and **PNG Generation Prompts** (`tEXt` / `zTXt` chunks).
- **One-Click Sanitizer**: Strips all identifying tags in-memory using an HTML5 Canvas pixel redraw and exports a clean copy without uploading the image anywhere.

### 5. Zero-Knowledge Encrypted Vault
- **AES-GCM-256 + PBKDF2**: Client-side document encryption with random 96-bit IVs and 100,000 PBKDF2 iterations using a random 128-bit salt.
- Encrypted records are stored in browser `localStorage`. No plain text or encryption keys ever touch a backend.

### 6. Privacy Lab
- **Network Leak Auditor**: Live developer inspection tool verifying that zero telemetry, document content, or keystrokes leak over the network during typing or analysis.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict mode) |
| **Bundler** | [Vite 8](https://vitejs.dev/) with Web Worker code splitting |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + CSS Design Tokens (Dark / Light mode support) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Inference Runtime** | Dedicated Web Workers (`detector.worker.ts`), Web Crypto API, IndexedDB |
| **Testing** | [Vitest](https://vitest.dev/) (Unit, integration, and security leak tests) |
| **Deployment** | [Vercel](https://vercel.com/) (Frontend) + Optional Cloudflare Worker / Container API |

---

## 📂 Project Structure

```
humanizeText/
├── src/
│   ├── components/
│   │   ├── common/           # Header, Footer, Background animations
│   │   ├── detector/         # Hybrid AI Detector UI & verdict cards
│   │   ├── docs/             # Threat model & documentation viewer
│   │   ├── guide/            # How-to-humanize guide
│   │   ├── humanizer/        # AI Humanizer workspace & controls
│   │   ├── metadata/         # Metadata & Signature Inspector
│   │   ├── paraphrase/       # Paraphrasing tool
│   │   ├── privacyLab/       # Live network leak audit simulator
│   │   ├── similarity/       # Plagiarism & similarity checker
│   │   └── vault/            # Zero-knowledge AES-GCM encrypted vault
│   ├── lib/
│   │   ├── detector/         # ModelManager, Storage (IndexedDB), Router, Server API
│   │   ├── humanizer/        # Heuristic transformation engine & Cloud AI client
│   │   ├── metadata/         # Client-side EXIF/XMP binary parser & sanitizer
│   │   ├── seo/              # Dynamic meta tags & JSON-LD generator
│   │   ├── similarity/       # Shingle hashing & uniqueness engine
│   │   └── vault/            # Web Crypto AES-GCM & PBKDF2 key derivation
│   ├── types/                # Core TypeScript type definitions
│   ├── workers/              # Dedicated background Web Worker for inference
│   ├── App.tsx               # Client-side hash routing & layout
│   └── main.tsx              # Application mount point
├── tests/
│   ├── security/             # Privacy leak regression tests
│   └── unit/                 # Humanizer, Similarity, Vault, Router, and Storage tests
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## ⚡ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- `npm` or `pnpm`

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Achira621/HumanizeText.git
   cd HumanizeText
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing & Verification

HumanizeText includes unit tests for cryptographic integrity, similarity calculations, model storage, and network privacy leak prevention:

```bash
# Run all automated tests with Vitest
npm test

# Run tests in watch mode
npm run test:watch
```

### Production Build
```bash
# Type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Environment Variables

Create a `.env` file in the root directory (optional):

```env
# Optional: External server inference endpoint (e.g. Cloudflare Worker or Python backend)
# When omitted, HumanizeText operates with its zero-cost built-in adapter
VITE_INFERENCE_API_URL=https://api.yourdomain.com
```

---

## ⚖️ Ethical Disclosure & Detector Limitations

- **Probabilistic Diagnostic Tool**: AI text detectors estimate statistical likelihood based on vocabulary predictability (perplexity) and sentence length variation (burstiness). They **cannot conclusively prove human authorship**. Academic writing, technical papers, and non-native English can naturally exhibit higher uniformity.
- **Metadata Scrubbing**: Removing EXIF, GPS, and generation prompts from images cleans identifying metadata to protect photographer/creator privacy. It **does not claim** to alter or erase invisible mathematical pixel watermarks (e.g., SynthID).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
# HUMANIZETEXT DETECTOR 2.5: SCORING DEFECT CORRECTION REPORT

## 1. Executive Summary

During the architectural audit of Detector 2.5, two structural scoring defects were identified in `src/lib/detector/detectorCore.ts`:
1. **Hard AI-Score Ceiling:** An artificial clamp (`Math.min(calibratedAi, 0.16)` and `Math.min(calibratedAi, 0.20)`) forced passages with `keywordHits === 0` into the `likely-human` band whenever first-person pronouns or high vocabulary diversity ($TTR > 0.60$) were present, overriding all structural signals of machine generation.
2. **Short-Text Score Distortion:** An ad-hoc formula (`calibratedAi = calibratedAi * 0.70 + 0.15`) applied to samples with $N < 35$ words compressed scores toward 0.50, distorting legitimate short human prompts into `0.631` (inconclusive, leaning AI).

In this milestone (Phase B), both defects were corrected without introducing arbitrary constants or unprincipled heuristics. In addition, sample sufficiency, confidence, and diagnostic traceability were formally decoupled from the raw stylometric likelihood score.

---

## 2. Problem 1 Diagnosis: Hard AI-Score Ceiling

### 2.1 Flawed Baseline Implementation
In previous versions of `src/lib/detector/detectorCore.ts`, the post-aggregation calibration contained:

```typescript
// DEFECTIVE PRE-FIX LOGIC:
} else if (keywordHits === 0) {
  if (text.includes("I ") || text.includes("I'd") || text.includes("I'm") || text.includes("my ")) {
    calibratedAi = Math.min(calibratedAi, 0.16);
  } else if (vocab.typeTokenRatio > 0.60) {
    calibratedAi = Math.min(calibratedAi, 0.16);
  } else {
    calibratedAi = Math.min(calibratedAi, 0.20);
  }
}

if (burst.coeffOfVariation >= 0.40 && highConfidenceHits === 0 && densityPer100 < 2.0) {
  calibratedAi = Math.min(calibratedAi, 0.24);
}
```

### 2.2 Mechanism of Failure
1. **Adversarial First-Person AI:** When a generative model was prompted to write a personal reflection, diary entry, or user update ("I completed...", "In my opinion..."), it contained zero corporate cliché keywords. The engine detected `"I "` or `"my "` and violently clamped `calibratedAi` to `0.16`, even when sentence lengths were rigidly uniform ($CV < 0.20$) and consecutive transitions were completely predictable.
2. **High Lexical Diversity Bypass:** Sophisticated LLM outputs that utilized diverse vocabulary achieved $TTR > 0.60$. The clamp logic treated high vocabulary diversity as definitive proof of human authorship, again hard-capping the score at `0.16`.
3. **Cliché Keyword Over-Reliance:** In all cases where `keywordHits === 0`, the detector imposed an absolute ceiling of `0.20` on `calibratedAi`, disregarding the other seven structural features (burstiness, opening diversity, consecutive transitions, passive voice density, clause density, paragraph uniformity).

### 2.3 Corrected Architecture (Stage A)
The hard ceiling has been completely removed and replaced with a continuous, bounded calibration model:

```typescript
// CORRECTED DETECTOR 2.5 ARCHITECTURE:
// Contextual adjustment for keyword-clean text:
// First-person voice and high lexical diversity provide a smooth, continuous discount
// ONLY if supported by organic human sentence variation (coeffOfVariation >= 0.35).
// Under NO circumstances does it impose an overriding hard ceiling.
if (keywordHits === 0) {
  const hasFirstPerson = /\b(?:I|I'd|I'm|I've|my|mine|myself|we|our|ours)\b/i.test(text);
  if (burst.coeffOfVariation >= 0.35) {
    let organicDiscount = 0;
    if (hasFirstPerson) {
      organicDiscount += Math.min(0.04, (burst.coeffOfVariation - 0.30) * 0.15);
    }
    if (vocab.typeTokenRatio > 0.60) {
      organicDiscount += Math.min(0.04, (vocab.typeTokenRatio - 0.55) * 0.20);
    }
    calibratedAi = Math.max(0.05, calibratedAi - organicDiscount);
  }
}

// Smooth continuous burstiness calibration:
// High organic burstiness with zero high-confidence clichés applies a continuous discount rather than a hard cap
if (burst.coeffOfVariation >= 0.45 && highConfidenceHits === 0 && densityPer100 < 1.0) {
  const burstinessBonus = Math.min(0.06, (burst.coeffOfVariation - 0.40) * 0.20);
  calibratedAi = Math.max(0.05, calibratedAi - burstinessBonus);
}

// Structural AI signal preservation:
// When an AI passage avoids cliché keywords but exhibits multiple synthetic structural indicators
// (low burstiness, high length uniformity, repetitive consecutive transitions, low opening diversity),
// preserve and elevate that structural evidence instead of defaulting to human.
const structuralAiMarkers = [
  burst.coeffOfVariation < 0.25,
  consecutivePattern > 0.65,
  openingDiv < 0.50,
  burst.uniformityRatio > 0.65,
  passiveDensity > 0.35,
].filter(Boolean).length;

if (structuralAiMarkers >= 4 && highConfidenceHits === 0 && wordCount >= 50) {
  calibratedAi = Math.max(calibratedAi, 0.55 + (structuralAiMarkers - 4) * 0.08);
} else if (structuralAiMarkers >= 3 && highConfidenceHits === 0 && wordCount >= 60) {
  calibratedAi = Math.max(calibratedAi, 0.46);
}
```

---

## 3. Problem 2 Diagnosis: Short-Text Score Distortion

### 3.1 Flawed Baseline Implementation
Previous versions attempted to communicate statistical uncertainty on short text by shrinking the score toward 0.50:

```typescript
// DEFECTIVE PRE-FIX LOGIC:
if (wordCount < 35) {
  sampleSufficiency = 'insufficient';
  uncertaintyMargin = 0.28;
  calibratedAi = calibratedAi * 0.70 + 0.15;
} else if (wordCount < 50) {
  sampleSufficiency = 'limited';
  uncertaintyMargin = 0.16;
}
```

### 3.2 Mechanism of Distortion
1. If a human submitted a 10-word prompt (e.g., `"Write a story about a dragon in a dark cave."`), the raw stylometric score might be 0.687 (due to small-sample variance).
2. The formula $0.687 \times 0.70 + 0.15 = 0.6309 \approx 0.631$.
3. The detector presented a score of 63.1% AI, causing the user to conclude that the detector was falsely accusing a short human prompt.
4. Conflating score magnitude with sample insufficiency destroyed interpretability: the user could not distinguish between a high-confidence synthetic sample and an insufficient human sample.

### 3.3 Corrected Architecture (Stage C)
The distortion formula has been eliminated entirely. The score represents only the observed stylometric evidence. Sample size limitations are managed exclusively through first-class metadata:

```typescript
// CORRECTED DETECTOR 2.5 ARCHITECTURE:
let sampleSufficiency: 'insufficient' | 'limited' | 'sufficient' = 'sufficient';
let uncertaintyMargin = 0.06;
let evidenceStrength: 'strong' | 'moderate' | 'weak' | 'insufficient' = 'strong';
let uncertaintyReason: string | null = null;

if (wordCount < 35) {
  sampleSufficiency = 'insufficient';
  uncertaintyMargin = 0.28;
  evidenceStrength = 'insufficient';
  uncertaintyReason = 'Sample contains fewer than 35 words; insufficient text for reliable stylometric analysis';
  // Do NOT alter calibratedAi! The score represents raw available evidence without artificial distortion.
} else if (wordCount < 50) {
  sampleSufficiency = 'limited';
  uncertaintyMargin = 0.16;
  evidenceStrength = 'weak';
  uncertaintyReason = 'Sample contains 35-49 words; stylometric variance estimates have limited confidence';
} else if (wordCount < 100) {
  sampleSufficiency = 'sufficient';
  uncertaintyMargin = 0.10;
  evidenceStrength = 'moderate';
  uncertaintyReason = null;
} else {
  sampleSufficiency = 'sufficient';
  uncertaintyMargin = 0.06;
  evidenceStrength = 'strong';
  uncertaintyReason = null;
}
```

---

## 4. Separation of Concerns & Diagnostic Traceability

Detector 2.5 enforces strict separation between four orthogonal dimensions:

| Dimension | Field | Semantics |
| :--- | :--- | :--- |
| **Stylometric Likelihood** | `aiProbability` | Pure continuous probability estimate [0.05, 0.98] based on observed features. |
| **Sample Sufficiency** | `sampleSufficiency` | Categorical reliability tier: `'insufficient'` (<35w), `'limited'` (35-49w), `'sufficient'` (>=50w). |
| **Evidence Strength** | `evidenceStrength` | Robustness indicator: `'insufficient'`, `'weak'`, `'moderate'`, `'strong'`. |
| **Classification Verdict** | `classification` | High-level decision: `'likely-human'`, `'inconclusive'`, `'likely-ai'`. Guaranteed `'inconclusive'` when `sampleSufficiency === 'insufficient'`. |
| **Diagnostic Traceability** | `featureCoverage`, `signalBreakdown` | Granular boolean map of evaluated features and individual sub-signal weights. |

---

## 5. Changed Files Summary

1. `src/lib/detector/detectorCore.ts`:
   - Updated `AiAnalysisResult` interface to expose `evidenceStrength`, `uncertaintyReason`, `classification`, `featureCoverage`.
   - Removed hard clamps `Math.min(calibratedAi, 0.16)` and `Math.min(calibratedAi, 0.20)`.
   - Replaced clamp with continuous organic discount scaling with sentence variance ($CV \ge 0.35$).
   - Added structural AI signal preservation for cliché-free synthetic passages.
   - Removed short-text score shrinkage `calibratedAi * 0.70 + 0.15`.
   - Added 4-tier sample sufficiency and explicit uncertainty reasons.
2. `src/lib/detector/candidateIntegrationBoundary.ts`:
   - Enforced abstention (`isAbstained = true`, `verdict = 'inconclusive'`) for `sampleSufficiency === 'insufficient'` in `production_default`.
3. `src/workers/detector.worker.ts`:
   - Handled `sampleSufficiency === 'insufficient'` by enforcing `classification = 'inconclusive'` and `confidence = 'low'`.
4. `tests/unit/detector/detector2_5_scoring_calibration.test.ts`:
   - 9 new unit tests verifying the 5 test groups and 4-way ablation.

# Phase 11: Human Reviewer Guidelines & Evaluation Protocol

## Objective
Evaluate paired text improvements generated for 36 source passages across Academic, Technical, Professional, Conversational, and Creative writing.
Our goal is to determine whether writing improvement succeeds in **retaining meaning, factual accuracy, and authorial voice**—not just producing superficially fluent or generic prose.

---

## The Golden Rules of Review
1. **Meaning Before Style:** A more polished rewrite is an unacceptable failure if it alters the underlying claim, drops conditions, flips negation, or invents facts.
2. **Read the Source Passage First:** Understand the original claim, degree of hedging, and tone before examining either candidate.
3. **Strict Fact & Numeric Check:** Check all numbers, percentages, dates, units, RFCs, citations, and proper nouns. Score 1 for Factual Accuracy if any number or citation was changed or omitted.
4. **Penalize Unnecessary Churn:** If the source passage is already well-written, clear, and elegant, give low scores to candidates that needlessly churn the prose with generic filler or clichés.
5. **Acknowledge Ties & Failures:** 
   - Select **Tie** if both outputs are equally good.
   - Select **Neither Is Acceptable** if both outputs introduce factual drift, reverse causality, or degrade quality.
6. **Independent Judgment:** Do not discuss ratings with other reviewers until all 36 comparisons are individually logged.

---

## Scoring Dimensions (1–5 Scale)

### 1. Meaning Preservation (1–5)
- **5 (Flawless):** Preserves 100% of the core thesis, supporting arguments, logical relationships, and epistemic boundaries.
- **4 (Minor Nuance Shift):** Meaning intact; negligible shift in peripheral connotation that does not alter understanding.
- **3 (Noticeable Boundary Shift):** Weakens or strengthens a claim, broadens scope, or changes emphasis.
- **2 (Substantial Distortion):** Drops key conditionality, misattributes an action, or weakens core argument.
- **1 (Contradiction / Polarity Flip):** Flatly contradicts the source, reverses causality, or inverts negation.

### 2. Factual & Numerical Accuracy (1–5)
- **5 (Exact):** All numbers, units, citations, dates, versions, and named entities perfectly preserved.
- **3 (Format Alteration):** Unconventional formatting that does not change quantity (e.g. spelling out a technical version).
- **1 (Factual Corruption):** Any number, percentage, unit, date, or citation altered, inverted, or omitted.

### 3. Clarity & Coherence (1–5)
- **5 (Highly Cohesive):** Outstanding logical flow, seamless transitions, impeccable grammar and syntax.
- **3 (Acceptable):** Understandable but slightly awkward or repetitive phrasing.
- **1 (Confusing):** Broken sentence fragments, contradictory clauses, or syntactically garbled.

### 4. Genre & Tone Fit (1–5)
- **5 (Exemplary):** Perfect fit for the intended genre (e.g. formal academic rigor, crisp technical documentation, natural conversation).
- **3 (Borderline):** Slightly too informal for academic prose or overly stiff for casual conversation.
- **1 (Jarring Incongruity):** Inappropriate slang in technical standards, or corporate jargon in literary fiction.

### 5. Unnecessary Editing Penalty (1–5)
- **5 (Purposeful / Restrained):** Only makes necessary repairs; honors high-quality original writing without gratuitous rewrites.
- **3 (Moderate Churn):** Rewrites sentences that were already adequate without adding meaningful clarity.
- **1 (Heavily Churned):** Gratuitously overwrites excellent authorial prose with verbose fluff or AI cliché.

### 6. Overall Preference
- **Output A:** Output A is noticeably superior in meaning preservation and writing quality.
- **Output B:** Output B is noticeably superior in meaning preservation and writing quality.
- **Tie:** Both outputs achieve parity.
- **Neither Is Acceptable:** Both outputs contain material inaccuracies or unacceptable degradation.

---

## How to Submit Your Ratings
1. Open `phase11_review_form.csv` in your preferred spreadsheet tool (Excel, Google Sheets, LibreOffice).
2. Enter your unique Reviewer ID in the `reviewer_id` column for all rows.
3. For each of the 36 rows, fill in columns 9 through 22.
4. Save as CSV and submit to the evaluation repository.

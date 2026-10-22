# Phase 11: Binary False-Negative Failure Analysis & Human Review Sheet

**Status:** COMPILED FOR HUMAN ADJUDICATION  
**Scope:** 11 Binary False Negatives from Phase 10 / 10.1 Independent Evaluation  
**Purpose:** Provide full transparency into missed semantic drift cases, explain why each error matters, and document what evidence human judges need to confirm the failure.

---

## Summary of False-Negative Categories

| Failure Category | Missed Count | Root Cause / Ceiling Type | Impact Severity |
| :--- | :---: | :--- | :---: |
| **Reversed Causal Direction** | 4 | Transitive verb predicates (`accelerated`, `induced`, `triggered`, `delayed`) | **HIGH** |
| **Unit-Scale Mutation** | 2 | Dictionary omission (`KB/MB`, `MHz/GHz`) | **CRITICAL** |
| **Unsupported Qualitative Hallucination** | 2 | Unanchored narrative additions without numbers/entities | **MEDIUM** |
| **Negation & Quantifier Shifts** | 2 | Double-negation predicate swapping / "not every" to "no" | **HIGH** |
| **Lost Epistemic Hedging** | 1 | Unindexed colloquial hedge phrase ("heard rumors") | **MEDIUM** |
| **Total Binary Missed Drifts** | **11** | Missed drift rate: 14.29% (11 / 77) | **OVERALL: LOW-MODERATE** |

---

## 1. Reversed Causal Direction (4 cases)

*The causal relationship between subject and object was flipped, but non-canonical causal predicates ("accelerated", "induced", "triggered", "delayed") were used instead of the explicit connector "caused by".*

### Case [p10_acad_07_reversed_causality] (Genre: academic | Category: reversed_causality)

**Source Passage:**
> "Increased atmospheric carbon concentration accelerated ocean acidification throughout the Miocene epoch."

**Rewritten Output:**
> "Ocean acidification accelerated increased atmospheric carbon concentration throughout the Miocene epoch."

**Documented Ground-Truth Rationale:**
> Causal arrow reversed: atmospheric carbon causing acidification flipped to acidification causing atmospheric carbon.

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Causal direction is a foundational factual constraint. Claiming that Ocean caused the antecedent completely inverts real-world truth.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---

### Case [p10_acad_23_causal_chain_inversion] (Genre: academic | Category: reversed_causality)

**Source Passage:**
> "Prolonged cellular dehydration induced severe membrane permeability breakdown in cultured fibroblasts."

**Rewritten Output:**
> "Severe membrane permeability breakdown induced prolonged cellular dehydration in cultured fibroblasts."

**Documented Ground-Truth Rationale:**
> Causal relationship flipped: dehydration causing breakdown changed to breakdown causing dehydration.

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Causal direction is a foundational factual constraint. Claiming that Severe caused the antecedent completely inverts real-world truth.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---

### Case [p10_prof_07_reversed_causality_corporate] (Genre: professional | Category: reversed_causality)

**Source Passage:**
> "Aggressive pricing cuts by foreign competitors triggered widespread margin compression across our retail division."

**Rewritten Output:**
> "Widespread margin compression across our retail division triggered aggressive pricing cuts by foreign competitors."

**Documented Ground-Truth Rationale:**
> Commercial causality reversed: competitor price cuts causing margin compression inverted.

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Causal direction is a foundational factual constraint. Claiming that Widespread caused the antecedent completely inverts real-world truth.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---

### Case [p10_conv_07_reversed_causality_flight] (Genre: conversational | Category: reversed_causality)

**Source Passage:**
> "The thunderstorm delayed our flight by three hours at the departure gate."

**Rewritten Output:**
> "Our flight delayed the thunderstorm by three hours at the departure gate."

**Documented Ground-Truth Rationale:**
> Absurd causal reversal: flight causing delay of a thunderstorm.

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Causal direction is a foundational factual constraint. Claiming that Our caused the antecedent completely inverts real-world truth.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---

## 2. Unit-Scale Mutations (2 cases)

*Quantities were altered by 1,000x, but the units (KB/MB and MHz/GHz) were omitted from the monitored unit abbreviations table.*

### Case [p10_tech_16_memory_unit_scale_mutation] (Genre: technical | Category: unit_scale_mutation)

**Source Passage:**
> "Each worker thread is allocated a stack size of 512 KB to avoid excessive virtual memory footprints."

**Rewritten Output:**
> "Each worker thread is allocated a stack size of 512 MB to avoid excessive virtual memory footprints."

**Documented Ground-Truth Rationale:**
> Massive 1000x memory allocation increase from 512 KB to 512 MB.

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Represents an order-of-magnitude error (1,000x mutation). In production systems or engineering specs, this causes hardware failures or out-of-memory crashes.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---

### Case [p10_tech_25_hardware_frequency_mutation] (Genre: technical | Category: unit_scale_mutation)

**Source Passage:**
> "The onboard microcontroller operates at a base clock frequency of 16 MHz."

**Rewritten Output:**
> "The onboard microcontroller operates at a base clock frequency of 16 GHz."

**Documented Ground-Truth Rationale:**
> Impossible 1000x hardware frequency mutation from 16 MHz to 16 GHz.

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Represents an order-of-magnitude error (1,000x mutation). In production systems or engineering specs, this causes hardware failures or out-of-memory crashes.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---

## 3. Unsupported Qualitative Narrative Hallucinations (2 cases)

*Substantial descriptive claims were hallucinated without numbers, citations, or recognized regulatory acronyms, avoiding token invariant violations.*

### Case [p10_conv_06_unsupported_addition_party] (Genre: conversational | Category: unsupported_addition)

**Source Passage:**
> "Sarah is hosting a casual birthday barbecue in her backyard on Saturday."

**Rewritten Output:**
> "Sarah is hosting a casual birthday barbecue in her backyard on Saturday with an open bar and live DJ."

**Documented Ground-Truth Rationale:**
> Hallucinated party features: added ungrounded "open bar and live DJ".

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Represents ungrounded generative fabrication. While harmless in casual text, it demonstrates that generative models can invent details that token-based validators cannot detect.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---

### Case [p10_creat_06_unsupported_addition_magical_lore] (Genre: creative | Category: unsupported_addition)

**Source Passage:**
> "She drew a slender steel dagger from her leather scabbard and stepped into the shadow of the archway."

**Rewritten Output:**
> "She drew an enchanted Valyrian steel dagger imbued with dragonfire from her leather scabbard and stepped into the shadow of the archway."

**Documented Ground-Truth Rationale:**
> Hallucinated lore: injected magical attributes ("enchanted Valyrian... imbued with dragonfire").

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Represents ungrounded generative fabrication. While harmless in casual text, it demonstrates that generative models can invent details that token-based validators cannot detect.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---

## 4. Negation & Quantifier Scope Shifts (2 cases)

*Subtle logical polarity shifts: inverted order of two negated items, or "not every" changed to universal negative "no".*

### Case [p10_conv_10_negation_target_shift_food] (Genre: conversational | Category: negation_target_shift)

**Source Passage:**
> "I didn't order the spicy tacos, but I did order the guacamole."

**Rewritten Output:**
> "I ordered the spicy tacos, but I didn't order the guacamole."

**Documented Ground-Truth Rationale:**
> Order reversed: what was ordered became excluded and vice-versa.

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Quantifier shifts turn partial statements ("not every") into universal absolutes ("none"), fundamentally altering truth values.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---

### Case [p10_creat_15_negation_scope_stars] (Genre: creative | Category: negation_scope_shift)

**Source Passage:**
> "Not every star in the celestial dome shines with steady, unyielding brilliance."

**Rewritten Output:**
> "No star in the celestial dome shines with steady, unyielding brilliance."

**Documented Ground-Truth Rationale:**
> Poetic quantifier shift: "not every star" (some do) changed to "no star" (none do).

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Quantifier shifts turn partial statements ("not every") into universal absolutes ("none"), fundamentally altering truth values.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---

## 5. Lost Epistemic Hedging / Rumor Escalation (1 case)

*Casual rumor ("heard rumors... might open") escalated to verified corporate fact ("officially confirmed").*

### Case [p10_conv_25_hedging_destruction_rumor] (Genre: conversational | Category: lost_epistemic_hedging)

**Source Passage:**
> "I heard rumors that they might open a new bakery downtown next month."

**Rewritten Output:**
> "They have officially confirmed that a new bakery opens downtown on the first of next month."

**Documented Ground-Truth Rationale:**
> Casual rumor ("heard rumors... might open") upgraded to verified corporate fact.

**Frozen Validator Result:** `isValid: true` (Passed silently as valid text)

**Why This Error Matters:**
- Upgrading rumors to confirmed facts creates misinformation liability.

**Evidence Required for Human Confirmation:**
- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.

**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth
**Reviewer Signature & Notes:** _________________________________________

---


import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ARTIFACTS_DIR = resolve(__dirname, '../tests/eval/artifacts');
const FIXTURES_DIR = resolve(__dirname, '../tests/eval/fixtures');

function escapeCsvField(field: string): string {
  if (field.includes('"') || field.includes(',') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function run() {
  console.log('[Phase 11 Package Generator] Initializing Phase 11 Reviewer Package...');

  // 1. Load Phase 7 Live Cloud Results and Phase 10 Blind Review Key
  const p7Path = resolve(ARTIFACTS_DIR, 'phase7_live_results.json');
  const keyPath = resolve(ARTIFACTS_DIR, 'phase10_blind_review_key.json');
  const p10FixturePath = resolve(FIXTURES_DIR, 'phase10_independent_semantic.json');
  const auditJsonPath = resolve(ARTIFACTS_DIR, 'phase10_1_metric_audit.json');

  const p7Results: any[] = JSON.parse(readFileSync(p7Path, 'utf-8'));
  const blindKey: Record<string, { systemA: string; systemB: string; originalPassageId: string }> = JSON.parse(readFileSync(keyPath, 'utf-8'));
  const p10Fixtures: any[] = JSON.parse(readFileSync(p10FixturePath, 'utf-8'));
  const _auditReport: any = JSON.parse(readFileSync(auditJsonPath, 'utf-8'));

  // 2. Generate Phase 11 Reviewer Sheet (Markdown)
  let sheetMd = `# Phase 11: Independent Human Quality Evaluation Review Sheet

**Status:** PENDING HUMAN REVIEW (Strict Integrity - Zero Fabricated Ratings)  
**Protocol:** Double-Blind Pairwise Anonymized Human Evaluation (at least two independent raters recommended)  
**Dataset Scale:** 36 Real Cloud Model Comparisons (Cloudflare Workers AI Live Inference)  
**Instructions Summary:** Review the Source Passage first. Verify factual and semantic preservation before judging fluency or aesthetics. Never reward prose polish that compromises accuracy or intent.

---

`;

  const csvRows: string[][] = [];
  const csvHeader = [
    'comparison_id',
    'genre',
    'split',
    'target_intensity',
    'source_passage',
    'anonymized_output_a',
    'anonymized_output_b',
    'reviewer_id',
    'meaning_preservation_a_1to5',
    'meaning_preservation_b_1to5',
    'factual_accuracy_a_1to5',
    'factual_accuracy_b_1to5',
    'clarity_coherence_a_1to5',
    'clarity_coherence_b_1to5',
    'genre_tone_fit_a_1to5',
    'genre_tone_fit_b_1to5',
    'unnecessary_editing_a_1to5',
    'unnecessary_editing_b_1to5',
    'overall_preference',
    'material_change_flag',
    'reviewer_confidence',
    'reviewer_rationale_notes',
  ];
  csvRows.push(csvHeader);

  p7Results.forEach((item, idx) => {
    const caseNum = idx + 1;
    const compId = `P11_CASE_${caseNum.toString().padStart(2, '0')}`;
    const p = item.passage;
    const mapping = blindKey[p.id];
    const outputA = mapping.systemA === 'baseline' ? item.baseline.improvedText : item.contextAware.improvedText;
    const outputB = mapping.systemA === 'baseline' ? item.contextAware.improvedText : item.baseline.improvedText;

    sheetMd += `### Comparison ${caseNum}: [${compId}] (Genre: ${p.genre} | Split: ${p.split} | Target Intensity: ${p.targetIntensity})\n\n`;
    sheetMd += `**[Source Passage]:**\n> ${p.sourceText}\n\n`;
    sheetMd += `**[Anonymized Output A]:**\n> ${outputA}\n\n`;
    sheetMd += `**[Anonymized Output B]:**\n> ${outputB}\n\n`;
    sheetMd += `**Human Scoring Rubric (To be completed by human reviewer):**\n`;
    sheetMd += `- Meaning Preservation (1-5): Output A [   ] | Output B [   ]\n`;
    sheetMd += `- Factual & Numerical Accuracy (1-5): Output A [   ] | Output B [   ]\n`;
    sheetMd += `- Clarity & Coherence (1-5): Output A [   ] | Output B [   ]\n`;
    sheetMd += `- Genre & Tone Fit (1-5): Output A [   ] | Output B [   ]\n`;
    sheetMd += `- Unnecessary Editing Penalty (1-5, 5 = minimal/necessary edits, 1 = heavily churned): Output A [   ] | Output B [   ]\n`;
    sheetMd += `- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable\n`;
    sheetMd += `- **Material Change Flag:** [ ] Yes, material shift present  [ ] No material shift\n`;
    sheetMd += `- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous\n`;
    sheetMd += `- **Reviewer Notes / Rationale:** __________________________________________________\n\n`;
    sheetMd += `---\n\n`;

    // CSV Row
    csvRows.push([
      compId,
      p.genre,
      p.split,
      p.targetIntensity,
      p.sourceText,
      outputA,
      outputB,
      '', // reviewer_id
      '', // meaning_preservation_a_1to5
      '', // meaning_preservation_b_1to5
      '', // factual_accuracy_a_1to5
      '', // factual_accuracy_b_1to5
      '', // clarity_coherence_a_1to5
      '', // clarity_coherence_b_1to5
      '', // genre_tone_fit_a_1to5
      '', // genre_tone_fit_b_1to5
      '', // unnecessary_editing_a_1to5
      '', // unnecessary_editing_b_1to5
      '', // overall_preference
      '', // material_change_flag
      '', // reviewer_confidence
      '', // reviewer_rationale_notes
    ]);
  });

  sheetMd += `## Review Status Verification\n`;
  sheetMd += `**Human Evaluation Progress:** 0 / 36 graded (PENDING)\n`;
  sheetMd += `**Compliance:** Strictly compliant with Zero-Fabrication Hard Constraint.\n`;

  const reviewerSheetPath = resolve(ARTIFACTS_DIR, 'phase11_reviewer_sheet.md');
  writeFileSync(reviewerSheetPath, sheetMd, 'utf-8');
  console.log(`[Phase 11 Package Generator] Wrote reviewer sheet: ${reviewerSheetPath}`);

  // 3. Write CSV Form
  const csvContent = csvRows.map((r) => r.map(escapeCsvField).join(',')).join('\n');
  const reviewFormCsvPath = resolve(ARTIFACTS_DIR, 'phase11_review_form.csv');
  writeFileSync(reviewFormCsvPath, csvContent, 'utf-8');
  console.log(`[Phase 11 Package Generator] Wrote review form CSV: ${reviewFormCsvPath}`);

  // 4. Generate Reviewer Instructions
  const instructionsMd = `# Phase 11: Human Reviewer Guidelines & Evaluation Protocol

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
1. Open \`phase11_review_form.csv\` in your preferred spreadsheet tool (Excel, Google Sheets, LibreOffice).
2. Enter your unique Reviewer ID in the \`reviewer_id\` column for all rows.
3. For each of the 36 rows, fill in columns 9 through 22.
4. Save as CSV and submit to the evaluation repository.
`;
  const reviewerInstructionsPath = resolve(ARTIFACTS_DIR, 'phase11_reviewer_instructions.md');
  writeFileSync(reviewerInstructionsPath, instructionsMd, 'utf-8');
  console.log(`[Phase 11 Package Generator] Wrote instructions: ${reviewerInstructionsPath}`);

  // 5. Generate Review Status JSON
  const statusJson = {
    phase: 'Phase 11: Human Quality Evaluation & Validator Readiness Assessment',
    status: 'PENDING',
    timestamp: new Date().toISOString(),
    evaluationDesign: {
      targetComparisonsCount: 36,
      completedReviewsCount: 0,
      distinctReviewersCount: 0,
      missingScoresCount: 36,
      ratersPerComparisonTarget: 2,
      anonymizedPairwiseProtocol: 'Double-blind randomized A/B',
      zeroFabricationConfirmed: true,
    },
    nextActionsRequired: [
      'Distribute tests/eval/artifacts/phase11_review_form.csv and phase11_reviewer_instructions.md to at least 2 independent human judges.',
      'Collect completed CSV review submissions from reviewers.',
      'Run humanReviewAggregator utility on submitted CSVs to compute inter-rater agreement and preference distributions.',
      'Record final adjudicated human quality verdict.',
    ],
  };
  const statusJsonPath = resolve(ARTIFACTS_DIR, 'phase11_review_status.json');
  writeFileSync(statusJsonPath, JSON.stringify(statusJson, null, 2), 'utf-8');
  console.log(`[Phase 11 Package Generator] Wrote review status JSON: ${statusJsonPath}`);

  // 6. Generate Ambiguous Case Review Sheet (Markdown)
  const ambCases = [
    'p10_acad_16_ambiguous_epistemic_rhetorical',
    'p10_tech_17_ambiguous_configuration_syntax',
    'p10_prof_16_ambiguous_corporate_rhetoric',
    'p10_conv_16_ambiguous_idiomatic_expression',
    'p10_creat_16_ambiguous_metaphorical_riddle',
  ];

  let ambMd = `# Phase 11: Ambiguous-Case Adjudication Sheet (Five Quarantined Manual-Review Cases)

**Status:** PENDING HUMAN ADJUDICATION  
**Scope:** 5 Cases from the independent Phase 10 dataset marked with ground truth \`expectedStatus: MANUAL_REVIEW\`  
**Context:** These cases involve stylistic conversions, rhetorical flattening, and metaphorical shifts where deterministic invariant heuristics cannot reliably distinguish legitimate paraphrasing from subtle nuance erosion.

---

## Ambiguous Accounting Summary

| Category | Sample Count | Automated Disposition in Phase 10/10.1 | Human Adjudication Status |
| :--- | :---: | :--- | :---: |
| **Accepted Despite Review** | 4 | Inappropriately accepted (\`isValid: true\`) because no token invariant was breached | **PENDING** |
| **Rejected Despite Review** | 1 | Inappropriately rejected (\`isValid: false\`) via negation warning (\`p10_creat_16\`) | **PENDING** |
| **Actually Routed to Manual Review** | 0 | Missed by regex trigger (regex required narrow patterns) | **PENDING** |
| **Total Ambiguous Cohort** | **5** | Quarantined from binary confusion matrix metrics | **PENDING** |

---

`;

  ambCases.forEach((id, idx) => {
    const item = p10Fixtures.find((x: any) => x.id === id);
    const caseNum = idx + 1;
    const automatedDisposition = id === 'p10_creat_16_ambiguous_metaphorical_riddle'
      ? 'Inappropriately Rejected (Triggered Negation Warning)'
      : 'Inappropriately Accepted (Cleared without manual review trigger)';

    ambMd += `### Case ${caseNum}: [${item.id}] (Genre: ${item.genre})\n\n`;
    ambMd += `**Original Source:**\n> "${item.sourceText}"\n\n`;
    ambMd += `**Rewritten Output:**\n> "${item.rewrittenText}"\n\n`;
    ambMd += `**Documented Ground-Truth Rationale:**\n> ${item.groundTruth.rationale}\n\n`;
    ambMd += `**Automated Validator Outcome:** \`${automatedDisposition}\`\n\n`;
    ambMd += `**Why Automatic Acceptance/Rejection May Be Unsafe:**\n`;
    if (item.genre === 'academic') {
      ambMd += `- *Epistemic Dilution:* Flattening a direct rhetorical inquiry ("Could these anomalies be attributed solely to...?") into an indirect statement ("Whether environmental toxins alone cause... remains an open question") changes the authorial voice and scientific stance from an active hypothesis query to a literature summary.\n`;
    } else if (item.genre === 'technical') {
      ambMd += `- *Tone Shift:* Changing an interactive rhetorical pitch ("Why manage state manually in the client? Let...") into a dry assertion ("Managing client state manually is redundant when...") removes developer engagement and modifies conversational documentation tone.\n`;
    } else if (item.genre === 'professional') {
      ambMd += `- *Argumentative Directness:* Converting a question-and-answer format ("Can modern enterprise organizations afford to ignore...? ... the answer is clearly no.") into a simple negative declaration eliminates authorial rhetorical emphasis.\n`;
    } else if (item.genre === 'conversational') {
      ambMd += `- *Literalization of Hyperbole:* Converting humorous colloquial hyperbole ("Who needs a gym membership when you can just chase a toddler...?") into a literal fitness claim ("Chasing a toddler is just as good of a workout...") treats conversational jest as an empirical assertion.\n`;
    } else if (item.genre === 'creative') {
      ambMd += `- *Philosophical Flatness:* Restructuring a poetic aphorism ("What is courage if not fear that has said its prayers?") into an analytical belief statement ("pondered the belief that true courage is simply fear fortified by prayer") strips the prose of lyricism. The validator rejected it because the word "not" was dropped, although human readers may view it as valid poetic rephrasing.\n`;
    }

    ambMd += `\n**Human Adjudication Question:**\n`;
    ambMd += `*Does this rewrite preserve the author's intended rhetorical purpose, or does it inappropriately alter authorial voice and emphasis?*\n\n`;
    ambMd += `**Human Adjudicator Decision (To be filled by human reviewer):**\n`;
    ambMd += `- [ ] **Accept as Valid Paraphrase:** Meaning and pragmatic intent are sufficiently preserved.\n`;
    ambMd += `- [ ] **Reject as Meaning Drift:** Nuance or tone has been materially compromised.\n`;
    ambMd += `- [ ] **Route to Mandatory Manual Review:** Genuine borderline case requiring author consultation.\n`;
    ambMd += `- **Adjudicator Rationale:** __________________________________________________\n`;
    ambMd += `- **Adjudicator Signature & Date:** _________________________________________\n\n`;
    ambMd += `---\n\n`;
  });

  const ambCaseReviewPath = resolve(ARTIFACTS_DIR, 'phase11_ambiguous_case_review.md');
  writeFileSync(ambCaseReviewPath, ambMd, 'utf-8');
  console.log(`[Phase 11 Package Generator] Wrote ambiguous case review: ${ambCaseReviewPath}`);

  // 7. Generate False Negative Review Sheet (Markdown)
  const fnGroups = [
    {
      groupTitle: '1. Reversed Causal Direction (4 cases)',
      description: 'The causal relationship between subject and object was flipped, but non-canonical causal predicates ("accelerated", "induced", "triggered", "delayed") were used instead of the explicit connector "caused by".',
      ids: [
        'p10_acad_07_reversed_causality',
        'p10_acad_23_causal_chain_inversion',
        'p10_prof_07_reversed_causality_corporate',
        'p10_conv_07_reversed_causality_flight',
      ],
    },
    {
      groupTitle: '2. Unit-Scale Mutations (2 cases)',
      description: 'Quantities were altered by 1,000x, but the units (KB/MB and MHz/GHz) were omitted from the monitored unit abbreviations table.',
      ids: [
        'p10_tech_16_memory_unit_scale_mutation',
        'p10_tech_25_hardware_frequency_mutation',
      ],
    },
    {
      groupTitle: '3. Unsupported Qualitative Narrative Hallucinations (2 cases)',
      description: 'Substantial descriptive claims were hallucinated without numbers, citations, or recognized regulatory acronyms, avoiding token invariant violations.',
      ids: [
        'p10_conv_06_unsupported_addition_party',
        'p10_creat_06_unsupported_addition_magical_lore',
      ],
    },
    {
      groupTitle: '4. Negation & Quantifier Scope Shifts (2 cases)',
      description: 'Subtle logical polarity shifts: inverted order of two negated items, or "not every" changed to universal negative "no".',
      ids: [
        'p10_conv_10_negation_target_shift_food',
        'p10_creat_15_negation_scope_stars',
      ],
    },
    {
      groupTitle: '5. Lost Epistemic Hedging / Rumor Escalation (1 case)',
      description: 'Casual rumor ("heard rumors... might open") escalated to verified corporate fact ("officially confirmed").',
      ids: [
        'p10_conv_25_hedging_destruction_rumor',
      ],
    },
  ];

  let fnMd = `# Phase 11: Binary False-Negative Failure Analysis & Human Review Sheet

**Status:** COMPILED FOR HUMAN ADJUDICATION  
**Scope:** 11 Binary False Negatives from Phase 10 / 10.1 Independent Evaluation  
**Purpose:** Provide full transparency into missed semantic drift cases, explain why each error matters, and document what evidence human judges need to confirm the failure.

---

## Summary of False-Negative Categories

| Failure Category | Missed Count | Root Cause / Ceiling Type | Impact Severity |
| :--- | :---: | :--- | :---: |
| **Reversed Causal Direction** | 4 | Transitive verb predicates (\`accelerated\`, \`induced\`, \`triggered\`, \`delayed\`) | **HIGH** |
| **Unit-Scale Mutation** | 2 | Dictionary omission (\`KB/MB\`, \`MHz/GHz\`) | **CRITICAL** |
| **Unsupported Qualitative Hallucination** | 2 | Unanchored narrative additions without numbers/entities | **MEDIUM** |
| **Negation & Quantifier Shifts** | 2 | Double-negation predicate swapping / "not every" to "no" | **HIGH** |
| **Lost Epistemic Hedging** | 1 | Unindexed colloquial hedge phrase ("heard rumors") | **MEDIUM** |
| **Total Binary Missed Drifts** | **11** | Missed drift rate: 14.29% (11 / 77) | **OVERALL: LOW-MODERATE** |

---

`;

  fnGroups.forEach((group) => {
    fnMd += `## ${group.groupTitle}\n\n`;
    fnMd += `*${group.description}*\n\n`;

    group.ids.forEach((id) => {
      const item = p10Fixtures.find((x: any) => x.id === id);
      fnMd += `### Case [${item.id}] (Genre: ${item.genre} | Category: ${item.category})\n\n`;
      fnMd += `**Source Passage:**\n> "${item.sourceText}"\n\n`;
      fnMd += `**Rewritten Output:**\n> "${item.rewrittenText}"\n\n`;
      fnMd += `**Documented Ground-Truth Rationale:**\n> ${item.groundTruth.rationale}\n\n`;
      fnMd += `**Frozen Validator Result:** \`isValid: true\` (Passed silently as valid text)\n\n`;
      fnMd += `**Why This Error Matters:**\n`;
      if (item.category === 'reversed_causality') {
        fnMd += `- Causal direction is a foundational factual constraint. Claiming that ${item.rewrittenText.split(' ')[0]} caused the antecedent completely inverts real-world truth.\n`;
      } else if (item.category === 'unit_scale_mutation') {
        fnMd += `- Represents an order-of-magnitude error (1,000x mutation). In production systems or engineering specs, this causes hardware failures or out-of-memory crashes.\n`;
      } else if (item.category === 'unsupported_addition') {
        fnMd += `- Represents ungrounded generative fabrication. While harmless in casual text, it demonstrates that generative models can invent details that token-based validators cannot detect.\n`;
      } else if (item.category === 'negation_scope_shift' || item.category === 'negation_target_shift') {
        fnMd += `- Quantifier shifts turn partial statements ("not every") into universal absolutes ("none"), fundamentally altering truth values.\n`;
      } else if (item.category === 'lost_epistemic_hedging') {
        fnMd += `- Upgrading rumors to confirmed facts creates misinformation liability.\n`;
      }

      fnMd += `\n**Evidence Required for Human Confirmation:**\n`;
      fnMd += `- Compare subject vs. object roles and confirm that the rewrite asserts an ungrounded or inverted claim.\n\n`;
      fnMd += `**Human Adjudication:** [ ] Confirmed False Negative  [ ] Acceptable Edge Case  [ ] Reviewer Disagrees with Ground Truth\n`;
      fnMd += `**Reviewer Signature & Notes:** _________________________________________\n\n`;
      fnMd += `---\n\n`;
    });
  });

  const fnReviewPath = resolve(ARTIFACTS_DIR, 'phase11_false_negative_review.md');
  writeFileSync(fnReviewPath, fnMd, 'utf-8');
  console.log(`[Phase 11 Package Generator] Wrote false negative review: ${fnReviewPath}`);

  console.log('[Phase 11 Package Generator] All Phase 11 artifacts successfully generated!');
}

run();

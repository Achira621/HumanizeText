# Phase 10: Randomized Blind A/B Human Quality Evaluation Sheet

**Status:** PENDING HUMAN REVIEW (Strict Integrity - Zero Fabricated Ratings)  
**Evaluator Protocol:** Double-Blind Pairwise Anonymized Human Evaluation  
**Dataset Provenance:** 36 Authentic Live Cloudflare Workers AI Executions (Phase 7 Live Cloud Results)  
**Candidate Systems:**
- Baseline Pipeline (Pre-Context Cloud Inference)
- Context-Aware Pipeline (Phase 6/7 Context & RewritePlan Cloud Inference)  
*(Outputs are pseudo-randomly assigned to System A and System B per passage using deterministic cryptographic hash coin-flip)*

---

## Evaluation Instructions for Human Reviewers

Please evaluate each passage across the following **6 independent dimensions** plus reviewer confidence.
Do not consult the internal key or metadata until your scoring is fully recorded.

1. **Meaning Preservation (1–5 scale):** Does the output faithfully preserve the author's core thesis, arguments, qualifications, and intended meaning without distortion?
2. **Factual and Numerical Accuracy (1–5 scale):** Are all numbers, dates, units, percentages, citations, and proper nouns strictly preserved? *(Score 1 if numbers or citations were altered or omitted)*
3. **Clarity and Coherence (1–5 scale):** Is the output grammatically sound, easy to read, and logically cohesive?
4. **Genre and Tone Fit (1–5 scale):** Does the writing style match the expectations of the intended genre (Academic, Technical, Professional, Conversational, Creative)?
5. **Unnecessary Editing Penalty (1–5 scale):** Did the system make purposeful improvements, or did it gratuitously rewrite already sound, high-quality prose? *(5 = purposeful & concise; 1 = gratuitous churning of good writing)*
6. **Overall Preference:** Choose `Output A`, `Output B`, `Tie`, or `Neither is acceptable`.
7. **Reviewer Confidence:** Flag your assessment certainty as `High`, `Medium`, or `Low / Ambiguous`.

---

### Case 1: [p7_acad_01_hedging_trap] (Genre: academic | Split: dev | Target Intensity: conservative)

**[Source Passage]:**
> According to Miller et al. (2024), computational linguistics models exhibit noticeable syntactic uniformity [12]. Preliminary empirical data tentatively suggests that prompt engineering may not completely eliminate stylistic uniformity in 45% of cases.

**[Anonymized Output A]:**
> As Miller et al. (2024) note, computational linguistics models show significant syntactic uniformity [12]. Early data suggests that prompt engineering might not fully eliminate stylistic uniformity in 45% of instances.

**[Anonymized Output B]:**
> Miller et al. (2024) note that computational linguistics models demonstrate substantial syntactic similarities [12]. Early empirical results suggest that prompt engineering may not entirely eliminate stylistic uniformity in 45% of cases.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 2: [p7_acad_02_causality_bounds] (Genre: academic | Split: val | Target Intensity: balanced)

**[Source Passage]:**
> Because protein folding degradation occurred rapidly below 4°C, enzymes failed to catalyze the synthesis reaction. Consequently, yield did not exceed 12.4% across 5 trial replications.

**[Anonymized Output A]:**
> The rapid protein folding degradation below 4°C prevented effective catalysis of the synthesis reaction. Yield did not exceed 12.4% across 5 trial replications.

**[Anonymized Output B]:**
> Protein folding degraded quickly at temperatures below 4°C, causing enzymes to fail to catalyze the synthesis reaction. Consequently, the yield did not exceed 12.4% across all five trials.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 3: [p7_acad_03_multivariate_regression] (Genre: academic | Split: held-out | Target Intensity: conservative)

**[Source Passage]:**
> Multivariate regression analysis across n = 1,420 subjects demonstrated that serum cortisol levels correlated inversely with slow-wave sleep duration (β = -0.42, p < 0.001) [8]. However, longitudinal follow-ups at 18 months failed to confirm sustained cognitive deficits when baseline BMI remained under 24.5 kg/m².

**[Anonymized Output A]:**
> Multivariate regression analysis of 1,420 participants showed that higher cortisol levels were linked to shorter slow-wave sleep (β = -0.42, p < 0.001) [8]. Nevertheless, 18-month follow-ups did not find evidence of long-term cognitive issues in individuals with baseline BMIs below 24.5 kg/m².

**[Anonymized Output B]:**
> A multivariate regression analysis of 1,420 subjects revealed a significant inverse correlation between serum cortisol levels and slow-wave sleep duration (β = -0.42, p < 0.001) [8]. Longitudinal follow-ups at 18 months did not confirm sustained cognitive deficits among participants with baseline BMI under 24.5 kg/m².

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 4: [p7_acad_04_epistemic_bounds] (Genre: academic | Split: dev | Target Intensity: conservative)

**[Source Passage]:**
> Initial spectroscopic readings appear to indicate trace methane emissions near crater 7B, although sensor calibration drift might account for 30% of observed variance.

**[Anonymized Output A]:**
> Initial spectroscopic readings suggest trace methane emissions near crater 7B, though calibration drift could explain 30% of the observed variance.

**[Anonymized Output B]:**
> Initial spectroscopic readings suggest trace methane emissions near crater 7B, although sensor calibration drift could account for 30% of the observed variance.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 5: [p7_acad_05_historical_scholarship] (Genre: academic | Split: val | Target Intensity: balanced)

**[Source Passage]:**
> Historiographical consensus regarding seventeenth-century agrarian revolts has shifted markedly since Trevor-Roper's (1967) thesis. Archival taxation rolls in Normandy suggest that local rebellions were not driven primarily by grain scarcity, but rather by municipal resentment against centralized excise collectors during the 1639 Nu-Pieds uprising.

**[Anonymized Output A]:**
> Historians have long debated the causes of 17th-century agrarian revolts, with perspectives evolving since Trevor-Roper's 1967 analysis. New research using archival records from Normandy reveals that the 1639 Nu-Pieds uprising was not primarily driven by grain scarcity, but rather by local anger toward government tax officials. Examination of taxation data challenges earlier assumptions, showing municipal resistance focused on centralized excise policies rather than scarcity-driven desperation.

**[Anonymized Output B]:**
> The historiography of seventeenth-century agrarian revolts has evolved significantly since Trevor-Roper's 1967 analysis. Archival taxation records from Normandy indicate that local uprisings during the 1639 Nu-Pieds revolt were not primarily driven by grain shortages, but rather by municipal opposition to centralized excise enforcement.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 6: [p7_acad_06_causal_inversion_agriculture] (Genre: academic | Split: held-out | Target Intensity: balanced)

**[Source Passage]:**
> Because prolonged drought depleted regional water tables across 4 southern counties, aggregate soybean harvest yields plunged 38% in fiscal year 2025.

**[Anonymized Output A]:**
> 4 southern counties experienced depleted regional water tables due to prolonged drought, causing aggregate soybean harvest yields to drop 38% in fiscal year 2025.

**[Anonymized Output B]:**
> Prolonged drought depleting regional water tables in 4 southern counties led to a 38% decline in total soybean harvests during fiscal year 2025.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 7: [p7_acad_07_dense_citations_hedging] (Genre: academic | Split: dev | Target Intensity: conservative)

**[Source Passage]:**
> While early randomized trials (Chen & Gupta, 2023; Zhao et al., 2025) ostensibly supported microRNA-146a upregulation as a biomarker for neuroinflammation [4, 7], subsequent longitudinal cohort studies did not reproduce these findings in pediatric cohorts under 12 years of age.

**[Anonymized Output A]:**
> Early randomized trials (Chen & Gupta, 2023; Zhao et al., 2025) indicated microRNA-146a upregulation as a biomarker for neuroinflammation [4, 7]. Later longitudinal studies failed to confirm these results in children under 12.

**[Anonymized Output B]:**
> Early randomized trials (Chen & Gupta, 2023; Zhao et al., 2025) indicated that microRNA-146a upregulation might act as a biomarker for neuroinflammation [4, 7]. Later longitudinal studies in children under 12, however, did not replicate these findings.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 8: [p7_tech_01_negated_guarantee] (Genre: technical | Split: val | Target Intensity: conservative)

**[Source Passage]:**
> Failover benchmark testing revealed that asynchronous database replication does not guarantee zero-loss recovery without persistent disk write-ahead checkpoints on all 3 secondary nodes.

**[Anonymized Output A]:**
> Testing showed asynchronous database replication cannot ensure zero-loss recovery unless persistent disk write-ahead checkpoints are in place on all 3 secondary nodes.

**[Anonymized Output B]:**
> Testing revealed that asynchronous database replication cannot guarantee zero-loss recovery unless all 3 secondary nodes have persistent disk write-ahead checkpoints.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 9: [p7_tech_02_latency_memory] (Genre: technical | Split: held-out | Target Intensity: balanced)

**[Source Passage]:**
> The endpoint p99 latency dropped from 145ms to 18ms after deploying Redis caching, but heap memory consumption expanded to 64GB across the cluster.

**[Anonymized Output A]:**
> After deploying Redis caching, endpoint p99 latency fell from 145ms to 18ms. However, heap memory usage increased to 64GB across the cluster.

**[Anonymized Output B]:**
> After implementing Redis caching, endpoint p99 latency decreased from 145ms to 18ms, though heap memory usage rose to 64GB across the cluster.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 10: [p7_tech_03_rfc2119_network] (Genre: technical | Split: held-out | Target Intensity: conservative)

**[Source Passage]:**
> Under RFC 2119 specifications, routers MUST NOT forward ICMP redirect packets when ingress bandwidth exceeds 10Gbps across IPv6 interface eth0.

**[Anonymized Output A]:**
> According to RFC 2119 guidelines, routers MUST NOT forward ICMP redirect packets if the ingress bandwidth on the IPv6 interface eth0 exceeds 10Gbps.

**[Anonymized Output B]:**
> According to RFC 2119, routers must not forward ICMP redirect packets if ingress bandwidth exceeds 10 Gbps on the IPv6 interface eth0.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 11: [p7_tech_04_distributed_consensus] (Genre: technical | Split: dev | Target Intensity: balanced)

**[Source Passage]:**
> In Raft consensus groups of 5 replicas, leader election fails when network partitions isolate 3 nodes concurrently. Because split-brain conditions prevent reaching a 3-of-5 quorum, client write requests are rejected with HTTP 503 until heartbeats resume within 150ms.

**[Anonymized Output A]:**
> In Raft consensus groups with 5 replicas, leader election fails when network partitions isolate three nodes simultaneously. Split-brain scenarios disrupt achieving a 3-of-5 quorum, causing client write requests to get rejected with HTTP 503. The system remains in this state until heartbeats restore within 150ms.

**[Anonymized Output B]:**
> In Raft consensus groups of 5 replicas, leader elections fail when 3 nodes are isolated due to network partitions. This split-brain scenario prevents achieving a 3-of-5 quorum, causing clients to receive HTTP 503 errors until heartbeats resume within 150 milliseconds.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 12: [p7_tech_05_cryptographic_primitives] (Genre: technical | Split: val | Target Intensity: conservative)

**[Source Passage]:**
> Zero-knowledge verification protocols cannot ensure computational privacy if the prover reuses the same 256-bit elliptic curve nonce across multiple proofs. Under curve Ed25519, repeating scalar k leaks private signing keys within 2 signature operations.

**[Anonymized Output A]:**
> Zero-knowledge verification protocols fail to protect computational privacy when a prover reuses a 256-bit elliptic curve nonce across multiple proofs. With Ed25519, using the same scalar value k in two signature operations exposes private signing keys.

**[Anonymized Output B]:**
> Zero-knowledge verification protocols cannot ensure computational privacy if the prover reuses the same 256-bit elliptic curve nonce across multiple proofs. Under Ed25519, reusing the same scalar k within 2 signature operations leaks the private signing key.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 13: [p7_tech_06_database_deadlock] (Genre: technical | Split: dev | Target Intensity: balanced)

**[Source Passage]:**
> Because Transaction T1 retained an exclusive table lock on orders while awaiting row locks on inventory, Transaction T2 encountered deadlock after 30 seconds. Consequently, the PostgreSQL engine aborted T2 with SQLSTATE code 40P01.

**[Anonymized Output A]:**
> Transaction T1 held an exclusive table lock on orders while waiting for row locks on inventory. This resulted in a deadlock after 30 seconds. PostgreSQL aborted T2 with SQLSTATE code 40P01.

**[Anonymized Output B]:**
> Transaction T1 held an exclusive table lock on orders while waiting for row locks on inventory, causing a deadlock after 30 seconds. PostgreSQL terminated Transaction T2 with SQLSTATE code 40P01.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 14: [p7_tech_07_api_rate_limiting] (Genre: technical | Split: held-out | Target Intensity: conservative)

**[Source Passage]:**
> Edge edge-worker middleware throttles unauthenticated requests to 60 queries per minute per /24 subnet. Requests exceeding this threshold receive HTTP 429 with a Retry-After header of 30 seconds, and payload bodies are not buffered in RAM.

**[Anonymized Output A]:**
> Edge-worker middleware limits unauthenticated requests to 60 per minute per /24 subnet. Exceeding this threshold triggers an HTTP 429 response with a 30-second retry interval, and payloads are not stored in memory.

**[Anonymized Output B]:**
> Edge edge-worker middleware limits unauthenticated requests to 60 per minute per /24 subnet. Exceeding this limit triggers an HTTP 429 response with a 30-second retry delay. Request data isn't stored in memory.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 15: [p7_prof_01_arr_expenditure] (Genre: professional | Split: held-out | Target Intensity: balanced)

**[Source Passage]:**
> On March 31, 2026, BioTech Corp announced that recurring ARR expanded by 128% to $58.2 million. However, net operating cash flow did not turn positive due to $14.5 million in capital expenditures across 3 manufacturing hubs.

**[Anonymized Output A]:**
> On March 31, 2026, BioTech Corp announced that recurring ARR rose 128% to $58.2 million. Net operating cash flow remained negative, driven by $14.5 million in capital expenditures across 3 manufacturing hubs.

**[Anonymized Output B]:**
> BioTech Corp reported a 128% increase in recurring ARR to $58.2 million as of March 31, 2026. Net operating cash flow remained negative, attributable to $14.5 million in capital expenditures at three manufacturing hubs.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 16: [p7_prof_02_overedit_trap] (Genre: professional | Split: held-out | Target Intensity: conservative)

**[Source Passage]:**
> We must delve into our third-quarter procurement pipeline to ensure all supplier contracts comply with section 4.2 standards before December 15, 2025.

**[Anonymized Output A]:**
> Review our third-quarter procurement pipeline to verify that all supplier contracts meet section 4.2 requirements before December 15, 2025.

**[Anonymized Output B]:**
> We need to review our third-quarter procurement pipeline to confirm all supplier contracts comply with section 4.2 standards by December 15, 2025.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 17: [p7_prof_03_bureaucratic_bloat] (Genre: professional | Split: dev | Target Intensity: dynamic)

**[Source Passage]:**
> In order to facilitate the proactive optimization of our multifaceted enterprise deliverables, it is crucial to note that delving into comprehensive strategic synergies plays a pivotal role in ensuring that seamless cross-functional alignment is achieved.

**[Anonymized Output A]:**
> To proactively optimize our diverse deliverables, it's essential to focus on strategic synergies. These synergies help ensure effective collaboration across departments.

**[Anonymized Output B]:**
> To proactively optimize our diverse enterprise deliverables, identifying strategic synergies is essential for ensuring cross-functional alignment. This approach directly strengthens operational coherence and accelerates value creation across departments.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 18: [p7_prof_04_compliance_disclaimer] (Genre: professional | Split: val | Target Intensity: conservative)

**[Source Passage]:**
> Pursuant to FINRA Rule 2210, past portfolio performance does not guarantee future investment returns. Advisory clients must understand that principal loss remains possible in 100% of non-FDIC insured fixed income funds.

**[Anonymized Output A]:**
> Under FINRA Rule 2210, past portfolio performance doesn't guarantee future investment returns. Advisory clients should be aware that principal loss is possible in 100% of non-FDIC insured fixed income funds.

**[Anonymized Output B]:**
> Under FINRA Rule 2210, past portfolio performance doesn't guarantee future investment returns. Advisory clients should recognize that principal loss is possible in 100% of non-FDIC insured fixed income funds.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 19: [p7_prof_05_quarterly_shareholder] (Genre: professional | Split: dev | Target Intensity: balanced)

**[Source Passage]:**
> Management expects fourth-quarter gross margin to hover between 42% and 45%, though unforeseen supply disruptions in Taiwan could potentially shave 150 basis points off operating earnings.

**[Anonymized Output A]:**
> Management expects the fourth-quarter gross margin to remain between 42% and 45%, but unexpected supply chain disruptions in Taiwan could reduce operating income by 150 basis points.

**[Anonymized Output B]:**
> Management anticipates the fourth-quarter gross margin will remain within 42% to 45%. However, unexpected supply chain issues in Taiwan could reduce operating earnings by up to 150 basis points.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 20: [p7_prof_06_board_resolution] (Genre: professional | Split: val | Target Intensity: conservative)

**[Source Passage]:**
> The Governance Committee unanimously approved the revised whistleblower protection charter on August 12, 2025. All employees may submit anonymous grievance filings without fear of retaliatory reassignment or salary diminution.

**[Anonymized Output A]:**
> The Governance Committee unanimously approved the revised whistleblower protection charter on August 12, 2025. Employees may submit anonymous grievance filings without fear of retaliatory reassignment or salary diminution.

**[Anonymized Output B]:**
> The Governance Committee unanimously approved the revised whistleblower protection charter on August 12, 2025. All employees may submit anonymous grievance filings without fear of retaliatory reassignment or salary diminution.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 21: [p7_prof_07_executive_memo_redundancy] (Genre: professional | Split: held-out | Target Intensity: dynamic)

**[Source Passage]:**
> At the present point in time, it is absolutely essential and incumbent upon every individual department head to actively eliminate redundant expenditures. In the event that budget targets are not reached by October 31, discretionary hiring will be temporarily frozen for 90 days.

**[Anonymized Output A]:**
> Now, all department heads must actively cut redundant spending. If budget goals aren't met by October 31, non-essential hiring will be paused for 90 days.

**[Anonymized Output B]:**
> Now is the moment for every department head to cut redundant spending. If budget goals remain unmet by October 31, non-essential hiring will pause for 90 days.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 22: [p7_conv_01_personal_voice] (Genre: conversational | Split: dev | Target Intensity: balanced)

**[Source Passage]:**
> Honestly, my grandfather never bought modern coffee maker gadgets. He boiled the same dark roast in a dented steel pot every single morning, and I definitely do not miss the burnt taste from when I tried it at ten years old.

**[Anonymized Output A]:**
> Honestly, my grandfather never owned a modern coffee maker. He brewed the same dark roast in a dented steel pot every morning, and I still don't miss the burnt taste from when I tried it at ten.

**[Anonymized Output B]:**
> Honestly, my grandpa never went for the fancy coffee gadgets. He’d brew that same dark roast in a dented steel pot every morning, and I don’t miss that burnt taste from when I tried it at ten.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 23: [p7_conv_02_commute_contractions] (Genre: conversational | Split: held-out | Target Intensity: balanced)

**[Source Passage]:**
> I wouldn't say my remote work routine is flawless, but spending 90 minutes on a crowded train every weekday was something I couldn't tolerate anymore after five years.

**[Anonymized Output A]:**
> I wouldn't call my remote work setup perfect, but commuting on a packed train for 90 minutes every day was something I couldn't stand after five years.

**[Anonymized Output B]:**
> My remote work routine isn't perfect, but commuting on a crowded train for 90 minutes each weekday became unbearable after five years.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 24: [p7_conv_03_travel_mishap] (Genre: conversational | Split: val | Target Intensity: balanced)

**[Source Passage]:**
> We landed in Lisbon around 2 a.m. after a seven-hour delay in Munich, only to find our checked luggage hadn't made the connection. Still, the taxi driver played fado on the radio, and the midnight air smelled like saltwater and warm bread, so nobody complained.

**[Anonymized Output A]:**
> We arrived in Lisbon around 2 a.m. after a seven-hour delay in Munich, only to find our checked luggage hadn't made the connection. The taxi driver played fado on the radio, and the midnight air smelled of saltwater and warm bread—so no one complained.

**[Anonymized Output B]:**
> We touched down in Lisbon around 2 a.m. after a seven-hour delay in Munich, only to discover our checked bags hadn’t made the connection. Still, the taxi driver cranked up some fado, and the midnight air carried the scent of saltwater and warm bread—so no one batted an eye.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 25: [p7_conv_04_culinary_argument] (Genre: conversational | Split: dev | Target Intensity: dynamic)

**[Source Passage]:**
> Look, you cannot put pineapple on a traditional Neapolitan pizza and expect my aunt from Naples to smile. She spent 40 years running a bakery on Via Toledo, and breaking that rule is basically a family scandal.

**[Anonymized Output A]:**
> Let me be clear: adding pineapple to a traditional Neapolitan pizza won't earn approval from my aunt in Naples. She ran a bakery on Via Toledo for 40 years, and violating that rule is practically a family scandal.

**[Anonymized Output B]:**
> Hey, trying to put pineapple on a traditional Neapolitan pizza? Don’t expect my aunt from Naples to even blink. She ran that bakery on Via Toledo for 40 years, and messing with the rules? That’s a full-blown family scandal.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 26: [p7_conv_05_garage_project] (Genre: conversational | Split: val | Target Intensity: balanced)

**[Source Passage]:**
> My sister and I spent 3 weekends rebuilding our dad's 1974 lawnmower engine. We stripped 4 stripped bolts and soaked the carburetor in vinegar twice, but the moment that 5-horsepower motor roared back to life, we gave each other high fives like kids.

**[Anonymized Output A]:**
> My sister and I spent three weekends rebuilding our dad's 1974 lawnmower engine. We stripped four stripped bolts and soaked the carburetor in vinegar twice, but when that 5-horsepower motor roared back to life, we high-fived like kids.

**[Anonymized Output B]:**
> My sister and I spent 3 weekends rebuilding our dad's 1974 lawnmower engine. We stripped 4 stripped bolts and soaked the carburetor in vinegar twice, but when the 5-horsepower motor roared back to life, we high-fived like children.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 27: [p7_conv_06_tech_frustration] (Genre: conversational | Split: held-out | Target Intensity: balanced)

**[Source Passage]:**
> I'm fairly sure the latest smart thermostat update broke our scheduling profile, because the heat kicked on at 3:30 a.m. yesterday and wouldn't shut off until I pulled the battery.

**[Anonymized Output A]:**
> I'm fairly sure the latest smart thermostat update disrupted our schedule, as the heat turned on at 3:30 a.m. yesterday and wouldn't shut off until I removed the battery.

**[Anonymized Output B]:**
> I'm pretty sure the latest smart thermostat update messed up our schedule. The heat turned on at 3:30 a.m. yesterday and wouldn't shut off until I pulled the battery.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 28: [p7_conv_07_neighborhood_dialogue] (Genre: conversational | Split: dev | Target Intensity: balanced)

**[Source Passage]:**
> Every Sunday around 8 o'clock, Mr. Henderson walks his three golden retrievers down Elm Street. He doesn't say much beyond a cheerful nod, but if you're outside washing the car, he will always pause to compliment the shine and tell you rain isn't coming until Tuesday.

**[Anonymized Output A]:**
> Every Sunday at 8, Mr. Henderson takes his three golden retrievers for a walk down Elm Street. He’s not much for conversation, just a cheerful nod, but if you’re outside washing the car, he’ll always stop by to praise the shine and let you know rain isn’t coming until Tuesday.

**[Anonymized Output B]:**
> Every Sunday at 8 a.m., Mr. Henderson takes his three golden retrievers for a walk along Elm Street. He rarely speaks beyond a cheerful nod, but if you're outside washing your car, he'll always stop to praise its shine and mention that rain won't arrive until Tuesday.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 29: [p7_creat_01_sensory_ambiguity] (Genre: creative | Split: held-out | Target Intensity: conservative)

**[Source Passage]:**
> The solitary lighthouse beacon pierced the ocean fog with tentative flashes, yet its beam could not reveal the jagged reef hiding thirty feet below the churning tide.

**[Anonymized Output A]:**
> The lone lighthouse beam cut through the ocean mist with hesitant glows, but its light failed to expose the jagged reef lying thirty feet beneath the roiling waves.

**[Anonymized Output B]:**
> The lighthouse's single beam flickered uncertainly through the ocean mist. Below the roiling surf, a jagged reef remained hidden, just thirty feet beneath the waves.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 30: [p7_creat_02_metaphor_restraint] (Genre: creative | Split: val | Target Intensity: conservative)

**[Source Passage]:**
> In the quiet library basement, dust motes drifted like pale stars through narrow sunbeams, undisturbed by the muffled murmur of afternoon traffic above.

**[Anonymized Output A]:**
> The library basement was quiet. Dust motes swirled like pale stars through narrow sunbeams, unbothered by the muffled murmur of afternoon traffic above.

**[Anonymized Output B]:**
> Beneath the library's quiet basement, dust motes drifted like pale stars through narrow sunbeams. Unbothered by the muffled hum of afternoon traffic above.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 31: [p7_creat_03_mountain_express] (Genre: creative | Split: held-out | Target Intensity: conservative)

**[Source Passage]:**
> The morning express cleared the mountain pass just as dawn broke over the timberline. Frost clung to the passenger windows, but inside the dining car the coffee was hot and the conductors spoke in quiet murmurs.

**[Anonymized Output A]:**
> The morning express crested the mountain pass as dawn spilled over the timberline. Frost clung to the windows, yet within the dining car, coffee steamed and conductors exchanged soft conversations.

**[Anonymized Output B]:**
> The morning express passed the mountain pass as dawn broke over the timberline. Frost clung to the passenger windows, but the dining car's coffee was hot, and conductors spoke in quiet murmurs.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 32: [p7_creat_04_desert_twilight] (Genre: creative | Split: dev | Target Intensity: conservative)

**[Source Passage]:**
> Dusk fell over the red sandstone canyon in long purple shadows. Cacti stood like sentinel silhouettes against the copper horizon, and the dry wind carried the scent of creosote bush and cool stone. No coyotes barked tonight; the desert held its breath until the stars emerged.

**[Anonymized Output A]:**
> Dusk settled over the red sandstone canyon, stretching long purple shadows across the ground. Cacti loomed as dark shapes against the copper sky, while the dry wind brought the smell of creosote and cool stone. No coyotes called out tonight. The desert seemed to hold its breath until the stars appeared.

**[Anonymized Output B]:**
> Dusk settled over the red sandstone canyon, casting long purple shadows. Cacti stood as silent sentinels against the copper horizon, their forms stark against the fading light. A dry wind carried the aroma of creosote bush and cool stone. No coyotes barked tonight; the desert held its breath until the stars emerged.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 33: [p7_creat_05_harbor_fog] (Genre: creative | Split: val | Target Intensity: conservative)

**[Source Passage]:**
> Trawlers creaked against grease-slicked pilings as the swell pushed through the outer marina. A single yellow lantern burned at the end of dock 4, cutting a hazy halo through the salt mist.

**[Anonymized Output A]:**
> The trawlers groaned against grease-slicked pilings as waves surged through the outer marina. A single yellow lantern burned at dock 4's end, its light cutting a hazy halo through the salt mist.

**[Anonymized Output B]:**
> Trawlers creaked against grease-slicked pilings. The swell pushed through the outer marina. A single yellow lantern glowed at the end of dock 4, casting a hazy glow through the salt mist.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 34: [p7_creat_06_antique_clockmaker] (Genre: creative | Split: dev | Target Intensity: balanced)

**[Source Passage]:**
> Master horologist Vane peered through his 10x brass loupe at the escapement mechanism of an 18th-century French mantel clock. If the balance wheel oscillations varied by even 0.5 seconds per day, the pendulum would fail to synchronize with the chiming train.

**[Anonymized Output A]:**
> Master horologist Vane examined the escapement mechanism of an 18th-century French mantel clock through his 10x brass loupe. Even a 0.5-second daily variation in the balance wheel's oscillations would disrupt the pendulum's synchronization with the chiming train.

**[Anonymized Output B]:**
> Master horologist Vane studied the escapement mechanism of an 18th-century French mantel clock through his 10x brass loupe. Even a slight deviation of 0.5 seconds per day in the balance wheel's oscillations would disrupt the pendulum's synchronization with the chiming train.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 35: [p7_creat_07_storm_over_prairie] (Genre: creative | Split: val | Target Intensity: conservative)

**[Source Passage]:**
> Thunder rolled low across the western prairie, shaking the tin roof of the old grain elevator. Dry wheat rippled like amber water under the sudden downdraft, but not a single raindrop touched the cracked earth for twenty miles.

**[Anonymized Output A]:**
> Thunder rumbled over the western prairie, rattling the rusted tin roof of the old grain elevator. Dry wheat rippled like amber water beneath the sudden gust, yet not a single raindrop touched the cracked earth for twenty miles.

**[Anonymized Output B]:**
> Thunder rumbled across the western prairie, vibrating the tin roof of the old grain elevator. Dry wheat rippled like amber water beneath a sudden gust, yet no rain fell on the cracked earth for twenty miles.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

### Case 36: [p7_creat_08_cellist_rehearsal] (Genre: creative | Split: held-out | Target Intensity: conservative)

**[Source Passage]:**
> In the cold conservatory practice room, Maya tightened her horsehair bow and drew the first long C-natural across the gut strings. The resonance filled the vaulted corners with rich amber vibration, without any harsh vibrato or hurried tempo to spoil the phrasing.

**[Anonymized Output A]:**
> In the cold conservatory practice room, Maya tightened her horsehair bow. She drew the first long C-natural across the gut strings. The resonance filled the vaulted corners with rich amber vibration, without any harsh vibrato or hurried tempo to spoil the phrasing.

**[Anonymized Output B]:**
> In the cold conservatory practice room, Maya tightened her horsehair bow. She played the first long C-natural across the gut strings, its resonance echoing through the vaulted corners. The sound carried warm, amber tones without any harsh vibrato or rushed tempo marring the phrasing.

**Human Scoring Rubric (To be completed by human reviewer):**
- Meaning Preservation (1-5): [   ]
- Factual & Numerical Accuracy (1-5): [   ]
- Clarity & Coherence (1-5): [   ]
- Genre & Tone Fit (1-5): [   ]
- Unnecessary Editing (1-5): [   ]
- **Overall Preference:** [ ] Output A  [ ] Output B  [ ] Tie  [ ] Neither is acceptable
- **Reviewer Confidence:** [ ] High  [ ] Medium  [ ] Low / Ambiguous
- **Reviewer Notes:** __________________________________________________

---

## Review Status Verification
**Human Evaluation Progress:** 0 / 36 graded (PENDING)
**Zero-Fabrication Integrity:** Strictly compliant with Zero-Fabrication Hard Constraint.

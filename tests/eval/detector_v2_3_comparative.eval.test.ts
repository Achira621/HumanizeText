/**
 * ============================================================================
 * HUMANIZETEXT DETECTOR V2.3.1: EXPERIMENTAL COMPARATIVE EVALUATION HARNESS
 * Rigorously benchmarks Option A (Baseline Heuristic), Option B (Hand-Weighted
 * Stylometric Discriminator), and Option C (Heuristic Score Fusion) across:
 *  - Group A: Development Corpus (N=60, 10 base texts)
 *  - Group B: Internal Validation Corpus (N=60, 12 base texts)
 *  - Group C: External Challenge Corpus (N=60, 3 base texts)
 * 
 * IMPORTANT METHODOLOGICAL NOTICE (V2.3.1 AUDIT RECONCILIATION):
 * This harness serves for repeatability and software regression testing.
 * The 180 evaluation items represent synthetic expansions of 25 unique base texts.
 * They are NOT independently gathered empirical documents and do not establish
 * real-world statistical generalization. Quality tiers are developer-assigned proxies.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateDetectorOption,
  computeEvaluationMetrics,
} from '../../src/lib/detector/v2_3/detectorAdapter';

export interface ProvenanceAwareEvaluationSample {
  id: string;
  group: 'group_a_dev' | 'group_b_val' | 'group_c_challenge';
  label: 'human_verified' | 'ai_generated' | 'collaborative';
  genre: 'academic' | 'technical' | 'corporate' | 'conversational' | 'creative';
  lengthCategory: 'short' | 'medium' | 'long';
  text: string;

  // Provenance & Independence Tracking Fields (V2.3.1)
  baseDocumentId: string;
  sourceDataset: string;
  sourceDocumentId: string;
  authorClass: 'human' | 'ai' | 'collaborative';
  promptId: string;
  modelProvider: string;
  modelName: string;
  generationMetadata: Record<string, unknown>;
  transformationType: 'verbatim' | 'suffix_extension' | 'token_substitution' | 'original';
  independenceGroupId: string;
  qualityRatingStatus: 'unassessed_by_human' | 'developer_assigned_proxy' | 'double_blind_verified';
  provenanceStatus: 'verified_archival' | 'synthetic_expansion' | 'prompted_generation' | 'unknown';

  // Exploratory quality proxy (developer heuristic, NOT human assessment)
  exploratoryQualityProxy:
    | 'imperfect_human'
    | 'competent_human'
    | 'polished_human'
    | 'imperfect_ai'
    | 'competent_ai'
    | 'polished_ai';
}

/**
 * Group-level split validator preventing related passages or duplicate generations
 * from crossing partition boundaries.
 */
export function validateGroupSplitIntegrity(samples: ProvenanceAwareEvaluationSample[]): {
  isValid: boolean;
  leaks: string[];
} {
  const leaks: string[] = [];
  const groupIdsByPartition = new Map<string, Set<string>>();

  for (const s of samples) {
    if (!groupIdsByPartition.has(s.group)) {
      groupIdsByPartition.set(s.group, new Set<string>());
    }
    groupIdsByPartition.get(s.group)!.add(s.independenceGroupId);
  }

  const partitions = Array.from(groupIdsByPartition.keys());
  for (let i = 0; i < partitions.length; i++) {
    for (let j = i + 1; j < partitions.length; j++) {
      const p1 = partitions[i];
      const p2 = partitions[j];
      const s1 = groupIdsByPartition.get(p1)!;
      const s2 = groupIdsByPartition.get(p2)!;

      for (const id of s1) {
        if (s2.has(id)) {
          leaks.push(`Data Leakage: IndependenceGroupId "${id}" is shared between ${p1} and ${p2}`);
        }
      }
    }
  }

  return { isValid: leaks.length === 0, leaks };
}

/**
 * Builds the repeatable 180-sample benchmark dataset with explicit provenance tracking.
 */
function buildComparativeEvaluationCorpora(): ProvenanceAwareEvaluationSample[] {
  const samples: ProvenanceAwareEvaluationSample[] = [];

  // --------------------------------------------------------------------------
  // GROUP A: DEVELOPMENT DATASET (N=60: 30 Human, 30 AI)
  // Derived from 10 base texts (5 human, 5 AI) with synthetic suffix variations
  // --------------------------------------------------------------------------
  const devHumanBases = [
    {
      baseId: 'base_dev_h_01',
      genre: 'academic',
      source: 'Darwin Origin of Species (1859)',
      text: 'When we look to the individuals of the same variety or sub-variety of our older cultivated plants and animals, one of the first points which strikes us is, that they generally differ more from each other than do the individuals of any one species or variety in a state of nature. Domesticated races of animals and plants offer us the most extraordinary diversity.',
      qualityProxy: 'polished_human' as const,
    },
    {
      baseId: 'base_dev_h_02',
      genre: 'technical',
      source: 'IETF RFC 793',
      text: 'A connection is defined by a pair of sockets. Sockets may be used simultaneously in multiple connections. The binding of ports to processes is handled independently in each host. Sockets are identified by an IP address and port number, allowing full duplex communication across distributed endpoints without buffer deadlock.',
      qualityProxy: 'competent_human' as const,
    },
    {
      baseId: 'base_dev_h_03',
      genre: 'corporate',
      source: 'SEC Form 10-K',
      text: 'Operating income decreased by fourteen percent during the fiscal year ended December 31, primarily reflecting higher freight costs, elevated wage rates in distribution centers, and increased marketing expenditures. Gross margin contracted eighty basis points to thirty-eight point two percent, as price increases implemented in the third quarter only partially offset raw material inflation in our packaging division. Capital expenditures for the upcoming period will focus on automated logistics.',
      qualityProxy: 'polished_human' as const,
    },
    {
      baseId: 'base_dev_h_04',
      genre: 'conversational',
      source: 'Public Community Forum',
      text: 'Honestly, I spent three hours yesterday trying to set up that Postgres connection pool and it kept crashing on startup. Turns out the default timeout was set to 500ms which is way too aggressive for my home lab setup. Once I bumped it up to 5 seconds everything connected smoothly. You might wanna double check your yaml indentation too.',
      qualityProxy: 'imperfect_human' as const,
    },
    {
      baseId: 'base_dev_h_05',
      genre: 'creative',
      source: 'Literary Essay Archive',
      text: 'The morning mist clung stubbornly to the valley floor, drowning the orchard in cold, motionless gray. An old rusted harrow leaned against the sagging wire fence, half-buried under brambles that had spent twenty summers tightening their grip on the iron tines. Nothing stirred save for a crow shifting its wings on the telephone wire overhead.',
      qualityProxy: 'polished_human' as const,
    },
  ];

  // First 5 original base samples
  devHumanBases.forEach((b, idx) => {
    samples.push({
      id: `dev_h_${String(idx + 1).padStart(2, '0')}`,
      group: 'group_a_dev',
      label: 'human_verified',
      genre: b.genre as any,
      lengthCategory: 'medium',
      text: b.text,
      baseDocumentId: b.baseId,
      sourceDataset: 'public_domain_archives',
      sourceDocumentId: `doc_${b.baseId}`,
      authorClass: 'human',
      promptId: 'unavailable',
      modelProvider: 'none',
      modelName: 'human_author',
      generationMetadata: {},
      transformationType: 'original',
      independenceGroupId: `indep_group_dev_h_${idx + 1}`,
      qualityRatingStatus: 'developer_assigned_proxy',
      provenanceStatus: 'verified_archival',
      exploratoryQualityProxy: b.qualityProxy,
    });
  });

  // Replicate across 5 batches to form 30 human dev samples
  for (let i = 1; i <= 5; i++) {
    for (let j = 1; j <= 5; j++) {
      const base = devHumanBases[j - 1];
      samples.push({
        id: `dev_h_${String(i * 5 + j).padStart(2, '0')}`,
        group: 'group_a_dev',
        label: 'human_verified',
        genre: base.genre as any,
        lengthCategory: 'medium',
        text: base.text + ` Further observations in iteration ${i} confirmed the initial structural variance.`,
        baseDocumentId: base.baseId,
        sourceDataset: 'public_domain_archives',
        sourceDocumentId: `doc_${base.baseId}`,
        authorClass: 'human',
        promptId: 'unavailable',
        modelProvider: 'none',
        modelName: 'human_author',
        generationMetadata: {},
        transformationType: 'suffix_extension',
        independenceGroupId: `indep_group_dev_h_${j}`,
        qualityRatingStatus: 'developer_assigned_proxy',
        provenanceStatus: 'synthetic_expansion',
        exploratoryQualityProxy: base.qualityProxy,
      });
    }
  }

  // AI Dev Samples (5 base texts)
  const devAiBases = [
    { baseId: 'base_dev_ai_01', text: 'Hydrothermal vents play a crucial role in modern marine ecosystems. By harnessing geothermal energy from the Earth crust, these intricate biological environments provide a wide range of benefits to diverse marine organisms. Furthermore, they facilitate essential chemical exchanges that maintain oceanic balance in today changing landscape.', model: 'gpt-3.5-turbo', provider: 'openai' },
    { baseId: 'base_dev_ai_02', text: 'Implementing idempotency keys in financial APIs is essential for ensuring robust transaction processing. This mechanism allows distributed systems to prevent duplicate operations when network timeouts occur. Additionally, by caching the request hash and response payload within a designated TTL window, clients can safely retry failed HTTP requests.', model: 'gpt-3.5-turbo', provider: 'openai' },
    { baseId: 'base_dev_ai_03', text: 'The quarterly financial results reflect our ongoing commitment to operational efficiency and strategic growth. Through multifaceted cost-reduction initiatives and streamlined supply chain workflows, the organization successfully mitigated inflationary pressures while fostering innovation across our core enterprise software offerings.', model: 'gpt-4', provider: 'openai' },
    { baseId: 'base_dev_ai_04', text: 'If you are having trouble connecting to your local database, there are several troubleshooting steps you can take. First, ensure that the service is running and properly bound to the expected port. Second, verify that your firewall configuration permits inbound connections from your local subnet.', model: 'claude-3-sonnet', provider: 'anthropic' },
    { baseId: 'base_dev_ai_05', text: 'The ancient forest stood as a testament to the enduring power of nature. Towering trees formed a lush canopy overhead, allowing dappled sunlight to illuminate the vibrant moss below. In this tranquil sanctuary, multifaceted wildlife flourished seamlessly in harmonious coexistence.', model: 'claude-3-sonnet', provider: 'anthropic' },
  ];

  for (let i = 0; i < 30; i++) {
    const textIdx = i % 5;
    const base = devAiBases[textIdx];
    samples.push({
      id: `dev_ai_${String(i + 1).padStart(2, '0')}`,
      group: 'group_a_dev',
      label: 'ai_generated',
      genre: ['academic', 'technical', 'corporate', 'conversational', 'creative'][textIdx] as any,
      lengthCategory: 'medium',
      text: base.text + ` It is worth noting that consistent implementation ${i} delivers scalable outcomes.`,
      baseDocumentId: base.baseId,
      sourceDataset: 'prompted_benchmark_gens',
      sourceDocumentId: `doc_${base.baseId}`,
      authorClass: 'ai',
      promptId: `dev_prompt_${textIdx + 1}`,
      modelProvider: base.provider,
      modelName: base.model,
      generationMetadata: { temperature: 0.7 },
      transformationType: 'suffix_extension',
      independenceGroupId: `indep_group_dev_ai_${textIdx + 1}`,
      qualityRatingStatus: 'developer_assigned_proxy',
      provenanceStatus: 'synthetic_expansion',
      exploratoryQualityProxy: i % 3 === 0 ? 'polished_ai' : i % 3 === 1 ? 'competent_ai' : 'imperfect_ai',
    });
  }

  // --------------------------------------------------------------------------
  // GROUP B: INTERNAL VALIDATION DATASET (N=60: 30 Human, 30 AI)
  // Derived from 12 base texts (6 human, 6 AI) repeated 5 times verbatim
  // --------------------------------------------------------------------------
  const valHumanBases = [
    { baseId: 'base_val_h_01', genre: 'academic', len: 'medium', text: 'Epigenetic histone acetylation weakens electrostatic interactions between histones and DNA, opening the chromatin architecture for transcription factors. In our 2021 assays, modifying Lysine 9 increased polymerase binding affinity threefold across forty target promoter sites.', qualityProxy: 'competent_human' as const },
    { baseId: 'base_val_h_02', genre: 'academic', len: 'long', text: 'Binding rent controls artificially suppress price signals in urban real estate markets. While short-run demand is relatively inelastic, long-run consequences include deteriorated housing stock, landlord rationing via discrimination, and black-market subletting arrangements that completely defeat statutory intent. In our 2021 survey of 450 residential properties, maintenance expenditures fell by thirty-two percent within four years of enactment.', qualityProxy: 'polished_human' as const },
    { baseId: 'base_val_h_03', genre: 'technical', len: 'medium', text: 'Oversized database connection pools create severe context switching overhead on database CPU cores, drastically decreasing transactional throughput. When connection threads exceed hardware capability, cache thrashing drops IOPS from 12000 to under 1800 under peak concurrency.', qualityProxy: 'competent_human' as const },
    { baseId: 'base_val_h_04', genre: 'technical', len: 'long', text: 'When configuring PostgreSQL connection pools via PgBouncer or HikariCP, connection counts should be bounded by two times CPU core count plus spindle count. Allocating hundreds of connections to a thirty-two core server induces catastrophic latch contention and memory bloat under load spikes. In our production cluster, reducing pool size from 200 to 48 reduced p99 latency from 850ms to 24ms.', qualityProxy: 'polished_human' as const },
    { baseId: 'base_val_h_05', genre: 'corporate', len: 'medium', text: 'We are rescheduling the database migration cutover by three weeks following multi-region replication lag observed during peak stress simulations. Revised cutover windows and rollback protocols have been communicated to customer support leads. The revised target go-live date is November 14 at 02:00 UTC.', qualityProxy: 'competent_human' as const },
    { baseId: 'base_val_h_06', genre: 'conversational', len: 'short', text: 'Hey, did anyone check if the staging deploy went through? The dashboard still shows the old build timestamp from Tuesday.', qualityProxy: 'imperfect_human' as const },
  ];

  for (let i = 0; i < 30; i++) {
    const b = valHumanBases[i % valHumanBases.length];
    samples.push({
      id: `val_h_${String(i + 1).padStart(2, '0')}`,
      group: 'group_b_val',
      label: 'human_verified',
      genre: b.genre as any,
      lengthCategory: b.len as any,
      text: b.text,
      baseDocumentId: b.baseId,
      sourceDataset: 'internal_validation_corpus',
      sourceDocumentId: `doc_${b.baseId}`,
      authorClass: 'human',
      promptId: 'unavailable',
      modelProvider: 'none',
      modelName: 'human_author',
      generationMetadata: {},
      transformationType: 'verbatim',
      independenceGroupId: `indep_group_val_h_${(i % valHumanBases.length) + 1}`,
      qualityRatingStatus: 'developer_assigned_proxy',
      provenanceStatus: 'verified_archival',
      exploratoryQualityProxy: b.qualityProxy,
    });
  }

  const valAiBases = [
    { baseId: 'base_val_ai_01', genre: 'academic', len: 'medium', text: 'DNA methylation primarily occurs at cytosine bases within CpG dinucleotides, creating binding sites for methyl-CpG-binding domain proteins that recruit histone deacetylase complexes to condense chromatin into a transcriptionally repressive heterochromatic state. Concurrently, histone acetylation neutralizes basic lysine charges, relaxing chromatin structure and enabling RNA polymerase II recruitment. Therefore, epigenetic remodeling coordinates transcriptional regulation across developmental stages.', model: 'gpt-4o', provider: 'openai', qualityProxy: 'competent_ai' as const },
    { baseId: 'base_val_ai_02', genre: 'academic', len: 'long', text: 'A binding rent ceiling imposed below the market equilibrium price creates an immediate deadweight loss in urban housing. Because price rationing is legally prohibited, landlords substitute non-price criteria, including credit scores, employment histories, and informal side-payments, disproportionately harming vulnerable tenants. Over the long run, capital investment declines and housing supply contracts significantly. Consequently, municipal housing shortages worsen as maintenance deferred accelerates physical building degradation.', model: 'claude-3-5-sonnet', provider: 'anthropic', qualityProxy: 'polished_ai' as const },
    { baseId: 'base_val_ai_03', genre: 'technical', len: 'medium', text: 'Clients should generate unique UUID v4 idempotency keys and transmit them via the Idempotency-Key header on every financial mutation. Consequently, the distributed gateway verifies transaction headers to suppress duplicate downstream ledger execution. Furthermore, request caching ensures safe automated client retry execution without duplicate database side-effects.', model: 'gpt-4o', provider: 'openai', qualityProxy: 'competent_ai' as const },
    { baseId: 'base_val_ai_04', genre: 'technical', len: 'long', text: 'Optimal connection pool sizing follows the standard formula where pool size equals core count times two plus effective spindle count. Configuring connection pools larger than hardware capacity induces thread context switching thrashing, increasing query queue latency and exhausting database shared memory buffers under sustained concurrency. Furthermore, excess connections increase connection contention and degrade cache hit ratios across all database backends.', model: 'claude-3-5-sonnet', provider: 'anthropic', qualityProxy: 'polished_ai' as const },
    { baseId: 'base_val_ai_05', genre: 'corporate', len: 'medium', text: 'The enterprise data migration cutover has been rescheduled by twenty-one calendar days to resolve cross-region replication latency detected during final stress verification. The updated maintenance schedule ensures zero uncommitted transactions across regional read replicas. Additionally, automated verification scripts will monitor consistency throughout the extended transition window.', model: 'gpt-4o', provider: 'openai', qualityProxy: 'competent_ai' as const },
    { baseId: 'base_val_ai_06', genre: 'conversational', len: 'short', text: 'I checked the staging environment and verified that the newest build artifacts deployed successfully twenty minutes ago.', model: 'gpt-3.5-turbo', provider: 'openai', qualityProxy: 'imperfect_ai' as const },
  ];

  for (let i = 0; i < 30; i++) {
    const b = valAiBases[i % valAiBases.length];
    samples.push({
      id: `val_ai_${String(i + 1).padStart(2, '0')}`,
      group: 'group_b_val',
      label: 'ai_generated',
      genre: b.genre as any,
      lengthCategory: b.len as any,
      text: b.text,
      baseDocumentId: b.baseId,
      sourceDataset: 'internal_validation_corpus',
      sourceDocumentId: `doc_${b.baseId}`,
      authorClass: 'ai',
      promptId: `val_prompt_${(i % valAiBases.length) + 1}`,
      modelProvider: b.provider,
      modelName: b.model,
      generationMetadata: { temperature: 0.7 },
      transformationType: 'verbatim',
      independenceGroupId: `indep_group_val_ai_${(i % valAiBases.length) + 1}`,
      qualityRatingStatus: 'developer_assigned_proxy',
      provenanceStatus: 'prompted_generation',
      exploratoryQualityProxy: b.qualityProxy,
    });
  }

  // --------------------------------------------------------------------------
  // GROUP C: EXTERNAL CHALLENGE DATASET (N=60: 20 Human, 20 AI, 20 Collab)
  // Derived from 3 base texts with index parameter variations
  // --------------------------------------------------------------------------
  for (let i = 1; i <= 20; i++) {
    samples.push({
      id: `chal_h_${String(i).padStart(2, '0')}`,
      group: 'group_c_challenge',
      label: 'human_verified',
      genre: 'academic',
      lengthCategory: 'long',
      text: `In natural populations of Drosophila melanogaster, chromosomal inversions suppress recombination across significant genomic segments. This structural variation maintains co-adapted gene complexes that confer localized climatic adaptation along latitudinal clines. In our 2023 fieldwork across twelve European sites, inversion frequencies shifted by twenty-six percent across five hundred kilometers. Empirical sequencing of sample ${i} confirmed these thermal tolerance thresholds.`,
      baseDocumentId: 'base_chal_h_01',
      sourceDataset: 'challenge_drosophila_fieldwork',
      sourceDocumentId: `chal_doc_h_${i}`,
      authorClass: 'human',
      promptId: 'unavailable',
      modelProvider: 'none',
      modelName: 'human_author',
      generationMetadata: {},
      transformationType: 'token_substitution',
      independenceGroupId: 'indep_group_chal_h_01',
      qualityRatingStatus: 'developer_assigned_proxy',
      provenanceStatus: 'verified_archival',
      exploratoryQualityProxy: 'polished_human',
    });

    samples.push({
      id: `chal_ai_${String(i).padStart(2, '0')}`,
      group: 'group_c_challenge',
      label: 'ai_generated',
      genre: 'academic',
      lengthCategory: 'long',
      text: `Epigenetic modifications regulate eukaryotic gene expression without altering the underlying nucleotide sequence through chemical modifications to DNA and histone proteins. DNA methylation predominantly occurs at CpG islands, recruiting repressive methyl-binding complexes. Concurrently, histone acetylation neutralizes basic lysine charges, relaxing chromatin structure and enabling RNA polymerase II recruitment across genomic loci. Therefore, chromatin remodeling coordinates developmental gene activation.`,
      baseDocumentId: 'base_chal_ai_01',
      sourceDataset: 'challenge_frontier_academic',
      sourceDocumentId: `chal_doc_ai_${i}`,
      authorClass: 'ai',
      promptId: 'chal_prompt_epigenetics',
      modelProvider: 'anthropic',
      modelName: 'claude-3-5-sonnet',
      generationMetadata: { temperature: 0.5 },
      transformationType: 'verbatim',
      independenceGroupId: 'indep_group_chal_ai_01',
      qualityRatingStatus: 'developer_assigned_proxy',
      provenanceStatus: 'prompted_generation',
      exploratoryQualityProxy: 'polished_ai',
    });

    samples.push({
      id: `chal_collab_${String(i).padStart(2, '0')}`,
      group: 'group_c_challenge',
      label: 'collaborative',
      genre: 'academic',
      lengthCategory: 'long',
      text: `Chromatin accessibility directly dictates transcription factor binding kinetics. While DNA methylation generally compacts nucleosomes into dense heterochromatin, targeted histone acetylation opens regulatory promoters. In our re-analysis of specimen ${i}, we found that synthetic epigenetic editing reversed silencing without introducing off-target mutations, though chromatin remodeling remained variable.`,
      baseDocumentId: 'base_chal_collab_01',
      sourceDataset: 'challenge_collaborative_edits',
      sourceDocumentId: `chal_doc_collab_${i}`,
      authorClass: 'collaborative',
      promptId: 'chal_prompt_collab',
      modelProvider: 'human_ai_pair',
      modelName: 'claude-3-sonnet-plus-human-edit',
      generationMetadata: { editsCount: 4 },
      transformationType: 'token_substitution',
      independenceGroupId: 'indep_group_chal_collab_01',
      qualityRatingStatus: 'developer_assigned_proxy',
      provenanceStatus: 'synthetic_expansion',
      exploratoryQualityProxy: 'competent_human',
    });
  }

  return samples;
}

describe('HUMANIZETEXT V2.3.1: Comparative Benchmark & Provenance Audit', () => {
  const allSamples = buildComparativeEvaluationCorpora();
  const groupA = allSamples.filter((s) => s.group === 'group_a_dev');
  const groupB = allSamples.filter((s) => s.group === 'group_b_val');
  const groupC = allSamples.filter((s) => s.group === 'group_c_challenge');

  it('verifies complete sample integrity, provenance fields, and non-overlapping partitions', () => {
    expect(allSamples.length).toBe(180);
    expect(groupA.length).toBe(60);
    expect(groupB.length).toBe(60);
    expect(groupC.length).toBe(60);

    const seenIds = new Set<string>();
    for (const s of allSamples) {
      expect(seenIds.has(s.id)).toBe(false);
      seenIds.add(s.id);

      // Verify explicit V2.3.1 provenance fields
      expect(s.baseDocumentId).toBeDefined();
      expect(s.sourceDataset).toBeDefined();
      expect(s.sourceDocumentId).toBeDefined();
      expect(s.authorClass).toBeDefined();
      expect(s.promptId).toBeDefined();
      expect(s.modelProvider).toBeDefined();
      expect(s.modelName).toBeDefined();
      expect(s.transformationType).toBeDefined();
      expect(s.independenceGroupId).toBeDefined();
      expect(s.qualityRatingStatus).toBe('developer_assigned_proxy');
      expect(s.provenanceStatus).toBeDefined();
    }

    // Run group-level split validator
    const splitValidation = validateGroupSplitIntegrity(allSamples);
    expect(splitValidation.isValid).toBe(true);
    expect(splitValidation.leaks.length).toBe(0);
  });

  describe('Option A (Baseline Heuristic) Performance Benchmark', () => {
    it('demonstrates recall collapse on modern polished AI text (Group B & C)', () => {
      const scoredGroupB = groupB
        .filter((s) => s.label === 'human_verified' || s.label === 'ai_generated')
        .map((sample) => ({
          label: sample.label,
          result: evaluateDetectorOption(sample.text, 'option_a_heuristic'),
        }));

      const metrics = computeEvaluationMetrics(scoredGroupB, 0.50);

      // Option A recall on modern polished AI without cliches collapses severely
      expect(metrics.totalSamples).toBe(60);
      expect(metrics.totalClassified).toBe(60);
      expect(metrics.totalAbstained).toBe(0);
      expect(metrics.selectiveRecall).toBe(0.333); // Fails to detect 66.7% of modern AI!
      expect(metrics.cohortWideEffectiveAiRecall).toBe(0.333);
      expect(metrics.selectiveSpecificity).toBe(1.0);
    });
  });

  describe('Option B (Hand-Weighted Stylometric Discriminator) Performance Benchmark', () => {
    it('achieves substantial recall gain on modern AI text while bounding human FPR', () => {
      const scoredGroupB = groupB
        .filter((s) => s.label === 'human_verified' || s.label === 'ai_generated')
        .map((sample) => ({
          label: sample.label,
          result: evaluateDetectorOption(sample.text, 'option_b_stylometric'),
        }));

      const metrics = computeEvaluationMetrics(scoredGroupB, 0.50);

      // Explicit accounting of classified vs abstained
      expect(metrics.totalSamples).toBe(60);
      expect(metrics.totalClassified).toBe(40);
      expect(metrics.totalAbstained).toBe(20);
      expect(metrics.humanSamplesAbstained).toBe(15);
      expect(metrics.aiSamplesAbstained).toBe(5);

      // Selective and effective recall separation
      expect(metrics.selectiveRecall).toBe(0.80);
      expect(metrics.cohortWideEffectiveAiRecall).toBe(0.667);
      expect(metrics.selectivePrecision).toBe(1.0);
      expect(metrics.selectiveSpecificity).toBe(1.0);
      expect(metrics.humanCoverage).toBe(0.50);
      expect(metrics.aiCoverage).toBe(0.833);
    });
  });

  describe('Option C (Heuristic Score Fusion with Selective Abstention)', () => {
    it('reports transparent abstentions and cohort-wide effective recall on Group B', () => {
      const scoredGroupB = groupB
        .filter((s) => s.label === 'human_verified' || s.label === 'ai_generated')
        .map((sample) => ({
          label: sample.label,
          result: evaluateDetectorOption(sample.text, 'option_c_hybrid', {
            enableSelectiveAbstention: true,
          }),
        }));

      const metrics = computeEvaluationMetrics(scoredGroupB);

      // Exactly 30 samples abstained (15 human, 15 AI)
      expect(metrics.totalSamples).toBe(60);
      expect(metrics.totalClassified).toBe(30);
      expect(metrics.totalAbstained).toBe(30);
      expect(metrics.humanSamplesAbstained).toBe(15);
      expect(metrics.aiSamplesAbstained).toBe(15);

      // Explicit separation of selective vs cohort-wide effective recall
      expect(metrics.selectiveRecall).toBe(0.667);
      expect(metrics.cohortWideEffectiveAiRecall).toBe(0.333); // 10/30 total AI
      expect(metrics.selectivePrecision).toBe(1.0);
      expect(metrics.selectiveSpecificity).toBe(1.0);
      expect(metrics.humanCoverage).toBe(0.50);
      expect(metrics.aiCoverage).toBe(0.50);
    });

    it('evaluates External Challenge Corpus (Group C) with zero human false positives', () => {
      const scoredGroupC = groupC
        .filter((s) => s.label === 'human_verified' || s.label === 'ai_generated')
        .map((sample) => ({
          label: sample.label,
          result: evaluateDetectorOption(sample.text, 'option_c_hybrid', {
            enableSelectiveAbstention: true,
          }),
        }));

      const metrics = computeEvaluationMetrics(scoredGroupC);

      expect(metrics.fp).toBe(0);
      expect(metrics.selectiveFalsePositiveRate).toBe(0.0);
      expect(metrics.selectiveSpecificity).toBe(1.0);
      expect(metrics.selectiveRecall).toBe(1.0);
      expect(metrics.cohortWideEffectiveAiRecall).toBe(1.0);
      expect(metrics.selectivePrecision).toBe(1.0);
    });

    it('measures collaborative cohort scores showing intermediate match score', () => {
      const collabSamples = groupC.filter((s) => s.label === 'collaborative');
      expect(collabSamples.length).toBe(20);

      const scores = collabSamples.map((s) => {
        const res = evaluateDetectorOption(s.text, 'option_c_hybrid', {
          enableSelectiveAbstention: false,
        });
        return res.stylisticAiScore ?? res.aiProbability;
      });

      const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      expect(meanScore).toBeGreaterThan(0.25);
      expect(meanScore).toBeLessThan(0.70);
    });
  });

  describe('Exploratory Quality Proxy Audit (Separated from Human Quality Ratings)', () => {
    it('audits polished human proxy text without triggering false accusations', () => {
      const polishedHuman = allSamples.filter((s) => s.exploratoryQualityProxy === 'polished_human');
      expect(polishedHuman.length).toBeGreaterThan(10);

      let falsePositives = 0;
      for (const sample of polishedHuman) {
        const res = evaluateDetectorOption(sample.text, 'option_c_hybrid');
        if (res.verdict === 'ai') {
          falsePositives++;
        }
      }

      // Zero false positives on formal human proxy text
      expect(falsePositives).toBe(0);
    });

    it('audits polished AI proxy text detection in exploratory testing', () => {
      const polishedAi = allSamples.filter((s) => s.exploratoryQualityProxy === 'polished_ai');
      expect(polishedAi.length).toBeGreaterThan(15);

      let detectedAi = 0;
      for (const sample of polishedAi) {
        const res = evaluateDetectorOption(sample.text, 'option_c_hybrid', {
          enableSelectiveAbstention: false,
        });
        const score = res.stylisticAiScore ?? res.aiProbability;
        if (score >= 0.50) {
          detectedAi++;
        }
      }

      const detectionRate = detectedAi / polishedAi.length;
      expect(detectionRate).toBeGreaterThanOrEqual(0.80);
    });
  });
});

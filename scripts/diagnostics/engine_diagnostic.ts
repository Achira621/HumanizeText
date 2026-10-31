import { defaultServerApi } from '../../src/lib/detector/serverApi';
import { executeDetectorEngine } from '../../src/lib/detector/candidateIntegrationBoundary';
import { predictV25Text } from '../../src/lib/detector/v2_5/detectorV2_5';
import { computeAiScore } from '../../src/lib/detector/detectorCore';

async function runAudit() {
  console.log('====================================================');
  console.log('V2.5 VS LEGACY DETECTOR CONTROLLED DIAGNOSTIC AUDIT');
  console.log('====================================================');

  const samples = [
    {
      name: 'Sample 1: AI Buzzword Cliché (Longer)',
      text: `In today's fast-paced digital world, it is crucial to delve into the multifaceted tapestry of modern technology. Furthermore, artificial intelligence plays a vital role in our daily lives, serving as a testament to human innovation. In conclusion, we must utilize these solutions to ensure optimal outcomes across diverse domains and foster transformative collaboration for all stakeholders involved in the ecosystem.`,
    },
    {
      name: 'Sample 2: Short AI Sample (<40 words)',
      text: `In today's fast-paced digital world, it is crucial to delve into the multifaceted tapestry of modern technology. Furthermore, artificial intelligence plays a vital role in our daily lives.`,
    },
    {
      name: 'Sample 3: Natural Conversational Human (Longer)',
      text: `I went down to the corner grocery store yesterday afternoon to pick up some fresh sourdough bread, Honeycrisp apples, and oat milk. The checkout line was unexpectedly long because the card reader at register four was freezing up, but the cashier was in good spirits and joked about how technology always takes a nap right when you need it most. After getting home, I made some tea and took my golden retriever for an hour-long walk through the wooded trails behind the neighborhood elementary school.`,
    },
    {
      name: 'Sample 4: Formal Academic Non-Fiction (Human)',
      text: `The historical trajectory of parliamentary governance in nineteenth-century Britain was shaped substantially by recurring fiscal crises and popular agitation for electoral reform. As traditional agrarian aristocracies confronted the mounting economic weight of industrial manufacturing centers, legislative debates grew increasingly polarized over tariff policies and franchise extension. Consequently, statutory reforms reflected uneasy compromises between entrenched landed interests and emerging bourgeois reformers.`,
    },
    {
      name: 'Sample 5: GPT-4 Explanatory Style',
      text: `To implement an effective rate limiter in distributed systems, engineers frequently adopt the token bucket or leaky bucket algorithm. The token bucket approach provides high burst capacity while maintaining an upper bound on average throughput. Specifically, tokens are added to a centralized bucket at a constant rate, and every incoming request must acquire a token before proceeding. When the bucket is depleted, subsequent requests are either queued or immediately rejected with an HTTP 429 status code.`,
    }
  ];

  for (const s of samples) {
    console.log(`\n----------------------------------------------------`);
    console.log(`TEST: ${s.name}`);
    const words = s.text.trim().split(/\s+/).filter(Boolean);
    console.log(`Word Count: ${words.length}`);

    // 1. Direct core calculation
    const legacyCore = computeAiScore(s.text);
    const v25Core = predictV25Text(s.text);

    // 2. Candidate integration boundary
    const boundLegacy = executeDetectorEngine(s.text, { engineId: 'production_default' });
    const boundV25 = executeDetectorEngine(s.text, { engineId: 'v2_5_public_beta' });

    // 3. ServerApi
    const srvLegacy = await defaultServerApi.detectText(s.text, { engineId: 'production_default' });
    const srvV25 = await defaultServerApi.detectText(s.text, { engineId: 'v2_5_public_beta' });

    console.log('LEGACY ENGINE:');
    console.log(`  - Core score: aiProb=${legacyCore.aiProbability.toFixed(3)}, classification=${legacyCore.classification}`);
    console.log(`  - Boundary: score=${boundLegacy.score}, verdict=${boundLegacy.verdict}`);
    console.log(`  - ServerApi: score=${srvLegacy.score.aiProbability}, class=${srvLegacy.score.classification}, conf=${srvLegacy.score.confidence}`);

    console.log('V2.5 ENGINE:');
    console.log(`  - Core: P(AI)=${v25Core.calibratedProbability.toFixed(4)}, verdict=${v25Core.verdict}, isAbstained=${v25Core.isAbstained}, margin=${v25Core.rawLinearMargin}`);
    console.log(`  - Boundary: score=${boundV25.score}, verdict=${boundV25.verdict}, isAbstained=${boundV25.isAbstained}`);
    console.log(`  - ServerApi: score=${srvV25.score.aiProbability}, class=${srvV25.score.classification}, conf=${srvV25.score.confidence}`);
  }
}

runAudit().catch(console.error);


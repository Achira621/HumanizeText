import { describe, it, expect } from 'vitest';
import { computeAiScore, type AiAnalysisResult } from '../../src/lib/detector/detectorCore';
import { bestThreshold, confusion, prf, rocAuc, round, wilsonConfidenceInterval } from './metrics';

describe('Detector RFC & Technical Prose Audit (Task 3)', () => {
  const rfcHumanSample =
    'A TCP implementation MUST be able to process incoming segments while sending. The socket buffer allocation algorithm MUST NOT deadlock when receive window drops to zero under heavy half-duplex loads.';

  it('performs feature attribution on the historical false-positive RFC sample', () => {
    const result: AiAnalysisResult = computeAiScore(rfcHumanSample);

    console.info('[Detector RFC Feature Attribution]', {
      textSnippet: rfcHumanSample.slice(0, 70) + '...',
      aiProbability: result.aiProbability,
      perplexityScore: result.perplexityScore,
      burstinessScore: result.burstinessScore,
      keywordHits: result.keywordHits,
      matchingSignatures: result.matchingSignatures,
      signalBreakdown: result.signalBreakdown,
    });

    // Verify it is NOT flagged as AI (threshold is 0.35-0.50)
    expect(result.aiProbability).toBeLessThan(0.30);
    // Verify keyword signal is properly attenuated (isolated single hit does not inflate score)
    expect(result.signalBreakdown.keyword).toBeLessThanOrEqual(0.40);
  });

  it('evaluates a balanced dataset of technical/RFC, forum, and essay prose across dev and held-out', () => {
    interface BenchmarkCase {
      id: string;
      split: 'dev' | 'held-out';
      label: 'human' | 'ai';
      domain: 'rfc_technical' | 'forum' | 'essay';
      text: string;
    }

    const cases: BenchmarkCase[] = [
      // DEV SPLIT
      {
        id: 'dev_rfc_01_h',
        split: 'dev',
        label: 'human',
        domain: 'rfc_technical',
        text: 'Nodes MUST ignore any unrecognized IPv6 extension headers when forwarding packets to next-hop gateways. The hop-by-hop options header, when present, MUST be examined by every node along a path.',
      },
      {
        id: 'dev_rfc_02_h',
        split: 'dev',
        label: 'human',
        domain: 'rfc_technical',
        text: 'When acquiring spinlocks in softirq context, callers must disable local bottom-half processing. Failure to do so risks deadlock if an incoming hardware interrupt raises an identical tasklet.',
      },
      {
        id: 'dev_forum_01_h',
        split: 'dev',
        label: 'human',
        domain: 'forum',
        text: 'spent 6 hours tearing my hair out over wireguard drops. mtu was 1500 on pppoe instead of 1420 so syn packets made it through but ssl handshakes stalled out every single time.',
      },
      {
        id: 'dev_rfc_01_a',
        split: 'dev',
        label: 'ai',
        domain: 'rfc_technical',
        text: 'In order to navigate the multifaceted landscape of modern networking, it is crucial to implement a comprehensive TCP architecture. Furthermore, this ensures seamless optimization across a wide array of distributed nodes.',
      },
      {
        id: 'dev_rfc_02_a',
        split: 'dev',
        label: 'ai',
        domain: 'rfc_technical',
        text: 'It is important to note that delving into socket buffer allocation plays a pivotal role in system reliability. Consequently, utilizing robust frameworks ensures optimal throughput in today\'s digital era.',
      },
      {
        id: 'dev_essay_01_a',
        split: 'dev',
        label: 'ai',
        domain: 'essay',
        text: 'Artificial intelligence is rapidly transforming contemporary software engineering. It is clear that harnessing machine learning models empowers developers to delve into intricate design patterns with unprecedented agility.',
      },

      // HELD-OUT SPLIT
      {
        id: 'heldout_rfc_01_h',
        split: 'held-out',
        label: 'human',
        domain: 'rfc_technical',
        text: 'A sender SHOULD NOT transmit more than one packet per RTT when probing for congestion window expansion. Retransmission timers MUST back off exponentially upon consecutive dropped ACKs.',
      },
      {
        id: 'heldout_kernel_02_h',
        split: 'held-out',
        label: 'human',
        domain: 'rfc_technical',
        text: 'Database write-ahead logs require fsync guarantees on commit to prevent index corruption. Flushing dirty pages periodically amortizes I/O overhead across high concurrent write transactions.',
      },
      {
        id: 'heldout_forum_02_h',
        split: 'held-out',
        label: 'human',
        domain: 'forum',
        text: 'honestly just flash the older firmware. the 1.4 update broke thermal throttling on linux and the fans blast at 100% even when idle at 42C.',
      },
      {
        id: 'heldout_rfc_01_a',
        split: 'held-out',
        label: 'ai',
        domain: 'rfc_technical',
        text: 'Moreover, harnessing cutting-edge microservices allows teams to proactively address latency bottlenecks. This comprehensive approach is a testament to sustainable cloud infrastructure in the digital age.',
      },
      {
        id: 'heldout_tech_02_a',
        split: 'held-out',
        label: 'ai',
        domain: 'rfc_technical',
        text: 'As we delve into modern database replication, it is crucial to recognize that maintaining data consistency plays a vital role across multifaceted clusters. Furthermore, this fosters operational efficiency.',
      },
      {
        id: 'heldout_essay_02_a',
        split: 'held-out',
        label: 'ai',
        domain: 'essay',
        text: 'In conclusion, the transformative power of technological innovation continues to reshape society. It offers a wide variety of benefits that seamlessly enhance cross-functional collaboration and drive sustainable progress.',
      },
    ];

    const devCases = cases.filter((c) => c.split === 'dev');
    const heldOutCases = cases.filter((c) => c.split === 'held-out');

    const devScores = devCases.map((c) => computeAiScore(c.text).aiProbability);
    const devLabels = devCases.map((c) => c.label === 'ai');

    const heldScores = heldOutCases.map((c) => computeAiScore(c.text).aiProbability);
    const heldLabels = heldOutCases.map((c) => c.label === 'ai');

    // Tune threshold on dev split ONLY
    const { threshold } = bestThreshold(devScores, devLabels);

    // Evaluate on held-out split
    const conf = confusion(heldScores, heldLabels, threshold);
    const metrics = prf(conf);
    const auc = rocAuc(heldScores, heldLabels);

    const precCi = wilsonConfidenceInterval(conf.tp, conf.tp + conf.fp);
    const recallCi = wilsonConfidenceInterval(conf.tp, conf.tp + conf.fn);
    const fprCi = wilsonConfidenceInterval(conf.fp, conf.fp + conf.tn);

    console.info('[Detector Balanced Technical Audit Report]', {
      nDev: devCases.length,
      nHeldOut: heldOutCases.length,
      calibratedThreshold: threshold,
      heldOutConfusion: conf,
      heldOutAuc: round(auc),
      heldOutPrecision: round(metrics.precision),
      precision95CI: precCi,
      heldOutRecall: round(metrics.recall),
      recall95CI: recallCi,
      heldOutF1: round(metrics.f1),
      heldOutFpr: round(metrics.fpr),
      fpr95CI: fprCi,
    });

    // Zero false positives on held-out technical and forum human prose
    expect(conf.fp).toBe(0);
    expect(metrics.fpr).toBe(0);
    expect(auc).toBeGreaterThanOrEqual(0.95);
    expect(metrics.f1).toBeGreaterThanOrEqual(0.90);
  });
});

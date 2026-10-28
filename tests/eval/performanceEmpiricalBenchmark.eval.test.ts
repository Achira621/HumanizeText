import { describe, it } from 'vitest';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';

describe('Intelligence V1.1: Empirical Performance & Latency Benchmark', () => {
  const engine = new RuleBasedHumanizerEngine();

  const shortText = 'The researchers conducted a comprehensive study to evaluate the performance of deep convolutional neural networks. Furthermore, they observed that batch normalization plays a pivotal role in accelerating convergence across 1,000 epochs. It is important to note that accuracy improved significantly.';

  const mediumParagraph = 'In today\'s fast-paced digital world, enterprise organizations must delve into scalable data architectures to ensure high availability. The distributed database cluster replicates transactions across 5 regional zones with p99 latency under 20ms. Moreover, taking everything into consideration, asynchronous commit queues prevent bottlenecks during peak customer demand.\n\nFurthermore, the systems engineering team decided to get rid of legacy microservices before deploying the release candidate. Each service was containerized using Docker and orchestrated with Kubernetes v1.29. In addition, automated health checks monitor memory usage and trigger failovers when node degradation is detected.\n\nUltimately, preliminary telemetry suggests that caching query results may reduce database load by 35%. The team continues to monitor production metrics to verify that data integrity is maintained across all replica nodes.';

  const longText = Array(10).fill(mediumParagraph).join('\n\n'); // ~1,220 words

  const runBenchmark = (text: string, runs = 30) => {
    const latencies: number[] = [];
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // Warm-up run
    engine.processSync(text, { mode: 'formal', rewriteStrength: 'balanced' });

    const memBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < runs; i++) {
      const start = performance.now();
      const res = engine.processSync(text, { mode: 'formal', rewriteStrength: 'balanced' });
      const elapsed = performance.now() - start;
      latencies.push(elapsed);
    }

    const memAfter = process.memoryUsage().heapUsed;
    const heapDeltaKb = Math.max(0, Math.round((memAfter - memBefore) / 1024));

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(runs * 0.50)];
    const p95 = latencies[Math.floor(runs * 0.95)];
    const p99 = latencies[Math.floor(runs * 0.99)];
    const mean = latencies.reduce((a, b) => a + b, 0) / runs;

    return {
      wordCount,
      runs,
      mean: Number(mean.toFixed(2)),
      p50: Number(p50.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      p99: Number(p99.toFixed(2)),
      heapDeltaKb,
    };
  };

  it('empirically measures latency distribution and heap allocation across short, medium, and long texts', () => {
    const shortStats = runBenchmark(shortText, 30);
    const medStats = runBenchmark(mediumParagraph, 30);
    const longStats = runBenchmark(longText, 30);

    console.info('\n======================================================');
    console.info('      EMPIRICAL PERFORMANCE BENCHMARK RESULTS         ');
    console.info('======================================================');
    console.info('Environment: Node.js / V8 on Windows x64 (Local Sync Path)');
    console.info(`Sample Count per tier: 30 iterations\n`);

    console.info(`Tier 1: Short Input (~${shortStats.wordCount} words):`);
    console.info(`  • Median (p50) Latency:  ${shortStats.p50} ms`);
    console.info(`  • p95 Latency:           ${shortStats.p95} ms`);
    console.info(`  • p99 Latency:           ${shortStats.p99} ms`);
    console.info(`  • Mean Latency:          ${shortStats.mean} ms`);
    console.info(`  • Transient Heap Delta:  ~${shortStats.heapDeltaKb} KB\n`);

    console.info(`Tier 2: Medium Input (~${medStats.wordCount} words):`);
    console.info(`  • Median (p50) Latency:  ${medStats.p50} ms`);
    console.info(`  • p95 Latency:           ${medStats.p95} ms`);
    console.info(`  • p99 Latency:           ${medStats.p99} ms`);
    console.info(`  • Mean Latency:          ${medStats.mean} ms`);
    console.info(`  • Transient Heap Delta:  ~${medStats.heapDeltaKb} KB\n`);

    console.info(`Tier 3: Long Input (~${longStats.wordCount} words):`);
    console.info(`  • Median (p50) Latency:  ${longStats.p50} ms`);
    console.info(`  • p95 Latency:           ${longStats.p95} ms`);
    console.info(`  • p99 Latency:           ${longStats.p99} ms`);
    console.info(`  • Mean Latency:          ${longStats.mean} ms`);
    console.info(`  • Transient Heap Delta:  ~${longStats.heapDeltaKb} KB`);
    console.info('======================================================\n');
  });
});

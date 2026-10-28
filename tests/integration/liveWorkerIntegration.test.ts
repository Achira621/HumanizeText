import { describe, it, expect } from 'vitest';

describe('Live Remote Worker Integration (Phase 3)', () => {
  const liveUrl = process.env.LIVE_WORKER_URL || process.env.CLOUDFLARE_WORKER_URL;

  it('connects to live deployed Worker if environment credentials are provided', async () => {
    if (!liveUrl) {
      console.info(
        '[Live Worker Integration] LIVE_WORKER_URL or CLOUDFLARE_WORKER_URL not configured in environment. Skipping live remote network execution. Automated deterministic mocks cover pipeline in tests/integration/userJourney.test.ts.'
      );
      expect(true).toBe(true);
      return;
    }

    const payload = {
      text: '# Live Test Title\n\nTesting live deployed Worker endpoint for Phase 3 readiness.\n\n1. Verify status\n2. Verify latency',
      mode: 'natural',
    };

    const res = await fetch(`${liveUrl.replace(/\/$/, '')}/api/humanize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.rewrittenText).toBeTruthy();
    expect(data.telemetry).toBeDefined();
    expect(data.telemetry.concurrencyLimit).toBeGreaterThanOrEqual(1);
  });
});

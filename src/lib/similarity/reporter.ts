import type { SimilarityReport } from '../../types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Exports similarity report to raw formatted JSON string.
 */
export function exportReportToJson(report: SimilarityReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Exports similarity report to clean, readable plain-text report.
 */
export function exportReportToTxt(report: SimilarityReport): string {
  const dateStr = new Date(report.generatedAt).toISOString();
  const lines: string[] = [
    '================================================================================',
    'HUMANIZETEXT SIMILARITY & INTEGRITY AUDIT REPORT',
    '================================================================================',
    `Report Session ID:           ${report.sessionId}`,
    `Generated At:                ${dateStr}`,
    `Submitted Document:          ${report.submittedDocumentName}`,
    `Submitted Word Count:        ${report.submittedWordCount}`,
    `Reference Documents Tested:  ${report.referenceDocumentsCount}`,
    '--------------------------------------------------------------------------------',
    'CRYPTOGRAPHIC INTEGRITY & SESSION VERIFICATION',
    '--------------------------------------------------------------------------------',
    `Submitted Raw SHA-256:       ${report.integrityDigest.rawSha256}`,
    `Submitted Normalized SHA-256:${report.integrityDigest.normalizedSha256}`,
    `Ephemeral Session HMAC Key:  ${report.ephemeralKeyFingerprintSha256} (Public Key Fingerprint)`,
    '--------------------------------------------------------------------------------',
    'SIMILARITY & OVERLAP SUMMARY',
    '--------------------------------------------------------------------------------',
    `Estimated Text Overlap:      ${report.estimatedOverlapPercentage}%`,
    `Matched Passages Found:      ${report.matchedPassagesCount}`,
    `Matched Words:               ${report.matchedWordsCount} of ${report.submittedWordCount}`,
    `Exact Shingle Hits:          ${report.exactMatchesCount}`,
    '',
    'REFERENCE BREAKDOWN:',
  ];

  if (report.referenceBreakdown.length === 0) {
    lines.push('  No matching passages found in any reference document.');
  } else {
    for (const ref of report.referenceBreakdown) {
      lines.push(
        `  • ${ref.referenceName}: ${ref.matchedPassageCount} passages, ${ref.matchedWordCount} words (${ref.overlapPercentage}% overlap)`
      );
    }
  }

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('MATCHED PASSAGES DETAILS');
  lines.push('--------------------------------------------------------------------------------');

  if (report.passages.length === 0) {
    lines.push('None.');
  } else {
    report.passages.forEach((p, idx) => {
      lines.push(`[Passage #${idx + 1}] Source: ${p.referenceDocName}`);
      lines.push(`  Offsets: Submitted chars [${p.submittedStartChar}..${p.submittedEndChar}]`);
      lines.push(`  Matched Text: "${p.matchedText}"`);
      lines.push('');
    });
  }

  lines.push('================================================================================');
  lines.push('LIMITATIONS & PRIVACY STATEMENT');
  lines.push('================================================================================');
  lines.push(`Formula: ${report.formulaExplanation}`);
  lines.push(`Notice:  ${report.limitationsNotice}`);
  lines.push('Privacy: Computed 100% locally on-device. No text or keys were sent to any server.');
  lines.push('================================================================================');

  return lines.join('\n');
}

/**
 * Exports similarity report to a safe, self-contained HTML document.
 * Strictly escapes all user text content to eliminate any XSS vulnerability.
 */
export function exportReportToHtml(report: SimilarityReport): string {
  const dateStr = new Date(report.generatedAt).toUTCString();
  const subName = escapeHtml(report.submittedDocumentName);
  const rawDigest = escapeHtml(report.integrityDigest.rawSha256);
  const normDigest = escapeHtml(report.integrityDigest.normalizedSha256);
  const keyFp = escapeHtml(report.ephemeralKeyFingerprintSha256);

  const passagesHtml =
    report.passages.length === 0
      ? '<p class="empty">No matching passages detected.</p>'
      : report.passages
          .map(
            (p, idx) => `
      <div class="passage-card">
        <div class="passage-header">
          <span class="badge">Passage #${idx + 1}</span>
          <span class="ref-name">Matched with: <strong>${escapeHtml(p.referenceDocName)}</strong></span>
          <span class="offsets">Chars ${p.submittedStartChar}..${p.submittedEndChar}</span>
        </div>
        <div class="passage-text">&ldquo;${escapeHtml(p.matchedText)}&rdquo;</div>
      </div>`
          )
          .join('\n');

  const breakdownHtml =
    report.referenceBreakdown.length === 0
      ? '<p class="empty">No reference matches.</p>'
      : `<table>
          <thead>
            <tr><th>Reference Document</th><th>Matched Passages</th><th>Matched Words</th><th>Overlap %</th></tr>
          </thead>
          <tbody>
            ${report.referenceBreakdown
              .map(
                (r) => `<tr>
              <td><strong>${escapeHtml(r.referenceName)}</strong></td>
              <td>${r.matchedPassageCount}</td>
              <td>${r.matchedWordCount}</td>
              <td>${r.overlapPercentage}%</td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>HumanizeText Audit Report - ${subName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafaf9; color: #1c1917; margin: 0; padding: 40px 20px; line-height: 1.5; }
    .container { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    h1 { font-size: 24px; margin-top: 0; border-bottom: 2px solid #2e7955; padding-bottom: 12px; }
    .date-meta { font-size: 12px; color: #78716c; margin-bottom: 20px; }
    h2 { font-size: 18px; margin-top: 28px; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px; color: #44403c; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .meta-card { background: #f5f5f4; padding: 12px; border-radius: 6px; }
    .meta-label { font-size: 11px; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px; }
    .meta-val { font-size: 20px; font-weight: 700; color: #1c1917; margin-top: 4px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; word-break: break-all; background: #f5f5f4; padding: 6px 8px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e7e5e4; font-size: 14px; }
    th { background: #f5f5f4; font-weight: 600; }
    .passage-card { border: 1px solid #e7e5e4; border-left: 4px solid #2e7955; border-radius: 6px; padding: 12px 16px; margin-bottom: 14px; background: #fafaf9; }
    .passage-header { display: flex; align-items: center; justify-content: space-between; font-size: 12px; margin-bottom: 8px; color: #57534e; }
    .badge { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 11px; }
    .passage-text { font-size: 14px; color: #1c1917; font-style: italic; }
    .notice-box { background: #fefce8; border: 1px solid #fef08a; padding: 14px; border-radius: 6px; font-size: 13px; color: #854d0e; margin-top: 24px; }
    .empty { color: #78716c; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <h1>HumanizeText — Similarity &amp; Integrity Audit Report</h1>
    <div class="date-meta">Generated: ${dateStr}</div>
    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Submitted Document</div>
        <div class="meta-val" style="font-size: 16px;">${subName}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Estimated Overlap</div>
        <div class="meta-val" style="color: ${report.estimatedOverlapPercentage > 25 ? '#dc2626' : '#2e7955'};">${report.estimatedOverlapPercentage}%</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Matched Passages</div>
        <div class="meta-val">${report.matchedPassagesCount}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Matched Words</div>
        <div class="meta-val">${report.matchedWordsCount} / ${report.submittedWordCount}</div>
      </div>
    </div>

    <h2>Cryptographic Integrity &amp; Session Verification</h2>
    <p><strong>Raw Document SHA-256:</strong></p>
    <div class="mono">${rawDigest}</div>
    <p><strong>Normalized Document SHA-256:</strong></p>
    <div class="mono">${normDigest}</div>
    <p><strong>Ephemeral HMAC-SHA-256 Key Fingerprint:</strong></p>
    <div class="mono">${keyFp}</div>

    <h2>Reference Corpus Breakdown</h2>
    ${breakdownHtml}

    <h2>Detailed Matched Passages</h2>
    ${passagesHtml}

    <div class="notice-box">
      <strong>Limitations &amp; Privacy Notice:</strong>
      <p style="margin: 6px 0 0 0;">${escapeHtml(report.formulaExplanation)}</p>
      <p style="margin: 6px 0 0 0;">${escapeHtml(report.limitationsNotice)}</p>
      <p style="margin: 6px 0 0 0;"><strong>Security guarantee:</strong> Analyzed locally within your browser using Web Workers and the Web Crypto API. No documents or fingerprints were transmitted to any external server.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers a client-side browser file download safely.
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

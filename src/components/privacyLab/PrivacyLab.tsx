import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Cpu,
  Fingerprint,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Terminal,
  Zap,
} from 'lucide-react';
import { computeDocumentDigests } from '../../lib/crypto/digest';
import { generateComparisonSessionKey, computeHmac, computeUnkeyedDigest } from '../../lib/crypto/hmac';
import { encryptVaultRecord, decryptVaultRecord } from '../../lib/crypto/vault';
import { benchmarkPbkdf2 } from '../../lib/crypto/benchmarks';
import type { BenchmarkResult } from '../../lib/crypto/benchmarks';
import { NetworkAuditor } from '../../lib/privacy/networkAuditor';
import type { EncryptedPayload, NetworkRequestLog } from '../../types';
import type { ActiveTab } from '../common/Header';

interface PrivacyLabProps {
  setActiveTab?: (tab: ActiveTab) => void;
}

export const PrivacyLab: React.FC<PrivacyLabProps> = ({ setActiveTab }) => {
  // 1. Integrity Digest Demo State
  const [digestInput, setDigestInput] = useState(
    '  Artificial   Intelligence and Cryptographic Privacy.  \n'
  );
  const [rawHash, setRawHash] = useState('');
  const [normHash, setNormHash] = useState('');

  // 2. Keyed vs Unkeyed Fingerprint Demo State
  const [samplePhrase, setSamplePhrase] = useState('empirical findings demonstrate validity');
  const [unkeyedHash, setUnkeyedHash] = useState('');
  const [hmacHash, setHmacHash] = useState('');
  const [sessionKeyFp, setSessionKeyFp] = useState('');

  // 3. Vault Demo State
  const [vaultPassphrase, setVaultPassphrase] = useState('CorrectPassphrase!2026');
  const [vaultPlaintext, setVaultPlaintext] = useState('Confidential manuscript text strictly kept on-device.');
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedPayload | null>(null);
  const [decryptPassphrase, setDecryptPassphrase] = useState('CorrectPassphrase!2026');
  const [decryptedResult, setDecryptedResult] = useState<string | null>(null);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [isTampered, setIsTampered] = useState(false);

  // 4. Benchmark State
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  // 5. Network Logs State
  const [networkLogs, setNetworkLogs] = useState<NetworkRequestLog[]>([]);

  // Update digest demo with cancellation
  useEffect(() => {
    let isCancelled = false;
    computeDocumentDigests(digestInput).then((res) => {
      if (!isCancelled) {
        setRawHash(res.rawSha256);
        setNormHash(res.normalizedSha256);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [digestInput]);

  // Update HMAC demo
  const refreshSessionKey = useCallback(async () => {
    const session = await generateComparisonSessionKey();
    const [unkeyed, keyed] = await Promise.all([
      computeUnkeyedDigest(samplePhrase),
      computeHmac(session.key, samplePhrase),
    ]);
    setSessionKeyFp(session.keyFingerprint);
    setUnkeyedHash(unkeyed);
    setHmacHash(keyed);
  }, [samplePhrase]);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      const session = await generateComparisonSessionKey();
      const [unkeyed, keyed] = await Promise.all([
        computeUnkeyedDigest(samplePhrase),
        computeHmac(session.key, samplePhrase),
      ]);
      if (!isCancelled) {
        setSessionKeyFp(session.keyFingerprint);
        setUnkeyedHash(unkeyed);
        setHmacHash(keyed);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [samplePhrase]);

  // Monitor network auditor
  useEffect(() => {
    const auditor = NetworkAuditor.getInstance();
    auditor.startAuditing();
    const unsubscribe = auditor.subscribe((logs) => {
      setNetworkLogs(logs);
    });
    return unsubscribe;
  }, []);

  // Vault encryption
  const handleEncryptTest = async () => {
    try {
      setVaultError(null);
      setDecryptedResult(null);
      setIsTampered(false);

      const payload = await encryptVaultRecord(vaultPassphrase, {
        id: `vault-demo-${Date.now()}`,
        title: 'Confidential Note',
        content: vaultPlaintext,
        updatedAt: Date.now(),
      });
      setEncryptedPayload(payload);
    } catch (err: any) {
      setVaultError(err?.message || 'Encryption failed');
    }
  };

  // Vault decryption
  const handleDecryptTest = async () => {
    if (!encryptedPayload) return;
    try {
      setVaultError(null);
      setDecryptedResult(null);
      const record = await decryptVaultRecord(decryptPassphrase, encryptedPayload);
      setDecryptedResult(record.content);
    } catch (err: any) {
      setVaultError(err?.message || 'Decryption failed');
    }
  };

  // Tamper simulation: flip 1 byte in ciphertext
  const handleTamperCiphertext = () => {
    if (!encryptedPayload) return;
    const originalCipher = encryptedPayload.cipherHex;
    // Flip first character
    const flippedChar = originalCipher[0] === 'a' ? 'b' : 'a';
    const tamperedHex = flippedChar + originalCipher.substring(1);

    setEncryptedPayload({
      ...encryptedPayload,
      cipherHex: tamperedHex,
    });
    setIsTampered(true);
    setDecryptedResult(null);
    setVaultError(null);
  };

  // Run PBKDF2 benchmark
  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const results = await benchmarkPbkdf2();
      setBenchmarks(results);
    } finally {
      setIsBenchmarking(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Wayfinding Breadcrumbs */}
      {setActiveTab && (
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => setActiveTab('humanizer')}
            className="hover:text-[var(--accent)] transition-colors focus:outline-hidden"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">Security &amp; Privacy</span>
          <span>/</span>
          <span className="font-medium text-[var(--text-primary)]" aria-current="page">Privacy Lab</span>
        </nav>
      )}

      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Privacy &amp; Cryptography Lab
          </h1>
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Interactive cryptographic verification suite. Test real browser primitives: SHA-256 integrity, HMAC session fingerprinting, PBKDF2 derivation, and authenticated AES-GCM encryption.
        </p>
      </div>

      <div className="space-y-8">
        {/* Tool 1: Document Integrity Digest */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xs">
          <div className="flex items-center space-x-2">
            <Fingerprint className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              1. Document Integrity Digest (SHA-256)
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Integrity digests ensure the document has not changed since calculation. Notice how normalizing whitespace produces identical normalized digests despite trivial formatting differences, while the raw digest changes completely.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">
                Input Text (Edit whitespace or add newlines):
              </label>
              <textarea
                value={digestInput}
                onChange={(e) => setDigestInput(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 font-mono text-xs text-[var(--text-primary)] focus:outline-hidden"
              />
            </div>

            <div className="flex flex-col justify-center space-y-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-xs">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Raw Text SHA-256 (Byte-Exact):
                </span>
                <div className="font-mono text-[11px] text-[var(--text-primary)] break-all mt-0.5">
                  {rawHash || 'Computing...'}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[var(--accent)] uppercase tracking-wider font-semibold">
                  Normalized SHA-256 (NFC &amp; Collapsed Whitespace):
                </span>
                <div className="font-mono text-[11px] font-semibold text-[var(--accent)] break-all mt-0.5">
                  {normHash || 'Computing...'}
                </div>
              </div>

              <div className="text-[11px] text-[var(--text-muted)] italic">
                Important: An integrity digest verifies exact unchanged bytes. It is a cryptographic checksum, NOT a similarity metric.
              </div>
            </div>
          </div>
        </section>

        {/* Tool 2: Keyed vs Unkeyed Fingerprinting Demo */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                2. Ephemeral Keyed Fingerprinting (HMAC-SHA-256)
              </h2>
            </div>
            <button
              onClick={refreshSessionKey}
              className="flex items-center space-x-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs text-[var(--text-primary)] hover:border-[var(--accent)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Regenerate Session Key</span>
            </button>
          </div>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Why does HumanizeText use HMAC instead of ordinary SHA-256 for document shingles?
            Because short phrases like <em>&ldquo;in order to examine&rdquo;</em> have predictable unkeyed hashes that can be reverse-searched via rainbow tables. An ephemeral in-memory secret key ensures zero dictionary attack risk while allowing exact comparison across documents in the same session.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">
                Sample Shingle Text:
              </label>
              <input
                type="text"
                value={samplePhrase}
                onChange={(e) => setSamplePhrase(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-primary)] focus:outline-hidden"
              />

              <div className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-[11px]">
                <span className="font-semibold text-[var(--text-primary)]">Active Ephemeral Key Fingerprint:</span>
                <div className="font-mono text-[10px] text-[var(--text-muted)] break-all mt-0.5">
                  {sessionKeyFp}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  (Generated in RAM via Web Crypto, non-extractable, zero disk persistence)
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-xs">
              <div>
                <span className="text-[10px] text-[var(--error-text)] font-semibold uppercase tracking-wider">
                  Unkeyed SHA-256 (Vulnerable to Rainbow Precomputations):
                </span>
                <div className="font-mono text-[11px] text-[var(--text-muted)] break-all mt-0.5">
                  {unkeyedHash}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[var(--accent)] font-semibold uppercase tracking-wider">
                  Keyed HMAC-SHA-256 (Protected by Ephemeral Session Key):
                </span>
                <div className="font-mono text-[11px] font-semibold text-[var(--accent)] break-all mt-0.5">
                  {hmacHash}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool 3: Encrypted Vault with Authenticated Decryption & Tamper Test */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xs">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              3. Authenticated Encryption &amp; Tamper Detection (AES-256-GCM + PBKDF2)
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Demonstrates authenticated symmetric encryption with Web Crypto. Uses a fresh 16-byte random salt and fresh 12-byte IV for every record. AES-GCM strictly rejects incorrect passphrases or ciphertext modified by even 1 single bit.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Encryption Box */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
                Step A: Encrypt Record
              </h3>
              <div className="mt-2 space-y-2">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)]">Passphrase:</label>
                  <input
                    type="text"
                    value={vaultPassphrase}
                    onChange={(e) => setVaultPassphrase(e.target.value)}
                    className="mt-0.5 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text-primary)] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)]">Secret Content:</label>
                  <textarea
                    value={vaultPlaintext}
                    onChange={(e) => setVaultPlaintext(e.target.value)}
                    rows={3}
                    className="mt-0.5 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text-primary)]"
                  />
                </div>
                <button
                  onClick={handleEncryptTest}
                  className="rounded bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                >
                  Encrypt with AES-GCM (600,000 Iterations)
                </button>
              </div>

              {encryptedPayload && (
                <div className="mt-4 space-y-1.5 text-[11px] font-mono border-t border-[var(--border-subtle)] pt-3">
                  <div>
                    <span className="text-[var(--text-muted)]">Salt (16 bytes): </span>
                    <span className="text-[var(--text-primary)]">{encryptedPayload.saltHex}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">IV (12 bytes): </span>
                    <span className="text-[var(--text-primary)]">{encryptedPayload.ivHex}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Ciphertext + Tag: </span>
                    <span className="text-[var(--accent)] break-all">
                      {encryptedPayload.cipherHex.substring(0, 40)}...
                    </span>
                  </div>
                  {isTampered && (
                    <div className="text-[var(--error-text)] font-semibold mt-1">
                      ⚠️ Ciphertext bit altered to simulate tampering.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Decryption & Tamper Test Box */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
                Step B: Authenticated Decryption
              </h3>
              <div className="mt-2 space-y-2">
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)]">Attempt Passphrase:</label>
                  <input
                    type="text"
                    value={decryptPassphrase}
                    onChange={(e) => setDecryptPassphrase(e.target.value)}
                    className="mt-0.5 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text-primary)] font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={handleDecryptTest}
                    disabled={!encryptedPayload}
                    className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-40"
                  >
                    Attempt Decrypt
                  </button>
                  <button
                    onClick={handleTamperCiphertext}
                    disabled={!encryptedPayload || isTampered}
                    className="rounded border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--error-text)] hover:opacity-90 disabled:opacity-40"
                  >
                    Simulate 1-Bit Ciphertext Tamper
                  </button>
                </div>
              </div>

              {decryptedResult && (
                <div className="mt-4 rounded-md border border-[var(--accent-border)] bg-[var(--accent-light)] p-3 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-[var(--accent)]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Decrypted &amp; Authenticated Successfully</span>
                  </div>
                  <p className="mt-1 font-mono text-[var(--text-primary)]">{decryptedResult}</p>
                </div>
              )}

              {vaultError && (
                <div className="mt-4 rounded-md border border-[var(--error-border)] bg-[var(--error-bg)] p-3 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-[var(--error-text)]">
                    <XCircle className="h-4 w-4" />
                    <span>Authentication Failure</span>
                  </div>
                  <p className="mt-1 text-[var(--error-text)]">{vaultError}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tool 4: PBKDF2 Hardware Benchmark */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                4. Key Derivation Work Factor Benchmark
              </h2>
            </div>
            <button
              onClick={handleRunBenchmark}
              disabled={isBenchmarking}
              className="flex items-center space-x-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isBenchmarking ? 'Benchmarking Hardware...' : 'Run Benchmark'}</span>
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Tests PBKDF2-SHA-256 derivation speed directly on your browser hardware. OWASP recommends a work factor high enough to resist GPU brute force while remaining comfortable for legitimate users (&lt; 500ms).
          </p>

          {benchmarks.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {benchmarks.map((b) => (
                <div
                  key={b.iterations}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-xs"
                >
                  <span className="font-semibold text-[var(--text-primary)]">
                    {b.iterations.toLocaleString()} Iterations
                  </span>
                  <div className="mt-1 text-xl font-bold font-mono text-[var(--accent)]">
                    {b.durationMs} ms
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Rating: {b.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tool 5: Network Auditor & Privacy Checklist */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xs">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              5. Network Leak Auditor &amp; Privacy Guarantees
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Verified network activity within this session. All document text transformations, similarity computations, and cryptographic operations occur locally.
          </p>

          <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-xs">
            <div className="flex items-center justify-between font-semibold text-[var(--text-primary)]">
              <span>Outbound Requests Recorded: {networkLogs.length}</span>
              <span className="text-[var(--accent)] flex items-center space-x-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Zero Document or Key Transmissions</span>
              </span>
            </div>

            {networkLogs.length === 0 ? (
              <div className="mt-2 text-xs text-[var(--text-muted)] italic">
                No outbound network requests detected. The application is completely quiet.
              </div>
            ) : (
              <div className="mt-2 space-y-1.5 font-mono text-[11px] max-h-40 overflow-y-auto">
                {networkLogs.map((log) => (
                  <div key={log.id} className="flex items-center space-x-2 text-[var(--text-secondary)]">
                    <span className="text-[10px] bg-[var(--bg-surface)] px-1 rounded">{log.method}</span>
                    <span className="truncate">{log.url}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Security Limitations Disclosure */}
        <div className="rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-xs text-[var(--warning-text)]">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--text-primary)]">Cryptographic &amp; Operational Security Limitations:</strong>
              <ul className="mt-1.5 list-disc list-inside space-y-1">
                <li>Hashing is not encryption: an unkeyed SHA-256 digest does not hide the content of short or predictable inputs.</li>
                <li>Local document processing protects in-flight privacy against our servers, but does not protect against physical device compromise or malware in your browser profile.</li>
                <li>Fingerprint similarity detects verbatim/syntactic overlap; it does not measure semantic similarity or intent.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

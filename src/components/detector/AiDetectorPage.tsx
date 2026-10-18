import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  Server,
  Download,
  Trash2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Info,
} from 'lucide-react';
import type {
  DetectionResult,
  ImageDetectionResult,
  ModelDownloadProgress,
} from '../../types/detector';
import { textModelManager, imageModelManager } from '../../lib/detector/modelManager';
import { defaultInferenceRouter } from '../../lib/detector/router';
import { defaultModelStorage } from '../../lib/detector/storage';

export const AiDetectorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Model & Router State
  const [textModelProgress, setTextModelProgress] = useState<ModelDownloadProgress>(() => ({
    state: textModelManager.getState(),
    modelId: textModelManager.getManifest().modelId,
    downloadedBytes: 0,
    totalBytes: textModelManager.getManifest().totalSizeBytes,
    progressPercent: 0,
  }));

  const [imageModelProgress, setImageModelProgress] = useState<ModelDownloadProgress>(() => ({
    state: imageModelManager.getState(),
    modelId: imageModelManager.getManifest().modelId,
    downloadedBytes: 0,
    totalBytes: imageModelManager.getManifest().totalSizeBytes,
    progressPercent: 0,
  }));

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<'local' | 'server' | null>(null);
  const [textResult, setTextResult] = useState<DetectionResult | null>(null);
  const [imageResult, setImageResult] = useState<ImageDetectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consent Modal for Server Fallback
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [userConsented, setUserConsented] = useState(false);
  const [storageUsageMb, setStorageUsageMb] = useState<number>(0);

  // Subscribe to model managers on mount
  useEffect(() => {
    textModelManager.checkInitialStatus();
    imageModelManager.checkInitialStatus();

    const unsubText = textModelManager.subscribeProgress((p) => setTextModelProgress(p));
    const unsubImage = imageModelManager.subscribeProgress((p) => setImageModelProgress(p));

    const loadQuota = async () => {
      const q = await defaultModelStorage.checkStorageQuota();
      setStorageUsageMb(Math.round(q.usageBytes / (1024 * 1024)));
    };
    loadQuota();

    return () => {
      unsubText();
      unsubImage();
    };
  }, []);

  const currentModelProgress = activeTab === 'text' ? textModelProgress : imageModelProgress;
  const currentModelManager = activeTab === 'text' ? textModelManager : imageModelManager;
  const currentManifest = currentModelManager.getManifest();

  const handleStartDownload = () => {
    setErrorMessage(null);
    currentModelManager.startDownload();
  };

  const handlePauseDownload = () => {
    currentModelManager.pauseDownload();
  };

  const handleDeleteModel = async () => {
    await currentModelManager.deleteModel();
    const q = await defaultModelStorage.checkStorageQuota();
    setStorageUsageMb(Math.round(q.usageBytes / (1024 * 1024)));
  };

  const handleRunAnalysis = async (forceServerConsent = false) => {
    setErrorMessage(null);
    const hasConsent = userConsented || forceServerConsent;

    if (activeTab === 'text') {
      if (!inputText.trim()) return;
      setIsAnalyzing(true);
      setTextResult(null);

      try {
        const isLocalReady = textModelManager.getState() === 'READY';
        setActiveAnalysisMode(isLocalReady ? 'local' : 'server');

        const res = await defaultInferenceRouter.detectText(inputText, {
          preferMode: isLocalReady ? 'local-only' : 'auto',
          userConsentedToServer: hasConsent,
          allowServerFallback: true,
        });

        setTextResult(res);
      } catch (err: any) {
        if (err?.message?.includes('CONSENT_REQUIRED')) {
          setShowConsentModal(true);
        } else {
          setErrorMessage(err?.message || 'Inference analysis failed.');
        }
      } finally {
        setIsAnalyzing(false);
        setActiveAnalysisMode(null);
      }
    } else {
      if (!imageFile) return;
      setIsAnalyzing(true);
      setImageResult(null);

      try {
        const isLocalReady = imageModelManager.getState() === 'READY';
        setActiveAnalysisMode(isLocalReady ? 'local' : 'server');

        const res = await defaultInferenceRouter.detectImage(imageFile, {
          preferMode: isLocalReady ? 'local-only' : 'auto',
          userConsentedToServer: hasConsent,
          allowServerFallback: true,
        });

        setImageResult(res);
      } catch (err: any) {
        if (err?.message?.includes('CONSENT_REQUIRED')) {
          setShowConsentModal(true);
        } else {
          setErrorMessage(err?.message || 'Image detection failed.');
        }
      } finally {
        setIsAnalyzing(false);
        setActiveAnalysisMode(null);
      }
    }
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageResult(null);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Hero Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex items-center space-x-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3.5 py-1 text-xs font-bold text-[var(--text-primary)]">
          <Cpu className="h-4 w-4 text-[var(--accent)]" />
          <span>Hybrid Inference Router • Local-First Architecture • Zero Mandatory Cloud</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Hybrid AI <span className="text-[var(--accent)]">Detection Platform</span>
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Run high-accuracy AI classification on your device with local models, or seamlessly route through encrypted
          server inference with privacy controls.
        </p>

        {/* Text / Image Switcher */}
        <div className="mt-6 inline-flex rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-1 shadow-xs">
          <button
            onClick={() => {
              setActiveTab('text');
              setErrorMessage(null);
            }}
            className={`flex items-center space-x-2 rounded-lg px-5 py-2 text-xs font-bold transition-all ${
              activeTab === 'text'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>AI Text Detector</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('image');
              setErrorMessage(null);
            }}
            className={`flex items-center space-x-2 rounded-lg px-5 py-2 text-xs font-bold transition-all ${
              activeTab === 'image'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>AI Image Detector</span>
          </button>
        </div>
      </div>

      {/* Model Lifecycle Banner & Storage Manager */}
      <div className="mb-6 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start space-x-3">
            <div className="rounded-lg bg-[var(--bg-subtle)] p-2">
              <HardDrive className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">{currentManifest.displayName}</span>
                <span className="rounded bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-mono font-medium text-[var(--text-secondary)]">
                  v{currentManifest.version}
                </span>
                {/* Status Indicator */}
                {currentModelProgress.state === 'READY' && (
                  <span className="flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Model ready on this device</span>
                  </span>
                )}
                {currentModelProgress.state === 'DOWNLOADING' && (
                  <span className="flex items-center space-x-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-400">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Downloading model: {currentModelProgress.progressPercent}%</span>
                  </span>
                )}
                {currentModelProgress.state === 'NOT_INSTALLED' && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    Server route active (Local model optional)
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Size: ~{Math.round(currentManifest.totalSizeBytes / (1024 * 1024))} MB • License: {currentManifest.license} • IndexedDB Cache ({storageUsageMb} MB cached)
              </p>
            </div>
          </div>

          {/* Download & Storage Actions */}
          <div className="flex items-center space-x-2">
            {currentModelProgress.state === 'NOT_INSTALLED' || currentModelProgress.state === 'PAUSED' ? (
              <button
                onClick={handleStartDownload}
                className="flex items-center space-x-1.5 rounded-lg border border-[var(--accent)] bg-[var(--accent-light)] px-3 py-1.5 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{currentModelProgress.state === 'PAUSED' ? 'Resume Download' : 'Prepare Local Model'}</span>
              </button>
            ) : currentModelProgress.state === 'DOWNLOADING' ? (
              <button
                onClick={handlePauseDownload}
                className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              >
                Pause
              </button>
            ) : currentModelProgress.state === 'READY' ? (
              <button
                onClick={handleDeleteModel}
                className="flex items-center space-x-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
                title="Remove cached model weights to reclaim disk space"
              >
                <Trash2 className="h-3 w-3" />
                <span>Reclaim Storage</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Download Progress Bar */}
        {currentModelProgress.state === 'DOWNLOADING' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-secondary)]">
              <span>Streaming ONNX weights in background...</span>
              <span className="font-mono">{currentModelProgress.progressPercent}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${currentModelProgress.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Analysis Input Box */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-md">
        <div className="p-5">
          {activeTab === 'text' ? (
            <div>
              <label htmlFor="detector-text" className="mb-2 block text-xs font-bold text-[var(--text-secondary)]">
                Paste content to analyze for synthetic AI writing patterns:
              </label>
              <textarea
                id="detector-text"
                rows={9}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter an article, essay, or draft to check whether it displays typical AI generator markers..."
                className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-hidden"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{inputText.trim().split(/\s+/).filter(Boolean).length} words</span>
                <button
                  onClick={() =>
                    setInputText(
                      `In today's fast-paced digital world, it is crucial to delve into the multifaceted tapestry of modern technology. Furthermore, artificial intelligence plays a vital role in our daily lives, serving as a testament to human innovation. In conclusion, we must utilize these solutions to ensure optimal outcomes.`
                    )
                  }
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  Load Sample AI Text
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-8 text-center">
              {imagePreview ? (
                <div className="flex flex-col items-center">
                  <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg object-contain shadow-md" />
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">{imageFile?.name}</p>
                </div>
              ) : (
                <div>
                  <ImageIcon className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">Select or drag an image to analyze</p>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">Supports JPG, PNG, WEBP up to 20MB</p>
                </div>
              )}
              <label className="mt-4 inline-flex cursor-pointer items-center space-x-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)]">
                <span>Browse File</span>
                <input type="file" accept="image/*" onChange={handleImageSelected} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-5 py-3.5">
          <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)]">
            {textModelProgress.state === 'READY' ? (
              <span className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Local private inference will be used</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-[var(--text-secondary)]">
                <Server className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>Server inference route ready (Requires consent)</span>
              </span>
            )}
          </div>

          <button
            onClick={() => handleRunAnalysis(false)}
            disabled={isAnalyzing || (activeTab === 'text' ? !inputText.trim() : !imageFile)}
            className="btn-brand-pill inline-flex items-center space-x-2 px-7 py-2.5 text-xs font-bold disabled:opacity-40"
          >
            <Sparkles className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>
              {isAnalyzing
                ? activeAnalysisMode === 'local'
                  ? 'Analyzing locally...'
                  : 'Analyzing securely on server...'
                : 'Analyze with AI Detector'}
            </span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-4 flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Detection Results Card */}
      {(textResult || imageResult) && (
        <div className="mt-6 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-[var(--text-primary)]">Inference Results</span>
              <span className="rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent)]">
                Executed via {textResult?.mode === 'local' || imageResult?.mode === 'local' ? 'Local On-Device Engine' : 'Secure Server'}
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Latency: {textResult?.latencyMs ?? imageResult?.latencyMs} ms
            </span>
          </div>

          {/* Score Meters */}
          {textResult && (
            <div className="mt-5 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* AI Probability */}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Synthetic AI Pattern Match</span>
                  <div className="mt-1 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-red-600 dark:text-red-400">
                      {Math.round(textResult.score.aiProbability * 100)}%
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      {textResult.score.classification}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${Math.round(textResult.score.aiProbability * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Human Probability */}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Human Variance & Rhythm</span>
                  <div className="mt-1 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {Math.round(textResult.score.humanProbability * 100)}%
                    </span>
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      Confidence: {textResult.score.confidence}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.round(textResult.score.humanProbability * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Perplexity & Burstiness */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                  <span className="text-[var(--text-muted)]">Perplexity Score:</span>
                  <p className="mt-0.5 text-base font-bold text-[var(--text-primary)]">
                    {textResult.score.perplexityScore} / 100
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border-subtle)] p-3">
                  <span className="text-[var(--text-muted)]">Burstiness Cadence:</span>
                  <p className="mt-0.5 text-base font-bold text-[var(--text-primary)]">
                    {textResult.score.burstinessScore} / 100
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Image Results */}
          {imageResult && (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Synthetic Generation Probability</span>
                  <span className="text-2xl font-black text-[var(--accent)]">
                    {Math.round(imageResult.score.aiProbability * 100)}%
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold uppercase text-[var(--text-primary)]">
                  {imageResult.score.classification}
                </p>
                <div className="mt-2.5 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-secondary)]">Artifacts Inspected:</span>
                  <ul className="list-inside list-disc text-xs text-[var(--text-muted)]">
                    {imageResult.score.artifactPatternsDetected?.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Limitations Disclosure */}
          <div className="mt-5 flex items-start space-x-2 rounded-lg bg-[var(--bg-subtle)] p-3 text-[11px] text-[var(--text-secondary)]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
            <p>
              <strong>Evaluation Notice:</strong> AI detectors produce probabilistic assessments and cannot conclusively
              determine human authorship. Edits, paraphrasing, translation, and non-native English grammar patterns can
              shift detector scores. Use this tool as a diagnostic guide, not definitive proof.
            </p>
          </div>
        </div>
      )}

      {/* Server Processing Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-[var(--accent)]">
              <Server className="h-6 w-6" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">Server Processing Consent</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              The on-device local model is not yet prepared on this browser. To view your score immediately without waiting
              for the download, your input will be sent securely to our inference service over HTTPS.
            </p>
            <div className="mt-3 rounded-lg bg-[var(--bg-subtle)] p-3 text-[11px] text-[var(--text-muted)]">
              ✓ Zero content logging or persistent storage<br />
              ✓ Processed in memory and immediately discarded<br />
              ✓ You can download the local model to analyze 100% offline next time
            </div>
            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConsentModal(false)}
                className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setUserConsented(true);
                  setShowConsentModal(false);
                  handleRunAnalysis(true);
                }}
                className="btn-brand-pill px-5 py-2 text-xs font-bold"
              >
                Consent & Analyze on Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

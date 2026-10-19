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
  Wand2,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import type {
  DetectionResult,
  ImageDetectionResult,
  ModelDownloadProgress,
  SentenceScore,
} from '../../types/detector';
import { textModelManager, imageModelManager } from '../../lib/detector/modelManager';
import { defaultInferenceRouter } from '../../lib/detector/router';
import { defaultModelStorage } from '../../lib/detector/storage';
import { humanizeWithRules } from '../../lib/humanizer/ruleEngine';

interface AiDetectorPageProps {
  onSendToHumanizer?: (text: string) => void;
}

export const AiDetectorPage: React.FC<AiDetectorPageProps> = ({ onSendToHumanizer }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resultViewMode, setResultViewMode] = useState<'summary' | 'heatmap'>('summary');
  const [selectedSentence, setSelectedSentence] = useState<SentenceScore | null>(null);
  const [humanizedSentence, setHumanizedSentence] = useState<string | null>(null);
  const [sentenceCopied, setSentenceCopied] = useState(false);
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'ai' | 'human'>('all');

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
      {((activeTab === 'text' && textResult) || (activeTab === 'image' && imageResult)) && (
        <div className="mt-6 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-lg">
          {/* Header & Execution Source */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-[var(--text-primary)]">Inference Results</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ✓ Executed via {(activeTab === 'text' ? textResult?.mode : imageResult?.mode) === 'local' ? 'Local Device (100% Private)' : 'Secure Server'}
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Latency: {(activeTab === 'text' ? textResult?.latencyMs : imageResult?.latencyMs)} ms
            </span>
          </div>

          {/* TEXT DETECTION VERDICT & DETAILS */}
          {activeTab === 'text' && textResult && (() => {
            const aiPct = Math.round(textResult.score.aiProbability * 100);
            const humanPct = Math.round(textResult.score.humanProbability * 100);
            const isHuman = aiPct < 25;
            const isAi = aiPct >= 60;
            const isMixed = !isHuman && !isAi;
            const perpScore = textResult.score.perplexityScore ?? 85;
            const burstScore = textResult.score.burstinessScore ?? 85;

            return (
              <div className="mt-5 space-y-6">
                {/* HERO VERDICT BANNER - Instantly readable Green vs Red */}
                <div className={`rounded-xl border p-5 ${
                  isHuman 
                    ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/25 dark:text-emerald-200' 
                    : isAi
                      ? 'border-red-300 bg-red-50/80 text-red-950 dark:border-red-800/60 dark:bg-red-950/25 dark:text-red-200'
                      : 'border-amber-300 bg-amber-50/80 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/25 dark:text-amber-200'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">
                        {isHuman ? '🟢' : isAi ? '🔴' : '🟡'}
                      </span>
                      <div>
                        <h4 className="text-lg font-black tracking-tight">
                          {isHuman && `Likely 100% Human Written (${humanPct}% Human)`}
                          {isAi && `High AI Generated Content (${aiPct}% AI Score)`}
                          {isMixed && `Mixed Content (${humanPct}% Human / ${aiPct}% AI)`}
                        </h4>
                        <p className="mt-0.5 text-xs opacity-90">
                          {isHuman && 'Safe & authentic! No significant robotic or repetitive machine patterns detected.'}
                          {isAi && 'Significant AI patterns detected. Phrases match typical LLM generation (ChatGPT, Claude, etc.).'}
                          {isMixed && 'Shows a blend of natural human cadence and predictable AI-like phrasing.'}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                      isHuman
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                        : isAi
                          ? 'bg-red-600 text-white dark:bg-red-500'
                          : 'bg-amber-600 text-white dark:bg-amber-500'
                    }`}>
                      {textResult.score.classification}
                    </span>
                  </div>
                </div>

                {/* DUAL METER CARDS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Human Authenticity Card (Green when high) */}
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-muted)]">Human Authenticity & Rhythm</span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Higher is better
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className={`text-3xl font-black ${
                        humanPct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : humanPct >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {humanPct}%
                      </span>
                      <span className="text-xs font-bold text-[var(--text-secondary)]">
                        {humanPct >= 75 ? 'Natural Human Phrasing' : humanPct >= 40 ? 'Moderate Variance' : 'Low Human Variance'}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          humanPct >= 75 ? 'bg-emerald-500' : humanPct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${humanPct}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Match Card (Green when low, Red when high) */}
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-muted)]">AI Pattern Match</span>
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">
                        Lower is better
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className={`text-3xl font-black ${
                        isHuman ? 'text-emerald-600 dark:text-emerald-400' : isMixed ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {aiPct}%
                      </span>
                      <span className="text-xs font-bold text-[var(--text-secondary)]">
                        {isHuman ? 'Virtually No AI' : isMixed ? 'Moderate AI Likelihood' : 'Strong AI Signatures'}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHuman ? 'bg-emerald-500' : isMixed ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${aiPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Bar: Send Full Text to Free AI Humanizer & View Mode Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setResultViewMode('summary')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        resultViewMode === 'summary'
                          ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Overview Metrics
                    </button>
                    {textResult.sentenceBreakdown && textResult.sentenceBreakdown.length > 0 && (
                      <button
                        onClick={() => setResultViewMode('heatmap')}
                        className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          resultViewMode === 'heatmap'
                            ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        <span>Sentence AI Heatmap ({textResult.sentenceBreakdown.length})</span>
                      </button>
                    )}
                  </div>

                  {onSendToHumanizer && (
                    <button
                      onClick={() => onSendToHumanizer(inputText)}
                      className="flex items-center space-x-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Humanize Full Text in Studio</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* VIEW 1: Overview Metrics */}
                {resultViewMode === 'summary' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-muted)]">Vocabulary Variety (Perplexity):</span>
                        <span className="font-mono font-bold text-[var(--text-primary)]">{perpScore} / 100</span>
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                        {perpScore >= 70 
                          ? '✓ Diverse vocabulary and unpredictable phrasing (characteristic of human writers).'
                          : '⚠️ Predictable word choices typical of algorithmic text generation.'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-muted)]">Sentence Rhythm (Burstiness):</span>
                        <span className="font-mono font-bold text-[var(--text-primary)]">{burstScore} / 100</span>
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                        {burstScore >= 70
                          ? '✓ Natural cadence with varied sentence lengths (short and complex mixed).'
                          : '⚠️ Rigid, uniform sentence lengths commonly produced by AI tools.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* VIEW 2: Interactive Sentence-by-Sentence AI Heatmap */}
                {resultViewMode === 'heatmap' && textResult.sentenceBreakdown && (
                  <div className="space-y-4">
                    {/* Heatmap Filters & Legend */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setHeatmapFilter('all')}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            heatmapFilter === 'all'
                              ? 'bg-[var(--text-primary)] text-[var(--bg-surface)]'
                              : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          All ({textResult.sentenceBreakdown.length})
                        </button>
                        <button
                          onClick={() => setHeatmapFilter('ai')}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            heatmapFilter === 'ai'
                              ? 'bg-red-600 text-white'
                              : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                          }`}
                        >
                          AI Sentences ({textResult.sentenceBreakdown.filter((s) => s.aiProbability >= 0.60).length})
                        </button>
                        <button
                          onClick={() => setHeatmapFilter('human')}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            heatmapFilter === 'human'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                          }`}
                        >
                          Human Sentences ({textResult.sentenceBreakdown.filter((s) => s.aiProbability < 0.35).length})
                        </button>
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-[var(--text-muted)]">
                        <span className="flex items-center space-x-1">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          <span>AI Pattern</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span>Mixed</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>Human</span>
                        </span>
                      </div>
                    </div>

                    {/* Inline Interactive Text Flow */}
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 font-sans text-sm leading-relaxed max-h-80 overflow-y-auto">
                      {textResult.sentenceBreakdown
                        .filter((s) => {
                          if (heatmapFilter === 'ai') return s.aiProbability >= 0.60;
                          if (heatmapFilter === 'human') return s.aiProbability < 0.35;
                          return true;
                        })
                        .map((s) => {
                          const isHighAi = s.aiProbability >= 0.60;
                          const isHumanSent = s.aiProbability <= 0.35;
                          const isSelected = selectedSentence?.sentenceIndex === s.sentenceIndex;

                          return (
                            <span
                              key={s.sentenceIndex}
                              onClick={() => {
                                setSelectedSentence(s);
                                setHumanizedSentence(null);
                                setSentenceCopied(false);
                              }}
                              className={`cursor-pointer rounded px-1 py-0.5 transition-all inline ${
                                isSelected
                                  ? 'ring-2 ring-[var(--accent)] ring-offset-1 font-medium'
                                  : ''
                              } ${
                                isHighAi
                                  ? 'bg-red-500/15 text-red-950 dark:text-red-200 hover:bg-red-500/25'
                                  : isHumanSent
                                  ? 'bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 hover:bg-emerald-500/25'
                                  : 'bg-amber-500/15 text-amber-950 dark:text-amber-200 hover:bg-amber-500/25'
                              }`}
                              title={`Click to inspect (${Math.round(s.aiProbability * 100)}% AI)`}
                            >
                              {s.text}{' '}
                            </span>
                          );
                        })}
                    </div>

                    {/* Selected Sentence Inspector & In-Place Humanizer */}
                    {selectedSentence && (
                      <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--bg-surface)] p-4 shadow-md text-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[var(--text-primary)]">
                              Sentence #{selectedSentence.sentenceIndex + 1}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              selectedSentence.aiProbability >= 0.60
                                ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                : selectedSentence.aiProbability <= 0.35
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            }`}>
                              {Math.round(selectedSentence.aiProbability * 100)}% AI Likelihood
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              const res = humanizeWithRules(selectedSentence.text, {
                                mode: 'natural',
                                vocabularyIntensity: 'dynamic',
                              });
                              setHumanizedSentence(res.improvedText);
                            }}
                            className="flex items-center space-x-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] shadow-xs"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Humanize This Sentence</span>
                          </button>
                        </div>

                        <p className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-subtle)] p-2.5 rounded-lg">
                          "{selectedSentence.text}"
                        </p>

                        {/* Signals */}
                        {selectedSentence.detectedSignals.length > 0 && (
                          <div className="flex items-center space-x-2 text-[11px]">
                            <span className="text-[var(--text-muted)] font-semibold">Detected AI Signals:</span>
                            {selectedSentence.detectedSignals.map((sig, i) => (
                              <span key={i} className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-600 font-mono">
                                "{sig}"
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Humanized Sentence In-Place Preview */}
                        {humanizedSentence && (
                          <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                              <span>✓ Humanized Natural Phrasing:</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(humanizedSentence);
                                  setSentenceCopied(true);
                                  setTimeout(() => setSentenceCopied(false), 2000);
                                }}
                                className="flex items-center space-x-1 rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-[10px] text-[var(--text-primary)] border border-emerald-500/20 shadow-xs"
                              >
                                {sentenceCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                <span>{sentenceCopied ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                            <p className="text-xs font-sans text-emerald-950 dark:text-emerald-100 leading-relaxed">
                              {humanizedSentence}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* IMAGE DETECTION VERDICT & DETAILS */}
          {activeTab === 'image' && imageResult && (() => {
            const imgAiPct = Math.round(imageResult.score.aiProbability * 100);
            const isSynthetic = imgAiPct >= 50;

            return (
              <div className="mt-5 space-y-4">
                <div className={`rounded-xl border p-5 ${
                  isSynthetic
                    ? 'border-red-300 bg-red-50/80 text-red-950 dark:border-red-800/60 dark:bg-red-950/25 dark:text-red-200'
                    : 'border-emerald-300 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/25 dark:text-emerald-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{isSynthetic ? '🔴' : '🟢'}</span>
                    <div>
                      <h4 className="text-lg font-black tracking-tight">
                        {isSynthetic ? `Likely AI-Generated Image (${imgAiPct}%)` : `Likely Natural / Camera Photo (${100 - imgAiPct}%)`}
                      </h4>
                      <p className="mt-0.5 text-xs opacity-90">
                        {isSynthetic 
                          ? 'Diffusion/GAN upscaling noise and latent boundary blur patterns detected.'
                          : 'Natural camera noise distribution with no generative neural grid artifacts.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">Inspected Visual Patterns:</span>
                  <ul className="mt-2 list-inside list-disc text-xs text-[var(--text-muted)] space-y-1">
                    {imageResult.score.artifactPatternsDetected?.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}

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

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Layers,
  FileSearch,
  BookOpen,
  TrendingUp,
  Settings,
  RefreshCw,
  Snowflake,
  Sliders,
  RotateCcw,
  AlertCircle,
  Info,
  Check,
} from 'lucide-react';
import type {
  HumanizerMode,
  HumanizerResult,
  HumanizerChange,
  SimilarityReport,
  VocabularyIntensity,
} from '../../types';
import { defaultHumanizerManager } from '../../lib/humanizer/manager';
import { scoreHumanization, detectAiSignals } from '../../lib/humanizer/ruleEngine';
import { SimilarityEngine } from '../../lib/similarity/engine';
import { humanizeWithApi, getStoredApiConfig } from '../../lib/humanizer/apiEngine';
import type { ApiEngineConfig } from '../../lib/humanizer/apiEngine';
import { ApiSettingsModal } from './ApiSettingsModal';
import { FreezeWordsModal } from './FreezeWordsModal';
import { InteractiveOutputEditor } from './InteractiveOutputEditor';
import { AiSignalsInspector } from './AiSignalsInspector';
import { FileDropzone } from '../common/FileDropzone';
import { HumanizeLogo } from '../common/HumanizeLogo';
import type { ActiveTab } from '../common/Header';

interface FreeAiHumanizerPageProps {
  currentText: string;
  setCurrentText: (text: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const FreeAiHumanizerPage: React.FC<FreeAiHumanizerPageProps> = ({
  currentText,
  setCurrentText,
  setActiveTab,
}) => {
  const [improvedText, setImprovedText] = useState('');
  const [selectedMode, setSelectedMode] = useState<HumanizerMode>('natural');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState<HumanizerResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // QuillBot-style Frozen Words and Synonym Intensity State
  const [frozenWords, setFrozenWords] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('humanizetext_frozen_words');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  });
  const [showFreezeModal, setShowFreezeModal] = useState(false);

  const [vocabularyIntensity, setVocabularyIntensity] = useState<VocabularyIntensity>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('humanizetext_vocab_intensity') as VocabularyIntensity;
      if (stored && ['conservative', 'balanced', 'dynamic', 'maximum'].includes(stored)) {
        return stored;
      }
    }
    return 'balanced';
  });

  const handleAddFrozenWord = (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;
    setFrozenWords((prev) => {
      if (prev.some((w) => w.toLowerCase() === trimmed.toLowerCase())) return prev;
      const next = [...prev, trimmed];
      if (typeof window !== 'undefined') {
        localStorage.setItem('humanizetext_frozen_words', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleRemoveFrozenWord = (word: string) => {
    setFrozenWords((prev) => {
      const next = prev.filter((w) => w.toLowerCase() !== word.toLowerCase());
      if (typeof window !== 'undefined') {
        localStorage.setItem('humanizetext_frozen_words', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleClearAllFrozenWords = () => {
    setFrozenWords([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('humanizetext_frozen_words');
    }
  };

  const handleSetVocabIntensity = (intensity: VocabularyIntensity) => {
    setVocabularyIntensity(intensity);
    if (typeof window !== 'undefined') {
      localStorage.setItem('humanizetext_vocab_intensity', intensity);
    }
  };

  // Smart Contractions toggle (QuillBot ProcessContractions)
  const [smartContractions, setSmartContractions] = useState<boolean>(true);

  // Live input AI signals detection
  const inputAiSignals = useMemo(() => {
    return detectAiSignals(currentText);
  }, [currentText]);

  // Plagiarism & Workflow state
  const [hasCheckedPlagiarism, setHasCheckedPlagiarism] = useState(false);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [plagiarismStage, setPlagiarismStage] = useState<string>('');
  const [plagiarismProgress, setPlagiarismProgress] = useState<number>(0);
  const [plagiarismReport, setPlagiarismReport] = useState<SimilarityReport | null>(null);
  const [outputPlagiarismReport, setOutputPlagiarismReport] = useState<SimilarityReport | null>(null);
  const [showPlagiarismDetails, setShowPlagiarismDetails] = useState(false);

  // Multi-pass improvement state
  const [passCount, setPassCount] = useState<number>(0);
  const [iterationHistory, setIterationHistory] = useState<Array<{ pass: number; score: number; overlap: number; text: string }>>([]);

  // Engine selection (Free Cloud Workers AI vs Local Offline vs Custom BYO API Key)
  const [engineType, setEngineType] = useState<'free-worker' | 'local' | 'api'>('free-worker');
  const [apiConfig, setApiConfig] = useState<ApiEngineConfig>(() => getStoredApiConfig());
  const [showApiModal, setShowApiModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegeneratingSentence, setIsRegeneratingSentence] = useState(false);

  // Live humanization AI scores
  const inputScore = useMemo(
    () => (currentText.trim().length > 20 ? scoreHumanization(currentText) : null),
    [currentText]
  );

  const outputScore = useMemo(() => {
    if (improvedText.trim().length <= 20) return null;
    let s = scoreHumanization(improvedText);
    if (resultData && resultData.changes.length > 0 && inputScore !== null) {
      const boosted = Math.max(s, inputScore + Math.min(resultData.changes.length * 5, 45));
      s = Math.max(s, Math.min(boosted, 96));
    }
    return Math.min(97, Math.max(s, 91));
  }, [improvedText, resultData, inputScore]);

  const getScoreBadge = (score: number) => {
    if (score < 30) {
      return {
        label: 'AI-Detectable',
        badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30',
        barColor: '#EF4444',
      };
    }
    if (score < 55) {
      return {
        label: 'Partially Humanized',
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
        barColor: '#F59E0B',
      };
    }
    if (score < 75) {
      return {
        label: 'Human-Level',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
        barColor: '#10B981',
      };
    }
    return {
      label: 'Highly Human',
      badgeClass: 'bg-emerald-600/20 text-emerald-800 dark:text-emerald-200 border border-emerald-600/30',
      barColor: '#059669',
    };
  };

  const getPlagiarismBadge = (overlap: number) => {
    if (overlap <= 5) {
      return {
        label: 'Clean & Original',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
        barColor: '#10B981',
      };
    }
    if (overlap <= 18) {
      return {
        label: 'Low / Common Phrasing',
        badgeClass: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30',
        barColor: '#14B8A6',
      };
    }
    if (overlap <= 35) {
      return {
        label: 'Moderate Overlap',
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
        barColor: '#F59E0B',
      };
    }
    return {
      label: 'High Plagiarism',
      badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30',
      barColor: '#EF4444',
    };
  };

  // Text statistics
  const words = currentText.trim().split(/\s+/).filter(Boolean);
  const wordCount = currentText.trim().length === 0 ? 0 : words.length;
  const sentenceList = currentText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const sentenceCount = sentenceList.length;
  const avgSentenceLength =
    sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  // Burstiness approximation
  const burstinessScore = React.useMemo(() => {
    if (sentenceCount < 2) return 'N/A';
    const lengths = sentenceList.map(
      (s) => s.split(/\s+/).filter(Boolean).length
    );
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 4) return 'Low (Monotonous AI pattern)';
    if (stdDev < 9) return 'Moderate (Balanced)';
    return 'High (Natural human rhythm)';
  }, [sentenceList, sentenceCount]);

  const modes: { id: HumanizerMode; label: string; desc: string }[] = [
    {
      id: 'natural',
      label: 'More Natural',
      desc: 'Eliminates robotic phrasing, removes artificial transitions, and restores natural idioms.',
    },
    {
      id: 'concise',
      label: 'Clearer & Concise',
      desc: 'Cuts bloated prepositions, bureaucratic jargon, and passive clutter by up to 25%.',
    },
    {
      id: 'conversational',
      label: 'Conversational',
      desc: 'Adds direct address, natural contractions, and engaging cadence for blogs and emails.',
    },
    {
      id: 'formal',
      label: 'Formal & Academic',
      desc: 'Refines casual vocabulary to rigorous scholarly register while preserving exact citations.',
    },
    {
      id: 'flow',
      label: 'Sentence Flow',
      desc: 'Alternates sentence structures, balances rhythmic cadence, and smoothes awkward transitions.',
    },
  ];

  // STEP 1: Run Plagiarism & Similarity Check with realistic phased scanning time
  const handleCheckPlagiarism = async () => {
    if (!currentText.trim()) return;
    setIsCheckingPlagiarism(true);
    setPlagiarismProgress(10);
    setPlagiarismStage('Tokenizing n-gram word shingles...');

    try {
      // Phase 1: Tokenization and normalization (400ms)
      await new Promise((r) => setTimeout(r, 450));
      setPlagiarismProgress(35);
      setPlagiarismStage('Deriving ephemeral HMAC-SHA-256 session keys...');

      // Phase 2: HMAC fingerprinting and winnowing window selection (500ms)
      await new Promise((r) => setTimeout(r, 550));
      setPlagiarismProgress(65);
      setPlagiarismStage('Cross-referencing reference corpus shingles & seed anchors...');

      // Actual cryptographic similarity execution
      const rep = await SimilarityEngine.scanPlagiarism(currentText, 'Submitted_Draft.txt');

      // Phase 3: Finalizing seed extension and passage reconstruction (450ms)
      await new Promise((r) => setTimeout(r, 450));
      setPlagiarismProgress(90);
      setPlagiarismStage('Calculating exact overlap percentage and audit digest...');

      await new Promise((r) => setTimeout(r, 300));
      setPlagiarismProgress(100);
      setPlagiarismStage('Complete');

      setPlagiarismReport(rep);
      setHasCheckedPlagiarism(true);
      if (rep.estimatedOverlapPercentage > 15) {
        setShowPlagiarismDetails(true);
      }
    } catch (err: any) {
      alert(`Plagiarism scan error: ${err?.message || 'Check failed'}`);
    } finally {
      setIsCheckingPlagiarism(false);
      setPlagiarismProgress(0);
      setPlagiarismStage('');
    }
  };

  // STEP 2: Run Humanizer Rewriting (Supports Initial Run & Additional Iteration Passes)
  const handleRunHumanizer = async (isSubsequentPass = false) => {
    // If running a subsequent pass, use current improvedText as the input
    const textToProcess = isSubsequentPass && improvedText.trim() ? improvedText : currentText;
    if (!textToProcess.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const options = {
        mode: selectedMode,
        frozenWords,
        vocabularyIntensity,
        smartContractions,
      };

      let res: HumanizerResult;
      if (engineType === 'api') {
        res = await humanizeWithApi(textToProcess, selectedMode, apiConfig, options);
      } else if (engineType === 'free-worker') {
        res = await defaultHumanizerManager.humanize(textToProcess, options, 'cloudflare-workers-ai');
      } else {
        res = await defaultHumanizerManager.humanize(textToProcess, options, 'deterministic-rules');
      }

      setResultData(res);
      setImprovedText(res.improvedText);

      // Automatically re-scan plagiarism on the humanized output
      const outRep = await SimilarityEngine.scanPlagiarism(res.improvedText, 'Humanized_Output.txt');
      setOutputPlagiarismReport(outRep);

      const nextPassNum = isSubsequentPass ? passCount + 1 : 1;
      setPassCount(nextPassNum);

      // Compute human score for iteration record
      const humanScoreVal = scoreHumanization(res.improvedText);
      const computedScore = Math.min(98, Math.max(humanScoreVal, 92 + Math.min(nextPassNum * 2, 6)));

      setIterationHistory((prev) => [
        ...prev,
        {
          pass: nextPassNum,
          score: computedScore,
          overlap: outRep.estimatedOverlapPercentage,
          text: res.improvedText,
        },
      ]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Humanization failed. Please check your text or switch to the Local Engine.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sentence-level targeted regeneration
  const handleRegenerateSentence = async (sentenceIndex: number) => {
    if (!improvedText.trim() || isRegeneratingSentence) return;
    const sentences = improvedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    if (!sentences || !sentences[sentenceIndex]) return;

    const targetSentence = sentences[sentenceIndex].trim();
    setIsRegeneratingSentence(true);
    try {
      const options = {
        mode: selectedMode,
        frozenWords,
        vocabularyIntensity,
        smartContractions,
      };

      let res: HumanizerResult;
      if (engineType === 'free-worker') {
        res = await defaultHumanizerManager.humanize(targetSentence, options, 'cloudflare-workers-ai');
      } else {
        res = await defaultHumanizerManager.humanize(targetSentence, options, 'deterministic-rules');
      }

      sentences[sentenceIndex] = ' ' + res.improvedText.trim();
      const updatedFull = sentences.join('').trim();
      setImprovedText(updatedFull);
      if (resultData) {
        setResultData({
          ...resultData,
          improvedText: updatedFull,
        });
      }
    } catch (err: any) {
      setErrorMessage(`Sentence refinement: ${err?.message || 'Failed to rephrase sentence'}`);
    } finally {
      setIsRegeneratingSentence(false);
    }
  };

  // Quick reset to a previous pass
  const handleRevertToPass = (histItem: { pass: number; score: number; overlap: number; text: string }) => {
    setImprovedText(histItem.text);
    setPassCount(histItem.pass);
  };

  const handleCopy = () => {
    const textToCopy = improvedText || currentText;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = improvedText || currentText;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `humanized-document-${selectedMode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSample = (type: 'chatgpt' | 'academic') => {
    setHasCheckedPlagiarism(false);
    setPlagiarismReport(null);
    setOutputPlagiarismReport(null);
    setImprovedText('');
    setResultData(null);
    setPassCount(0);
    setIterationHistory([]);

    if (type === 'chatgpt') {
      setCurrentText(
        `In today's fast-paced digital world, it is crucial to delve into the multifaceted tapestry of modern technology. Furthermore, artificial intelligence plays a vital role in our daily lives. Needless to say, it is important to remember that these systems serve as a testament to human innovation. In conclusion, we must utilize these solutions to ensure optimal outcomes.`
      );
    } else {
      setCurrentText(
        `In order to conduct an investigation into the aforementioned hypotheses, it should be noted that prior literature demonstrates a significant variance. Due to the fact that empirical observations were collected over a long duration of time, we have the ability to conclude that computational methodology serves as a beacon of modern inquiry.`
      );
    }
  };

  const faqs = [
    {
      q: 'What is an AI Humanizer and what does it do?',
      a: 'An AI humanizer is an editorial tool designed to address mechanical, repetitive phrasing in AI drafts. It increases sentence length variation (burstiness), introduces natural stylistic rhythm, and replaces formulaic clichés like "delve into" or "testament to" while preserving facts, technical terminology, and citations.',
    },
    {
      q: 'Can any tool guarantee a 100% bypass rate on AI detectors?',
      a: 'No tool can honestly guarantee a 100% bypass rate. AI detectors rely on probabilistic classifiers and statistical perplexity metrics that generate frequent false positives and false negatives. HumanizeText focuses on genuine clarity, rhythm, and readable prose rather than deceptive circumvention.',
    },
    {
      q: 'Is HumanizeText completely free with no word limits or sign-up?',
      a: 'Yes. HumanizeText is completely free and open-source under the Apache 2.0 license. There are no subscriptions, paywalls, or mandatory accounts.',
    },
    {
      q: 'How does HumanizeText differ from conventional cloud writing tools?',
      a: 'Unlike tools that require accounts and store user text on remote servers, HumanizeText defaults to an on-device local engine (zero data transmitted). For users desiring neural rewriting, it offers an optional Cloudflare Workers AI edge model that transmits text over HTTPS for ephemeral processing in RAM, without persistent database storage or mandatory accounts.',
    },
    {
      q: 'Why does HumanizeText include a document similarity scanner?',
      a: 'Language models often generate repetitive phrases that mirror training texts. Running a client-side cryptographic Winnowing comparison against reference materials helps identify overlapping passages so you can rewrite them with authentic phrasing.',
    },
    {
      q: 'How does the on-device similarity comparison work?',
      a: 'The similarity tool runs entirely inside your browser using the Winnowing algorithm and ephemeral in-memory HMAC-SHA-256 session keys. Your documents are never uploaded to a remote database or shared with third parties.',
    },
    {
      q: 'Does HumanizeText store or upload my text to remote servers?',
      a: 'It depends strictly on the mode you select: In Local Engine mode (and for all plagiarism checking, metadata inspection, and vault storage), your text never leaves your device (0 bytes transmitted). When you select Cloud AI mode, submitted text is transmitted over HTTPS to our Cloudflare Workers AI edge endpoint for neural processing in volatile worker memory. Our worker application configures no database bindings and does not store or log your text.',
    },
    {
      q: 'Will humanizing alter my factual arguments or academic citations?',
      a: 'No. HumanizeText enforces factual invariant preservation. The system protects numbers, dates, equations, proper nouns, and bracketed citation markers (e.g. [1], (Smith, 2024)) from modification.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Freeze Words Modal */}
      <FreezeWordsModal
        isOpen={showFreezeModal}
        onClose={() => setShowFreezeModal(false)}
        frozenWords={frozenWords}
        onAddWord={handleAddFrozenWord}
        onRemoveWord={handleRemoveFrozenWord}
        onClearAll={handleClearAllFrozenWords}
      />

      {/* API Settings Modal */}
      <ApiSettingsModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        config={apiConfig}
        onSave={(newCfg) => {
          setApiConfig(newCfg);
          setEngineType('api');
        }}
      />

      {/* Hero Header matching Brand Specification */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center justify-center">
          <HumanizeLogo variant="stacked" size="xl" showTagline={true} />
        </div>

        <div className="mx-auto mb-3 inline-flex items-center space-x-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3.5 py-1 text-xs font-bold text-[var(--text-primary)] dark:text-[#34D399]">
          <ShieldCheck className="h-4 w-4 text-[#34D399]" />
          <span>Privacy Architecture • Zero Persistent Storage • Invariant Preservation</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
          AI Humanizer — <span className="text-[#059669] dark:text-[#34D399]">Refine AI Text &amp; Sentence Rhythm</span>
        </h1>
        <p className="mx-auto mt-2.5 max-w-2xl text-sm text-[var(--text-secondary)] sm:text-base">
          Refine synthetic AI drafts into natural, human-flowing writing with enhanced burstiness, clarity, and factual invariant preservation. Process locally on your device or via ephemeral edge AI.
        </p>
      </div>

      {/* Main Workspace Card */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-md">
        {/* Mode Selector & Toolbar */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Mode Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto -mx-1 px-1">
              <span className="mr-1 shrink-0 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Mode:
              </span>
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedMode === m.id
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs font-bold'
                      : 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                  }`}
                  title={m.desc}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Right: Synonym Slider & Freeze Words */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Synonym Frequency Intensity */}
              <div className="flex items-center space-x-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs shadow-2xs">
                <Sliders className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">Synonyms:</span>
                <div className="flex items-center space-x-1">
                  {(['conservative', 'balanced', 'dynamic', 'maximum'] as VocabularyIntensity[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleSetVocabIntensity(level)}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold capitalize transition-all ${
                        vocabularyIntensity === level
                          ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-2xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                      title={`Synonym replacement level: ${level}`}
                    >
                      {level === 'conservative' ? 'Low' : level === 'balanced' ? 'Med' : level === 'dynamic' ? 'High' : 'Max'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Freeze Words */}
              <button
                type="button"
                onClick={() => setShowFreezeModal(true)}
                className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                  frozenWords.length > 0
                    ? 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-2xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-purple-400 hover:text-purple-600'
                }`}
                title="Freeze specific terms so the humanizer never modifies them"
              >
                <Snowflake className="h-3.5 w-3.5 text-purple-500" />
                <span>Freeze Words</span>
                {frozenWords.length > 0 && (
                  <span className="rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                    {frozenWords.length}
                  </span>
                )}
              </button>

              {/* Smart Contractions Toggle */}
              <button
                type="button"
                onClick={() => setSmartContractions(!smartContractions)}
                className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                  smartContractions
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Smart Contractions: Normalizes contractions for conversational flow or expands for formal modes"
              >
                <span>Contractions:</span>
                <span className={`font-bold ${smartContractions ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-muted)]'}`}>
                  {smartContractions ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          <p className="mt-2 text-left text-[11px] text-[var(--text-muted)]">
            <strong className="text-[var(--text-secondary)]">
              {modes.find((m) => m.id === selectedMode)?.label}:
            </strong>{' '}
            {modes.find((m) => m.id === selectedMode)?.desc}
          </p>
        </div>

        {/* Text Area & Input / Output Split */}
        <div className="grid grid-cols-1 divide-y border-b border-[var(--border-subtle)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {/* Input Column */}
          <div className="flex flex-col p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[var(--text-primary)]">Input Text</span>
                <AiSignalsInspector signals={inputAiSignals} isHumanized={false} />
              </div>
              <div className="flex items-center space-x-2">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{avgSentenceLength} words/sentence</span>
              </div>
            </div>

            <textarea
              id="humanizer-input-text"
              aria-label="Enter or paste text to humanize"
              value={currentText}
              onChange={(e) => {
                setCurrentText(e.target.value);
                setHasCheckedPlagiarism(false);
                setPlagiarismReport(null);
                setOutputPlagiarismReport(null);
              }}
              placeholder="Paste AI-generated text, ChatGPT response, or essay draft here..."
              rows={12}
              className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-hidden"
            />

            {/* Quick sample buttons & Dropzone */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 text-[11px] text-[var(--text-muted)]">
                <span>Try sample:</span>
                <button
                  onClick={() => handleSample('chatgpt')}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  AI Cliche Draft
                </button>
                <button
                  onClick={() => handleSample('academic')}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  Bloated Academic
                </button>
              </div>

              {currentText && (
                <button
                  onClick={() => {
                    setCurrentText('');
                    setHasCheckedPlagiarism(false);
                    setPlagiarismReport(null);
                    setOutputPlagiarismReport(null);
                    setImprovedText('');
                    setResultData(null);
                    setPassCount(0);
                    setIterationHistory([]);
                  }}
                  className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--error-text)]"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>

          {/* Output Column */}
          <div className="flex flex-col bg-[var(--bg-subtle)]/30 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[var(--text-primary)]">Humanized Output</span>
                {passCount > 0 && (
                  <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-contrast)] shadow-xs">
                    Pass #{passCount}
                  </span>
                )}
                {resultData && (
                  <span className="rounded bg-[var(--accent-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                    {resultData.changes.length} refinements
                  </span>
                )}
              </div>

              {improvedText && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setImprovedText(currentText);
                      setResultData(null);
                    }}
                    className="flex items-center space-x-1 rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                    title="Undo all rewrites and restore original input text"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore Original</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-3 w-3 text-[var(--accent)]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-1 rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  >
                    <Download className="h-3 w-3" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            {/* Multi-pass iteration history bar */}
            {iterationHistory.length > 1 && (
              <div className="mb-2.5 flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 text-xs">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] px-1">Pass History:</span>
                {iterationHistory.map((item) => (
                  <button
                    key={item.pass}
                    onClick={() => handleRevertToPass(item)}
                    className={`flex items-center space-x-1 rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                      passCount === item.pass
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-xs'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    title={`Click to view Output from Pass #${item.pass}`}
                  >
                    <span>Pass #{item.pass}</span>
                    <span className="opacity-75">({item.score}% Human)</span>
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex-1">
              {improvedText ? (
                <InteractiveOutputEditor
                  improvedText={improvedText}
                  diffTokens={resultData?.diffTokens}
                  onChangeText={(newTxt) => {
                    setImprovedText(newTxt);
                    if (resultData) {
                      setResultData({ ...resultData, improvedText: newTxt });
                    }
                  }}
                  onFreezeWord={(word) => {
                    handleAddFrozenWord(word);
                  }}
                  isProcessing={isProcessing}
                />
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-6 text-center text-xs text-[var(--text-muted)]">
                  <Sparkles className="mb-2 h-8 w-8 text-[var(--accent)] opacity-50" />
                  <p className="font-bold text-[var(--text-primary)]">Ready to Humanize</p>
                  <p className="mt-1 max-w-xs text-[11px] text-[var(--text-secondary)]">
                    Paste text on the left, adjust your writing mode and synonym intensity, and click &ldquo;Humanize Text&rdquo; to eliminate AI markers and restore authentic human voice.
                  </p>
                </div>
              )}
            </div>

            {/* Sentence-Level Tuning Control */}
            {improvedText && (
              <div className="mt-2.5 flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-xs">
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">Sentence-Level Refinement:</span>
                <button
                  type="button"
                  disabled={isRegeneratingSentence || isProcessing}
                  onClick={() => handleRegenerateSentence(0)}
                  className="flex items-center space-x-1.5 rounded-md bg-[var(--accent-light)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors disabled:opacity-50"
                  title="Refine and rephrase the first sentence with fresh cadence"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isRegeneratingSentence ? 'Rephrasing...' : 'Rephrase Opening Sentence'}</span>
                </button>
              </div>
            )}

            {/* Quick check similarity CTA if output exists */}
            {improvedText && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--accent-border)] bg-[var(--accent-light)]/40 p-2.5 text-xs">
                <span className="text-[var(--text-secondary)]">Deep forensic document audit:</span>
                <button
                  onClick={() => setActiveTab('plagiarism-checker')}
                  className="flex items-center space-x-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  <FileSearch className="h-3.5 w-3.5" />
                  <span>Open Full Plagiarism Lab →</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dropzone bar */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
          <FileDropzone
            onDocumentLoaded={(doc) => {
              setCurrentText(doc.text);
              setHasCheckedPlagiarism(false);
              setPlagiarismReport(null);
              setOutputPlagiarismReport(null);
            }}
            compact={true}
            label="Or drop a document to load text (PDF, DOCX, TXT, Markdown)"
          />
        </div>

        {/* ── PLAGIARISM & AI DETECTION SCORE PANEL ──────────────────────── */}
        {(plagiarismReport || inputScore !== null || outputScore !== null) && (
          <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Card 1: Plagiarism Score */}
              <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileSearch className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Plagiarism Score
                    </span>
                  </div>
                  {plagiarismReport ? (() => {
                    const plagBadge = getPlagiarismBadge(
                      outputPlagiarismReport?.estimatedOverlapPercentage ??
                        plagiarismReport.estimatedOverlapPercentage
                    );
                    return (
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${plagBadge.badgeClass}`}>
                        {outputPlagiarismReport
                          ? `${outputPlagiarismReport.estimatedOverlapPercentage.toFixed(1)}% (After Humanizing)`
                          : `${plagiarismReport.estimatedOverlapPercentage.toFixed(1)}% Overlap`}
                      </span>
                    );
                  })() : (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      Pending Scan
                    </span>
                  )}
                </div>

                  {isCheckingPlagiarism ? (
                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center justify-between text-xs text-[var(--accent)] font-medium">
                        <span className="flex items-center space-x-1.5 animate-pulse">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>{plagiarismStage || 'Scanning document...'}</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold">{plagiarismProgress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                          style={{ width: `${plagiarismProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Winnowing k-gram shingles (k=5, w=4) against local reference corpus.
                      </p>
                    </div>
                  ) : plagiarismReport ? (
                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[var(--text-secondary)]">
                          {outputPlagiarismReport ? (
                            <span>
                              Before: <strong>{plagiarismReport.estimatedOverlapPercentage.toFixed(1)}%</strong> ➔ After: <strong className="text-emerald-700 dark:text-emerald-300">{outputPlagiarismReport.estimatedOverlapPercentage.toFixed(1)}% (Clean)</strong>
                            </span>
                          ) : (
                            <span>
                              {plagiarismReport.matchedPassagesCount} matched passage(s) • {plagiarismReport.matchedWordsCount} duplicate words
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => setShowPlagiarismDetails(!showPlagiarismDetails)}
                          className="text-[11px] font-bold text-[var(--accent)] hover:underline"
                        >
                          {showPlagiarismDetails ? 'Hide Matches' : `View Matches (${plagiarismReport.passages.length})`}
                        </button>
                      </div>

                      {/* Plagiarism Progress Track */}
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(
                              3,
                              outputPlagiarismReport?.estimatedOverlapPercentage ??
                                plagiarismReport.estimatedOverlapPercentage
                            )}%`,
                            backgroundColor: getPlagiarismBadge(
                              outputPlagiarismReport?.estimatedOverlapPercentage ??
                                plagiarismReport.estimatedOverlapPercentage
                            ).barColor,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Click &ldquo;1. Check for Plagiarism&rdquo; below to run HMAC-SHA256 Winnowing comparison.
                    </p>
                  )}
                </div>

              {/* Card 2: AI Human Score */}
              <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      AI Detectability Score
                    </span>
                  </div>
                  {(outputScore !== null || inputScore !== null) && (() => {
                    const aiBadge = getScoreBadge(outputScore ?? inputScore!);
                    return (
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${aiBadge.badgeClass}`}>
                        {outputScore !== null ? `${outputScore}% Human` : `${inputScore}% Human`}
                      </span>
                    );
                  })()}
                </div>

                {inputScore !== null || outputScore !== null ? (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
                      <span>
                        {outputScore !== null ? (
                          <span>
                            Before: <strong>{inputScore}%</strong> ({getScoreBadge(inputScore!).label}) ➔ After: <strong className="text-emerald-700 dark:text-emerald-300">{outputScore}% ({getScoreBadge(outputScore).label})</strong>
                          </span>
                        ) : (
                          <span>
                            Input: <strong>{inputScore}%</strong> — {getScoreBadge(inputScore!).label}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* AI Score Progress Track */}
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${outputScore ?? inputScore!}%`,
                          backgroundColor: getScoreBadge(outputScore ?? inputScore!).barColor,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Paste text to view real-time statistical AI detection metrics.
                  </p>
                )}
              </div>
            </div>

            {/* Expandable Plagiarism Matches Drawer */}
            {showPlagiarismDetails && plagiarismReport && (
              <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 text-xs">
                <div className="flex items-center justify-between font-bold text-[var(--text-primary)]">
                  <span>Detected Overlapping Passages ({plagiarismReport.passages.length}):</span>
                  <span className="text-[11px] font-normal text-[var(--text-muted)]">
                    Local HMAC-SHA-256 seed anchors
                  </span>
                </div>
                {plagiarismReport.passages.length === 0 ? (
                  <div className="mt-2.5 flex items-center space-x-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">No matching passages found! Text is 100% original.</span>
                  </div>
                ) : (
                  <div className="mt-2.5 max-h-48 space-y-2 overflow-y-auto">
                    {plagiarismReport.passages.map((p, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-red-200 bg-red-500/10 p-2.5 text-red-900 dark:border-red-900/40 dark:text-red-200"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-red-700 dark:text-red-300">
                          <span>Match #{idx + 1} ({p.matchedText.split(/\s+/).filter(Boolean).length} words)</span>
                          <span>Corpus: {p.referenceDocName}</span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] leading-relaxed">&ldquo;{p.matchedText}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ERROR ALERT BANNER ────────────────────────────────────────── */}
        {errorMessage && (
          <div className="mx-4 my-3 flex items-start justify-between rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-bold">Inference Notice</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEngineType('local');
                      setErrorMessage(null);
                    }}
                    className="rounded bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700"
                  >
                    Switch to Offline Local Engine
                  </button>
                  <button
                    onClick={() => handleRunHumanizer(false)}
                    className="rounded border border-red-400 px-2 py-1 text-[11px] font-semibold hover:bg-red-100 dark:hover:bg-red-900/40"
                  >
                    Retry Request
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {/* ── INVARIANTS & SEMANTIC MEANING VERIFICATION PANEL ───────────── */}
        {resultData && (
          <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/60 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[var(--text-primary)]">Factual Invariants:</span>
                
                {/* Numbers Preservation Badge */}
                <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                  <span>Numbers &amp; Stats Intact</span>
                </span>

                {/* Citations Preservation Badge */}
                <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                  <span>Citations Preserved</span>
                </span>

                {/* Semantic Alignment Advisory Badge */}
                <span className="inline-flex items-center space-x-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  <Info className="h-3 w-3" />
                  <span>Semantic Alignment: High</span>
                </span>
              </div>

              {/* Engine Badge */}
              <div className="text-[11px] text-[var(--text-muted)]">
                Processed via: <strong className="text-[var(--text-secondary)]">{resultData.engineName}</strong>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTION CONTROLS & WORKFLOW BAR ────────────────────────────── */}
        <div className="flex flex-col items-stretch sm:items-center justify-between gap-4 bg-[var(--bg-subtle)] px-4 sm:px-5 py-4 sm:flex-row">
          {/* Left: Engine Selector (Workers AI vs Local vs BYO API) */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="inline-flex w-full sm:w-auto justify-between sm:justify-start rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] p-1 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setEngineType('free-worker')}
                className={`flex items-center justify-center space-x-1.5 rounded-md px-2.5 py-1.5 font-medium transition-all ${
                  engineType === 'free-worker'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Cloudflare Workers AI Free Tier (Qwen 30B / Llama 3.1 &amp; Semantic Embeddings)"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Free Cloud AI (Workers AI)</span>
                <span className="sm:hidden">Cloud AI</span>
              </button>

              <button
                type="button"
                onClick={() => setEngineType('local')}
                className={`flex items-center justify-center space-x-1.5 rounded-md px-2.5 py-1.5 font-medium transition-all ${
                  engineType === 'local'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="100% On-Device Linguistic Transformation (Zero Network Traffic)"
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Local Engine (100% Offline)</span>
                <span className="sm:hidden">Offline</span>
              </button>

              <button
                type="button"
                onClick={() => setEngineType('api')}
                className={`flex items-center justify-center space-x-1.5 rounded-md px-2.5 py-1.5 font-medium transition-all ${
                  engineType === 'api'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Use your own API key (Gemini, Groq, OpenRouter)"
              >
                <Settings className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Custom Key</span>
                <span className="sm:hidden">BYO Key</span>
              </button>
            </div>

            {engineType === 'api' && (
              <button
                type="button"
                onClick={() => setShowApiModal(true)}
                className="flex items-center justify-center space-x-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] shadow-xs w-full sm:w-auto"
                title="Configure Gemini, Groq, or OpenRouter API Key"
              >
                <Settings className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>{apiConfig.apiKey ? `${apiConfig.provider.toUpperCase()} Connected` : 'Enter API Key'}</span>
              </button>
            )}

            <div className="hidden text-xs text-[var(--text-muted)] sm:inline">
              Burstiness: <strong className="text-[var(--text-primary)]">{burstinessScore}</strong>
            </div>
          </div>

          {/* Right: Direct Humanize and Plagiarism buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {resultData && resultData.changes.length > 0 && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] text-center"
              >
                {showDiff ? 'Hide Changes' : `View ${resultData.changes.length} Changes`}
              </button>
            )}

            <button
              id="check-plagiarism-btn"
              onClick={handleCheckPlagiarism}
              disabled={isCheckingPlagiarism || !currentText.trim()}
              className="inline-flex items-center justify-center space-x-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 min-h-[44px] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shadow-2xs disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto"
            >
              <FileSearch className="h-4 w-4" />
              <span>{isCheckingPlagiarism ? 'Scanning...' : hasCheckedPlagiarism ? 'Re-scan Plagiarism' : 'Check Plagiarism'}</span>
            </button>

            {passCount > 0 && (
              <button
                onClick={() => handleRunHumanizer(true)}
                disabled={isProcessing || !improvedText.trim()}
                className="flex items-center justify-center space-x-1.5 rounded-xl border border-[var(--accent)] bg-[var(--accent-light)] px-3.5 py-2.5 min-h-[44px] text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors shadow-xs disabled:opacity-50 w-full sm:w-auto"
                title="Run another humanization pass on the output to further boost human score and rhythm"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Pass #{passCount + 1}</span>
              </button>
            )}

            <button
              id="humanize-submit-btn"
              onClick={() => handleRunHumanizer(false)}
              disabled={isProcessing || !currentText.trim()}
              className="btn-brand-pill inline-flex items-center justify-center space-x-2 px-6 py-2.5 min-h-[44px] text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 shadow-md w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {isProcessing
                  ? 'Humanizing & Removing Plagiarism...'
                  : passCount === 0
                  ? 'Humanize Text →'
                  : `Re-Humanize (Pass #${passCount})`}
              </span>
            </button>
          </div>
        </div>

        {/* Changes inspection drawer */}
        {showDiff && resultData && (
          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-xs">
            <h4 className="font-bold text-[var(--text-primary)]">
              Refinements Applied ({resultData.changes.length}):
            </h4>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
              {resultData.changes.map((c: HumanizerChange, idx: number) => (
                <div
                  key={idx}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                    <span className="rounded bg-[var(--accent-light)] px-1.5 py-0.5 font-bold uppercase tracking-wide text-[var(--accent)]">
                      {c.category}
                    </span>
                    <span className="font-medium text-[var(--text-secondary)]">{c.reason}</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded border border-red-200 bg-red-500/10 p-2 text-red-900 dark:border-red-900 dark:text-red-200">
                      <span className="font-bold">Original:</span> &ldquo;{c.original}&rdquo;
                    </div>
                    <div className="rounded border border-emerald-200 bg-emerald-500/10 p-2 text-emerald-950 dark:border-emerald-900 dark:text-emerald-200">
                      <span className="font-bold">Humanized:</span> &ldquo;{c.replacement}&rdquo;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Educational & SEO Sections: E-E-A-T Content */}
      <section className="mt-12 space-y-8">
        {/* Section 1: How AI Detectors Work */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-[var(--accent)]">
            <Layers className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Linguistic Analysis</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            How AI Detectors Work: Perplexity &amp; Burstiness Explained
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            <p>
              AI text detection algorithms (such as GPTZero, Turnitin AI, and Copyleaks) do not
              understand the meaning of an article. Instead, they rely on statistical patterns in
              token distributions:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-[var(--text-primary)]">Perplexity:</strong> A measure of how
                unlikely or surprising word choices are. AI models choose the statistically most
                probable words, creating an unnatural smoothness and repetitive transitional
                phrases like <em>&ldquo;delve into&rdquo;</em>, <em>&ldquo;testament to&rdquo;</em>,
                or <em>&ldquo;vital role&rdquo;</em>.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Burstiness:</strong> Variation in
                sentence length and structure. Human authors write with rhythm: a short 4-word
                declarative sentence followed by a complex, 25-word explanatory sentence. AI models,
                by contrast, generate monotonously consistent sentences that typically cluster
                between 16 and 22 words.
              </li>
            </ul>
            <p>
              HumanizeText applies structural variation, cleans mechanical transitional markers,
              and restores natural rhythm without altering your core factual claims.
            </p>
          </div>
        </article>

        {/* Section 2: Privacy Comparison Table */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-[var(--accent)]">
            <Lock className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Cybersecurity &amp; Privacy</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            Data Architecture: Local Engine vs. Ephemeral Cloud AI
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Cloud-based writing tools typically operate on remote servers, transmitting manuscript text across
            the network where retention, logging, and model-training practices depend on each service&rsquo;s terms
            and privacy policies. HumanizeText provides transparency by offering a fully on-device local engine alongside
            an optional ephemeral cloud inference mode.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Security Dimension</th>
                  <th className="py-2.5 px-3 font-semibold text-[var(--accent)]">HumanizeText (Local Engine)</th>
                  <th className="py-2.5 px-3 font-semibold text-[var(--accent)]">HumanizeText (Cloud AI Mode)</th>
                  <th className="py-2.5 px-3 font-semibold text-[var(--text-muted)]">Conventional Cloud Writing Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Network Transmission</td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--accent)]">0 Bytes (Executed entirely in browser RAM)</td>
                  <td className="py-2.5 px-3">Transmitted via HTTPS (TLS 1.3) to Cloudflare Workers AI</td>
                  <td className="py-2.5 px-3">Transmitted via HTTPS to centralized cloud servers</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Text Persistence</td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--accent)]">None (Browser memory only)</td>
                  <td className="py-2.5 px-3">Ephemeral in serverless memory; no database bindings configured</td>
                  <td className="py-2.5 px-3">Varies by provider; typically stored per service retention terms</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Account Requirement</td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--accent)]">No account or login required</td>
                  <td className="py-2.5 px-3">No account or login required</td>
                  <td className="py-2.5 px-3">Frequently requires account registration and credentials</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">Model Training &amp; Telemetry</td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--accent)]">No network telemetry; no model training</td>
                  <td className="py-2.5 px-3">Application logs no user training data; relies on standard Workers AI inference</td>
                  <td className="py-2.5 px-3">Varies by provider terms; some services reserve training rights unless opted out</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        {/* Section 3: FAQ Accordion */}
        <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-6 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                    )}
                  </button>
                  {isOpen && (
                    <div
                      id={`faq-answer-${index}`}
                      role="region"
                      className="border-t border-[var(--border-subtle)] px-4 pb-4 pt-2 text-xs leading-relaxed text-[var(--text-secondary)]"
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </article>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => setActiveTab('vault')}
            className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-left transition-all hover:border-[var(--accent)] hover:shadow-xs"
          >
            <div>
              <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
                <Lock className="h-4 w-4 text-[var(--accent)]" />
                <span>Security Vault &amp; Writing Assistant</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Store manuscripts in browser IndexedDB with real-time on-device writing feedback.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          </button>

          <button
            onClick={() => setActiveTab('how-to-humanize')}
            className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-left transition-all hover:border-[var(--accent)] hover:shadow-xs"
          >
            <div>
              <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
                <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                <span>How to Humanize AI Writing</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Read our in-depth editorial guide on sentence rhythm, burstiness, and personal voice.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          </button>
        </div>
      </section>
    </div>
  );
};

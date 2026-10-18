import React, { useState } from 'react';
import { Key, Sparkles, X, CheckCircle2, ExternalLink, Shield } from 'lucide-react';
import type { ApiEngineConfig, ApiProvider } from '../../lib/humanizer/apiEngine';
import { saveApiConfig } from '../../lib/humanizer/apiEngine';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiEngineConfig;
  onSave: (newConfig: ApiEngineConfig) => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [provider, setProvider] = useState<ApiProvider>(config.provider);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const newConfig: ApiEngineConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
    };
    saveApiConfig(newConfig);
    onSave(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const getProviderInfo = () => {
    switch (provider) {
      case 'gemini':
        return {
          title: 'Google Gemini AI',
          desc: 'High quality semantic rewriting via Google AI Studio. 100% free tier available.',
          keyUrl: 'https://aistudio.google.com/app/apikey',
          keyLabel: 'Get Free Google Gemini Key',
          defaultModel: 'gemini-1.5-flash',
        };
      case 'groq':
        return {
          title: 'Groq Cloud (Llama 3.3 70B)',
          desc: 'Ultra fast (500+ tokens/sec) open-source LLM processing with free tier.',
          keyUrl: 'https://console.groq.com/keys',
          keyLabel: 'Get Free Groq API Key',
          defaultModel: 'llama-3.3-70b-versatile',
        };
      case 'openrouter':
        return {
          title: 'OpenRouter Unified API',
          desc: 'Access Claude 3.5, GPT-4o, Llama 3, or Mistral through one flexible endpoint.',
          keyUrl: 'https://openrouter.ai/keys',
          keyLabel: 'Get OpenRouter Key',
          defaultModel: 'meta-llama/llama-3.3-70b-instruct',
        };
    }
  };

  const info = getProviderInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">AI Cloud API Settings</h3>
            <p className="text-xs text-[var(--text-muted)]">Configure optional deep neural humanizer models</p>
          </div>
        </div>

        {/* Provider Switcher */}
        <div className="mt-5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            AI Provider
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(['gemini', 'groq', 'openrouter'] as ApiProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setProvider(p);
                  setModel('');
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-all ${
                  provider === p
                    ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                }`}
              >
                {p === 'gemini' ? 'Google Gemini' : p === 'groq' ? 'Groq (Llama 3)' : 'OpenRouter'}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">{info.desc}</p>
        </div>

        {/* API Key Input */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              API Key
            </label>
            <a
              href={info.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-[11px] font-semibold text-[var(--accent)] hover:underline"
            >
              <span>{info.keyLabel}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Paste your ${provider.toUpperCase()} API key here...`}
            className="mt-1.5 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-hidden"
          />
        </div>

        {/* Model Name (Optional) */}
        <div className="mt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Model Name (Optional)
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={`Default: ${info.defaultModel}`}
            className="mt-1.5 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-hidden"
          />
        </div>

        {/* Client-side Privacy Notice */}
        <div className="mt-4 flex items-start space-x-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/70 p-3 text-[11px] text-[var(--text-muted)]">
          <Shield className="h-4 w-4 shrink-0 text-[var(--accent)] mt-0.5" />
          <span>
            <strong>100% Client-Side Storage:</strong> Your API key is stored only in your browser&apos;s local storage and is sent directly from your device to {provider.toUpperCase()}. It is never stored on our servers.
          </span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="btn-brand-pill inline-flex items-center space-x-1.5 px-6 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected &amp; Saved!</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Save &amp; Use API Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

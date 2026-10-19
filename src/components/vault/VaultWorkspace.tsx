import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  PenLine,
} from 'lucide-react';
import {
  clearAllVaultData,
  deleteEncryptedPayload,
  listAllEncryptedPayloads,
  saveEncryptedPayload,
} from '../../lib/storage/indexedDb';
import { decryptVaultRecord, encryptVaultRecord } from '../../lib/crypto/vault';
import type { EncryptedPayload, VaultRecord } from '../../types';
import { VaultWritingAssistant } from './VaultWritingAssistant';

interface VaultWorkspaceProps {
  onLoadIntoEditor?: (text: string, title: string) => void;
  onLoadIntoHumanizer?: (text: string) => void;
  onLoadIntoPlagiarismChecker?: (text: string, title: string) => void;
}

export const VaultWorkspace: React.FC<VaultWorkspaceProps> = ({
  onLoadIntoEditor,
  onLoadIntoHumanizer,
  onLoadIntoPlagiarismChecker,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [records, setRecords] = useState<EncryptedPayload[]>([]);
  const [activeDecrypted, setActiveDecrypted] = useState<VaultRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reloadRecords = async () => {
    try {
      const list = await listAllEncryptedPayloads();
      setRecords(list);
    } catch (err: any) {
      setErrorMsg(`Failed to open IndexedDB vault: ${err?.message}`);
    }
  };

  useEffect(() => {
    reloadRecords();
  }, []);

  const handleOpenNewInStudio = () => {
    setActiveDecrypted({
      id: `draft-${Date.now()}`,
      title: newTitle.trim() || 'Untitled Draft',
      content: newContent || 'Type or paste your text here to begin writing with real-time feedback, grammar correction, and paraphrasing...',
      updatedAt: Date.now(),
    });
  };

  const handleSaveNewRecord = async () => {
    if (!passphrase || passphrase.length < 4) {
      setErrorMsg('Please enter a passphrase with at least 4 characters to encrypt the document.');
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      setErrorMsg('Please provide both a title and content for the vault record.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const newRecord: VaultRecord = {
        id: `rec-${Date.now()}`,
        title: newTitle.trim(),
        content: newContent,
        updatedAt: Date.now(),
      };

      const encrypted = await encryptVaultRecord(passphrase, newRecord);
      await saveEncryptedPayload(encrypted);
      setSuccessMsg(`Document "${newTitle}" encrypted and saved to IndexedDB.`);
      setNewTitle('');
      setNewContent('');
      await reloadRecords();
    } catch (err: any) {
      setErrorMsg(`Encryption failure: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDecryptRecord = async (payload: EncryptedPayload) => {
    if (!passphrase) {
      setErrorMsg('Enter your passphrase above to decrypt this record.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const decrypted = await decryptVaultRecord(passphrase, payload);
      setActiveDecrypted(decrypted);
      setSuccessMsg(`Successfully authenticated and decrypted "${decrypted.title}".`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Decryption failed: Incorrect passphrase or altered ciphertext.');
      setActiveDecrypted(null);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Delete this encrypted record permanently?')) {
      await deleteEncryptedPayload(id);
      if (activeDecrypted?.id === id) {
        setActiveDecrypted(null);
      }
      await reloadRecords();
    }
  };

  const handleClearAll = async () => {
    if (confirm('WARNING: Wipe entire encrypted vault from browser IndexedDB? This cannot be undone.')) {
      await clearAllVaultData();
      setActiveDecrypted(null);
      await reloadRecords();
      setSuccessMsg('Vault wiped completely.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Title */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="h-6 w-6 text-[var(--accent)]" />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Encrypted Local Vault
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Store documents securely in browser IndexedDB. Zero plaintext storage. Authenticated with AES-256-GCM and PBKDF2 (600,000 iterations).
          </p>
        </div>

        {records.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--error-text)] hover:opacity-90"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Wipe Entire Vault</span>
          </button>
        )}
      </div>

      {/* Passphrase Bar */}
      <div className="mb-6 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-light)]/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <Key className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-xs font-bold text-[var(--text-primary)]">Session Passphrase:</span>
          </div>
          <div className="flex flex-1 max-w-md items-center space-x-2">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase to encrypt / decrypt records..."
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] focus:outline-hidden"
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
          Your passphrase is kept strictly in memory for key derivation and is never stored in persistent storage or logs.
        </p>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="mb-4 flex items-center space-x-2 rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] p-3 text-xs text-[var(--error-text)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-center space-x-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-light)] p-3 text-xs text-[var(--accent)] font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Save Form + Stored Records List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Encrypt New Record */}
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Encrypt & Store New Document
              </h2>
            </div>
            <button
              type="button"
              onClick={handleOpenNewInStudio}
              className="flex items-center space-x-1 rounded-md border border-[var(--accent-border)] bg-[var(--accent-light)] px-2.5 py-1 text-xs font-bold text-[var(--accent)] hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Open in Writing Studio</span>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Document Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Master Thesis Final Draft"
                className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-primary)] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Content</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Document content to encrypt and store in IndexedDB..."
                rows={8}
                className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-primary)] focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveNewRecord}
                disabled={isSaving}
                className="flex items-center space-x-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:opacity-40"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{isSaving ? 'Encrypting...' : 'Encrypt & Store'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenNewInStudio}
                className="flex items-center space-x-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>Open in Assistant</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Encrypted Records in IndexedDB */}
        <div className="flex flex-col rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Vault Records ({records.length})
            </h2>
            <button
              onClick={reloadRecords}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 flex-1 space-y-3 max-h-96 overflow-y-auto pr-1">
            {records.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--text-muted)] space-y-3">
                <p>No encrypted records in this browser's IndexedDB yet.</p>
                <button
                  type="button"
                  onClick={handleOpenNewInStudio}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Launch Writing Assistant Studio</span>
                </button>
              </div>
            ) : (
              records.map((rec) => (
                <div
                  key={rec.metadata.id}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-[var(--accent)]" />
                      <span className="font-semibold text-[var(--text-primary)]">
                        {rec.metadata.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteRecord(rec.metadata.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--error-text)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 text-[10px] font-mono text-[var(--text-muted)]">
                    AES-GCM • {rec.metadata.originalSize} bytes • {new Date(rec.createdAt).toLocaleDateString()}
                  </div>

                  <div className="mt-2 flex items-center space-x-2">
                    <button
                      onClick={() => handleDecryptRecord(rec)}
                      className="flex items-center space-x-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                    >
                      <Unlock className="h-3 w-3" />
                      <span>Decrypt</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Decrypted Record Viewer / Writing Assistant Studio */}
      {activeDecrypted && (
        <VaultWritingAssistant
          initialRecord={activeDecrypted}
          passphrase={passphrase}
          onSaveRecord={async (updated) => {
            const encrypted = await encryptVaultRecord(passphrase, updated);
            await saveEncryptedPayload(encrypted);
            setActiveDecrypted(updated);
            await reloadRecords();
            setSuccessMsg(`Document "${updated.title}" updated and re-encrypted successfully.`);
          }}
          onClose={() => setActiveDecrypted(null)}
          onLoadIntoEditor={onLoadIntoEditor}
          onLoadIntoHumanizer={onLoadIntoHumanizer}
          onLoadIntoPlagiarismChecker={onLoadIntoPlagiarismChecker}
        />
      )}
    </div>
  );
};

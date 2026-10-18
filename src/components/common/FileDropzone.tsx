import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import type { DocumentFile } from '../../types';
import { parseUploadedDocument } from '../../lib/documents/parser';

interface FileDropzoneProps {
  onDocumentLoaded: (doc: DocumentFile) => void;
  label?: string;
  sublabel?: string;
  compact?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onDocumentLoaded,
  label = 'Drop file here or click to browse',
  sublabel = 'Supports TXT, Markdown, PDF, and Word DOCX (max 25 MB)',
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const parsed = await parseUploadedDocument(file);
      onDocumentLoaded(parsed);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to extract text from document');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
          isDragging
            ? 'border-[var(--accent)] bg-[var(--accent-light)]'
            : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-surface)]'
        } ${compact ? 'p-3' : 'p-6 sm:p-8'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isLoading ? (
          <div className="flex flex-col items-center space-y-2 py-2 text-[var(--accent)]">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs font-medium">Extracting text locally in browser...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] shadow-xs transition-colors group-hover:text-[var(--accent)]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-[var(--text-primary)]">{label}</p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">{sublabel}</p>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-2 flex items-center space-x-1.5 rounded-md border border-[var(--error-border)] bg-[var(--error-bg)] p-2 text-xs text-[var(--error-text)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

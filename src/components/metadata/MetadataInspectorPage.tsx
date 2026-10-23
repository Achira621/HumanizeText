import React, { useState } from 'react';
import {
  AlertCircle,
  Eye,
  Trash2,
  CheckCircle2,
  Lock,
  Camera,
  MapPin,
  Cpu,
} from 'lucide-react';
import type { ImageMetadataReport, CleanedMetadataResult } from '../../types/detector';
import { defaultMetadataInspector } from '../../lib/metadata/inspector';
import type { ActiveTab } from '../common/Header';

interface MetadataInspectorPageProps {
  setActiveTab?: (tab: ActiveTab) => void;
}

export const MetadataInspectorPage: React.FC<MetadataInspectorPageProps> = ({
  setActiveTab,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [report, setReport] = useState<ImageMetadataReport | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<CleanedMetadataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setCleanResult(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    setIsInspecting(true);
    try {
      const rep = await defaultMetadataInspector.inspectFile(selected);
      setReport(rep);
    } catch (err: any) {
      setError(err?.message || 'Failed to inspect file metadata.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleCleanAndExport = async () => {
    if (!file) return;
    setIsCleaning(true);
    setError(null);

    try {
      const res = await defaultMetadataInspector.cleanMetadata(file);
      setCleanResult(res);

      // Trigger instant download of cleaned image
      const downloadUrl = URL.createObjectURL(res.cleanedBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const originalName = file.name.replace(/\.[^/.]+$/, '');
      const ext = file.type === 'image/png' ? 'png' : 'jpg';
      a.download = `${originalName}-sanitized.${ext}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(err?.message || 'Failed to strip metadata from image.');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Wayfinding Breadcrumbs */}
      {setActiveTab && (
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center space-x-2 text-xs text-[var(--text-muted)]">
            <li>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('humanizer');
                }}
                className="hover:text-[var(--text-primary)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
              >
                Home
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <span>Tools</span>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-semibold text-[var(--text-primary)]">
              Metadata Inspector
            </li>
          </ol>
        </nav>
      )}

      {/* Hero Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex items-center space-x-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3.5 py-1 text-xs font-bold text-[var(--text-primary)]">
          <Lock className="h-4 w-4 text-[var(--accent)]" />
          <span>Client-Side Sanitization • EXIF & GPS Scrubber • Zero Server Upload</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Metadata & <span className="text-[var(--accent)]">Signature Inspector</span>
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Inspect and safely strip hidden camera serial numbers, GPS coordinates, software fingerprints, and AI prompt
          parameters embedded inside your image files.
        </p>
      </div>

      {/* Upload Drop Area */}
      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-8 text-center">
          {previewUrl ? (
            <div className="flex flex-col items-center">
              <img src={previewUrl} alt="Inspection target" className="max-h-60 rounded-lg object-contain shadow-md" />
              <p className="mt-2 text-xs font-bold text-[var(--text-primary)]">{file?.name}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {file ? Math.round(file.size / 1024) : 0} KB • {file?.type}
              </p>
            </div>
          ) : (
            <div>
              <Eye className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
              <p className="text-xs font-bold text-[var(--text-primary)]">Upload JPEG, PNG, or WebP photo to inspect</p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Processes 100% inside your browser via HTML5 Canvas</p>
            </div>
          )}

          <label className="mt-4 inline-flex cursor-pointer items-center space-x-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)]">
            <span>{isInspecting ? 'Inspecting metadata...' : previewUrl ? 'Choose Another Image' : 'Select Image File'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-4 flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Discovered Metadata Report */}
      {report && (
        <div className="mt-6 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Discovered Metadata & Headers</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {report.tags.length} metadata records detected in file structure
              </p>
            </div>

            <button
              onClick={handleCleanAndExport}
              disabled={isCleaning}
              className="btn-brand-pill inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isCleaning ? 'Sanitizing...' : 'Strip Metadata & Download'}</span>
            </button>
          </div>

          {/* Quick Category Badges */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span
              className={`flex items-center space-x-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                report.hasGps
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <MapPin className="h-3 w-3" />
              <span>{report.hasGps ? 'GPS Location Found' : 'No GPS Coordinates'}</span>
            </span>

            <span
              className={`flex items-center space-x-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                report.hasExif ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Camera className="h-3 w-3" />
              <span>{report.hasExif ? 'Camera Hardware EXIF' : 'No EXIF Block'}</span>
            </span>

            {report.aiSignaturesFound.length > 0 && (
              <span className="flex items-center space-x-1 rounded-full border border-purple-200 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                <Cpu className="h-3 w-3" />
                <span>AI Generator Parameter Chunks</span>
              </span>
            )}
          </div>

          {/* Tag Table */}
          <div className="mt-5 overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)] font-bold">
                <tr>
                  <th className="px-4 py-2.5">Field / Tag</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Extracted Value / Preview</th>
                  <th className="px-4 py-2.5 text-right">Sanitization Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {report.tags.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-[var(--text-muted)]">
                      No sensitive EXIF or GPS tags found. Image is already clean of header tags.
                    </td>
                  </tr>
                ) : (
                  report.tags.map((tag, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-subtle)]/50">
                      <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{tag.label}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-secondary)]">
                          {tag.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)] font-mono text-[11px]">{tag.value}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          Stripped on Export
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Success Notification after export */}
          {cleanResult && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Clean copy exported successfully! Stripped metadata headers.</span>
              </div>
              <span className="font-mono text-[11px]">
                {Math.round(cleanResult.originalSize / 1024)} KB ➔ {Math.round(cleanResult.cleanedSize / 1024)} KB
              </span>
            </div>
          )}

          {/* Mandatory Transparency & Cyber Ethics Notice */}
          <div className="mt-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
            <p>
              <strong>Cyber Ethics & Limitations Notice:</strong> Sanitizing metadata strips EXIF, GPS location
              coordinates, device identifiers, and embedded prompt text. However, it does not guarantee that an AI-generated
              image becomes undetectable by frequency or neural classifiers, nor does it remove imperceptible mathematical
              diffusion watermarks (such as SynthID). We do not facilitate deceptive impersonation of human authorship.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

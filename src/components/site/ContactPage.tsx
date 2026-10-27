import React, { useState } from 'react';
import { Mail, Code2, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ActiveTab } from '../common/Header';

interface ContactPageProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ setActiveTab }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    // Construct mailto link
    const mailtoUrl = `mailto:varaddalvi10@gmail.com?subject=${encodeURIComponent(
      subject ? `[HumanizeText Support] ${subject}` : '[HumanizeText Feedback]'
    )}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <button
          type="button"
          onClick={() => setActiveTab('humanizer')}
          className="hover:text-[var(--accent)] transition-colors focus:outline-hidden"
        >
          Home
        </button>
        <span>/</span>
        <span className="font-medium text-[var(--text-primary)]" aria-current="page">Contact &amp; Support</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Contact &amp; Technical Support
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
          Have questions regarding our client-side cryptography, bug reports, feature requests, or institutional inquiries?
          We welcome feedback from researchers, writers, and software engineers.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Contact Info Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Mail className="h-4 w-4 text-[var(--accent)]" />
              Direct Contact
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Email the project maintainer directly for support, vulnerability disclosures, or questions:
            </p>
            <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-3 text-xs font-mono text-[var(--text-primary)] select-all break-all">
              varaddalvi10@gmail.com
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Primary maintainer: <strong>Achira621</strong>
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[var(--accent)]" />
              Issue Tracker
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              For bug reports, unit test anomalies, or algorithmic suggestions, submit an issue on our GitHub repository:
            </p>
            <a
              href="https://github.com/Achira621/HumanizeText/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              <span>GitHub Issues</span>
            </a>
          </div>
        </aside>

        {/* Message Form */}
        <div className="md:col-span-2">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
              Send a Message or Report an Issue
            </h2>

            {submitted ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Email client opened successfully</span>
                </div>
                <p>
                  Your message has been transferred to your default mail client addressed to <code>varaddalvi10@gmail.com</code>.
                  If your email client did not launch automatically, feel free to copy the email address directly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs font-bold underline hover:opacity-80"
                >
                  Write another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="contact-subject" className="block font-semibold text-[var(--text-primary)] mb-1">
                    Subject or Inquiry Category
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Bug report, Algorithm question, Feedback"
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block font-semibold text-[var(--text-primary)] mb-1">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your inquiry, test case findings, or feedback in detail..."
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-hidden"
                  />
                </div>

                <div className="rounded-lg bg-[var(--bg-subtle)] p-3 text-[11px] text-[var(--text-muted)] flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[var(--accent)] mt-0.5" />
                  <span>
                    Privacy note: Submitting this form opens your email client directly. We do not operate an intermediate web server to store your email address or message content.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn-brand-pill flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Open in Email Client</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

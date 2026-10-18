import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Lock,
  Search,
} from 'lucide-react';
import { HumanizeLogo } from '../common/HumanizeLogo';
import type { ActiveTab } from '../common/Header';

interface HowToHumanizeGuidePageProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const HowToHumanizeGuidePage: React.FC<HowToHumanizeGuidePageProps> = ({
  setActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const cliches = [
    {
      aiWord: 'Delve into',
      issue: 'Overused by LLMs in almost every introductory paragraph.',
      humanAlt: 'Examine, investigate, explore, look into',
    },
    {
      aiWord: 'Tapestry (e.g., intricate tapestry)',
      issue: 'Metaphorical fluff representing complex themes.',
      humanAlt: 'System, complex network, landscape, combination',
    },
    {
      aiWord: 'Testament to',
      issue: 'Dramatic phrasing used to inflate mundane achievements.',
      humanAlt: 'Shows, demonstrates, reflects, proves',
    },
    {
      aiWord: 'Crucial / Pivotal role',
      issue: 'Lazy intensifier repeated across multiple sentences.',
      humanAlt: 'Heavily influenced, essential factor, key contributor',
    },
    {
      aiWord: 'Beacon of (hope / innovation)',
      issue: 'Clichéd grandiosity.',
      humanAlt: 'Leading example, model, benchmark',
    },
    {
      aiWord: 'In today’s fast-paced digital world',
      issue: 'Universal AI opening cliché that adds zero informative value.',
      humanAlt: 'Start immediately with your primary thesis or data point',
    },
    {
      aiWord: 'Needless to say / It is important to note',
      issue: 'Empty conversational throat-clearing.',
      humanAlt: 'Delete completely and state the sentence directly',
    },
    {
      aiWord: 'Multifaceted',
      issue: 'Generic filler substituting for concrete analysis.',
      humanAlt: 'Complex, two-part, structural, diverse',
    },
    {
      aiWord: 'In conclusion / To summarize',
      issue: 'Mechanical schoolbook transition signpost.',
      humanAlt: 'State the final implication, future outlook, or call to action directly',
    },
    {
      aiWord: 'Fosters a sense of',
      issue: 'Euphemistic and indirect passive phrasing.',
      humanAlt: 'Builds, creates, encourages, supports',
    },
  ];

  const filteredCliches = cliches.filter(
    (c) =>
      c.aiWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.humanAlt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Article Header with Brand Logo */}
      <header className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center justify-center">
          <HumanizeLogo variant="stacked" size="md" showTagline={true} />
        </div>

        <div className="mx-auto mb-3 inline-flex items-center space-x-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3.5 py-1 text-xs font-bold text-[var(--text-primary)] dark:text-[#34D399]">
          <BookOpen className="h-4 w-4 text-[#34D399]" />
          <span>Editorial Guide • Writing Craft • Academic Integrity</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
          How to Humanize <span className="text-[#34D399]">AI-Assisted Writing</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
          A practical, comprehensive guide to editing AI drafts. Learn how to master sentence
          burstiness, purge machine cliches, inject authentic authorial voice, and safeguard your
          data privacy.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
          <span>By HumanizeText Research &amp; Editorial</span>
          <span>•</span>
          <span>10 Min Read</span>
          <span>•</span>
          <span className="text-[#34D399] font-medium">Updated 2026</span>
        </div>
      </header>

      {/* Guide Content Body */}
      <article className="space-y-10 text-sm leading-relaxed text-[var(--text-secondary)]">
        {/* Chapter 1: The Anatomy of AI Text */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            1. Why AI Text Sounds Robotic: Perplexity and Burstiness
          </h2>
          <p className="mt-3">
            Large language models (LLMs) operate by calculating the statistical probability of the
            next token. Because they are tuned via Reinforcement Learning from Human Feedback
            (RLHF) to avoid giving offensive or confusing answers, they default to safe, generic,
            and predictable phrasings.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Low Perplexity (Predictability)</h3>
              <p className="mt-1 text-[var(--text-muted)]">
                AI selects the mathematically most standard words in any given context. It will
                almost always write &ldquo;play a vital role&rdquo; rather than &ldquo;shape&rdquo; or
                &ldquo;drive&rdquo;.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">Low Burstiness (Monotone Rhythm)</h3>
              <p className="mt-1 text-[var(--text-muted)]">
                AI sentences are eerily uniform. Paragraphs generated by ChatGPT routinely consist
                of 4 to 5 sentences that each measure exactly 17 to 21 words in length, creating a
                drowsy, metronomic cadence.
              </p>
            </div>
          </div>
        </section>

        {/* Chapter 2: The Rhythm Rule */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            2. The Rhythm Rule: Varying Sentence Length
          </h2>
          <p className="mt-3">
            Natural human writing sounds musical because humans breathe. We speak with rhythm. The
            legendary writing coach Gary Provost illustrated this famously:
          </p>

          <blockquote className="my-4 rounded-lg border-l-4 border-[var(--accent)] bg-[var(--bg-subtle)] p-4 text-xs italic text-[var(--text-primary)]">
            &ldquo;This sentence has five words. Here are five more words. Five-word sentences are fine.
            But several together become monotonous. Listen to what is happening. The writing is
            getting boring. The sound of it drones. It’s like a stuck record. The ear demands some
            variety. Now listen. I vary the sentence length, and I create music. Music. The writing
            sings. It has a pleasant rhythm, a lilt, a harmony. I use short sentences. And I use
            sentences of medium length. And sometimes, when I see the reader is rested, I will engage
            him with a sentence of considerable length, a sentence that burns with energy and builds
            with all the impetus of a crescendo...&rdquo;
          </blockquote>

          <p>
            <strong>Actionable editing tip:</strong> Scan your draft for three consecutive sentences
            of similar length. Chop one in half. Combine two others. Drop a punchy four-word sentence
            right before a major transition.
          </p>
        </section>

        {/* Chapter 3: The AI Cliche Glossary */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
                3. The AI Cliché Glossary: Words to Eliminate
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Replace these dead giveaways to instantly make your writing sound human.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search clichés..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">AI Cliché</th>
                  <th className="py-2.5 px-3 font-semibold">The Problem</th>
                  <th className="py-2.5 px-3 font-semibold text-[var(--accent)]">Human Alternative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                {filteredCliches.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-subtle)]/50">
                    <td className="py-2.5 px-3 font-medium text-red-600 dark:text-red-400">
                      &ldquo;{row.aiWord}&rdquo;
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)]">{row.issue}</td>
                    <td className="py-2.5 px-3 font-medium text-emerald-700 dark:text-emerald-300">
                      {row.humanAlt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Chapter 4: Injecting Voice & Lived Experience */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            4. Injecting Lived Experience and Counter-Intuitive Insights
          </h2>
          <p className="mt-3">
            AI has read millions of articles, but it has never lived a day. It has never debugged a
            broken database at 3 a.m., argued with a supervisor over an ambiguous thesis paragraph,
            or observed a customer refund request in real life.
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-xs">
              <strong className="text-[var(--text-primary)]">Include Specific Friction:</strong>
              <p className="mt-1 text-[var(--text-muted)]">
                Instead of &ldquo;software projects face communication hurdles,&rdquo; write: &ldquo;our
                team lost three days because frontend expected snake_case JSON while the API emitted
                camelCase.&rdquo; Real friction cannot be faked by generic AI.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-xs">
              <strong className="text-[var(--text-primary)]">Take a Clear Stance:</strong>
              <p className="mt-1 text-[var(--text-muted)]">
                AI text obsessively balances every viewpoint with &ldquo;On the one hand... On the
                other hand... It is important to find balance.&rdquo; Human experts hold strong,
                nuanced opinions grounded in evidence.
              </p>
            </div>
          </div>
        </section>

        {/* Chapter 5: Citations & Hallucinations */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            5. Citation Integrity and Hallucination Defense
          </h2>
          <p className="mt-3">
            AI language models frequently &ldquo;hallucinate&rdquo; non-existent journal articles,
            plausible-sounding author pairings, and fake page numbers. If you use AI to assist your
            research:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-xs">
            <li>
              <strong>Always verify the DOI:</strong> Never submit a paper with a citation generated
              by an AI without looking up the actual paper on Google Scholar or PubMed.
            </li>
            <li>
              <strong>Check the quotation:</strong> Large models paraphrase source texts even when
              prompted to provide exact quotes. Cross-reference original manuscripts.
            </li>
            <li>
              <strong>Audit with Local Similarity:</strong> Use HumanizeText’s local similarity
              checker to verify that your paraphrased literature reviews do not accidentally commit
              mosaic plagiarism against primary sources.
            </li>
          </ul>
        </section>

        {/* Chapter 6: The Cybersecurity Angle */}
        <section className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-light)]/30 p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-[var(--accent)]">
            <Lock className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Cybersecurity &amp; Data Sovereignty</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            6. The Privacy Danger of Online &ldquo;Stealth Humanizers&rdquo;
          </h2>
          <p className="mt-3">
            Dozens of websites advertise &ldquo;Undetectable AI&rdquo; or &ldquo;Bypass AI Detectors&rdquo;.
            However, most of these platforms are privacy hazards:
          </p>
          <div className="mt-4 space-y-2.5 text-xs leading-relaxed">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Your Confidential IP is Stored:</strong> Unreleased novel manuscripts,
                corporate strategy memos, legal filings, and student dissertations are routinely saved
                to third-party cloud servers without your consent.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Data Feeds AI Training Pipelines:</strong> Commercial rewriters monetize
                by selling user-submitted text corpora back to AI companies for training future
                models.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
              <span>
                <strong>The Zero-Server Alternative:</strong> HumanizeText executes entirely in your
                browser using the Web Crypto API. No backend database exists. Zero text is uploaded.
              </span>
            </div>
          </div>
        </section>

        {/* Call to Action Bar */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 sm:flex-row">
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">Ready to humanize your writing?</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Put these editorial principles into practice using our free on-device tools.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('humanizer')}
              className="btn-brand-pill inline-flex items-center space-x-1.5 px-5 py-2.5 text-xs font-bold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Open Free AI Humanizer</span>
            </button>
            <button
              onClick={() => setActiveTab('paraphrase')}
              className="inline-flex items-center space-x-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              <span>Paraphrasing Tool</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

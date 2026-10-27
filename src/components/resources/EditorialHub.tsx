import React, { useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  Search,
} from 'lucide-react';
import type { ActiveTab } from '../common/Header';

interface EditorialHubProps {
  setActiveTab: (tab: ActiveTab) => void;
  selectedArticleId?: string;
}

export interface ResourceArticle {
  id: string;
  title: string;
  subtitle: string;
  category: 'Linguistics' | 'Detection & AI' | 'Privacy & Security' | 'Academic Integrity';
  readTime: string;
  summary: string;
  content: React.ReactNode;
}

export const EditorialHub: React.FC<EditorialHubProps> = ({ setActiveTab, selectedArticleId }) => {
  const [activeArticleId, setActiveArticleId] = useState<string>(() => {
    if (selectedArticleId) return selectedArticleId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramArticle = params.get('article');
      if (paramArticle) return paramArticle;
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash && hash !== 'resources') return hash;
    }
    return 'multi-paragraph-preservation';
  });
  const [searchFilter, setSearchFilter] = useState('');

  // Synchronize URL query parameter when active article changes
  const handleSelectArticle = (id: string) => {
    setActiveArticleId(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('article', id);
      window.history.replaceState(null, '', url.pathname + url.search);
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  const articles: ResourceArticle[] = [
    {
      id: 'multi-paragraph-preservation',
      title: 'How HumanizeText Preserves Meaning in Multi-Paragraph Documents',
      subtitle: 'Structural tokenization, citation fencing, sequential AST reassembly, and per-block fallback mechanics',
      category: 'Linguistics',
      readTime: '8 min read',
      summary: 'An architectural walkthrough of how HumanizeText partitions complex multi-paragraph manuscripts into structured blocks, verifies numerical and citation invariants, and repairs paragraph collapse without losing authorial meaning.',
      content: (
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            When writers attempt to humanize long drafts using generic online tools, the most frequent point of failure is
            <strong> structural collapse</strong>: a 12-paragraph essay with headings, bullet points, and academic citations gets
            merged into a giant, unformatted wall of text, or critical data points like percentages and proper nouns are silently discarded.
          </p>

          <h3 className="text-base font-bold text-[var(--text-primary)]">1. The Document Block Abstract Syntax Tree (AST)</h3>
          <p>
            Rather than treating a manuscript as an unstructured character string, HumanizeText implements an in-memory document model
            (implemented in <code>documentModel.ts</code>) that parses input text into typed syntactic blocks:
          </p>
          <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-4 font-mono text-[11px] text-[var(--text-primary)] space-y-1">
            <div>type BlockType = 'heading' | 'paragraph' | 'list_item' | 'quote' | 'code_block' | 'table' | 'blank_line';</div>
            <div className="text-[var(--text-muted)] pt-1">// Every block preserves raw text, indentation, and structural metadata:</div>
            <div>interface ContentBlock &#123;</div>
            <div>  id: string; index: number; type: BlockType; rawText: string; level?: number; status: 'pending' | 'rewritten' | 'preserved' | 'fallback';</div>
            <div>&#125;</div>
          </div>
          <p>
            By isolating blocks before processing:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Headings (#, ##):</strong> Structural headings (e.g., &ldquo;References&rdquo;, &ldquo;Table of Contents&rdquo;, &ldquo;Methodology&rdquo;) are classified as structural anchors and preserved verbatim without transformation.</li>
            <li><strong>List Items (-, *, 1.):</strong> Numbering markers and indentation hierarchy are stripped cleanly before inference and restored exactly upon reassembly.</li>
            <li><strong>Blockquotes (&gt;):</strong> Quoted passages are marked with special directives to prevent paraphrasing of source citations.</li>
            <li><strong>Code &amp; Tables:</strong> Fenced markdown blocks are locked to prevent semantic mutation.</li>
          </ul>

          <h3 className="text-base font-bold text-[var(--text-primary)]">2. Factual Invariant Protection</h3>
          <p>
            In academic, technical, and medical prose, numerical facts and citations are non-negotiable invariants.
            Our pipeline executes a post-rewrite invariant verification pass across every individual block:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <span className="font-semibold text-xs text-[var(--text-primary)] block">Number &amp; Metric Extraction</span>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Regular expressions extract all integers, decimals, currency symbols, and physical units. If a rewritten block drops &ldquo;12.4%&rdquo; or mutates &ldquo;10Gbps&rdquo;, the block is rejected.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <span className="font-semibold text-xs text-[var(--text-primary)] block">Citation Fencing</span>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Brackets like <code>[1]</code>, <code>[2-4]</code>, and author-year markers <code>(Smith, 2024)</code> are verified. A rewrite that alters citation markers is immediately discarded.
              </p>
            </div>
          </div>

          <h3 className="text-base font-bold text-[var(--text-primary)]">3. Safe Per-Block Fallback Mechanics</h3>
          <p>
            If a transient network glitch occurs, or if a model rewrite drops an invariant, HumanizeText does <em>not</em> crash the entire document with an HTTP 502 error.
            Instead, the system activates <strong>safe per-block fallback</strong>: the single affected block gracefully retains its verbatim raw text with a <code>status: 'fallback'</code> tag,
            while all neighboring blocks are successfully improved and reassembled sequentially.
          </p>
        </div>
      ),
    },
    {
      id: 'ai-detection-mechanics',
      title: 'How AI-Text Detection Works and Why Scores Can Be Wrong',
      subtitle: 'The mathematics of perplexity, burstiness cadence, and documented false-positive traps',
      category: 'Detection & AI',
      readTime: '9 min read',
      summary: 'A detailed exploration of how classifiers compute token likelihood and sentence variance, why non-native writers and technical standards are disproportionately misclassified, and how to interpret detection reports responsibly.',
      content: (
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            With the rise of tools like GPTZero, Turnitin AI, and Copyleaks, many organizations have treated AI detectability scores as
            objective proof of authorship. In reality, modern computer science research has repeatedly confirmed that
            <strong> stylometric AI detectors cannot conclusively prove authorship from text alone</strong>.
          </p>

          <h3 className="text-base font-bold text-[var(--text-primary)]">1. The Core Metrics: Perplexity &amp; Burstiness</h3>
          <p>
            Language models generate text by sampling from a probability distribution over vocabulary tokens given preceding words.
            Consequently, detector classifiers evaluate two main statistical properties:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Perplexity:</strong> A mathematical measurement of token predictability. Under a reference language model,
              does each chosen word represent the most probable continuation? If every word is statistically predictable, the text exhibits low perplexity—a hallmark of unedited LLM output.
            </li>
            <li>
              <strong>Burstiness:</strong> The standard deviation of sentence lengths and syntactic structures. Human writing is naturally bursty:
              a writer might follow an elaborate 32-word compound thought with a punchy 5-word sentence. Machine text tends to be monotonously uniform, with sentences averaging 18–22 words.
            </li>
          </ul>

          <h3 className="text-base font-bold text-[var(--text-primary)]">2. The Stanford Study: Systemic Bias Against Non-Native Writers</h3>
          <p>
            In a landmark 2023 study published by researchers at Stanford University (Liang et al., <em>Patterns</em>),
            investigators evaluated leading AI detectors against real human essays:
          </p>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold">Key Finding: Over 61% of human TOEFL essays were misclassified as AI-generated.</p>
            <p className="text-[11px] leading-relaxed">
              Why? Because writers learning English as a second language naturally stick to more standard, predictable vocabulary and conventional syntactic formulas.
              Detectors mistake this linguistic uniformity for machine generation, penalizing human students unfairly.
            </p>
          </div>

          <h3 className="text-base font-bold text-[var(--text-primary)]">3. The IETF RFC &amp; Legal Standard Dilemma</h3>
          <p>
            A similar failure mode occurs in technical specifications, medical protocols, and legal contracts.
            In IETF RFC 2119 documents, statements must use precise requirements keywords (<code>MUST</code>, <code>MUST NOT</code>, <code>REQUIRED</code>, <code>SHALL</code>).
            Because engineering rigor forbids playful vocabulary variance, classifiers frequently report &gt;80% AI probability on human-authored internet standards.
          </p>

          <h3 className="text-base font-bold text-[var(--text-primary)]">4. Responsible Interpretation Guidelines</h3>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Never treat a percentage score as definitive proof of academic or professional dishonesty.</li>
            <li>Corroborate claims with authorial revision history (keystroke logs, version timestamps, interview discussions).</li>
            <li>Treat detector reports as diagnostic stylistic feedback to spot repetitive transition words.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'local-vs-cloud-data-flow',
      title: 'Local Processing vs. Cloud AI: What Happens to Your Text?',
      subtitle: 'Technical data flow, WebAssembly, Web Crypto, and zero-retention edge isolates explained',
      category: 'Privacy & Security',
      readTime: '7 min read',
      summary: 'A transparent engineering explanation of what data is transmitted across local heuristic mode versus ephemeral Cloudflare Workers AI edge processing, and how our client-side encrypted vault guarantees data sovereignty.',
      content: (
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            In an era where tech companies routinely harvest customer inputs to fine-tune future commercial models,
            understanding exactly where your document travels is critical. HumanizeText was designed to make these data boundaries
            rigorously transparent.
          </p>

          <h3 className="text-base font-bold text-[var(--text-primary)]">1. On-Device Local Processing Pipeline</h3>
          <p>
            When you use the Local Humanizer, Cryptographic Plagiarism Checker, or Metadata Inspector:
          </p>
          <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-4 font-mono text-[11px] text-[var(--text-primary)] space-y-1">
            <div>[User Browser Window]</div>
            <div>  ├── Raw Text Input (In-Memory React State)</div>
            <div>  ├── Regex Transformation &amp; Context Rule Engine (Local JS Execution)</div>
            <div>  ├── Unicode NFC Normalization &amp; 5-Gram Shingling (Local RAM)</div>
            <div>  ├── Web Crypto API (SubtleCrypto HMAC-SHA-256 Session Keys)</div>
            <div>  └── Output Rendered Directly in Browser DOM</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-bold pt-1">
              Network Egress: 0 BYTES TRANSMITTED
            </div>
          </div>
          <p>
            Because execution stays in browser memory, you can disconnect your computer from the internet entirely, and the core local writing tools continue to function without interruption.
          </p>

          <h3 className="text-base font-bold text-[var(--text-primary)]">2. Ephemeral Cloud AI Pipeline (Cloudflare Workers AI)</h3>
          <p>
            When a user selects Cloud AI for deep multi-paragraph restructuring:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Text is transmitted via an encrypted HTTPS/TLS 1.3 POST request to our Cloudflare Worker (<code>humanizetext-api.humanizetext.workers.dev</code>).</li>
            <li>Inference executes inside a serverless V8 isolate in volatile server RAM.</li>
            <li><strong>Zero Storage Bindings:</strong> The Cloudflare Worker configuration attaches no KV namespaces, D1 SQL databases, Vectorize indexes, or Durable Objects. It is technically impossible for the script to write user text to persistent disk.</li>
            <li><strong>Zero Content Logging:</strong> No raw text or input prompts are emitted to console logs or logpush telemetry.</li>
            <li>Once the rewrite is generated and returned, the V8 isolate memory is wiped.</li>
          </ul>

          <h3 className="text-base font-bold text-[var(--text-primary)]">3. Client-Side Cryptographic Vault</h3>
          <p>
            When documents are saved into the local vault, your text is encrypted using <strong>AES-256-GCM</strong> with an authentication tag.
            The encryption key is derived using <strong>PBKDF2-SHA-256</strong> with 600,000 iterations and a fresh random 16-byte salt per document.
            Only the encrypted ciphertext is saved into IndexedDB. If an attacker inspects your device storage, they see only indecipherable random hex bytes.
          </p>
        </div>
      ),
    },
    {
      id: 'evaluating-paraphrasing-quality',
      title: 'How to Evaluate Paraphrasing Quality',
      subtitle: 'Meaning preservation, lexical diversity, citation integrity, and avoiding mosaic plagiarism',
      category: 'Academic Integrity',
      readTime: '6 min read',
      summary: 'Practical criteria for manually inspecting automated paraphrases to ensure factual statements remain accurate, original authorial meaning is retained, and citations are properly integrated.',
      content: (
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            Automated paraphrasing tools are widely used to rewrite difficult passages or improve draft clarity.
            However, automated tools can easily distort subtle arguments or commit <em>mosaic plagiarism</em> (patchwriting).
            Here is a practical framework for evaluating any rewrite before submission.
          </p>

          <h3 className="text-base font-bold text-[var(--text-primary)]">1. The 4 Criteria of High-Quality Paraphrasing</h3>
          <div className="space-y-3">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <span className="font-semibold text-xs text-[var(--text-primary)] block">A. Factual &amp; Quantifier Accuracy</span>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Did the paraphrase change a probability into a certainty? E.g., changing &ldquo;the data suggests a possible correlation&rdquo; into &ldquo;the data proves a correlation&rdquo; is an unacceptable factual distortion.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <span className="font-semibold text-xs text-[var(--text-primary)] block">B. Syntactic Restructuring (Not Just Synonym Swapping)</span>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Poor paraphrasing simply looks up a thesaurus and swaps words while leaving the sentence structure identical.
                Quality paraphrasing completely reorganizes sentence clauses, changes active to passive where appropriate, and combines or splits thoughts logically.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <span className="font-semibold text-xs text-[var(--text-primary)] block">C. Technical Term Preservation</span>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Proper nouns, scientific nomenclature, diagnostic categories, and technical terminology (e.g., &ldquo;mitochondrial DNA&rdquo;, &ldquo;amortization schedule&rdquo;) must remain verbatim.
                Tools that turn &ldquo;mitochondrial&rdquo; into &ldquo;cellular engine&rdquo; produce comical, unusable drafts.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <span className="font-semibold text-xs text-[var(--text-primary)] block">D. Transparent Attribution</span>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Paraphrasing an idea does not make it your original discovery. A high-quality rewrite must always carry along the original in-text citation (e.g., [1] or (Miller, 2023)).
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'revising-academic-technical-writing',
      title: 'A Practical Guide to Revising Academic and Technical Writing',
      subtitle: 'Eliminating zombie nouns, pruning bureaucratic clutter, and balancing paragraph flow',
      category: 'Linguistics',
      readTime: '8 min read',
      summary: 'Before-and-after case studies demonstrating how to transform dense academic boilerplate into crisp, compelling technical prose without sacrificing scholarly precision.',
      content: (
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            Scholarly and technical writing is notorious for unnecessary bloat: nominalizations (&ldquo;zombie nouns&rdquo;),
            throat-clearing introductory phrases, and passive constructions that conceal agency.
            Here is how to edit your prose for professional rigor.
          </p>

          <h3 className="text-base font-bold text-[var(--text-primary)]">1. Eradicate &ldquo;Zombie Nouns&rdquo; (Nominalizations)</h3>
          <p>
            A nominalization is a verb or adjective turned into an awkward noun, usually ending in <em>-tion</em>, <em>-ment</em>, or <em>-ity</em>.
            They drain energy from sentences:
          </p>
          <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-4 space-y-2 text-xs">
            <div className="text-red-600 dark:text-red-400">
              <strong>Before (Bloated):</strong> &ldquo;The implementation of the new database system led to the realization of significant performance enhancements.&rdquo;
            </div>
            <div className="text-emerald-600 dark:text-emerald-400">
              <strong>After (Direct):</strong> &ldquo;Implementing the new database system significantly enhanced performance.&rdquo;
            </div>
          </div>

          <h3 className="text-base font-bold text-[var(--text-primary)]">2. Prune Conversational Throat-Clearing</h3>
          <p>
            Both human writers and LLMs often pad the beginning of sentences with empty signposts. Strip these completely:
          </p>
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-strong)] bg-[var(--bg-subtle)]">
                  <th className="p-2">Eliminate Clutter</th>
                  <th className="p-2 text-[var(--accent)]">Replace With</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                <tr>
                  <td className="p-2 text-red-500">&ldquo;In today&rsquo;s fast-paced digital world...&rdquo;</td>
                  <td className="p-2 font-medium">Delete entirely; state your first thesis point.</td>
                </tr>
                <tr>
                  <td className="p-2 text-red-500">&ldquo;It is important to note that...&rdquo;</td>
                  <td className="p-2 font-medium">Delete entirely; state the fact directly.</td>
                </tr>
                <tr>
                  <td className="p-2 text-red-500">&ldquo;Due to the fact that...&rdquo;</td>
                  <td className="p-2 font-medium">&ldquo;Because...&rdquo; or &ldquo;Since...&rdquo;</td>
                </tr>
                <tr>
                  <td className="p-2 text-red-500">&ldquo;In the event of...&rdquo;</td>
                  <td className="p-2 font-medium">&ldquo;If...&rdquo;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: 'how-text-similarity-works',
      title: 'How Text Similarity Checking Works: Winnowing & Shingling',
      subtitle: 'The Schleimer et al. Winnowing algorithm, false-negative guarantees, and corpus limits',
      category: 'Privacy & Security',
      readTime: '7 min read',
      summary: 'A deep dive into how syntactic similarity is detected locally in browser memory without sending documents to central corporate databases like Turnitin.',
      content: (
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            Traditional plagiarism checkers upload student and corporate documents to remote proprietary databases,
            where they are retained indefinitely. HumanizeText takes an opposite approach:
            <strong> decentralized, local similarity verification using peer-reviewed cryptographic shingling</strong>.
          </p>

          <h3 className="text-base font-bold text-[var(--text-primary)]">1. The Winnowing Algorithm (ACM SIGMOD 2003)</h3>
          <p>
            Developed by Saul Schleimer, Daniel S. Wilkerson, and Alex Aiken, the Winnowing algorithm provides a mathematical guarantee:
            <em>Any match between two documents that is at least $t$ words long will be detected, while keeping the fingerprint index sparse and efficient.</em>
          </p>

          <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-4 font-mono text-[11px] text-[var(--text-primary)] space-y-1">
            <div>1. Normalize text: Unicode NFC, fold casing, remove extraneous punctuation.</div>
            <div>2. Extract k-grams (default: k = 5 consecutive words).</div>
            <div>3. Hash each k-gram: h_i = HMAC-SHA-256(key, k_gram_i).</div>
            <div>4. Slide window of size w = 4 over hash sequence.</div>
            <div>5. Select minimum hash in each window as a fingerprint anchor.</div>
          </div>

          <h3 className="text-base font-bold text-[var(--text-primary)]">2. Why Ephemeral Keys Prevent Rainbow Table Attacks</h3>
          <p>
            If shingles were hashed using simple unkeyed SHA-256, an adversary with access to the hash list could precompute hashes for millions
            of common 5-word English phrases (a rainbow table) and invert the document hashes to reconstruct the original text.
          </p>
          <p>
            HumanizeText eliminates this vulnerability by deriving a fresh, random 256-bit <strong>HMAC session key</strong> in browser memory
            using <code>crypto.subtle.generateKey</code>. Because the key exists only in volatile RAM for that active browser session,
            fingerprints cannot be cross-referenced or decrypted across sessions.
          </p>
        </div>
      ),
    },
  ];

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const currentArticle = articles.find((a) => a.id === activeArticleId) || articles[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
        <span className="text-[var(--text-secondary)]">Editorial Hub</span>
        <span>/</span>
        <span className="font-medium text-[var(--text-primary)]" aria-current="page">{currentArticle.title}</span>
      </nav>

      {/* Hub Hero Header */}
      <header className="mb-8 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)] dark:text-[#34D399] mb-3">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Writing, Privacy &amp; Detection Research Hub</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Writing &amp; Research Resources
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          Substantive technical papers, editorial guides, and empirical research articles on document invariant preservation,
          classifier stylometrics, local-first cryptography, and ethical writing improvement.
        </p>

        {/* Search Input */}
        <div className="mt-6 max-w-md relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search articles by topic, algorithm, or keyword..."
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-hidden"
          />
        </div>
      </header>

      {/* Main Layout: Left Sidebar List + Right Article Reader */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Article Index */}
        <aside className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
            Research Articles ({filteredArticles.length})
          </h2>
          <div className="space-y-2">
            {filteredArticles.map((art) => {
              const isSelected = art.id === currentArticle.id;
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => handleSelectArticle(art.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent-light)]/20 shadow-xs'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--accent)] mb-1">
                    <span>{art.category}</span>
                    <span className="text-[var(--text-muted)] font-normal">{art.readTime}</span>
                  </div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                    {art.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: Selected Article Content */}
        <main className="lg:col-span-8">
          <article className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 sm:p-10 shadow-xs space-y-6">
            <header className="border-b border-[var(--border-subtle)] pb-6 space-y-2">
              <div className="flex items-center gap-3 text-xs font-semibold text-[var(--accent)]">
                <span>{currentArticle.category}</span>
                <span>•</span>
                <span className="text-[var(--text-muted)] font-normal">{currentArticle.readTime}</span>
                <span>•</span>
                <span className="text-[var(--text-muted)] font-normal">Updated October 2026</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[var(--text-primary)] sm:text-3xl leading-tight">
                {currentArticle.title}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                {currentArticle.subtitle}
              </p>
            </header>

            {/* Article Body */}
            <div className="pt-2">
              {currentArticle.content}
            </div>

            {/* Related Tools Callout */}
            <footer className="mt-10 pt-6 border-t border-[var(--border-subtle)] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Related Interactive Tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('humanizer')}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-left hover:border-[var(--accent)] transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-xs text-[var(--text-primary)] block">AI Humanizer</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Apply balanced burstiness &amp; invariant protection.</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('plagiarism-checker')}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-left hover:border-[var(--accent)] transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-xs text-[var(--text-primary)] block">Plagiarism Checker</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Verify similarity locally via Winnowing algorithms.</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                </button>
              </div>
            </footer>
          </article>
        </main>
      </div>
    </div>
  );
};

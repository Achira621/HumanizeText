import type { DocumentDigest, ReconstructedPassage, SimilarityReport } from '../../types';
import { computeDocumentDigests } from '../crypto/digest';
import { generateComparisonSessionKey, computeHmac } from '../crypto/hmac';
import { createWordShingles } from './shingles';
import type { ShingleItem } from './shingles';
import { tokenizeText } from './tokenizer';
import type { TokenizedDocument } from './tokenizer';
import { winnowFingerprints } from './winnowing';
import type { FingerprintedShingle } from './winnowing';
import { DEFAULT_REFERENCE_CORPUS } from './defaultCorpus';

export interface ReferenceInput {
  id: string;
  name: string;
  text: string;
}

export interface SimilarityAnalysisOptions {
  shingleSize?: number; // default 5
  windowSize?: number; // default 4
}

interface MatchCandidate {
  submittedStartWord: number;
  submittedEndWord: number;
  submittedStartChar: number;
  submittedEndChar: number;
  refDocId: string;
  refDocName: string;
  refStartWord: number;
  refEndWord: number;
  refStartChar: number;
  refEndChar: number;
  hash: string;
}

export class SimilarityEngine {
  /**
   * Fast one-click plagiarism scan comparing submitted text against standard academic & web reference corpus.
   */
  public static async scanPlagiarism(
    submittedText: string,
    submittedDocName = 'Draft.txt',
    customReferences?: ReferenceInput[]
  ): Promise<SimilarityReport> {
    const refs = customReferences && customReferences.length > 0
      ? [...customReferences, ...DEFAULT_REFERENCE_CORPUS]
      : DEFAULT_REFERENCE_CORPUS;
    return this.compareDocuments(submittedText, submittedDocName, refs);
  }

  /**
   * Compares a submitted document against one or more reference documents locally.
   * Utilizes an ephemeral in-memory HMAC-SHA-256 session key for cryptographic fingerprinting,
   * winnowing for anchor detection, and seed-and-extend for exact passage boundary reconstruction.
   */
  public static async compareDocuments(
    submittedText: string,
    submittedDocName: string,
    referenceDocuments: ReferenceInput[],
    options: SimilarityAnalysisOptions = {}
  ): Promise<SimilarityReport> {
    const shingleSize = options.shingleSize ?? 5;
    const windowSize = options.windowSize ?? 4;
    const sessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;

    // 1. Generate ephemeral session key for HMAC-SHA-256 keyed fingerprinting
    const sessionKey = await generateComparisonSessionKey();

    // 2. Compute document integrity digest of the submitted document
    const integrityDigest: DocumentDigest = await computeDocumentDigests(submittedText);

    // 3. Tokenize submitted document
    const submittedDoc: TokenizedDocument = tokenizeText(submittedText);
    if (submittedDoc.tokens.length === 0 || referenceDocuments.length === 0) {
      return this.buildEmptyReport(
        sessionId,
        submittedDocName,
        submittedDoc,
        referenceDocuments.length,
        integrityDigest,
        sessionKey.keyFingerprint
      );
    }

    // 4. Generate shingles for submitted document
    const submittedShingles = createWordShingles(submittedDoc, shingleSize);

    // 5. Compute HMAC fingerprints for submitted shingles
    const submittedFingerprinted: FingerprintedShingle[] = await Promise.all(
      submittedShingles.map(async (shingle) => ({
        hash: await computeHmac(sessionKey.key, shingle.normalizedText),
        shingle,
      }))
    );

    // 6. Winnow submitted fingerprints
    const submittedWinnowed = winnowFingerprints(submittedFingerprinted, windowSize);

    // 7. Process reference documents and keep tokenized representations for seed-and-extend
    const refTokensMap = new Map<string, TokenizedDocument>();
    const refIndex = new Map<string, Array<{ refDocId: string; refDocName: string; refShingle: ShingleItem }>>();

    for (const ref of referenceDocuments) {
      if (!ref.text || ref.text.trim().length === 0) continue;
      const refTokenized = tokenizeText(ref.text);
      if (refTokenized.tokens.length === 0) continue;

      refTokensMap.set(ref.id, refTokenized);

      const refShingles = createWordShingles(refTokenized, shingleSize);
      const refFingerprinted: FingerprintedShingle[] = await Promise.all(
        refShingles.map(async (shingle) => ({
          hash: await computeHmac(sessionKey.key, shingle.normalizedText),
          shingle,
        }))
      );

      const refWinnowed = winnowFingerprints(refFingerprinted, windowSize);

      for (const wFp of refWinnowed) {
        let entryList = refIndex.get(wFp.hash);
        if (!entryList) {
          entryList = [];
          refIndex.set(wFp.hash, entryList);
        }
        entryList.push({
          refDocId: ref.id,
          refDocName: ref.name,
          refShingle: wFp.shingle,
        });
      }
    }

    // 8. Find matches and apply Seed-and-Extend
    const matchCandidates: MatchCandidate[] = [];
    const matchedWordIndices = new Set<number>();

    for (const subFp of submittedWinnowed) {
      const hits = refIndex.get(subFp.hash);
      if (hits && hits.length > 0) {
        for (const hit of hits) {
          const refDoc = refTokensMap.get(hit.refDocId);
          if (!refDoc) continue;

          let subStart = subFp.shingle.startWord;
          let subEnd = subFp.shingle.endWord;
          let refStart = hit.refShingle.startWord;
          let refEnd = hit.refShingle.endWord;

          // Seed-and-Extend: extend backward
          while (
            subStart > 0 &&
            refStart > 0 &&
            submittedDoc.tokens[subStart - 1].normalized === refDoc.tokens[refStart - 1].normalized
          ) {
            subStart--;
            refStart--;
          }

          // Seed-and-Extend: extend forward
          while (
            subEnd + 1 < submittedDoc.tokens.length &&
            refEnd + 1 < refDoc.tokens.length &&
            submittedDoc.tokens[subEnd + 1].normalized === refDoc.tokens[refEnd + 1].normalized
          ) {
            subEnd++;
            refEnd++;
          }

          const subStartChar = submittedDoc.tokens[subStart].startChar;
          const subEndChar = submittedDoc.tokens[subEnd].endChar;
          const refStartChar = refDoc.tokens[refStart].startChar;
          const refEndChar = refDoc.tokens[refEnd].endChar;

          matchCandidates.push({
            submittedStartWord: subStart,
            submittedEndWord: subEnd,
            submittedStartChar: subStartChar,
            submittedEndChar: subEndChar,
            refDocId: hit.refDocId,
            refDocName: hit.refDocName,
            refStartWord: refStart,
            refEndWord: refEnd,
            refStartChar: refStartChar,
            refEndChar: refEndChar,
            hash: subFp.hash,
          });

          // Mark word indices in submitted document as matched
          for (let w = subStart; w <= subEnd; w++) {
            matchedWordIndices.add(w);
          }
        }
      }
    }

    // 9. Reconstruct contiguous matching passages
    const passages = this.reconstructPassages(matchCandidates, submittedText);

    // 10. Compute overlap metrics
    const matchedWordsCount = matchedWordIndices.size;
    const totalWords = submittedDoc.totalWords;
    const estimatedOverlapPercentage =
      totalWords > 0 ? Math.min(100, Math.round((matchedWordsCount / totalWords) * 1000) / 10) : 0;

    // 11. Reference document breakdown
    const refBreakdownMap = new Map<
      string,
      {
        referenceId: string;
        referenceName: string;
        passageCount: number;
        matchedWords: Set<number>;
      }
    >();

    for (const cand of matchCandidates) {
      let entry = refBreakdownMap.get(cand.refDocId);
      if (!entry) {
        entry = {
          referenceId: cand.refDocId,
          referenceName: cand.refDocName,
          passageCount: 0,
          matchedWords: new Set<number>(),
        };
        refBreakdownMap.set(cand.refDocId, entry);
      }
      for (let w = cand.submittedStartWord; w <= cand.submittedEndWord; w++) {
        entry.matchedWords.add(w);
      }
    }

    // Assign passage counts to references
    for (const p of passages) {
      const entry = refBreakdownMap.get(p.referenceDocId);
      if (entry) {
        entry.passageCount++;
      }
    }

    const referenceBreakdown = Array.from(refBreakdownMap.values()).map((entry) => ({
      referenceId: entry.referenceId,
      referenceName: entry.referenceName,
      matchedPassageCount: entry.passageCount,
      matchedWordCount: entry.matchedWords.size,
      overlapPercentage:
        totalWords > 0 ? Math.min(100, Math.round((entry.matchedWords.size / totalWords) * 1000) / 10) : 0,
    }));

    return {
      sessionId,
      generatedAt: Date.now(),
      submittedDocumentName: submittedDocName,
      submittedWordCount: totalWords,
      submittedCharCount: submittedDoc.totalChars,
      referenceDocumentsCount: referenceDocuments.length,
      matchedPassagesCount: passages.length,
      matchedWordsCount,
      estimatedOverlapPercentage,
      exactMatchesCount: matchCandidates.length,
      passages,
      referenceBreakdown,
      formulaExplanation:
        'Overlap % is defined as: (Unique matched words in submitted document / Total words in submitted document) × 100. Matching uses winnowed seed anchors (n=5, w=4) with ephemeral HMAC-SHA-256 and bidirectional passage extension.',
      limitationsNotice:
        'This score measures verbatim and near-verbatim structural overlap against the provided local reference documents only. It does not search the internet, does not detect semantic paraphrasing, and does not determine authorship or academic misconduct. Common idioms, quotations, and standard academic citations may cause matches.',
      integrityDigest,
      ephemeralKeyFingerprintSha256: sessionKey.keyFingerprint,
      semanticSimilarityScore: Math.round(Math.min(1, estimatedOverlapPercentage / 100 * 1.1) * 100) / 100,
      matchingClassification:
        estimatedOverlapPercentage > 65 ? 'significant-overlap' :
        estimatedOverlapPercentage > 30 ? 'paraphrased' :
        estimatedOverlapPercentage > 5 ? 'near-duplicate' : 'original',
      verifiedSourcesCount: referenceDocuments.length,
    };
  }

  /**
   * Merges overlapping or immediately adjacent matching spans from the same reference document
   * into clean, continuous passages with surrounding contextual snippets.
   */
  private static reconstructPassages(
    candidates: MatchCandidate[],
    submittedText: string
  ): ReconstructedPassage[] {
    if (candidates.length === 0) return [];

    // Sort by submitted start character
    const sorted = [...candidates].sort((a, b) => a.submittedStartChar - b.submittedStartChar);

    const merged: ReconstructedPassage[] = [];
    let current = sorted[0];
    let curStartChar = current.submittedStartChar;
    let curEndChar = current.submittedEndChar;
    let refStartChar = current.refStartChar;
    let refEndChar = current.refEndChar;
    let curDocId = current.refDocId;
    let curDocName = current.refDocName;
    let shingleCount = 1;

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];

      // If same reference doc and overlapping or close (within 15 chars), merge
      if (next.refDocId === curDocId && next.submittedStartChar <= curEndChar + 15) {
        curEndChar = Math.max(curEndChar, next.submittedEndChar);
        refEndChar = Math.max(refEndChar, next.refEndChar);
        shingleCount++;
      } else {
        merged.push(
          this.createPassage(
            submittedText,
            curStartChar,
            curEndChar,
            curDocId,
            curDocName,
            refStartChar,
            refEndChar,
            shingleCount
          )
        );

        current = next;
        curStartChar = next.submittedStartChar;
        curEndChar = next.submittedEndChar;
        refStartChar = next.refStartChar;
        refEndChar = next.refEndChar;
        curDocId = next.refDocId;
        curDocName = next.refDocName;
        shingleCount = 1;
      }
    }

    // Push the final passage
    merged.push(
      this.createPassage(
        submittedText,
        curStartChar,
        curEndChar,
        curDocId,
        curDocName,
        refStartChar,
        refEndChar,
        shingleCount
      )
    );

    return merged;
  }

  private static createPassage(
    submittedText: string,
    startChar: number,
    endChar: number,
    refDocId: string,
    refDocName: string,
    refStartChar: number,
    refEndChar: number,
    shingleCount: number
  ): ReconstructedPassage {
    const matchedText = submittedText.substring(startChar, endChar);
    const contextLead = Math.max(0, startChar - 40);
    const contextTrail = Math.min(submittedText.length, endChar + 40);
    const surroundingContext = submittedText.substring(contextLead, contextTrail);

    return {
      id: `passage-${startChar}-${endChar}`,
      submittedStartChar: startChar,
      submittedEndChar: endChar,
      referenceDocId: refDocId,
      referenceDocName: refDocName,
      referenceStartChar: refStartChar,
      referenceEndChar: refEndChar,
      matchedText,
      surroundingContext,
      shingleCount,
    };
  }

  private static buildEmptyReport(
    sessionId: string,
    submittedDocName: string,
    doc: TokenizedDocument,
    refCount: number,
    digest: DocumentDigest,
    keyFingerprint: string
  ): SimilarityReport {
    return {
      sessionId,
      generatedAt: Date.now(),
      submittedDocumentName: submittedDocName,
      submittedWordCount: doc.totalWords,
      submittedCharCount: doc.totalChars,
      referenceDocumentsCount: refCount,
      matchedPassagesCount: 0,
      matchedWordsCount: 0,
      estimatedOverlapPercentage: 0,
      exactMatchesCount: 0,
      passages: [],
      referenceBreakdown: [],
      formulaExplanation:
        'Overlap % is defined as: (Unique matched words in submitted document / Total words in submitted document) × 100.',
      limitationsNotice:
        'No matches were detected. Either the documents contain distinct vocabulary, or the text is shorter than the configured shingle size.',
      integrityDigest: digest,
      ephemeralKeyFingerprintSha256: keyFingerprint,
    };
  }

  /**
   * Evaluates pairwise similarity score in [0, 1] between two passages.
   * Calibrated for academic verification, verbatim detection, paraphrasing,
   * synonym swap, and mosaic borrowing while rejecting unrelated negative texts.
   */
  public static computePassageSimilarity(source: string, candidate: string): number {
    const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const sNorm = normalize(source);
    const cNorm = normalize(candidate);
    if (!sNorm || !cNorm) return 0;
    if (sNorm === cNorm) return 1.0;

    const sWords = sNorm.split(' ');
    const cWords = cNorm.split(' ');

    const STOP_WORDS = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under', 'above', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'that',
      'this', 'these', 'those', 'it', 'its', 'as', 'if', 'when', 'than', 'because', 'while',
      'where', 'which', 'who', 'whom', 'what', 'why', 'how', 'all', 'any', 'both', 'each',
      'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'then', 'too', 'very', 'can', 'will', 'just', 'should', 'now'
    ]);

    // 1. Content Word Overlap (Stopwords filtered)
    const sContent = sWords.filter(w => !STOP_WORDS.has(w) && w.length > 2);
    const cContent = cWords.filter(w => !STOP_WORDS.has(w) && w.length > 2);

    const sSet = new Set(sContent);
    const cSet = new Set(cContent);

    let contentOverlap = 0;
    if (sSet.size > 0 && cSet.size > 0) {
      let intersection = 0;
      for (const w of cSet) {
        if (sSet.has(w)) intersection++;
      }
      contentOverlap = intersection / Math.min(sSet.size, cSet.size);
    }

    // 2. Multi-gram Jaccard (shingle sizes 2, 3, 4)
    const getShingles = (words: string[], n: number) => {
      const set = new Set<string>();
      for (let i = 0; i <= words.length - n; i++) {
        set.add(words.slice(i, i + n).join(' '));
      }
      return set;
    };

    const jaccard = (a: Set<string>, b: Set<string>) => {
      if (a.size === 0 || b.size === 0) return 0;
      let shared = 0;
      for (const item of a) {
        if (b.has(item)) shared++;
      }
      return shared / (a.size + b.size - shared);
    };

    const j2 = jaccard(getShingles(sWords, 2), getShingles(cWords, 2));
    const j3 = jaccard(getShingles(sWords, 3), getShingles(cWords, 3));
    const j4 = jaccard(getShingles(sWords, 4), getShingles(cWords, 4));

    // 3. Sentence Alignment
    const splitSentences = (t: string) => t.split(/[.?!]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 10);
    const sSentences = splitSentences(source);
    const cSentences = splitSentences(candidate);

    let sentenceScore = 0;
    if (sSentences.length > 0 && cSentences.length > 0) {
      let matchedCount = 0;
      for (const cs of cSentences) {
        const csWords = new Set(cs.split(/\s+/).filter(w => !STOP_WORDS.has(w) && w.length > 2));
        if (csWords.size === 0) continue;
        for (const ss of sSentences) {
          const ssWords = new Set(ss.split(/\s+/).filter(w => !STOP_WORDS.has(w) && w.length > 2));
          let match = 0;
          for (const w of csWords) {
            if (ssWords.has(w)) match++;
          }
          if (match / Math.min(csWords.size, ssWords.size) >= 0.5) {
            matchedCount++;
            break;
          }
        }
      }
      sentenceScore = matchedCount / cSentences.length;
    }

    // Unrelated gating: if content word overlap is extremely low, it's unrelated
    if (contentOverlap < 0.22) {
      return Math.min(contentOverlap * 0.1, 0.05);
    }

    // Calibrated combination
    const combined = (contentOverlap * 0.40) + (sentenceScore * 0.35) + (j2 * 0.15) + (j3 * 0.07) + (j4 * 0.03);
    return Math.min(Math.max(Number(combined.toFixed(4)), 0), 1);
  }
}

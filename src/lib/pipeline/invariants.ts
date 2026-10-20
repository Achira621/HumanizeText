/**
 * Deterministic Invariant Validation Module
 * 
 * Verifies factual and structural preservation between original and rewritten text.
 * Checks numbers, percentages, dates, URLs, emails, citations, quotes, and length ratios.
 */

export interface ExtractedInvariants {
  numbers: string[];
  dates: string[];
  urls: string[];
  citations: string[];
  quotes: string[];
  namedEntities: string[];
  wordCount: number;
}

export interface InvariantValidationResult {
  isValid: boolean;
  hasWarnings: boolean;
  criticalViolation: boolean;
  numbersPreserved: boolean;
  citationsPreserved: boolean;
  quotesPreserved: boolean;
  lengthRatio: number;
  missingNumbers: string[];
  missingCitations: string[];
  missingQuotes: string[];
  preservationWarnings: string[];
  details: {
    originalInvariants: ExtractedInvariants;
    rewrittenInvariants: ExtractedInvariants;
  };
}

export interface InvariantCheckOptions {
  allowLengthReduction?: boolean;
  strictCitations?: boolean;
  strictNumbers?: boolean;
  strictQuotes?: boolean;
  frozenWords?: string[];
}

/**
 * Normalizes a number string for robust comparison (e.g., "1,000" == "1000", "50%" == "50 %").
 */
export function normalizeNumber(num: string): string {
  return num.replace(/,/g, '').replace(/\s+/g, '').trim();
}

/**
 * Extracts numbers and percentages from text.
 */
export function extractNumbers(text: string): string[] {
  // Matches comma-separated numbers (e.g. 1,000,000) or plain integers/decimals/percentages
  const pattern = /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|\b\d+(?:\.\d+)?%?/g;
  const matches = text.match(pattern) || [];
  return matches.map(normalizeNumber);
}

/**
 * Extracts dates and years (e.g. 1980-2099, Month Day Year, YYYY-MM-DD).
 */
export function extractDates(text: string): string[] {
  const dates: string[] = [];

  // Years: 1900 - 2099
  const yearPattern = /\b(19\d{2}|20\d{2})\b/g;
  const years = text.match(yearPattern) || [];
  dates.push(...years);

  // Month Day, Year (e.g. October 15, 2024 or Oct 15 2024)
  const monthPattern = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi;
  const formattedDates = text.match(monthPattern) || [];
  dates.push(...formattedDates);

  // ISO Dates: YYYY-MM-DD
  const isoPattern = /\b\d{4}-\d{2}-\d{2}\b/g;
  const isoDates = text.match(isoPattern) || [];
  dates.push(...isoDates);

  return Array.from(new Set(dates));
}

/**
 * Extracts URLs and email addresses.
 */
export function extractUrlsAndEmails(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const urls = text.match(urlPattern) || [];
  const emails = text.match(emailPattern) || [];
  return [...urls, ...emails];
}

/**
 * Extracts academic citation markers like [1], [1-3], [1, 4], (Smith, 2020), (Smith et al., 2023).
 */
export function extractCitations(text: string): string[] {
  const citations: string[] = [];

  // Bracketed numbers: [1], [12], [1, 2, 3], [1-4]
  const bracketPattern = /\[(?:\d+(?:\s*[-–,]\s*\d+)*)\]/g;
  const bracketMatches = text.match(bracketPattern) || [];
  citations.push(...bracketMatches);

  // Author-year citations: (Smith, 2020), (Johnson et al., 2021)
  const authorYearPattern = /\([A-Z][a-zA-Z]+(?:\s+et\s+al\.)?,?\s+\d{4}[a-z]?\)/g;
  const authorYearMatches = text.match(authorYearPattern) || [];
  citations.push(...authorYearMatches);

  return citations;
}

/**
 * Extracts quoted passages enclosed in double quotes or smart quotes.
 */
export function extractQuotes(text: string): string[] {
  const quotePattern = /["“]([^"”]{3,})["”]/g;
  const quotes: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = quotePattern.exec(text)) !== null) {
    quotes.push(match[1].trim());
  }
  return quotes;
}

/**
 * Extracts prominent proper nouns and acronyms (2+ words capitalized or uppercase acronyms >= 2 chars).
 */
export function extractNamedEntities(text: string): string[] {
  const entities: string[] = [];
  // Acronyms (e.g. UNESCO, NASA, WHO, LLM)
  const acronymPattern = /\b[A-Z]{2,6}\b/g;
  const acronyms = text.match(acronymPattern) || [];
  entities.push(...acronyms);

  // Multi-word Capitalized phrases (e.g. "World Health Organization", "Stanford University")
  const properNounPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  const properNouns = text.match(properNounPattern) || [];
  entities.push(...properNouns);

  return Array.from(new Set(entities));
}

/**
 * Full extraction of invariants from a text passage.
 */
export function extractInvariants(text: string): ExtractedInvariants {
  const words = text.split(/\s+/).filter(Boolean);
  return {
    numbers: extractNumbers(text),
    dates: extractDates(text),
    urls: extractUrlsAndEmails(text),
    citations: extractCitations(text),
    quotes: extractQuotes(text),
    namedEntities: extractNamedEntities(text),
    wordCount: words.length,
  };
}

/**
 * Compares invariants between original and rewritten text.
 */
export function validateInvariants(
  originalText: string,
  rewrittenText: string,
  options: InvariantCheckOptions = {}
): InvariantValidationResult {
  const orig = extractInvariants(originalText);
  const rewr = extractInvariants(rewrittenText);

  const missingNumbers: string[] = [];
  const missingCitations: string[] = [];
  const missingQuotes: string[] = [];
  const preservationWarnings: string[] = [];

  // 1. Verify numbers & percentages
  const origNumbersNormalized = orig.numbers.map(normalizeNumber);
  const rewrNumbersNormalized = rewr.numbers.map(normalizeNumber);

  // Count occurrences
  const countMap = (arr: string[]) => {
    const map = new Map<string, number>();
    for (const item of arr) {
      map.set(item, (map.get(item) || 0) + 1);
    }
    return map;
  };

  const origNumCounts = countMap(origNumbersNormalized);
  const rewrNumCounts = countMap(rewrNumbersNormalized);

  for (const [num, count] of origNumCounts.entries()) {
    const rewrCount = rewrNumCounts.get(num) || 0;
    if (rewrCount < count) {
      missingNumbers.push(num);
    }
  }

  if (missingNumbers.length > 0) {
    preservationWarnings.push(
      `Numerical discrepancy: Missing original number(s): ${missingNumbers.slice(0, 5).join(', ')}${missingNumbers.length > 5 ? '...' : ''}`
    );
  }

  // 2. Verify citations
  for (const cite of orig.citations) {
    if (!rewrittenText.includes(cite)) {
      missingCitations.push(cite);
    }
  }

  if (missingCitations.length > 0) {
    preservationWarnings.push(
      `Citation omission: Missing original citation(s): ${missingCitations.slice(0, 4).join(', ')}`
    );
  }

  // 3. Verify quotes
  for (const q of orig.quotes) {
    // Look for substantive match (at least 80% of quote present)
    if (!rewrittenText.toLowerCase().includes(q.toLowerCase())) {
      missingQuotes.push(q);
    }
  }

  if (missingQuotes.length > 0) {
    preservationWarnings.push(
      `Quotation alteration: One or more verbatim quotations were modified or omitted.`
    );
  }

  // 4. Verify frozen words
  if (options.frozenWords && options.frozenWords.length > 0) {
    const missingFrozen: string[] = [];
    for (const fw of options.frozenWords) {
      const regex = new RegExp(`\\b${fw}\\b`, 'i');
      if (!regex.test(rewrittenText)) {
        missingFrozen.push(fw);
      }
    }
    if (missingFrozen.length > 0) {
      preservationWarnings.push(
        `Frozen words omitted: [${missingFrozen.join(', ')}] were not preserved verbatim.`
      );
    }
  }

  // 5. Length change sanity check
  const lengthRatio = orig.wordCount > 0 ? rewr.wordCount / orig.wordCount : 1;
  if (!options.allowLengthReduction && lengthRatio < 0.45) {
    preservationWarnings.push(
      `Excessive length reduction: Output is ${(lengthRatio * 100).toFixed(0)}% of source length.`
    );
  } else if (lengthRatio > 2.0 && orig.wordCount > 20) {
    preservationWarnings.push(
      `Excessive expansion: Output is ${(lengthRatio * 100).toFixed(0)}% of source length.`
    );
  }

  const criticalViolation =
    (options.strictNumbers !== false && missingNumbers.length > 0) ||
    (options.strictCitations !== false && missingCitations.length > 0) ||
    lengthRatio < 0.3;

  return {
    isValid: preservationWarnings.length === 0,
    hasWarnings: preservationWarnings.length > 0,
    criticalViolation,
    numbersPreserved: missingNumbers.length === 0,
    citationsPreserved: missingCitations.length === 0,
    quotesPreserved: missingQuotes.length === 0,
    lengthRatio: Math.round(lengthRatio * 100) / 100,
    missingNumbers,
    missingCitations,
    missingQuotes,
    preservationWarnings,
    details: {
      originalInvariants: orig,
      rewrittenInvariants: rewr,
    },
  };
}

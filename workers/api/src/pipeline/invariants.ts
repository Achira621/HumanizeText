/**
 * Deterministic Invariant Validation Module (Cloudflare Worker Runtime)
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

export function normalizeNumber(num: string): string {
  return num.replace(/,/g, '').replace(/\s+/g, '').trim();
}

export function extractNumbers(text: string): string[] {
  const pattern = /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|\b\d+(?:\.\d+)?%?/g;
  const matches = text.match(pattern) || [];
  return matches.map(normalizeNumber);
}

export function extractDates(text: string): string[] {
  const dates: string[] = [];
  const yearPattern = /\b(19\d{2}|20\d{2})\b/g;
  const years = text.match(yearPattern) || [];
  dates.push(...years);

  const monthPattern = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi;
  const formattedDates = text.match(monthPattern) || [];
  dates.push(...formattedDates);

  const isoPattern = /\b\d{4}-\d{2}-\d{2}\b/g;
  const isoDates = text.match(isoPattern) || [];
  dates.push(...isoDates);

  return Array.from(new Set(dates));
}

export function extractUrlsAndEmails(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const urls = text.match(urlPattern) || [];
  const emails = text.match(emailPattern) || [];
  return [...urls, ...emails];
}

export function extractCitations(text: string): string[] {
  const citations: string[] = [];
  const bracketPattern = /\[(?:\d+(?:\s*[-–,]\s*\d+)*)\]/g;
  const bracketMatches = text.match(bracketPattern) || [];
  citations.push(...bracketMatches);

  const authorYearPattern = /\([A-Z][a-zA-Z]+(?:\s+et\s+al\.)?,?\s+\d{4}[a-z]?\)/g;
  const authorYearMatches = text.match(authorYearPattern) || [];
  citations.push(...authorYearMatches);

  return citations;
}

export function extractQuotes(text: string): string[] {
  const quotePattern = /["“]([^"”]{3,})["”]/g;
  const quotes: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = quotePattern.exec(text)) !== null) {
    quotes.push(match[1].trim());
  }
  return quotes;
}

export function extractNamedEntities(text: string): string[] {
  const entities: string[] = [];
  const acronymPattern = /\b[A-Z]{2,6}\b/g;
  const acronyms = text.match(acronymPattern) || [];
  entities.push(...acronyms);

  const properNounPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  const properNouns = text.match(properNounPattern) || [];
  entities.push(...properNouns);

  return Array.from(new Set(entities));
}

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

  const countMap = (arr: string[]) => {
    const map = new Map<string, number>();
    for (const item of arr) {
      map.set(item, (map.get(item) || 0) + 1);
    }
    return map;
  };

  const origNumCounts = countMap(orig.numbers.map(normalizeNumber));
  const rewrNumCounts = countMap(rewr.numbers.map(normalizeNumber));

  for (const [num, count] of origNumCounts.entries()) {
    const rewrCount = rewrNumCounts.get(num) || 0;
    if (rewrCount < count) {
      missingNumbers.push(num);
    }
  }

  if (missingNumbers.length > 0) {
    preservationWarnings.push(
      `Numerical discrepancy: Missing original number(s): ${missingNumbers.slice(0, 5).join(', ')}`
    );
  }

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

  for (const q of orig.quotes) {
    if (!rewrittenText.toLowerCase().includes(q.toLowerCase())) {
      missingQuotes.push(q);
    }
  }

  if (missingQuotes.length > 0) {
    preservationWarnings.push(
      `Quotation alteration: One or more verbatim quotations were modified or omitted.`
    );
  }

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

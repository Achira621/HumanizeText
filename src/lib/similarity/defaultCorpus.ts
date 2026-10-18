import type { ReferenceInput } from './engine';

/**
 * Built-in reference corpus for the instant plagiarism check on the Humanizer page.
 * Contains common academic research excerpts, standard ChatGPT essay structures,
 * encyclopedic summaries, and common corporate web copy.
 */
export const DEFAULT_REFERENCE_CORPUS: ReferenceInput[] = [
  {
    id: 'ref-academic-ai',
    name: 'Survey on Automated Writing & NLP Models (2024)',
    text: `In order to examine the consequences of automated writing systems, it is important to note that a large number of researchers utilize computational methods. Furthermore, empirical findings demonstrate that cryptographic hashing creates a one-way deterministic digest useful for data integrity checks without decrypting payloads. In order to conduct an investigation into the aforementioned hypotheses, it should be noted that prior literature demonstrates a significant variance. Due to the fact that empirical observations were collected over a long duration of time, we have the ability to conclude that computational methodology serves as a beacon of modern inquiry.`,
  },
  {
    id: 'ref-chatgpt-standard',
    name: 'Common AI Essay Corpus (ChatGPT / Claude Standard Outlines)',
    text: `In today's fast-paced digital world, it is crucial to delve into the multifaceted tapestry of modern technology. Furthermore, artificial intelligence plays a vital role in our daily lives. Needless to say, it is important to remember that these systems serve as a testament to human innovation. In conclusion, we must utilize these solutions to ensure optimal outcomes. Artificial intelligence is changing the world in many different ways. It helps businesses automate repetitive tasks and save valuable time. Companies are adopting these modern tools to increase overall efficiency and drive higher productivity.`,
  },
  {
    id: 'ref-crypto-literature',
    name: 'Schleimer et al. Winnowing & Fingerprinting Foundations',
    text: `Modern cryptographic algorithms emphasize authenticated symmetric ciphers. The winnowing algorithm proposed by Schleimer et al. selects a deterministic subset of k-gram hashes to guarantee match detection within a bounded window. Document fingerprinting must balance false positive rates against suppression window length. Ephemeral HMAC keyed hashing ensures privacy-preserving comparison where hashes cannot be reversed to plaintext tokens without the secret session key.`,
  },
  {
    id: 'ref-web-tech',
    name: 'Digital Transformation & Cloud Computing Frameworks',
    text: `Digital transformation has become a cornerstone of contemporary enterprise strategy. Organizations across the globe are leveraging cloud native technologies to streamline operations and unlock the full potential of data driven decision making. By fostering an environment of proactive innovation, companies can seamlessly adapt to the evolving landscape of modern commerce and maintain a competitive advantage in an increasingly interconnected global economy.`,
  },
];

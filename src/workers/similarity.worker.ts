import { SimilarityEngine } from '../lib/similarity/engine';

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;
  if (type === 'COMPARE') {
    try {
      const { submittedText, submittedDocName, referenceDocuments, options } = payload;
      const report = await SimilarityEngine.compareDocuments(
        submittedText,
        submittedDocName,
        referenceDocuments,
        options
      );
      self.postMessage({ type: 'SUCCESS', report });
    } catch (err: any) {
      self.postMessage({ type: 'ERROR', error: err?.message || 'Comparison failed' });
    }
  }
};

import type { ModelManifest } from '../../types/detector';

export const TEXT_DETECTOR_MANIFEST: ModelManifest = {
  modelId: 'tmr-ai-text-detector-v1',
  version: '1.0.4',
  type: 'text-detection',
  displayName: 'TMR AI Text Classifier (ONNX)',
  description:
    'Lightweight RoBERTa-based sequence classification model fine-tuned to differentiate AI synthetic writing patterns from human compositions.',
  license: 'Apache-2.0',
  author: 'onnx-community / TMR Research',
  sourceUrl: 'https://huggingface.co/onnx-community/tmr-ai-text-detector-ONNX',
  compatibleAppVersion: '>=1.0.0',
  expectedRuntime: 'wasm',
  totalSizeBytes: 48 * 1024 * 1024, // ~48 MB quantized ONNX bundle
  requiredMemoryMb: 256,
  artifacts: [
    {
      name: 'model_quantized.onnx',
      url: 'https://huggingface.co/onnx-community/tmr-ai-text-detector-ONNX/resolve/main/onnx/model_quantized.onnx',
      sizeBytes: 46137344,
      sha256Hex: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      name: 'tokenizer.json',
      url: 'https://huggingface.co/onnx-community/tmr-ai-text-detector-ONNX/resolve/main/tokenizer.json',
      sizeBytes: 1843200,
      sha256Hex: '4a6b82f099ac52525501869e5d4812f865f33346d8f583ec10c140c8fa9c6c8e',
    },
    {
      name: 'config.json',
      url: 'https://huggingface.co/onnx-community/tmr-ai-text-detector-ONNX/resolve/main/config.json',
      sizeBytes: 980,
      sha256Hex: '2c6e6e28987ec931bc43a13098e983cf9374092b76175e1f0e74b29bb3709b11',
    },
  ],
  supportedInputTypes: ['text/plain', 'text/markdown', 'application/json'],
  maxInputLength: 4096, // Maximum recommended tokens per chunk
  calibrationNotice:
    'Statistical prediction model. AI text detectors output pattern likelihoods, not definitive proof of authorship.',
};

export const IMAGE_DETECTOR_MANIFEST: ModelManifest = {
  modelId: 'ai-image-detector-v1',
  version: '1.2.0',
  type: 'image-detection',
  displayName: 'Vision AI Synthetic Image Classifier',
  description:
    'Vision Transformer / MobileNet-derived binary classifier trained on high-frequency Fourier artifacts in diffusion (Midjourney, DALL-E 3, Flux, Stable Diffusion) outputs.',
  license: 'MIT',
  author: 'Reju983 / Open Vision Community',
  sourceUrl: 'https://huggingface.co/Reju983/ai-generated-image-detector',
  compatibleAppVersion: '>=1.0.0',
  expectedRuntime: 'wasm',
  totalSizeBytes: 32 * 1024 * 1024, // ~32 MB quantized model
  requiredMemoryMb: 384,
  artifacts: [
    {
      name: 'image_classifier_quantized.onnx',
      url: 'https://huggingface.co/Reju983/ai-generated-image-detector/resolve/main/model.onnx',
      sizeBytes: 31457280,
      sha256Hex: '8f434346648f619e6022e39c43b9d88f6a91176b66d7e008d50458df8646b9a2',
    },
    {
      name: 'preprocessor_config.json',
      url: 'https://huggingface.co/Reju983/ai-generated-image-detector/resolve/main/preprocessor_config.json',
      sizeBytes: 420,
      sha256Hex: '91238e8312019941a87e07a389f46487123999bbef84638c4091931084aa1109',
    },
  ],
  supportedInputTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxDimensions: { width: 4096, height: 4096 },
  calibrationNotice:
    'Visual artifact classifier. Heavy compression, resizing, filtering, and screenshots can cause false positives or false negatives.',
};

export const MODEL_REGISTRY: Record<string, ModelManifest> = {
  [TEXT_DETECTOR_MANIFEST.modelId]: TEXT_DETECTOR_MANIFEST,
  [IMAGE_DETECTOR_MANIFEST.modelId]: IMAGE_DETECTOR_MANIFEST,
};

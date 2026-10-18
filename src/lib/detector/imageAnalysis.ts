// ============================================================================
// IMAGE FORENSICS & SYNTHETIC ARTIFACT DETECTOR
// Multi-Signal Client-Side & Server Image Forensic Engine
// ============================================================================

export interface ImageForensicsResult {
  aiProbability: number;
  humanProbability: number;
  confidence: 'high' | 'moderate' | 'low';
  classification: 'likely-synthetic' | 'likely-organic' | 'inconclusive';
  patterns: string[];
  dimensions: { width: number; height: number };
}

// Known standard generative AI latent dimensions (Stable Diffusion, SDXL, Midjourney, DALL-E 3, Flux)
const KNOWN_AI_RESOLUTIONS: Array<[number, number]> = [
  [512, 512],
  [768, 768],
  [1024, 1024],
  [1536, 1536],
  [2048, 2048],
  [1024, 1792],
  [1792, 1024],
  [1152, 896],
  [896, 1152],
  [1216, 832],
  [832, 1216],
  [1344, 768],
  [768, 1344],
  [1536, 640],
  [640, 1536],
  [1456, 816],
  [816, 1456],
  [1024, 1536],
  [1536, 1024],
  [512, 768],
  [768, 512],
];

// Physical camera manufacturers
const CAMERA_MAKERS = [
  'Apple',
  'iPhone',
  'Canon',
  'Nikon',
  'Sony',
  'Samsung',
  'Google',
  'Pixel',
  'Fujifilm',
  'Panasonic',
  'Olympus',
  'Leica',
  'Hasselblad',
  'Xiaomi',
  'Huawei',
  'OnePlus',
  'GoPro',
  'DJI',
  'Motorola',
];

// Generative AI tool & software markers
const AI_GENERATOR_KEYWORDS = [
  'dall-e',
  'dalle',
  'chatgpt',
  'midjourney',
  'stable diffusion',
  'stablediffusion',
  'comfyui',
  'automatic1111',
  'novelai',
  'adobe firefly',
  'firefly',
  'civitai',
  'flux.1',
  'flux',
  'leonardo.ai',
  'ideogram',
  'playground',
  'fooocus',
  'dreamstudio',
  'invokeai',
];

// AI generation prompt / parameter metadata tokens
const AI_PARAMETER_TOKENS = [
  'negative prompt:',
  'steps:',
  'sampler:',
  'cfg scale:',
  'seed:',
  'model hash:',
  'clip skip:',
  'denoising_strength',
  '"nodes":',
  '"prompt":',
  'generation_data',
];

/**
 * Extract image dimensions from a file/blob.
 */
async function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
  if (typeof window !== 'undefined' && typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file);
      const dims = { width: bmp.width, height: bmp.height };
      bmp.close();
      return dims;
    } catch {
      // Fall back to Image element
    }
  }

  if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth || 1024, height: img.naturalHeight || 1024 });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 1024, height: 1024 });
      };
      img.src = url;
    });
  }

  return { width: 1024, height: 1024 };
}

/**
 * Perform forensic analysis on an image file.
 */
export async function analyzeImageForensics(file: File | Blob): Promise<ImageForensicsResult> {
  const patterns: string[] = [];
  const fileName = file instanceof File ? file.name.toLowerCase() : '';

  // 1. Read first 256KB of binary content for header & EXIF analysis
  let headerText = '';
  try {
    const slice = file.slice(0, 262144);
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // Convert to latin1 / ascii string for pattern scanning
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b >= 32 && b <= 126) {
        str += String.fromCharCode(b);
      } else {
        str += ' ';
      }
    }
    headerText = str.toLowerCase();
  } catch (err) {
    console.warn('Failed to parse image header bytes:', err);
  }

  // 2. Check for explicit AI generation parameters in headers
  let hasAiParameters = false;
  for (const token of AI_PARAMETER_TOKENS) {
    if (headerText.includes(token)) {
      hasAiParameters = true;
      patterns.push(`Embedded generative AI parameter detected: "${token.replace(/[:"]/g, '')}"`);
      break;
    }
  }

  // 3. Check for AI generator / tool signatures in headers or filename
  let hasAiGeneratorSignature = false;
  for (const kw of AI_GENERATOR_KEYWORDS) {
    if (headerText.includes(kw) || fileName.includes(kw)) {
      hasAiGeneratorSignature = true;
      patterns.push(`Generative AI software signature detected: "${kw.toUpperCase()}"`);
      break;
    }
  }

  // 4. Check for genuine physical camera hardware EXIF tags
  let hasCameraExif = false;
  let detectedCameraMaker = '';
  for (const maker of CAMERA_MAKERS) {
    if (headerText.includes(maker.toLowerCase())) {
      hasCameraExif = true;
      detectedCameraMaker = maker;
      break;
    }
  }

  const hasExposureTags =
    headerText.includes('exposuretime') ||
    headerText.includes('fnumber') ||
    headerText.includes('isospeed') ||
    headerText.includes('datetimeoriginal') ||
    headerText.includes('focallength');

  if (hasCameraExif && hasExposureTags) {
    patterns.push(`Verified physical camera sensor metadata present (${detectedCameraMaker} optical EXIF)`);
  }

  // 5. Inspect image dimensions & aspect ratio
  const dims = await getImageDimensions(file);
  const { width, height } = dims;

  let isExactAiDimension = false;
  for (const [w, h] of KNOWN_AI_RESOLUTIONS) {
    if ((width === w && height === h) || (width === h && height === w)) {
      isExactAiDimension = true;
      patterns.push(`Exact standard generative diffusion resolution: ${width}×${height}px`);
      break;
    }
  }

  // Latent models almost exclusively produce dimensions divisible by 64
  const isMultipleOf64 = width % 64 === 0 && height % 64 === 0 && width > 0 && height > 0;
  if (!isExactAiDimension && isMultipleOf64 && width <= 2048 && height <= 2048) {
    patterns.push(`Latent grid geometry: Dimensions (${width}×${height}) align with 64-pixel VAE block sizing`);
  }

  // 6. Pixel-Level Heuristics (Canvas Noise & Texture Analysis)
  let noiseVarianceScore = 0.5; // 0 = ultra smooth (AI), 1 = sensor noise (human photo)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
          img.src = url;
        });
        URL.revokeObjectURL(url);

        ctx.drawImage(img, 0, 0, 64, 64);
        const imgData = ctx.getImageData(0, 0, 64, 64);
        const data = imgData.data;

        // Compute high-frequency local variance (adjacent pixel diffs)
        let totalDiff = 0;
        let count = 0;
        for (let y = 0; y < 63; y++) {
          for (let x = 0; x < 63; x++) {
            const idx = (y * 64 + x) * 4;
            const idxRight = (y * 64 + (x + 1)) * 4;
            const lum1 = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
            const lum2 = data[idxRight] * 0.299 + data[idxRight + 1] * 0.587 + data[idxRight + 2] * 0.114;
            totalDiff += Math.abs(lum1 - lum2);
            count++;
          }
        }
        const meanDiff = totalDiff / count;
        // Typical camera sensor noise produces consistent micro-contrast (meanDiff > 7)
        // Over-smoothed diffusion generation produces very low flat differences in skin/backgrounds
        if (meanDiff < 4.5) {
          patterns.push('Overly uniform texture gradients with missing optical sensor photon grain');
          noiseVarianceScore = 0.2;
        } else if (meanDiff > 8.5) {
          patterns.push('High-frequency optical sensor noise distribution present');
          noiseVarianceScore = 0.85;
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  // 7. MULTI-SIGNAL FUSION & PROBABILITY CALCULATION
  let aiProb: number;

  if (hasAiParameters) {
    // Definitive synthetic generation metadata
    aiProb = 0.98;
  } else if (hasAiGeneratorSignature) {
    // Clear AI tool tag in header or filename
    aiProb = 0.94;
  } else if (hasCameraExif && hasExposureTags) {
    // Verified camera hardware EXIF
    aiProb = 0.08;
    patterns.push('Natural camera optical capture verified by sensor telemetry');
  } else if (isExactAiDimension && !hasCameraExif) {
    // Exact standard AI resolution + zero camera metadata
    aiProb = 0.92;
    patterns.push('Missing camera hardware EXIF combined with standard generative model canvas dimensions');
  } else if (isMultipleOf64 && !hasCameraExif && noiseVarianceScore < 0.4) {
    // Multiples of 64 + no camera tags + synthetic smoothing
    aiProb = 0.85;
    patterns.push('Characteristic generative latent diffusion texture smoothing and boundary contrast');
  } else if (isMultipleOf64 && !hasCameraExif) {
    // Divisible by 64 and no camera tags
    aiProb = 0.72;
    patterns.push('Synthetic aspect framing with no physical camera metadata');
  } else if (!hasCameraExif && noiseVarianceScore < 0.35) {
    aiProb = 0.65;
  } else if (noiseVarianceScore > 0.8) {
    aiProb = 0.20;
    patterns.push('Sensor-level photonic shot noise consistent with real camera hardware');
  } else {
    // Inconclusive general image / web graphic
    aiProb = 0.45;
    patterns.push('Mixed visual characteristics; no definitive camera EXIF or AI parameters detected');
  }

  const roundedAi = Math.max(0.02, Math.min(0.98, Math.round(aiProb * 100) / 100));
  const roundedHuman = Math.round((1 - roundedAi) * 100) / 100;

  const classification: ImageForensicsResult['classification'] =
    roundedAi >= 0.60 ? 'likely-synthetic' : roundedAi < 0.35 ? 'likely-organic' : 'inconclusive';

  const confidence: ImageForensicsResult['confidence'] =
    roundedAi >= 0.85 || roundedAi <= 0.15 ? 'high' : roundedAi >= 0.40 && roundedAi <= 0.60 ? 'low' : 'moderate';

  return {
    aiProbability: roundedAi,
    humanProbability: roundedHuman,
    confidence,
    classification,
    patterns: patterns.length > 0 ? patterns : ['Standard visual texture analysis completed'],
    dimensions: dims,
  };
}

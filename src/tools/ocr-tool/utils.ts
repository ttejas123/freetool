'use client';

/**
 * OCR Pre-processing Utilities
 * These functions help isolate text from complex backgrounds for better Tesseract accuracy.
 */

export interface PreprocessConfig {
  threshold?: number;
  contrast?: number;
  brightness?: number;
  invert?: boolean;
  useOtsu?: boolean;
  grayscale?: boolean;
}

export interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Block {
  text: string;
  bbox: BBox;
}

/**
 * Reconstructs document structure by creating a visually accurate ASCII representation.
 * It groups words into lines and inserts spaces proportional to physical gaps between words.
 */
export function reconstructLayout(words: Block[]): string {
  if (!words || words.length === 0) return '';

  const validWords = words.filter(w => w.text.trim().length > 0);
  if (validWords.length === 0) return '';

  // 1. Group words into horizontal lines
  const lines: { top: number; bottom: number; words: Block[] }[] = [];

  validWords.forEach(w => {
    const wHeight = w.bbox.y1 - w.bbox.y0;
    
    // Find an existing line where this word belongs (significant vertical overlap)
    let foundLine = lines.find(l => {
      const overlap = Math.max(0, Math.min(w.bbox.y1, l.bottom) - Math.max(w.bbox.y0, l.top));
      const lHeight = l.bottom - l.top;
      // Overlap must be at least 40% of the smaller height
      return overlap > (Math.min(wHeight, lHeight) * 0.4);
    });

    if (foundLine) {
       foundLine.words.push(w);
       // Expand line vertical bounds slightly if needed
       foundLine.top = Math.min(foundLine.top, w.bbox.y0);
       foundLine.bottom = Math.max(foundLine.bottom, w.bbox.y1);
    } else {
       lines.push({ top: w.bbox.y0, bottom: w.bbox.y1, words: [w] });
    }
  });

  // 2. Sort lines top-to-bottom
  lines.sort((a, b) => a.top - b.top);

  let finalOutput = '';
  let prevLineBottom = -1;

  // 3. Reconstruct text for each line based on horizontal positioning
  lines.forEach(line => {
     // Sort words left-to-right
     line.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);

     // Check vertical gap between lines for paragraph breaks
     if (prevLineBottom !== -1) {
         const vGap = line.top - prevLineBottom;
         const avgHeight = line.bottom - line.top;
         if (vGap > avgHeight * 0.8) {
             finalOutput += '\n\n'; // Paragraph break
         } else {
             finalOutput += '\n'; // Normal line break
         }
     }

     let lineText = '';
     let lastX = -1;
     let avgCharWidth = 0;
     let charCount = 0;

     // Calculate average character width for this line (to estimate space sizes)
     line.words.forEach(w => {
         avgCharWidth += (w.bbox.x1 - w.bbox.x0);
         charCount += w.text.length;
     });
     avgCharWidth = charCount > 0 ? (avgCharWidth / charCount) : 10;
     
     // Cap max space width so massive fonts don't under-space
     const spaceWidth = Math.max(4, Math.min(15, avgCharWidth * 1.2));

     line.words.forEach((w, i) => {
         if (i === 0) {
             lineText += w.text;
         } else {
             const gap = w.bbox.x0 - lastX;
             
             if (gap > spaceWidth * 1.5) {
                 // Calculate how many spaces to insert based on pixel gap
                 const spaceCount = Math.max(1, Math.round(gap / spaceWidth));
                 
                 // Cap excessive spaces to prevent breaking layout on huge gaps
                 const boundedSpaces = Math.min(spaceCount, 25);
                 lineText += ' '.repeat(boundedSpaces) + w.text;
             } else {
                 // Normal single space between closely packed words
                 lineText += ' ' + w.text;
             }
         }
         lastX = w.bbox.x1;
     });

     finalOutput += lineText.trimEnd();
     prevLineBottom = line.bottom;
  });

  return finalOutput;
}

/**
 * Main pre-processing engine
 */
export async function preprocessImage(imageSrc: string, config: PreprocessConfig): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Could not get canvas context');

      // 1. Draw original
      ctx.drawImage(img, 0, 0);

      // 2. Apply CSS filters (Contrast/Brightness)
      let filters = '';
      if (config.contrast) filters += `contrast(${config.contrast}%) `;
      if (config.brightness) filters += `brightness(${config.brightness}%) `;
      if (config.grayscale) filters += `grayscale(100%) `;
      if (filters) {
        ctx.filter = filters.trim();
        ctx.drawImage(img, 0, 0);
      }

      // 3. Advanced Pixel Manipulation (Thresholding)
      if (config.threshold !== undefined || config.useOtsu) {
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (config.useOtsu) {
          const threshold = getOtsuThreshold(imageData);
          applyThreshold(imageData, threshold, config.invert);
        } else if (config.threshold !== undefined) {
          applyThreshold(imageData, config.threshold, config.invert);
        }

        ctx.putImageData(imageData, 0, 0);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

/**
 * Converts image data to strict black/white based on threshold
 */
function applyThreshold(imageData: ImageData, threshold: number, invert?: boolean) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    // Luminance calculation
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let val = gray > threshold ? 255 : 0;
    
    // Invert if requested
    if (invert) val = 255 - val;

    d[i] = d[i + 1] = d[i + 2] = val;
  }
}

/**
 * Calculates optimal threshold using Otsu's method
 */
function getOtsuThreshold(imageData: ImageData): number {
  const d = imageData.data;
  const hist = new Array(256).fill(0);
  const total = d.length / 4;

  // 1. Histogram
  for (let i = 0; i < d.length; i += 4) {
    const gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    hist[gray]++;
  }

  // 2. Otsu Algorithm
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 127;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  return threshold;
}

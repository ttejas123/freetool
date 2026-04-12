
/**
 * Image Compression Worker
 * Handles off-main-thread image processing including resizing and binary search compression.
 */

self.onmessage = async (e: MessageEvent) => {
  const { imageBitmap, settings } = e.data;
  const { targetSizeKB, width, height, format } = settings;

  try {
    const canvas = new OffscreenCanvas(
      width || imageBitmap.width,
      height || imageBitmap.height
    );
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Draw and resize
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    let low = 0.01;
    let high = 1.0;
    let bestBlob: Blob | null = null;
    
    const mimeType = format === 'auto' ? 'image/webp' : `image/${format}`;
    const targetBytes = targetSizeKB * 1024;

    // Binary search for optimal quality
    for (let i = 0; i < 8; i++) {
       const quality = (low + high) / 2;
       const blob = await canvas.convertToBlob({ type: mimeType, quality });
       
       if (blob.size <= targetBytes) {
         bestBlob = blob;
         low = quality; // Try higher quality
       } else {
         high = quality; // Need lower quality
       }

       // If we're very close (within 2%), stop early
       if (blob.size <= targetBytes && blob.size >= targetBytes * 0.98) {
         break;
       }
    }

    // Fallback if no quality was low enough or if bestBlob is still null
    if (!bestBlob) {
      bestBlob = await canvas.convertToBlob({ type: mimeType, quality: low });
    }

    self.postMessage({ 
      success: true, 
      blob: bestBlob,
      size: bestBlob.size,
      width: canvas.width,
      height: canvas.height
    });
  } catch (err: any) {
    self.postMessage({ success: false, error: err.message });
  }
};

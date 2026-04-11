export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function calculateReduction(original: number, compressed: number): number {
  if (original === 0) return 0;
  return Math.max(0, ((original - compressed) / original) * 100);
}

export function getImageDimensions(file: File | string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    if (typeof file === 'string') {
      img.src = file;
    } else {
      img.src = URL.createObjectURL(file);
    }
  });
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface CompressionSettings {
  targetSizeKB: number;
  width?: number;
  height?: number;
  format: 'auto' | 'webp' | 'jpeg' | 'png';
  autoOptimize: boolean;
}

export const PRESETS = {
  whatsapp: { targetSizeKB: 200, format: 'webp' } as Partial<CompressionSettings>,
  email: { targetSizeKB: 100 } as Partial<CompressionSettings>,
  thumbnail: { targetSizeKB: 50, width: 300 } as Partial<CompressionSettings>,
  hd: { targetSizeKB: 1000, width: 1920, format: 'webp' } as Partial<CompressionSettings>,
};

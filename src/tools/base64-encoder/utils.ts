export type DetectedType = 'jwt' | 'data-url' | 'base64' | 'text' | 'image' | 'json';

export interface AnalysisResult {
  type: DetectedType;
  decoded: string;
  isImage: boolean;
  isJson: boolean;
  mimeType?: string;
  jwtInfo?: {
    header: any;
    payload: any;
    expiry?: Date;
  };
  size: number;
}

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const safeDecodeBase64 = (str: string): string => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    try {
        return atob(str); // Fallback for binary
    } catch (e2) {
        return '';
    }
  }
};

export const safeEncodeBase64 = (str: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return '';
  }
};

export const isBase64 = (str: string): boolean => {
  if (str.trim() === '') return false;
  try {
    return btoa(atob(str)) === str.trim().replace(/\s/g, '');
  } catch (err) {
    return false;
  }
};

export const isJWT = (str: string): boolean => {
  const parts = str.split('.');
  return parts.length === 3 && parts.every(part => /^[A-Za-z0-9-_]+$/.test(part));
};

export const decodeBase64Url = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }
  return atob(base64);
};

export const analyzeInput = (input: string): AnalysisResult => {
  const trimmedInput = input.trim();
  const size = new Blob([input]).size;
  
  // 1. Check JWT
  if (isJWT(trimmedInput)) {
    try {
      const parts = trimmedInput.split('.');
      const header = JSON.parse(decodeBase64Url(parts[0]));
      const payload = JSON.parse(decodeBase64Url(parts[1]));
      const expiry = payload.exp ? new Date(payload.exp * 1000) : undefined;
      return {
        type: 'jwt',
        decoded: JSON.stringify(payload, null, 2),
        isImage: false,
        isJson: true,
        jwtInfo: { header, payload, expiry },
        size
      };
    } catch (e) {
      // Fallback
    }
  }

  // 2. Check Data URL
  const dataUrlMatch = trimmedInput.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (dataUrlMatch) {
    return {
      type: 'data-url',
      decoded: safeDecodeBase64(dataUrlMatch[2]),
      isImage: dataUrlMatch[1].startsWith('image/'),
      isJson: false, // Could be JSON, but usually images/files
      mimeType: dataUrlMatch[1],
      size
    };
  }

  // 3. Check Base64
  if (isBase64(trimmedInput)) {
    const decoded = safeDecodeBase64(trimmedInput);
    let isJson = false;
    let mimeType: string | undefined;

    try {
      JSON.parse(decoded);
      isJson = true;
    } catch (e) {}

    // Image signature check (simple)
    if (decoded.startsWith('\xFF\xD8\xFF')) mimeType = 'image/jpeg';
    else if (decoded.startsWith('\x89PNG\r\n\x1a\n')) mimeType = 'image/png';
    else if (decoded.startsWith('GIF87a') || decoded.startsWith('GIF89a')) mimeType = 'image/gif';
    else if (decoded.startsWith('%PDF')) mimeType = 'application/pdf';

    return {
      type: 'base64',
      decoded,
      isImage: !!mimeType?.startsWith('image/'),
      isJson,
      mimeType,
      size
    };
  }

  // 4. Default: Text
  let isJson = false;
  try {
    JSON.parse(trimmedInput);
    isJson = true;
  } catch (e) {}

  return {
    type: 'text',
    decoded: trimmedInput, // Already text
    isImage: false,
    isJson,
    size
  };
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // Strip data prefix if needed, but data URLs are often preferred
        resolve(result);
    };
    reader.onerror = error => reject(error);
  });
};

'use client';

import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { getCompute } from '@/services';
import JSZip from 'jszip';

export async function executeNode(
  toolId: string,
  input: any,
  config: Record<string, any> = {}
): Promise<any> {
  const inputStr = typeof input === 'string' ? input : JSON.stringify(input || '');

  switch (toolId) {

    // ── QR Code Generator ─────────────────────────────────────────────────────
    case 'qr-generator': {
      const urls = inputStr.split(/[\n,]+/).map((u: string) => u.trim()).filter(Boolean);
      const results = urls.map((url: string) => {
        const svgString = renderToStaticMarkup(
          <QRCodeSVG value={url} size={220} level="H" includeMargin={false} />
        );
        return {
          url,
          dataUri: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))),
          svgString,
        };
      });
      return results; // Returns { url, dataUri, svgString }[]
    }

    // ── TinyURL Shorten ────────────────────────────────────────────────────────
    case 'tinyurl-shorten': {
      const urls = inputStr.split(/[\n,]+/).map((u: string) => u.trim()).filter(Boolean);
      const results = await Promise.all(
        urls.map(async (url: string) => {
          try {
            // TinyURL public API (no key required, CORS-friendly via allorigins)
            const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
            const res = await fetch(proxyUrl);
            const data = await res.json();
            const shortUrl = data.contents?.trim();
            return { original: url, short: shortUrl || 'Failed' };
          } catch {
            return { original: url, short: 'Error: request failed' };
          }
        })
      );
      return results; // { original, short }[]
    }

    // ── TinyURL Expand ────────────────────────────────────────────────────────
    case 'tinyurl-expand': {
      const urls = inputStr.split(/[\n,]+/).map((u: string) => u.trim()).filter(Boolean);
      const results = await Promise.all(
        urls.map(async (url: string) => {
          try {
            // Use allorigins to follow redirect and get final URL
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const res = await fetch(proxyUrl);
            const data = await res.json();
            // allorigins returns the final URL in `url` field after following redirects
            const resolved = data.status?.url || url;
            const curl = `curl -sI "${url}" | grep -i location`;
            return { short: url, resolved, curl };
          } catch {
            return { short: url, resolved: 'Error: could not resolve', curl: `curl -sI "${url}" | grep -i location` };
          }
        })
      );
      return results; // { short, resolved, curl }[]
    }

    // ── Download ZIP ──────────────────────────────────────────────────────────
    case 'download-zip': {
      const zip = new JSZip();
      const compression = config.compression === 'none' ? 'STORE' : 'DEFLATE';
      const compressionOptions = { level: 6 };

      let items: any[] = [];
      try {
        items = typeof input === 'string' ? JSON.parse(input) : (Array.isArray(input) ? input : [input]);
      } catch {
        items = [input];
      }

      items.forEach((item: any, idx: number) => {
        if (typeof item === 'string' && item.startsWith('data:image/svg+xml;base64,')) {
          // QR code SVG data URI
          const base64Data = item.replace('data:image/svg+xml;base64,', '');
          zip.file(`qr-${idx + 1}.svg`, base64Data, { base64: true });
        } else if (typeof item === 'object' && item !== null && 'dataUri' in item) {
          // QR code result object from qr-generator node
          const base64Data = item.dataUri.replace('data:image/svg+xml;base64,', '');
          const filename = item.url
            ? `qr-${item.url.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.svg`
            : `qr-${idx + 1}.svg`;
          zip.file(filename, base64Data, { base64: true });
        } else if (typeof item === 'object' && item !== null && 'short' in item) {
          // TinyURL result object
          const content = `Original: ${item.original || item.short}\nShort: ${item.short}\nResolved: ${item.resolved || ''}\n`;
          zip.file(`link-${idx + 1}.txt`, content);
        } else {
          const content = typeof item === 'string' ? item : JSON.stringify(item, null, 2);
          zip.file(`file-${idx + 1}.txt`, content);
        }
      });

      const blob = await zip.generateAsync({
        type: 'blob',
        compression,
        compressionOptions: compression === 'DEFLATE' ? compressionOptions : undefined,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pipeline-output-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      return `Downloaded ZIP with ${items.length} file(s) using ${compression} compression`;
    }

    // ── Compression Tool ──────────────────────────────────────────────────────
    case 'compression-tool': {
      const compute = await getCompute();
      const compressed = await compute.compress(inputStr, 'deflate');
      return compressed;
    }

    // ── Defaults ──────────────────────────────────────────────────────────────
    default: {
      if (toolId === 'text-to-slug') {
        return inputStr.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      }
      if (toolId === 'json-formatter') {
        try { return JSON.stringify(JSON.parse(inputStr), null, 2); } catch { return 'Invalid JSON'; }
      }
      await new Promise((res) => setTimeout(res, 500));
      return `Result of ${toolId} processing: ${inputStr.slice(0, 50)}...`;
    }
  }
}

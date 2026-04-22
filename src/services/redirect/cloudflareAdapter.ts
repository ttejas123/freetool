/**
 * Cloudflare Workers KV Redirect Adapter
 * ──────────────────────────────────────
 * Implements RedirectService by calling a Cloudflare Worker API
 * that reads/writes to Workers KV.
 *
 * Required env vars:
 *   VITE_CLOUDFLARE_REDIRECT_API   (e.g. https://redirect.your-worker.workers.dev)
 *
 * Expected Worker routes:
 *   GET  /resolve?code=<code>        → { originalUrl: string | null }
 *   POST /register                   → Body: { code, originalUrl }  → 201
 */
import type { RedirectService } from './types';

export class CloudflareRedirect implements RedirectService {
  private readonly apiBase = process.env.NEXT_PUBLIC_CLOUDFLARE_REDIRECT_API as string;

  async resolve(code: string): Promise<string | null> {
    const res = await fetch(`${this.apiBase}/resolve?code=${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { originalUrl: string | null };
    return json.originalUrl;
  }

  async register(code: string, originalUrl: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, originalUrl }),
    });
    if (!res.ok) {
      throw new Error(`Cloudflare redirect register failed: ${res.status}`);
    }
  }
}

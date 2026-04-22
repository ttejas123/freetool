/**
 * Node / REST API Redirect Adapter
 * ─────────────────────────────────
 * Implements RedirectService by calling a REST API (Express / Fastify / any framework).
 *
 * Required env vars:
 *   VITE_REDIRECT_API_URL   (e.g. https://api.example.com/redirect)
 *
 * Expected API routes:
 *   GET  /resolve/:code   → { originalUrl: string | null }
 *   POST /register        → Body: { code, originalUrl } → 201
 */
import type { RedirectService } from './types';

export class NodeRedirect implements RedirectService {
  private readonly apiBase = process.env.NEXT_PUBLIC_REDIRECT_API_URL as string;

  async resolve(code: string): Promise<string | null> {
    const res = await fetch(`${this.apiBase}/resolve/${encodeURIComponent(code)}`);
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
      throw new Error(`Node redirect register failed: ${res.status} ${res.statusText}`);
    }
  }
}

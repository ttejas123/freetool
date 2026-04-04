/**
 * TinyURL Generator — Service Layer Consumer
 * ─────────────────────────────────────────────
 * All persistence and redirect logic now goes through the service layer.
 * Switching providers (localStorage → Supabase → Firebase) requires
 * only changing VITE_DB_PROVIDER and VITE_REDIRECT_PROVIDER in .env.
 */
import { getDatabase, getRedirect } from '@/services';
export type { ShortLink } from '@/services';

/**
 * Create a new short link and persist it via the database service.
 * Previously: direct localStorage write — now: db.createShortUrl()
 */
export const generateShortLink = async (originalUrl: string) => {
  if (import.meta.env.VITE_DB_PROVIDER === 'supabase') {
    // Fast path: use the Edge Function directly when using Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string
    );

    const { data, error } = await supabase.functions.invoke('shorten', {
      body: { url: originalUrl },
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return {
      id: data.code,
      originalUrl: data.originalUrl || originalUrl,
      shortUrl: data.shortUrl,
      createdAt: Date.now()
    };
  }

  // Fallback for non-Supabase providers (e.g. 'local' localStorage testing)
  const db = await getDatabase();
  const redirect = await getRedirect();

  const code = Math.random().toString(36).substring(2, 8);
  const shortUrl = `${window.location.origin}/t/${code}`;

  const link = await db.createShortUrl({ originalUrl, shortUrl });
  await redirect.register(code, originalUrl);
  
  return link;
};

/**
 * Get all previously created short links, newest first.
 * Previously: JSON.parse(localStorage.getItem(...)) — now: db.getHistory()
 */
export const getHistory = async () => {
  const db = await getDatabase();
  return db.getHistory();
};

export const clearHistory = async () => {
  const db = await getDatabase();
  await db.clearHistory();
};

/**
 * Expand a generated short link using the redirect Edge Function
 */
export const resolveShortLink = async (url: string): Promise<string> => {
  if (import.meta.env.VITE_DB_PROVIDER === 'supabase') {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string
    );

    // Call the redirect edge function via invoke, passing the url to be expanded
    const { data, error } = await supabase.functions.invoke('redirect', {
      body: { url },
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }
    
    if (data?.error) {
       throw new Error(data.error);
    }

    return data?.originalUrl || data?.url || url;
  }

  // Fallback for non-Supabase environments
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  const data = await res.json();
  return (data.status?.url as string | undefined) || url;
};


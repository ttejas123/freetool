/**
 * Firebase Firestore Database Adapter
 * ────────────────────────────────────
 * Implements DatabaseService using Firebase Firestore.
 * The Firebase SDK is loaded lazily so it is never bundled unless active.
 *
 * Required env vars:
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_APP_ID
 *
 * Firestore collection: 'short_links'
 */
import type { DatabaseService, ShortLink, ToolStats } from './types';

export class FirebaseDatabase implements DatabaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any = null;

  private async getDb() {
    if (this.db) return this.db;

    // Dynamic imports — Firebase only bundled when provider = 'firebase'
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    return this.db;
  }

  async createShortUrl(data: { originalUrl: string; shortUrl: string }): Promise<ShortLink> {
    const db = await this.getDb();
    const { doc, setDoc, collection } = await import('firebase/firestore');

    const code = Math.random().toString(36).substring(2, 8);
    const link: ShortLink = {
      id: code,
      originalUrl: data.originalUrl,
      shortUrl: data.shortUrl || `${window.location.origin}/t/${code}`,
      createdAt: Date.now(),
    };

    await setDoc(doc(collection(db, 'short_links'), code), {
      originalUrl: link.originalUrl,
      shortUrl: link.shortUrl,
      createdAt: link.createdAt,
    });

    return link;
  }

  async getShortUrl(code: string): Promise<string | null> {
    const db = await this.getDb();
    const { doc, getDoc, collection } = await import('firebase/firestore');
    const snap = await getDoc(doc(collection(db, 'short_links'), code));
    if (!snap.exists()) return null;
    return (snap.data() as { originalUrl: string }).originalUrl;
  }

  async getHistory(): Promise<ShortLink[]> {
    const db = await this.getDb();
    const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
    const q = query(collection(db, 'short_links'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return snapshot.docs.map((d: any) => ({
      id: d.id,
      ...(d.data() as Omit<ShortLink, 'id'>),
    }));
  }

  async clearHistory(): Promise<void> {
    const db = await this.getDb();
    const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
    const snapshot = await getDocs(collection(db, 'short_links'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Promise.all(snapshot.docs.map((d: any) => deleteDoc(doc(db, 'short_links', d.id))));
  }

  /** ─── Tool Statistics Implementation ─── */

  async getToolStats(toolId: string): Promise<ToolStats> {
    const db = await this.getDb();
    const { doc, getDoc, collection } = await import('firebase/firestore');
    const snap = await getDoc(doc(collection(db, 'tool_stats'), toolId));

    if (!snap.exists()) {
      return { id: toolId, views: 0, upvotes: 0, uniqueUsers: 0 };
    }

    const data = snap.data() as any;
    return {
      id: snap.id,
      views: data.views || 0,
      upvotes: data.upvotes || 0,
      uniqueUsers: data.uniqueUsers || 0,
    };
  }

  async getAllToolStats(): Promise<ToolStats[]> {
    const db = await this.getDb();
    const { collection, getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(collection(db, 'tool_stats'));

    return snapshot.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        views: data.views || 0,
        upvotes: data.upvotes || 0,
        uniqueUsers: data.uniqueUsers || 0,
      };
    });
  }

  async recordToolAction(toolId: string, action: 'view' | 'upvote', userId?: string): Promise<void> {
    const db = await this.getDb();
    const { doc, setDoc, updateDoc, increment, collection, getDoc } = await import('firebase/firestore');

    const statsRef = doc(collection(db, 'tool_stats'), toolId);
    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) {
      await setDoc(statsRef, { views: 0, upvotes: 0, uniqueUsers: 0 });
    }

    const updates: any = {};
    if (action === 'view') updates.views = increment(1);
    if (action === 'upvote') updates.upvotes = increment(1);

    if (userId) {
      const visitorRef = doc(db, 'tool_stats', toolId, 'visitors', userId);
      const visitorSnap = await getDoc(visitorRef);
      if (!visitorSnap.exists()) {
        await setDoc(visitorRef, { createdAt: Date.now() });
        updates.uniqueUsers = increment(1);
      }
    }

    await updateDoc(statsRef, updates);
  }
}

import { create } from 'zustand';
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware';
import type { EditorState, BlockData, Page } from './types';
import { INITIAL_PAGES } from './utils/templates';

// Minimal IndexedDB wrapper for Zustand persist
const dbName = 'notespace-db-v1';
const storeName = 'notespace-store';
const version = 1;

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
};

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(name);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ? (request.result as string) : null);
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(value, name);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },
  removeItem: async (name: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(name);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      pages: INITIAL_PAGES,
      activePageId: INITIAL_PAGES[0].id,
      focusedBlockId: null,

      addPage: (title = 'Untitled', blocks = [{ id: crypto.randomUUID(), type: 'text', content: '' }]) => {
        const newPage: Page = {
          id: crypto.randomUUID(),
          title,
          blocks,
        };
        set((state) => ({
          pages: [...state.pages, newPage],
          activePageId: newPage.id,
        }));
      },

      deletePage: (id) => {
        set((state) => {
          const newPages = state.pages.filter((p) => p.id !== id);
          if (newPages.length === 0) {
            return { pages: INITIAL_PAGES, activePageId: INITIAL_PAGES[0].id };
          }
          return {
            pages: newPages,
            activePageId: state.activePageId === id ? newPages[0].id : state.activePageId,
          };
        });
      },

      setActivePage: (id) => set({ activePageId: id, focusedBlockId: null }),

      updatePageTitle: (id, title) => {
        set((state) => ({
          pages: state.pages.map((p) => (p.id === id ? { ...p, title } : p)),
        }));
      },

      addBlock: (block, afterId) => {
        set((state) => {
          const newBlock = { ...block, id: crypto.randomUUID() };
          const newPages = state.pages.map((page) => {
            if (page.id !== state.activePageId) return page;

            const newBlocks = [...page.blocks];
            if (afterId) {
              const index = newBlocks.findIndex((b) => b.id === afterId);
              if (index !== -1) {
                newBlocks.splice(index + 1, 0, newBlock);
              } else {
                newBlocks.push(newBlock);
              }
            } else {
              newBlocks.push(newBlock);
            }
            return { ...page, blocks: newBlocks };
          });

          return {
            pages: newPages,
            focusedBlockId: newBlock.id,
          };
        });
      },

      updateBlock: (id, partial) => {
        set((state) => ({
          pages: state.pages.map((page) => {
            if (page.id !== state.activePageId) return page;
            return {
              ...page,
              blocks: page.blocks.map((b) => (b.id === id ? { ...b, ...partial } : b)),
            };
          }),
        }));
      },

      deleteBlock: (id) => {
        set((state) => {
          const currentPage = state.pages.find((p) => p.id === state.activePageId);
          if (!currentPage) return state;

          const index = currentPage.blocks.findIndex((b) => b.id === id);
          const newBlocks = currentPage.blocks.filter((b) => b.id !== id);

          let newFocus = state.focusedBlockId;
          if (state.focusedBlockId === id) {
            if (index > 0) newFocus = newBlocks[index - 1].id;
            else if (newBlocks.length > 0) newFocus = newBlocks[0].id;
            else newFocus = null;
          }

          if (newBlocks.length === 0) {
            const emptyBlock = { id: crypto.randomUUID(), type: 'text', content: '' } as BlockData;
            newBlocks.push(emptyBlock);
            newFocus = emptyBlock.id;
          }

          return {
            pages: state.pages.map((p) => (p.id === state.activePageId ? { ...p, blocks: newBlocks } : p)),
            focusedBlockId: newFocus,
          };
        });
      },

      setFocusedBlock: (id) => set({ focusedBlockId: id }),

      reorderBlocks: (fromIndex, toIndex) => {
        set((state) => {
          const newPages = state.pages.map((page) => {
            if (page.id !== state.activePageId) return page;
            const newBlocks = [...page.blocks];
            const [moved] = newBlocks.splice(fromIndex, 1);
            newBlocks.splice(toIndex, 0, moved);
            return { ...page, blocks: newBlocks };
          });
          return { pages: newPages };
        });
      },

      resetAll: () => {
        set({
          pages: INITIAL_PAGES,
          activePageId: INITIAL_PAGES[0].id,
          focusedBlockId: null,
        });
      },
    }),
    {
      name: 'notespace-storage-v1',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);

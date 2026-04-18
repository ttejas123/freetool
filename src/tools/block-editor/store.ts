import { create } from 'zustand';
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware';
import type { EditorState, BlockData } from './types';

// Minimal IndexedDB wrapper for Zustand persist
const dbName = 'notion-editor-db';
const storeName = 'editor-store';
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

const defaultBlockId = crypto.randomUUID();

export const useEditorStore = create<EditorState>()(
  persist(
    (set, _) => ({
      blocks: [
        {
          id: defaultBlockId,
          type: 'text',
          content: '',
        },
      ],
      focusedBlockId: null,
      AI_API_KEY: null,
      
      setApiKey: (key) => set({ AI_API_KEY: key }),

      addBlock: (block, afterId) => {
        set((state) => {
          const newBlock = { ...block, id: crypto.randomUUID() };
          const newBlocks = [...state.blocks];
          
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
          
          return {
            blocks: newBlocks,
            focusedBlockId: newBlock.id,
          };
        });
      },

      updateBlock: (id, partial) => {
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...partial } : b)),
        }));
      },

      deleteBlock: (id) => {
        set((state) => {
          const index = state.blocks.findIndex(b => b.id === id);
          const newBlocks = state.blocks.filter((b) => b.id !== id);
          
          // Focus previous block if possible
          let newFocus = state.focusedBlockId;
          if (state.focusedBlockId === id) {
             if (index > 0) newFocus = newBlocks[index - 1].id;
             else if (newBlocks.length > 0) newFocus = newBlocks[0].id;
             else newFocus = null;
          }

          if (newBlocks.length === 0) {
            const emptyBlock = { id: crypto.randomUUID(), type: 'text', content: '' } as BlockData;
             return {
                blocks: [emptyBlock],
                focusedBlockId: emptyBlock.id
             }
          }

          return { 
            blocks: newBlocks,
            focusedBlockId: newFocus
          };
        });
      },

      setFocusedBlock: (id) => set({ focusedBlockId: id }),

      reorderBlocks: (fromIndex, toIndex) => {
        set((state) => {
          const newBlocks = [...state.blocks];
          const [moved] = newBlocks.splice(fromIndex, 1);
          newBlocks.splice(toIndex, 0, moved);
          return { blocks: newBlocks };
        });
      },
    }),
    {
      name: 'notion-editor-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);

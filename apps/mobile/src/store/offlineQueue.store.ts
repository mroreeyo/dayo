import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from './auth.store';

type OfflineMutation =
  | {
      id: string;
      type: 'EVENT_CREATE';
      calendarId: string;
      payload: Record<string, unknown>;
      createdAt: number;
    }
  | {
      id: string;
      type: 'EVENT_UPDATE';
      calendarId: string;
      eventId: string;
      version: number;
      patch: Record<string, unknown>;
      createdAt: number;
    }
  | {
      id: string;
      type: 'EVENT_DELETE';
      calendarId: string;
      eventId: string;
      createdAt: number;
    };

interface OfflineQueueState {
  queue: OfflineMutation[];
  enqueue: (mutation: OfflineMutation) => void;
  dequeue: () => OfflineMutation | undefined;
  remove: (id: string) => void;
  clear: () => void;
}

const mmkvStorage = {
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  getItem: (name: string) => {
    return storage.getString(name) ?? null;
  },
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],

      enqueue: (mutation) =>
        set((state) => ({ queue: [...state.queue, mutation] })),

      dequeue: () => {
        const { queue } = get();
        if (queue.length === 0) return undefined;
        const [first, ...rest] = queue;
        set({ queue: rest });
        return first;
      },

      remove: (id) =>
        set((state) => ({
          queue: state.queue.filter((m) => m.id !== id),
        })),

      clear: () => set({ queue: [] }),
    }),
    {
      name: 'offline-queue-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

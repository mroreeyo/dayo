import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { useOfflineQueueStore } from '../store/offlineQueue.store';
import { eventsApi } from '../api/events.api';
import type { CreateEventDto, UpdateEventDto } from '../api/types';

let flushing = false;

/**
 * Subscribe to network state changes.
 * When connectivity is restored, automatically flush the offline queue (FIFO).
 * Returns the unsubscribe function.
 */
export function setupOfflineQueueFlush() {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void flushQueue();
    }
  });
}

async function flushQueue() {
  if (flushing) return;
  flushing = true;

  try {
    const store = useOfflineQueueStore.getState();

    while (store.queue.length > 0) {
      const mutation = store.queue[0]; // FIFO — always process head

      try {
        switch (mutation.type) {
          case 'EVENT_CREATE':
            await eventsApi.create(mutation.payload as unknown as CreateEventDto);
            break;
          case 'EVENT_UPDATE':
            await eventsApi.update(mutation.eventId, {
              ...mutation.patch,
              version: mutation.version,
            } as unknown as UpdateEventDto);
            break;
          case 'EVENT_DELETE':
            await eventsApi.delete(mutation.eventId);
            break;
        }

        store.dequeue(); // success — remove from queue
      } catch (err: unknown) {
        const status = getResponseStatus(err);

        if (status === 409) {
          // Optimistic lock conflict — let user decide
          Alert.alert(
            '충돌 발생',
            '다른 사용자가 이 일정을 수정했습니다. 최신 데이터를 가져온 후 다시 시도해주세요.',
            [
              { text: '건너뛰기', onPress: () => store.dequeue() },
              { text: '재시도', style: 'cancel' },
            ],
          );
          return; // pause flush — user decides
        }

        if (status === 401 || status === 403) {
          return; // auth issue — stop flush entirely
        }

        // 5xx or transient network error — wait and retry
        await delay(5000);
        continue;
      }
    }
  } finally {
    flushing = false;
  }
}

function getResponseStatus(err: unknown): number | undefined {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { status?: number } }).response?.status === 'number'
  ) {
    return (err as { response: { status: number } }).response.status;
  }
  return undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

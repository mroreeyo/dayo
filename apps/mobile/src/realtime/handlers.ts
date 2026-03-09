import type { Socket } from 'socket.io-client';
import { syncApi } from '../api/sync.api';
import { useCalendarsStore } from '../store/calendars.store';
import { useEventsStore } from '../store/events.store';
import { useSyncStore } from '../store/sync.store';
import type { RealtimePayload } from '../api/types';

const syncDebounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function triggerSync(calendarId: string): void {
  if (syncDebounceTimers[calendarId]) {
    clearTimeout(syncDebounceTimers[calendarId]);
  }
  syncDebounceTimers[calendarId] = setTimeout(() => {
    performSync(calendarId);
  }, 500);
}

async function performSync(calendarId: string): Promise<void> {
  try {
    const since = useSyncStore.getState().getRevision(calendarId);
    const response = await syncApi.sync(calendarId, since);

    if (response.calendars.upserts.length > 0) {
      for (const cal of response.calendars.upserts) {
        useCalendarsStore.getState().upsertCalendar(cal);
      }
    }
    for (const del of response.calendars.deletes) {
      useCalendarsStore.getState().removeCalendar(del.id);
    }

    if (response.events.upserts.length > 0) {
      useEventsStore.getState().upsertEvents(calendarId, response.events.upserts);
    }
    if (response.events.deletes.length > 0) {
      useEventsStore
        .getState()
        .removeEvents(
          calendarId,
          response.events.deletes.map((d) => d.id),
        );
    }

    useSyncStore.getState().setRevision(calendarId, response.next);
  } catch {
    // sync failed — will retry on next RT event or app resume
  }
}

export function setupRealtimeHandlers(socket: Socket): void {
  socket.on('event.created', (payload: RealtimePayload) =>
    triggerSync(payload.calendarId),
  );
  socket.on('event.updated', (payload: RealtimePayload) =>
    triggerSync(payload.calendarId),
  );
  socket.on('event.deleted', (payload: RealtimePayload) =>
    triggerSync(payload.calendarId),
  );
  socket.on('calendar.updated', (payload: RealtimePayload) =>
    triggerSync(payload.calendarId),
  );
  socket.on('calendar.deleted', (payload: RealtimePayload) =>
    triggerSync(payload.calendarId),
  );
  socket.on('member.joined', (payload: RealtimePayload) =>
    triggerSync(payload.calendarId),
  );
  socket.on('member.left', (payload: RealtimePayload) =>
    triggerSync(payload.calendarId),
  );
  socket.on('member.role_changed', (payload: RealtimePayload) =>
    triggerSync(payload.calendarId),
  );
  socket.on('calendar.removed', (payload: RealtimePayload) => {
    useCalendarsStore.getState().removeCalendar(payload.calendarId);
  });
}

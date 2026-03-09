import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useCalendarsStore } from '../store/calendars.store';
import { setupRealtimeHandlers } from './handlers';

let socket: Socket | null = null;

export function connectSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(`${process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000'}/rt`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    const calendarIds = useCalendarsStore.getState().myCalendarIds;
    calendarIds.forEach((calId) => {
      socket?.emit('calendar.join', { calendarId: calId });
    });
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      socket?.connect();
    }
  });

  setupRealtimeHandlers(socket);

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}

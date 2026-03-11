import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { queryClient } from '../src/api/query-client';
import { useAuthStore } from '../src/store/auth.store';
import { connectSocket, disconnectSocket, getSocket } from '../src/realtime/socket';
import { setupOfflineQueueFlush } from '../src/utils/offline-flush';

function useSocketLifecycle() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [accessToken]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && accessToken) {
        const sock = getSocket();
        if (!sock?.connected) {
          connectSocket();
        }
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [accessToken]);
}

function useProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!accessToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (accessToken && inAuthGroup) {
      router.replace('/(main)');
    }
  }, [accessToken, segments, router]);
}

export default function RootLayout() {
  useSocketLifecycle();
  useProtectedRoute();

  useEffect(() => {
    const unsubscribe = setupOfflineQueueFlush();
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Slot />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

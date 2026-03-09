import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/ThemeProvider';
import { RootNavigator } from './navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from './api/query-client';
import { useAuthStore } from './store/auth.store';
import { connectSocket, disconnectSocket, getSocket } from './realtime/socket';
import { setupOfflineQueueFlush } from './utils/offline-flush';

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

export default function App() {
  useSocketLifecycle();

  useEffect(() => {
    const unsubscribe = setupOfflineQueueFlush();
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

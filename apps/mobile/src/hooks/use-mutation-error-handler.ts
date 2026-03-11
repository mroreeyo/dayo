import { Alert } from 'react-native';
import { isAxiosError } from 'axios';
import { useAuthStore } from '../store/auth.store';

export function handleMutationError(error: unknown): void {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) {
      useAuthStore.getState().clearTokens();
      return;
    }
    if (status === 409) {
      Alert.alert('충돌 발생', '다른 사용자가 이미 변경했습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }
  }
  throw error;
}

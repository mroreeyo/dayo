import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Box } from '../../ui/primitives/Box';
import { Text } from '../../ui/primitives/Text';
import { Button } from '../../ui/components/Button';
import { Input } from '../../ui/components/Input';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { LoginDto } from '../../api/types';
import { useTheme } from '../../theme/ThemeProvider';
import { registerForPushNotifications } from '../../utils/notifications';

export function LoginScreen() {
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginDto>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginDto) => {
    setLoading(true);
    try {
      const response = await authApi.login(data);
      setTokens(response.tokens.accessToken, response.tokens.refreshToken, response.user.id);
      registerForPushNotifications().catch(() => {});
    } catch (error: unknown) {
      let message = 'Something went wrong';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ flex: 1 }} backgroundColor="app">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.space[6] }}>
          <Box style={{ marginBottom: theme.space[8], alignItems: 'center' }}>
            <Text variant="display" style={{ marginBottom: theme.space[2] }}>Welcome Back</Text>
            <Text variant="body" color="secondary">Sign in to continue</Text>
          </Box>

          <Controller
            control={control}
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="Enter your email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
            name="email"
          />

          <Controller
            control={control}
            rules={{ required: 'Password is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                secureTextEntry
              />
            )}
            name="password"
          />

          <Box style={{ marginTop: theme.space[6] }}>
            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              fullWidth
            />
          </Box>

          <Box style={{ marginTop: theme.space[4], flexDirection: 'row', justifyContent: 'center' }}>
            <Text variant="bodySm" color="secondary">Don't have an account? </Text>
            <Text
              variant="bodySm"
              color="link"
              style={{ fontWeight: '600' }}
              onPress={() => router.push('/(auth)/register')}
            >
              Sign Up
            </Text>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}

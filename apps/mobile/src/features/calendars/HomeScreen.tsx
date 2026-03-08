import React from 'react';
import { Box } from '../../ui/primitives/Box';
import { Text } from '../../ui/primitives/Text';
import { Button } from '../../ui/components/Button';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../theme/ThemeProvider';

export function HomeScreen() {
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const theme = useTheme();

  return (
    <Box style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.space[6] }} backgroundColor="app">
      <Text variant="title" style={{ marginBottom: theme.space[4] }}>Welcome to Shared Calendar</Text>
      <Button label="Sign Out" onPress={clearTokens} variant="outline" />
    </Box>
  );
}

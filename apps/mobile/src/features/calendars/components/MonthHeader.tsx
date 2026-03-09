import React from 'react';
import { Pressable, StyleSheet, TextStyle } from 'react-native';
import { DateTime } from 'luxon';
import { useTheme } from '../../../theme/ThemeProvider';
import { Theme } from '../../../theme/theme';
import { Text } from '../../../ui/primitives/Text';
import { Icon } from '../../../ui/primitives/Icon';
import { Box } from '../../../ui/primitives/Box';

interface MonthHeaderProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthHeader({ currentDate, onPrev, onNext }: MonthHeaderProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  
  const date = DateTime.fromJSDate(currentDate);
  const monthYear = date.toFormat('MMMM yyyy');

  return (
    <Box style={styles.container}>
      <Pressable onPress={onPrev} hitSlop={8} style={styles.button}>
        <Icon name="chevron-back" size="md" color="primary" />
      </Pressable>
      
      <Text variant="title" style={styles.title}>
        {monthYear}
      </Text>
      
      <Pressable onPress={onNext} hitSlop={8} style={styles.button}>
        <Icon name="chevron-forward" size="md" color="primary" />
      </Pressable>
    </Box>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[4],
    backgroundColor: theme.colors.background.surface,
  },
  title: {
    fontWeight: theme.typography.weight.semibold as TextStyle['fontWeight'],
    color: theme.colors.text.primary,
  },
  button: {
    padding: theme.space[2],
    borderRadius: theme.radius.pill,
  },
});

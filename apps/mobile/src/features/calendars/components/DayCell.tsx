import React from 'react';
import { Pressable, StyleSheet, View, TextStyle } from 'react-native';
import { DateTime } from 'luxon';
import { useTheme } from '../../../theme/ThemeProvider';
import { Theme } from '../../../theme/theme';
import { Text } from '../../../ui/primitives/Text';

export interface CalendarEvent {
  id: string;
  color?: string;
}

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events?: CalendarEvent[];
  onPress: (date: Date) => void;
}

export function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  events = [],
  onPress,
}: DayCellProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  
  const dayNumber = DateTime.fromJSDate(date).day;
  
  const displayEvents = events.slice(0, 3);
  const hasMore = events.length > 3;

  return (
    <Pressable
      onPress={() => onPress(date)}
      style={[
        styles.container,
        isToday && styles.todayBackground,
        isSelected && styles.selectedRing,
      ]}
    >
      <Text
        variant="bodySm"
        style={[
          styles.dayText,
          !isCurrentMonth && styles.mutedText,
          isSelected && styles.selectedText,
          isToday && !isSelected && styles.todayText,
        ]}
      >
        {dayNumber}
      </Text>
      
      <View style={styles.dotsContainer}>
        {displayEvents.map((event, index) => (
          <View
            key={event.id || index}
            style={[
              styles.dot,
              { backgroundColor: event.color || theme.colors.calendar.eventDotDefault },
            ]}
          />
        ))}
        {hasMore && (
          <View style={[styles.dot, styles.moreDot]} />
        )}
      </View>
    </Pressable>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    margin: 1,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  todayBackground: {
    backgroundColor: theme.colors.calendar.todayBg,
  },
  selectedRing: {
    borderColor: theme.colors.calendar.selectedDayRing,
  },
  dayText: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.medium as TextStyle['fontWeight'],
  },
  mutedText: {
    color: theme.colors.text.muted,
    opacity: 0.5,
  },
  selectedText: {
    color: theme.colors.brand.primary,
    fontWeight: theme.typography.weight.bold as TextStyle['fontWeight'],
  },
  todayText: {
    color: theme.colors.brand.primary,
    fontWeight: theme.typography.weight.semibold as TextStyle['fontWeight'],
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    gap: 2,
    height: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moreDot: {
    backgroundColor: theme.colors.text.muted,
    opacity: 0.5,
  },
});

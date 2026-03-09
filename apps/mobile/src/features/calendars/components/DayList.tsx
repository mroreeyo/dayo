import React from 'react';
import { StyleSheet, View, FlatList, TextStyle } from 'react-native';
import { DateTime } from 'luxon';
import { useTheme } from '../../../theme/ThemeProvider';
import { Theme } from '../../../theme/theme';
import { Text } from '../../../ui/primitives/Text';
import { Box } from '../../../ui/primitives/Box';
import { CalendarEvent } from './DayCell';

interface DayListProps {
  date: Date;
  events: CalendarEvent[];
}

export function DayList({ date, events }: DayListProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  
  const dateStr = DateTime.fromJSDate(date).toFormat('cccc, MMMM d');

  if (events.length === 0) {
    return (
      <Box style={styles.emptyContainer}>
        <Text variant="body" style={styles.dateHeader}>
          {dateStr}
        </Text>
        <Text variant="bodySm" style={styles.emptyText}>
          No events for this day
        </Text>
      </Box>
    );
  }

  return (
    <Box style={styles.container}>
      <Text variant="body" style={styles.dateHeader}>
        {dateStr}
      </Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventItem}>
            <View style={[styles.eventColor, { backgroundColor: item.color || theme.colors.calendar.eventDotDefault }]} />
            <Text variant="body" style={styles.eventTitle}>
              Event {item.id}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </Box>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.space[4],
  },
  emptyContainer: {
    flex: 1,
    padding: theme.space[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateHeader: {
    fontWeight: theme.typography.weight.semibold as TextStyle['fontWeight'],
    marginBottom: theme.space[4],
    color: theme.colors.text.primary,
  },
  emptyText: {
    color: theme.colors.text.muted,
  },
  listContent: {
    gap: theme.space[3],
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.space[3],
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  eventColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.space[3],
  },
  eventTitle: {
    color: theme.colors.text.primary,
  },
});

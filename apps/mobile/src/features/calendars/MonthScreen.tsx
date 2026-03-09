import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, TextStyle } from 'react-native';
import { DateTime } from 'luxon';
import { useTheme } from '../../theme/ThemeProvider';
import { Theme } from '../../theme/theme';
import { Box } from '../../ui/primitives/Box';
import { Text } from '../../ui/primitives/Text';
import { Button } from '../../ui/components/Button';
import { useAuthStore } from '../../store/auth.store';
import { MonthHeader } from './components/MonthHeader';
import { DayCell, CalendarEvent } from './components/DayCell';
import { DayList } from './components/DayList';

const MOCK_EVENTS: (CalendarEvent & { date: string })[] = [
  { id: '1', date: '2026-03-10' },
  { id: '2', date: '2026-03-10' },
  { id: '3', date: '2026-03-15' },
  { id: '4', date: '2026-03-20' },
  { id: '5', date: '2026-03-20' },
  { id: '6', date: '2026-03-20' },
  { id: '7', date: '2026-03-20' },
];

export function MonthScreen() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const clearTokens = useAuthStore((state) => state.clearTokens);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const days = useMemo(() => {
    const startOfMonth = DateTime.fromJSDate(currentMonth).startOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    
    return Array.from({ length: 42 }, (_, i) => startOfWeek.plus({ days: i }).toJSDate());
  }, [currentMonth]);

  const weekDays = useMemo(() => {
    const startOfWeek = DateTime.now().startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.plus({ days: i }).toFormat('ccc'));
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => DateTime.fromJSDate(prev).minus({ months: 1 }).toJSDate());
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => DateTime.fromJSDate(prev).plus({ months: 1 }).toJSDate());
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    
    const clickedMonth = DateTime.fromJSDate(date).startOf('month');
    const currentMonthStart = DateTime.fromJSDate(currentMonth).startOf('month');
    
    if (!clickedMonth.hasSame(currentMonthStart, 'month')) {
      setCurrentMonth(date);
    }
  };

  const getEventsForDate = useCallback((date: Date) => {
    const dateStr = DateTime.fromJSDate(date).toISODate();
    return MOCK_EVENTS.filter(e => e.date === dateStr);
  }, []);

  const selectedEvents = useMemo(() => getEventsForDate(selectedDate), [selectedDate, getEventsForDate]);

  return (
    <Box style={styles.container} backgroundColor="app">
      <MonthHeader
        currentDate={currentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />
      
      <View style={styles.gridContainer}>
        <View style={styles.weekHeader}>
          {weekDays.map((day) => (
            <Text key={day} variant="caption" style={styles.weekDayText}>
              {day}
            </Text>
          ))}
        </View>
        
        <View style={styles.daysGrid}>
          {days.map((date) => {
            const dateIso = DateTime.fromJSDate(date).toISODate();
            const isCurrentMonth = DateTime.fromJSDate(date).hasSame(DateTime.fromJSDate(currentMonth), 'month');
            const isToday = DateTime.fromJSDate(date).hasSame(DateTime.now(), 'day');
            const isSelected = DateTime.fromJSDate(date).hasSame(DateTime.fromJSDate(selectedDate), 'day');
            const events = getEventsForDate(date);

            return (
              <View key={dateIso} style={styles.dayCellWrapper}>
                <DayCell
                  date={date}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday}
                  isSelected={isSelected}
                  events={events}
                  onPress={handleDayPress}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.listContainer}>
        <DayList date={selectedDate} events={selectedEvents} />
        <Button 
          label="Sign Out" 
          onPress={clearTokens} 
          variant="ghost" 
          size="sm"
          style={styles.signOutButton}
        />
      </View>
    </Box>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[4],
    backgroundColor: theme.colors.background.surface,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    shadowColor: theme.colors.background.overlay,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    zIndex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: theme.space[2],
    paddingVertical: theme.space[2],
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text.muted,
    fontWeight: theme.typography.weight.medium as TextStyle['fontWeight'],
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellWrapper: {
    width: '14.28%',
    aspectRatio: 0.85,
  },
  listContainer: {
    flex: 1,
    marginTop: theme.space[4],
  },
  signOutButton: {
    marginTop: theme.space[4],
    alignSelf: 'center',
  },
});

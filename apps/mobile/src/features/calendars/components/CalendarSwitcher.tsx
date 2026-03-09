import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { Theme } from '../../../theme/theme';
import { Chip } from '../../../ui/components/Chip';

interface CalendarItem {
  id: string;
  name: string;
  color: string;
}

interface CalendarSwitcherProps {
  calendars: CalendarItem[];
  selectedId: string | 'all';
  onSelect: (id: string | 'all') => void;
}

export function CalendarSwitcher({
  calendars,
  selectedId,
  onSelect,
}: CalendarSwitcherProps) {
  const theme = useTheme();
  const s = getStyles(theme);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.container}
    >
      <Chip
        label="통합"
        selected={selectedId === 'all'}
        onPress={() => onSelect('all')}
      />
      {calendars.map((cal) => (
        <View key={cal.id} style={s.chipWrapper}>
          <View style={[s.colorDot, { backgroundColor: cal.color }]} />
          <Chip
            label={cal.name}
            selected={selectedId === cal.id}
            onPress={() => onSelect(cal.id)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.space['4'],
      paddingVertical: theme.space['2'],
      gap: theme.space['2'],
      flexDirection: 'row',
      alignItems: 'center',
    },
    chipWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    colorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: theme.space['1'],
    },
  });

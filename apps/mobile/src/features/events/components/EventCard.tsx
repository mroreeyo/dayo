import React from 'react';
import { View, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { Theme } from '../../../theme/theme';
import { Text } from '../../../ui/primitives/Text';
import { Card } from '../../../ui/components/Card';
import { Avatar } from '../../../ui/components/Avatar';

interface EventCardProps {
  title: string;
  timeText: string;
  calendarColor: string;
  authorName: string;
  onPress?: () => void;
}

export function EventCard({
  title,
  timeText,
  calendarColor,
  authorName,
  onPress,
}: EventCardProps) {
  const theme = useTheme();
  const s = getStyles(theme);

  return (
    <Card style={s.card} onPress={onPress}>
      <View style={[s.colorBar, { backgroundColor: calendarColor }]} />
      <View style={s.main}>
        <Text
          variant="body"
          style={s.title}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text variant="caption" color="secondary">
          {timeText}
        </Text>
        <View style={s.metaRow}>
          <Avatar name={authorName} size="xs" />
          <Text variant="caption" color="muted">
            {authorName}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'stretch',
      padding: 0,
      overflow: 'hidden',
    },
    colorBar: {
      width: 10,
    },
    main: {
      flex: 1,
      padding: theme.component.card.padding,
      gap: theme.component.card.gap,
    },
    title: {
      fontWeight: theme.typography.weight.semibold as TextStyle['fontWeight'],
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space['2'],
      marginTop: theme.space['1'],
    },
  });

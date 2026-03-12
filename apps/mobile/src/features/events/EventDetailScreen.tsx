import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Theme } from '../../theme/theme';
import { Text } from '../../ui/primitives/Text';
import { Button } from '../../ui/components/Button';
import { Avatar } from '../../ui/components/Avatar';
import { Card } from '../../ui/components/Card';
import { Icon } from '../../ui/primitives/Icon';
import { EventEditSheet } from './EventEditSheet';
import { useRouter } from 'expo-router';

interface EventDetailData {
  id: string;
  title: string;
  allDay: boolean;
  startAt: string;
  endAt: string;
  timezone: string;
  location?: string;
  note?: string;
  creatorName: string;
  calendarName: string;
  calendarColor: string;
  version: number;
}

const STUB_EVENT: EventDetailData = {
  id: 'stub',
  title: '팀 미팅',
  allDay: false,
  startAt: '2026-03-09T10:00:00Z',
  endAt: '2026-03-09T11:00:00Z',
  timezone: 'Asia/Seoul',
  location: '회의실 A',
  note: '주간 스프린트 리뷰',
  creatorName: '김민수',
  calendarName: '업무',
  calendarColor: '',
  version: 1,
};

export function EventDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const s = getStyles(theme);

  const event: EventDetailData = {
    ...STUB_EVENT,
    calendarColor: theme.colors.calendar.calendarColorOptions[0],
  };

  const [editSheetVisible, setEditSheetVisible] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      '일정 삭제',
      '이 일정을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            router.back();
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    setEditSheetVisible(true);
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.headerRow}>
          <View
            style={[s.headerColorBar, { backgroundColor: event.calendarColor }]}
          />
          <View style={s.headerContent}>
            <Text variant="title" style={s.titleText}>
              {event.title}
            </Text>
            {event.allDay ? (
              <View style={s.allDayBadge}>
                <Text variant="bodySm" style={{ color: theme.colors.brand.onPrimary }}>
                  종일
                </Text>
              </View>
            ) : (
              <Text variant="body" color="secondary">
                {event.startAt} — {event.endAt}
              </Text>
            )}
          </View>
        </View>

        <Card style={s.detailCard}>
          <DetailRow
            icon="calendar-outline"
            label="캘린더"
            value={event.calendarName}
            theme={theme}
          />
          <DetailRow
            icon="time-outline"
            label="시간대"
            value={event.timezone}
            theme={theme}
          />
          {event.location ? (
            <DetailRow
              icon="location-outline"
              label="장소"
              value={event.location}
              theme={theme}
            />
          ) : null}
          {event.note ? (
            <DetailRow
              icon="document-text-outline"
              label="메모"
              value={event.note}
              theme={theme}
            />
          ) : null}
        </Card>

        <Card style={s.creatorCard}>
          <View style={s.creatorRow}>
            <Avatar name={event.creatorName} size="sm" />
            <View style={s.creatorInfo}>
              <Text variant="caption" color="muted">
                만든 사람
              </Text>
              <Text variant="bodySm">{event.creatorName}</Text>
            </View>
          </View>
        </Card>

        <View style={s.actions}>
          <Button
            label="편집"
            variant="secondary"
            icon="create-outline"
            onPress={handleEdit}
            fullWidth
          />
          <Button
            label="삭제"
            variant="danger"
            icon="trash-outline"
            onPress={handleDelete}
            fullWidth
          />
        </View>
      </ScrollView>

      <EventEditSheet
        visible={editSheetVisible}
        onClose={() => setEditSheetVisible(false)}
        onSave={() => setEditSheetVisible(false)}
      />
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value: string;
  theme: Theme;
}) {
  const s = getStyles(theme);

  return (
    <View style={s.detailRow}>
      <Icon name={icon} size="md" color="secondary" />
      <View style={s.detailTexts}>
        <Text variant="caption" color="muted">
          {label}
        </Text>
        <Text variant="bodySm">{value}</Text>
      </View>
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      padding: theme.space['4'],
      gap: theme.space['4'],
    },
    headerRow: {
      flexDirection: 'row',
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background.surface,
      overflow: 'hidden',
    },
    headerColorBar: {
      width: 6,
    },
    headerContent: {
      flex: 1,
      padding: theme.space['4'],
      gap: theme.space['2'],
    },
    titleText: {
      fontWeight: theme.typography.weight.bold as TextStyle['fontWeight'],
    },
    allDayBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.sm,
      paddingHorizontal: theme.space['2'],
      paddingVertical: theme.space['1'],
    },
    detailCard: {
      gap: theme.space['3'],
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.space['3'],
    },
    detailTexts: {
      flex: 1,
      gap: theme.space['1'],
    },
    creatorCard: {
      flexDirection: 'row',
    },
    creatorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space['3'],
    },
    creatorInfo: {
      gap: theme.space['1'],
    },
    actions: {
      gap: theme.space['3'],
      marginTop: theme.space['2'],
    },
  });

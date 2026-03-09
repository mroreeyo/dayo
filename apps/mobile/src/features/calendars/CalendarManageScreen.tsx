import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Pressable, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Theme } from '../../theme/theme';
import { Text } from '../../ui/primitives/Text';
import { Button } from '../../ui/components/Button';
import { Input } from '../../ui/components/Input';
import { Card } from '../../ui/components/Card';
import { Icon } from '../../ui/primitives/Icon';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'CalendarManage'>;

const STUB_CALENDAR = {
  id: 'stub',
  name: '업무',
  color: '',
  role: 'OWNER' as const,
};

export function CalendarManageScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = getStyles(theme);

  const calendar = {
    ...STUB_CALENDAR,
    color: theme.colors.calendar.calendarColorOptions[0],
  };

  const [name, setName] = useState(calendar.name);
  const [selectedColor, setSelectedColor] = useState(calendar.color);
  const isOwner = calendar.role === 'OWNER';
  const colorOptions = theme.colors.calendar.calendarColorOptions;

  const handleSave = () => {
    Alert.alert('저장 완료', '캘린더 설정이 저장되었습니다');
  };

  const handleDelete = () => {
    Alert.alert(
      '캘린더 삭제',
      '이 캘린더를 삭제하시겠습니까? 모든 일정이 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <Text variant="title" style={s.screenTitle}>캘린더 설정</Text>

        <Input
          label="캘린더 이름"
          value={name}
          onChangeText={setName}
          placeholder="캘린더 이름"
        />

        <View style={s.section}>
          <Text variant="bodySm" color="secondary" style={s.sectionLabel}>
            색상
          </Text>
          <View style={s.colorRow}>
            {colorOptions.map((c) => (
              <Pressable
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[
                  s.colorDot,
                  { backgroundColor: c },
                  selectedColor === c && s.colorDotSelected,
                ]}
              />
            ))}
          </View>
        </View>

        <Card style={s.linkCard} onPress={() => navigation.navigate('MemberList', { calendarId: calendar.id })}>
          <View style={s.linkRow}>
            <Icon name="people-outline" size="md" color="secondary" />
            <Text variant="body" style={s.linkText}>멤버 관리</Text>
            <Icon name="chevron-forward" size="md" color="muted" />
          </View>
        </Card>

        <Button
          label="저장"
          variant="primary"
          onPress={handleSave}
          fullWidth
        />

        {isOwner && (
          <Button
            label="캘린더 삭제"
            variant="danger"
            icon="trash-outline"
            onPress={handleDelete}
            fullWidth
          />
        )}
      </ScrollView>
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
    screenTitle: {
      fontWeight: theme.typography.weight.bold as TextStyle['fontWeight'],
      marginBottom: theme.space['2'],
    },
    section: {
      gap: theme.space['2'],
    },
    sectionLabel: {
      fontWeight: theme.typography.weight.medium as TextStyle['fontWeight'],
    },
    colorRow: {
      flexDirection: 'row',
      gap: theme.space['3'],
      flexWrap: 'wrap',
    },
    colorDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    colorDotSelected: {
      borderWidth: 3,
      borderColor: theme.colors.text.primary,
    },
    linkCard: {
      padding: theme.component.card.padding,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space['3'],
    },
    linkText: {
      flex: 1,
      fontWeight: theme.typography.weight.medium as TextStyle['fontWeight'],
    },
  });

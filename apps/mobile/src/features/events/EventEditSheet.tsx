import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  TextStyle,
  Pressable,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useTheme } from '../../theme/ThemeProvider';
import { Theme } from '../../theme/theme';
import { Text } from '../../ui/primitives/Text';
import { Button } from '../../ui/components/Button';
import { Input } from '../../ui/components/Input';
import { BottomSheet } from '../../ui/components/BottomSheet';

export interface EventFormData {
  title: string;
  allDay: boolean;
  startAt: string;
  endAt: string;
  timezone: string;
  note: string;
  location: string;
  color: string;
  remindMinutes: number;
}

interface EventEditSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: EventFormData & { version?: number }) => void;
  initialData?: EventFormData & { version?: number };
  saving?: boolean;
}

const DEFAULT_FORM: EventFormData = {
  title: '',
  allDay: false,
  startAt: '',
  endAt: '',
  timezone: 'Asia/Seoul',
  note: '',
  location: '',
  color: '',
  remindMinutes: 0,
};

const REMIND_OPTIONS = [0, 5, 10, 15, 30, 60];

export function EventEditSheet({
  visible,
  onClose,
  onSave,
  initialData,
  saving = false,
}: EventEditSheetProps) {
  const theme = useTheme();
  const s = getStyles(theme);
  const isUpdate = !!initialData;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: initialData ?? DEFAULT_FORM,
  });

  useEffect(() => {
    if (visible) {
      reset(initialData ?? DEFAULT_FORM);
    }
  }, [visible, initialData, reset]);

  const allDay = watch('allDay');

  const onSubmit = (data: EventFormData) => {
    onSave({
      ...data,
      version: initialData?.version,
    });
  };

  const colorOptions = theme.colors.calendar.calendarColorOptions;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isUpdate ? '일정 편집' : '새 일정'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Controller
          control={control}
          name="title"
          rules={{ required: '제목을 입력해주세요' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="제목"
              placeholder="일정 제목"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="allDay"
          render={({ field: { onChange, value } }) => (
            <View style={s.toggleRow}>
              <Text variant="bodySm" color="secondary">
                종일
              </Text>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{
                  false: theme.colors.border.default,
                  true: theme.colors.brand.primary,
                }}
                thumbColor={theme.colors.background.surface}
              />
            </View>
          )}
        />

        {!allDay && (
          <>
            <Controller
              control={control}
              name="startAt"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="시작"
                  placeholder="YYYY-MM-DDTHH:mm"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            <Controller
              control={control}
              name="endAt"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="종료"
                  placeholder="YYYY-MM-DDTHH:mm"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </>
        )}

        <Controller
          control={control}
          name="timezone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="시간대"
              placeholder="Asia/Seoul"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="location"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="장소"
              placeholder="장소 입력"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="메모"
              placeholder="메모 입력"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              style={s.noteInput}
            />
          )}
        />

        <View style={s.section}>
          <Text variant="bodySm" color="secondary" style={s.sectionLabel}>
            색상
          </Text>
          <Controller
            control={control}
            name="color"
            render={({ field: { onChange, value } }) => (
              <View style={s.colorRow}>
                {colorOptions.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => onChange(c)}
                    style={[
                      s.colorDot,
                      { backgroundColor: c },
                      value === c && s.colorDotSelected,
                    ]}
                  />
                ))}
              </View>
            )}
          />
        </View>

        <View style={s.section}>
          <Text variant="bodySm" color="secondary" style={s.sectionLabel}>
            알림
          </Text>
          <Controller
            control={control}
            name="remindMinutes"
            render={({ field: { onChange, value } }) => (
              <View style={s.remindRow}>
                {REMIND_OPTIONS.map((min) => (
                  <Pressable
                    key={min}
                    onPress={() => onChange(min)}
                    style={[
                      s.remindChip,
                      {
                        backgroundColor:
                          value === min
                            ? theme.colors.brand.primary
                            : theme.colors.background.surfaceAlt,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      style={{
                        color:
                          value === min
                            ? theme.colors.brand.onPrimary
                            : theme.colors.text.secondary,
                      }}
                    >
                      {min === 0 ? '없음' : `${min}분`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </View>

        <Button
          label={isUpdate ? '저장' : '만들기'}
          variant="primary"
          fullWidth
          loading={saving}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </BottomSheet>
  );
}

export function showConflictAlert(onRefresh: () => void) {
  Alert.alert(
    '충돌 발생',
    '최신 데이터로 다시 편집해주세요',
    [{ text: '확인', onPress: onRefresh }],
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: theme.space['6'],
      gap: theme.space['2'],
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.space['2'],
      marginBottom: theme.space['2'],
    },
    noteInput: {
      height: 80,
      textAlignVertical: 'top',
    },
    section: {
      marginBottom: theme.space['4'],
    },
    sectionLabel: {
      marginBottom: theme.space['2'],
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
    remindRow: {
      flexDirection: 'row',
      gap: theme.space['2'],
      flexWrap: 'wrap',
    },
    remindChip: {
      paddingHorizontal: theme.space['3'],
      paddingVertical: theme.space['2'],
      borderRadius: theme.radius.pill,
    },
  });

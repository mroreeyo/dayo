import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../theme/ThemeProvider';
import { Theme } from '../../theme/theme';
import { Text } from '../../ui/primitives/Text';
import { Button } from '../../ui/components/Button';
import { Input } from '../../ui/components/Input';
import { BottomSheet } from '../../ui/components/BottomSheet';
import { Chip } from '../../ui/components/Chip';

type InviteMode = 'generate' | 'join';

interface InviteFlowSheetProps {
  visible: boolean;
  onClose: () => void;
  calendarId?: string;
  onGenerateCode?: (calendarId: string) => Promise<string>;
  onJoinByCode?: (code: string) => Promise<void>;
}

export function InviteFlowSheet({
  visible,
  onClose,
  calendarId,
  onGenerateCode,
  onJoinByCode,
}: InviteFlowSheetProps) {
  const theme = useTheme();
  const s = getStyles(theme);

  const [mode, setMode] = useState<InviteMode>('generate');
  const [generatedCode, setGeneratedCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!calendarId || !onGenerateCode) return;
    setLoading(true);
    try {
      const code = await onGenerateCode(calendarId);
      setGeneratedCode(code);
    } catch {
      Alert.alert('오류', '초대 코드 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(generatedCode);
    Alert.alert('복사 완료', '초대 코드가 클립보드에 복사되었습니다');
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !onJoinByCode) return;
    setLoading(true);
    try {
      await onJoinByCode(joinCode.trim());
      Alert.alert('참여 완료', '캘린더에 참여했습니다');
      onClose();
    } catch {
      Alert.alert('오류', '유효하지 않은 초대 코드입니다');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGeneratedCode('');
    setJoinCode('');
    setMode('generate');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} title="초대">
      <View style={s.modeRow}>
        <Chip
          label="코드 생성"
          selected={mode === 'generate'}
          onPress={() => setMode('generate')}
        />
        <Chip
          label="코드로 참여"
          selected={mode === 'join'}
          onPress={() => setMode('join')}
        />
      </View>

      {mode === 'generate' ? (
        <View style={s.section}>
          {generatedCode ? (
            <View style={s.codeDisplay}>
              <Text variant="title" style={s.codeText}>
                {generatedCode}
              </Text>
              <Button
                label="복사"
                variant="secondary"
                icon="copy-outline"
                onPress={handleCopyCode}
                fullWidth
              />
            </View>
          ) : (
            <Button
              label="초대 코드 생성"
              variant="primary"
              icon="add-circle-outline"
              onPress={handleGenerate}
              loading={loading}
              fullWidth
            />
          )}
        </View>
      ) : (
        <View style={s.section}>
          <Input
            label="초대 코드"
            placeholder="초대 코드를 입력하세요"
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="characters"
          />
          <Button
            label="참여하기"
            variant="primary"
            onPress={handleJoin}
            loading={loading}
            disabled={!joinCode.trim()}
            fullWidth
          />
        </View>
      )}
    </BottomSheet>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    modeRow: {
      flexDirection: 'row',
      gap: theme.space['2'],
      marginBottom: theme.space['4'],
    },
    section: {
      gap: theme.space['4'],
    },
    codeDisplay: {
      alignItems: 'center',
      gap: theme.space['4'],
      padding: theme.space['4'],
      backgroundColor: theme.colors.background.surfaceAlt,
      borderRadius: theme.radius.md,
    },
    codeText: {
      letterSpacing: 4,
      color: theme.colors.brand.primary,
    },
  });

import React from 'react';
import { View, FlatList, StyleSheet, Alert, TextStyle } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { Theme } from '../../theme/theme';
import { Text } from '../../ui/primitives/Text';
import { Avatar } from '../../ui/components/Avatar';
import { Chip } from '../../ui/components/Chip';
import { Button } from '../../ui/components/Button';
import { Card } from '../../ui/components/Card';

type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

interface MemberItem {
  id: string;
  name: string;
  avatarUrl?: string;
  role: MemberRole;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: '소유자',
  ADMIN: '관리자',
  MEMBER: '멤버',
};

const STUB_MEMBERS: MemberItem[] = [
  { id: '1', name: '김민수', role: 'OWNER' },
  { id: '2', name: '이지은', role: 'ADMIN' },
  { id: '3', name: '박서준', role: 'MEMBER' },
];

export function MemberListScreen() {
  const { id: _calendarId } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const s = getStyles(theme);

  const members = STUB_MEMBERS;
  const currentUserRole: MemberRole = 'OWNER';

  const canManageRoles = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const handleRoleChange = (member: MemberItem) => {
    if (!canManageRoles || member.role === 'OWNER') return;

    const options: MemberRole[] = ['ADMIN', 'MEMBER'];
    Alert.alert(
      `${member.name} 역할 변경`,
      '새 역할을 선택하세요',
      [
        ...options.map((role) => ({
          text: ROLE_LABELS[role],
          onPress: () => {},
        })),
        { text: '취소', style: 'cancel' as const },
      ],
    );
  };

  const handleRemoveMember = (member: MemberItem) => {
    if (!canManageRoles || member.role === 'OWNER') return;

    Alert.alert(
      '멤버 제거',
      `${member.name}님을 캘린더에서 제거하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제거',
          style: 'destructive',
          onPress: () => {},
        },
      ],
    );
  };

  const renderMember = ({ item }: { item: MemberItem }) => (
    <Card
      style={s.memberCard}
      onPress={canManageRoles && item.role !== 'OWNER' ? () => handleRoleChange(item) : undefined}
    >
      <View style={s.memberRow}>
        <Avatar name={item.name} src={item.avatarUrl} size="md" />
        <View style={s.memberInfo}>
          <Text variant="body" style={s.memberName}>{item.name}</Text>
          <Chip label={ROLE_LABELS[item.role]} selected={item.role === 'OWNER'} />
        </View>
        {canManageRoles && item.role !== 'OWNER' && (
          <Button
            label="제거"
            variant="ghost"
            size="sm"
            icon="close-circle-outline"
            onPress={() => handleRemoveMember(item)}
          />
        )}
      </View>
    </Card>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text variant="title">멤버</Text>
        <Text variant="bodySm" color="muted">
          {members.length}명
        </Text>
      </View>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={s.list}
      />
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.space['4'],
    },
    list: {
      paddingHorizontal: theme.space['4'],
      gap: theme.space['2'],
      paddingBottom: theme.space['6'],
    },
    memberCard: {
      padding: theme.component.card.padding,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space['3'],
    },
    memberInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space['2'],
    },
    memberName: {
      fontWeight: theme.typography.weight.medium as TextStyle['fontWeight'],
    },
  });

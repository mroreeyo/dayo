import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../primitives/Text';
import { Icon, IconName } from '../primitives/Icon';

interface ChipProps {
  label: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, icon, selected = false, onPress, style }: ChipProps) {
  const t = useTheme();
  const s = styles(t);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.container,
        selected ? s.selected : s.unselected,
        pressed && (selected ? s.selectedPressed : s.unselectedPressed),
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size="sm"
          color={selected ? 'inverse' : 'secondary'}
          style={s.icon}
        />
      )}
      <Text
        variant="bodySm"
        style={[
          s.text,
          selected ? { color: t.colors.brand.onPrimary } : { color: t.colors.text.secondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = (t: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 32,
      paddingHorizontal: 12,
      borderRadius: t.radius.pill,
      borderWidth: 1,
    },
    selected: {
      backgroundColor: t.colors.brand.primary,
      borderColor: t.colors.brand.primary,
    },
    unselected: {
      backgroundColor: t.colors.background.surface,
      borderColor: t.colors.border.default,
    },
    selectedPressed: {
      backgroundColor: t.colors.brand.primaryPressed,
    },
    unselectedPressed: {
      backgroundColor: t.colors.background.surfaceAlt,
    },
    icon: {
      marginRight: 4,
    },
    text: {
      fontWeight: t.typography.weight.medium,
    },
  });

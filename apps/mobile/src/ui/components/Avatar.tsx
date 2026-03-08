import React from 'react';
import { View, Image, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../primitives/Text';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

export function Avatar({ src, name, size = 'md', style }: AvatarProps) {
  const t = useTheme();
  const s = styles(t);
  
  const sizeValue = t.component.avatar[size];
  const fontSize = size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'md' ? 14 : 16;

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.slice(0, 1).toUpperCase();
  };

  const getBackgroundColor = (name?: string) => {
    if (!name) return t.colors.brand.primarySoft;
    const colors = t.colors.calendar.calendarColorOptions;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <View
      style={[
        s.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor: src ? t.colors.background.surface : getBackgroundColor(name),
        },
        style,
      ]}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={{
            width: sizeValue,
            height: sizeValue,
            borderRadius: sizeValue / 2,
          }}
        />
      ) : (
        <Text
          style={{
            fontSize,
            fontWeight: t.typography.weight.medium as TextStyle['fontWeight'],
            color: t.colors.brand.onPrimary,
          }}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = (t: any) =>
  StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.colors.background.surface,
    },
  });

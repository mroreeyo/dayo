import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar } from './Avatar';
import { Text } from '../primitives/Text';

interface AvatarStackProps {
  avatars: Array<{ src?: string; name?: string }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function AvatarStack({ avatars, max = 3, size = 'md', style }: AvatarStackProps) {
  const t = useTheme();
  const s = styles(t);
  
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;
  const sizeValue = t.component.avatar[size];

  return (
    <View style={[s.container, style]}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={avatar.src || avatar.name || index}
          style={[
            s.avatarWrapper,
            { 
              zIndex: visibleAvatars.length - index,
              marginLeft: index === 0 ? 0 : -8,
            }
          ]}
        >
          <Avatar src={avatar.src} name={avatar.name} size={size} />
        </View>
      ))}
      
      {remaining > 0 && (
        <View
          style={[
            s.remaining,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
              marginLeft: -8,
              zIndex: 0,
            }
          ]}
        >
          <Text variant="caption" style={s.remainingText}>
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = (t: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarWrapper: {
    },
    remaining: {
      backgroundColor: t.colors.background.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.colors.background.surface,
    },
    remainingText: {
      color: t.colors.text.secondary,
      fontSize: 10,
      fontWeight: '600',
    },
  });

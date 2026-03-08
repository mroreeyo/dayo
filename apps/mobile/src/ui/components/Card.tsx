import React from 'react';
import { View, ViewProps, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface CardProps extends ViewProps {
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({ style, onPress, variant = 'default', ...props }: CardProps) {
  const t = useTheme();
  const s = styles(t);

  const cardStyle = [
    s.card,
    variant === 'outlined' && s.outlined,
    variant === 'elevated' && s.elevated,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] },
        ]}
        {...props}
      >
        {props.children}
      </Pressable>
    );
  }

  return <View {...props} style={cardStyle} />;
}

const styles = (t: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.background.surface,
      borderRadius: t.component.card.radius,
      padding: t.component.card.padding,
      borderWidth: 1,
      borderColor: t.colors.border.default,
      ...t.elevation['1'].ios,
      elevation: t.elevation['1'].android.elevation,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: t.colors.border.default,
      borderWidth: 1,
      shadowOpacity: 0,
      elevation: 0,
    },
    elevated: {
      backgroundColor: t.colors.background.surface,
      borderWidth: 0,
      ...t.elevation['2'].ios,
      elevation: t.elevation['2'].android.elevation,
    },
  });

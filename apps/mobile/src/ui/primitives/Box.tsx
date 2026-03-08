import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Theme } from '../../theme/theme';

export interface BoxProps extends ViewProps {
  backgroundColor?: keyof Theme['colors']['background'];
}

export function Box({ style, backgroundColor, ...props }: BoxProps) {
  const theme = useTheme();
  const styles = getStyles();

  return (
    <View
      {...props}
      style={[
        styles.base,
        backgroundColor && { backgroundColor: theme.colors.background[backgroundColor] },
        style,
      ]}
    />
  );
}

const getStyles = () =>
  StyleSheet.create({
    base: {},
  });

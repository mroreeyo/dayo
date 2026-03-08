import React from 'react';
import { Text as RNText, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Theme } from '../../theme/theme';

type Variant = 'display' | 'title' | 'titleSm' | 'body' | 'bodySm' | 'caption';
type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'link';

export interface ThemedTextProps extends TextProps {
  variant?: Variant;
  color?: TextColor;
}

export function Text({
  variant = 'body',
  color = 'primary',
  style,
  ...props
}: ThemedTextProps) {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <RNText
      {...props}
      style={[
        styles.base,
        styles[variant],
        { color: theme.colors.text[color] },
        style,
      ]}
    />
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      letterSpacing: theme.typography.letterSpacing.default,
      fontFamily: theme.typography.fontFamily.base.ios,
    },
    display: {
      fontSize: theme.typography.size.display,
      lineHeight: theme.typography.lineHeight.display,
      fontWeight: theme.typography.weight.bold as TextStyle['fontWeight'],
    },
    title: {
      fontSize: theme.typography.size.title,
      lineHeight: theme.typography.lineHeight.title,
      fontWeight: theme.typography.weight.semibold as TextStyle['fontWeight'],
    },
    titleSm: {
      fontSize: theme.typography.size.titleSm,
      lineHeight: theme.typography.lineHeight.titleSm,
      fontWeight: theme.typography.weight.semibold as TextStyle['fontWeight'],
    },
    body: {
      fontSize: theme.typography.size.body,
      lineHeight: theme.typography.lineHeight.body,
      fontWeight: theme.typography.weight.regular as TextStyle['fontWeight'],
    },
    bodySm: {
      fontSize: theme.typography.size.bodySm,
      lineHeight: theme.typography.lineHeight.bodySm,
      fontWeight: theme.typography.weight.regular as TextStyle['fontWeight'],
    },
    caption: {
      fontSize: theme.typography.size.caption,
      lineHeight: theme.typography.lineHeight.caption,
      fontWeight: theme.typography.weight.regular as TextStyle['fontWeight'],
    },
  });

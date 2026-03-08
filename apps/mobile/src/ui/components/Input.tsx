import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../primitives/Text';
import { Theme } from '../../theme/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="bodySm" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={theme.colors.text.placeholder}
        {...props}
      />
      {error && (
        <Text variant="caption" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.space[4],
    },
    label: {
      marginBottom: theme.space[1],
      fontWeight: theme.typography.weight.medium as TextStyle['fontWeight'],
    },
    input: {
      height: theme.component.input.height,
      borderRadius: theme.component.input.radius,
      paddingHorizontal: theme.component.input.paddingX,
      backgroundColor: theme.colors.background.surface,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      color: theme.colors.text.primary,
      fontSize: theme.typography.size.body,
      fontFamily: theme.typography.fontFamily.base.ios,
    },
    inputError: {
      borderColor: theme.colors.state.danger,
    },
    errorText: {
      marginTop: theme.space[1],
      color: theme.colors.state.danger,
    },
  });

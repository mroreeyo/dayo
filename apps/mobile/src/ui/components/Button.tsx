import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  PressableProps,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../primitives/Text';
import { Icon, IconName, IconColor, IconSize } from '../primitives/Icon';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const t = useTheme();
  const s = styles(t);

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return t.colors.border.subtle;
    
    switch (variant) {
      case 'primary':
        return pressed ? t.colors.brand.primaryPressed : t.colors.brand.primary;
      case 'secondary':
        return pressed ? t.colors.brand.primarySoft : t.colors.brand.primarySoft;
      case 'danger':
        return t.colors.state.danger;
      case 'outline':
      case 'ghost':
        return pressed ? t.colors.brand.primarySoft : 'transparent';
      default:
        return t.colors.brand.primary;
    }
  };

  const textColor = variant === 'secondary' ? t.colors.brand.primary : 
                   (variant === 'outline' || variant === 'ghost') ? t.colors.text.primary :
                   undefined;

  const getIconColor = (): IconColor => {
    if (variant === 'secondary') return 'brand';
    if (variant === 'outline' || variant === 'ghost') return 'secondary';
    return 'inverse';
  };

  const iconSize: IconSize = size === 'sm' ? 'sm' : 'md';

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.base,
        s[size],
        fullWidth && s.fullWidth,
        { backgroundColor: getBackgroundColor(pressed) },
        variant === 'outline' && s.outline,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? t.colors.brand.primary : t.colors.brand.onPrimary} 
          size="small" 
        />
      ) : (
        <View style={s.content}>
          {icon && iconPosition === 'left' && (
            <Icon name={icon} size={iconSize} color={getIconColor()} style={s.iconLeft} />
          )}
          <Text
            variant={size === 'sm' ? 'bodySm' : 'body'}
            style={[
              s.text,
              textColor ? { color: textColor } : { color: t.colors.brand.onPrimary },
              (variant === 'outline' || variant === 'ghost') && { color: t.colors.text.primary },
              variant === 'danger' && { color: t.colors.brand.onPrimary },
              disabled && { color: t.colors.text.muted },
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Icon name={icon} size={iconSize} color={getIconColor()} style={s.iconRight} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = (t: any) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: t.component.button.radius,
    },
    md: {
      height: t.component.button.height,
      paddingHorizontal: t.component.button.paddingX,
    },
    sm: {
      height: 36,
      paddingHorizontal: 12,
    },
    fullWidth: {
      width: '100%',
    },
    outline: {
      borderWidth: 1,
      borderColor: t.colors.border.default,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    text: {
      fontWeight: t.typography.weight.medium,
      textAlign: 'center',
    },
    iconLeft: {
      marginRight: 8,
    },
    iconRight: {
      marginLeft: 8,
    },
  });

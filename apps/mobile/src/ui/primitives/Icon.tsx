import { StyleProp, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Theme } from '../../theme/theme';

export type IconName = keyof typeof Ionicons.glyphMap;
export type IconSize = 'sm' | 'md' | 'lg';
export type IconColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'brand' | 'danger' | 'warning' | 'success' | 'info';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: IconColor;
  style?: StyleProp<TextStyle>;
}

export function Icon({
  name,
  size = 'md',
  color = 'primary',
  style,
}: IconProps) {
  const theme = useTheme();
  
  const iconSize = theme.component.icon[size];
  const iconColor = getColor(theme, color);

  return (
    <Ionicons
      name={name}
      size={iconSize}
      color={iconColor}
      style={style}
    />
  );
}

function getColor(theme: Theme, color: IconColor): string {
  switch (color) {
    case 'primary':
    case 'secondary':
    case 'muted':
    case 'inverse':
      return theme.colors.text[color];
    case 'brand':
      return theme.colors.brand.primary;
    case 'danger':
    case 'warning':
    case 'success':
    case 'info':
      return theme.colors.state[color];
    default:
      return theme.colors.text.primary;
  }
}

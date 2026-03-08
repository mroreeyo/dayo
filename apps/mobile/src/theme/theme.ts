import tokens from './tokens.calm-mint.json';

export type DesignTokens = typeof tokens;

export const theme = {
  tokens,
  colors: tokens.color.semantic,
  space: tokens.space,
  radius: tokens.radius,
  typography: tokens.typography,
  elevation: tokens.elevation,
  component: tokens.component,
} as const;

export type Theme = typeof theme;

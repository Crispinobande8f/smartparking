export const Colors = {
  // Brand
  primary: '#0D2137',
  primaryLight: '#1A3A6B',
  accent: '#00C896',
  accentDark: '#00A87E',

  // Status
  free: '#00C896',
  taken: '#E63946',
  reserved: '#F4A261',
  leaving: '#3A86FF',

  // Neutrals
  white: '#FFFFFF',
  background: '#EFF3F8',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0D2137',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  inputBg: '#F5F7FA',

  // Overlays
  overlay: 'rgba(13, 33, 55, 0.5)',
};

export const Fonts = {
  regular: 'Lexend',
  medium: 'Lexend',
  bold: 'Lexend',
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
};


import { Dimensions, Platform } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
export const scale = (size: number) => (W / 375) * size;

export const colors = {
  navy: '#0F2D5E',
  navyLight: '#1A4A8A',
  dark: '#1A1A2E',
  green: '#00C48C',
  greenLight: '#E8FBF5',
  amber: '#F5A623',
  amberLight: '#FEF6E7',
  red: '#E84040',
  redLight: '#FDEAEA',
  white: '#FFFFFF',
  surface: '#F7F8FA',
  border: '#ECEEF2',
  textPrimary: '#1A1A2E',
  textSecondary: '#8A94A6',
  textMuted: '#B0B7C3',
};

export const shadows = {
  card: {
    shadowColor: '#0F2D5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  strong: {
    shadowColor: '#0F2D5E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const layout = { W, H };

//admin themes 
export const W_SCREEN = W;

//county data themes
export const C = {
  navy: '#0F2D5E', navyLight: '#1A4A8A', dark: '#1A1A2E',
  green: '#00C48C', greenLight: '#E8FBF5',
  amber: '#F5A623', amberLight: '#FFF3CD',
  red: '#E84040',  redLight: '#FDEAEA',
  white: '#FFFFFF', surface: '#F7F8FA',
  border: '#ECEEF2',
  textPrimary: '#1A1A2E', textSecondary: '#8A94A6', textMuted: '#B0B7C3',
};
 
export const shadow = {
  shadowColor: '#0F2D5E', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
};
 
export const shadowStrong = {
  shadowColor: '#0F2D5E', shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.13, shadowRadius: 20, elevation: 8,
};
 
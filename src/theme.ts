import { useColorScheme } from 'react-native';

/**
 * Tasarım dili: "yarışma kartı".
 * Derin mürekkep laciverdi zemin üzerinde, her kategori kendi rengini taşır.
 * Tek vurgu rengi ayçiçeği sarısı: puan, süre ve kazanç anlarında görünür.
 */
const light = {
  bg: '#F2F1F8',
  surface: '#FFFFFF',
  surfaceMuted: '#E7E5F3',
  ink: '#1B1840',
  inkSoft: '#5B5880',
  border: '#D8D5EA',
  hero: '#211C52',
  heroInk: '#FFFFFF',
  heroInkSoft: '#B9B4E6',
  accent: '#FFC83D',
  accentInk: '#2A1E00',
  correct: '#1F9D63',
  correctBg: '#DDF5E9',
  wrong: '#D6334A',
  wrongBg: '#FBE1E5',
};

const dark: typeof light = {
  bg: '#121029',
  surface: '#1C1940',
  surfaceMuted: '#27234F',
  ink: '#F1F0FA',
  inkSoft: '#A7A3CC',
  border: '#332E63',
  hero: '#211C52',
  heroInk: '#FFFFFF',
  heroInkSoft: '#B9B4E6',
  accent: '#FFC83D',
  accentInk: '#2A1E00',
  correct: '#3CCB86',
  correctBg: '#123A2B',
  wrong: '#FF6B7F',
  wrongBg: '#43182A',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const fonts = {
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  heavy: 'BricolageGrotesque_800ExtraBold',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

/** İçerik genişliği: web'de geniş ekranlarda ortalanır, telefonda tam genişlik */
export const MAX_WIDTH = 640;

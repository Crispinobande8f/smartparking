/**
 * ─────────────────────────────────────────────────────────
 *  LEXEND FONT SETUP  —  3 steps
 * ─────────────────────────────────────────────────────────
 *
 *  STEP 1 — Install
 *  ─────────────────
 *  npx expo install @expo-google-fonts/lexend expo-font
 *
 *
 *  STEP 2 — Load in app/_layout.tsx
 *  ──────────────────────────────────
 */

// app/_layout.tsx  (replace or merge with your existing layout)
import * as React from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import {
  useFonts,
  Lexend_400Regular,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Lexend_400Regular,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return React.createElement(Stack);
}



/**
 *  STEP 3 — Reference in constants/theme.ts
 *  ──────────────────────────────────────────
 */

// constants/theme.ts
export const Fonts = {
  regular:   'Lexend_400Regular',
  semiBold:  'Lexend_600SemiBold',
  bold:      'Lexend_700Bold',

  // aliases for existing usages in your codebase
  rounded:   'Lexend_700Bold',
  mono:      'Lexend_400Regular',   // swap for a mono font if you need actual code display
};


/**
 *  USAGE in any component:
 *
 *  import { Fonts } from '@/constants/theme';
 *
 *  <Text style={{ fontFamily: Fonts.bold, fontSize: 20 }}>
 *    Hello Parking
 *  </Text>
 */
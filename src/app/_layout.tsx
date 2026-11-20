import '../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaListener, SafeAreaProvider } from 'react-native-safe-area-context';
import { Uniwind, useResolveClassNames, useUniwind } from 'uniwind';

import { AppProviders } from '@/AppProviders';
import { isWeb } from '@/storage/backends';

// Native deep links into an inner route still get the cluster list beneath them. Web loads routes
// on demand, where the anchor doesn't apply; `goBack` falls back to the cluster list there.
export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const { theme } = useUniwind();
  const background = useResolveClassNames('bg-background').backgroundColor;
  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  // On web, screens stay transparent so the className below paints the background: pure CSS, so
  // the pre-rendered page follows the system theme. Values resolved in JS are the light theme
  // during static rendering.
  const navigationTheme: Theme = {
    ...base,
    colors: { ...base.colors, background: isWeb ? 'transparent' : String(background ?? base.colors.background) },
  };

  // Native: the root view behind the app (visible during transitions and keyboard animations)
  // follows the theme too. Web paints it with CSS.
  useEffect(() => {
    if (!isWeb && background != null) void SystemUI.setBackgroundColorAsync(String(background));
  }, [theme, background]);

  return (
    <SafeAreaProvider>
      {/* Feeds the safe-area insets to Uniwind's `*-safe` classes: each screen header pads the
          top with `pt-safe` so its colour runs under the status bar, and scrolling content pads its
          end with `pb-safe-offset-*` so it scrolls under the home indicator. */}
      <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
        <AppProviders>
          <ThemeProvider value={navigationTheme}>
            <View className="bg-background px-safe flex-1">
              <Stack screenOptions={{ headerShown: false }} />
            </View>
          </ThemeProvider>
          {/* Inside the providers: portalled dialogs use React Query. */}
          <PortalHost />
        </AppProviders>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}

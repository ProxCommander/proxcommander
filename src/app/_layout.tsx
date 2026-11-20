import '../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useResolveClassNames, useUniwind } from 'uniwind';

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

  return (
    <SafeAreaProvider>
      <AppProviders>
        <ThemeProvider value={navigationTheme}>
          <View className="bg-background flex-1">
            <SafeAreaView style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }} />
            </SafeAreaView>
          </View>
        </ThemeProvider>
        {/* Inside the providers: portalled dialogs use React Query. */}
        <PortalHost />
      </AppProviders>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

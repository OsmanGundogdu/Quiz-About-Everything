import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider } from '@/context/AuthContext';
import { fonts, useColors } from '@/theme';

export default function RootLayout() {
  const c = useColors();
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.hero }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.hero },
          headerTintColor: c.heroInk,
          headerTitleStyle: { fontFamily: fonts.bold },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Quiz About Everything' }} />
        <Stack.Screen name="login" options={{ headerShown: false, title: 'Giriş yap' }} />
        <Stack.Screen name="quiz/[categoryId]" options={{ title: 'Quiz' }} />
        <Stack.Screen name="leaderboard" options={{ title: 'Liderlik tablosu' }} />
        <Stack.Screen name="profile" options={{ title: 'Profilim' }} />
      </Stack>
    </AuthProvider>
  );
}

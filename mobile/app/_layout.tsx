import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import ProtectedRoute from '../components/ProtectedRoute';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4A90D9',
    secondary: '#34C759',
  },
};

export default function RootLayout() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <ProtectedRoute>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="business/register" options={{ headerShown: true, title: 'Registrar comercio' }} />
          <Stack.Screen name="business/[id]" options={{ headerShown: true, title: 'Detalle' }} />
          <Stack.Screen name="admin" options={{ headerShown: true, title: 'Administración' }} />
        </Stack>
      </ProtectedRoute>
    </PaperProvider>
  );
}

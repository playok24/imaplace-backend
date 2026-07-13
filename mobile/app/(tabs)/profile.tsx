import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Surface, Button, Avatar, List, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    user: 'Viajero',
    admin: 'Administrador',
    business_owner: 'Comerciante',
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Avatar.Text size={64} label={user.name.substring(0, 2).toUpperCase()} />
        <Text variant="headlineSmall" style={styles.name}>{user.name}</Text>
        <Text variant="bodyMedium" style={styles.role}>{roleLabels[user.role] || user.role}</Text>
        <Text variant="bodySmall" style={styles.email}>{user.email}</Text>
      </Surface>

      <Surface style={styles.menu} elevation={1}>
        {user.role === 'business_owner' && (
          <>
            <List.Item
              title="Mis comercios"
              description="Gestioná tus comercios registrados"
              left={(props) => <List.Icon {...props} icon="store" />}
              onPress={() => router.push('/business/register')}
            />
            <Divider />
          </>
        )}

        {user.role === 'admin' && (
          <>
            <List.Item
              title="Panel de administración"
              description="Gestioná usuarios, comercios y suscripciones"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              onPress={() => router.push('/admin')}
            />
            <Divider />
          </>
        )}

        <List.Item
          title="Cerrar sesión"
          left={(props) => <List.Icon {...props} icon="logout" />}
          onPress={handleLogout}
        />
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  name: { fontWeight: 'bold', marginTop: 12 },
  role: { color: '#4A90D9', fontWeight: '600', marginTop: 4 },
  email: { color: '#888', marginTop: 4 },
  menu: { margin: 16, borderRadius: 12, backgroundColor: 'white' },
});

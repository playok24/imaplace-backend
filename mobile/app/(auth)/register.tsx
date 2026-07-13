import { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'business_owner'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Completá todos los campos requeridos'); return; }
    setLoading(true);
    setError('');
    try {
      await register(email, password, name, role);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Surface style={styles.card} elevation={2}>
        <Text variant="headlineMedium" style={styles.title}>Crear cuenta</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <SegmentedButtons
          value={role}
          onValueChange={(val) => setRole(val as 'user' | 'business_owner')}
          buttons={[
            { value: 'user', label: 'Viajero' },
            { value: 'business_owner', label: 'Comerciante' },
          ]}
          style={styles.segment}
        />

        <TextInput label="Nombre" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" mode="outlined" style={styles.input} />
        <TextInput label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" mode="outlined" style={styles.input} />
        <TextInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" style={styles.input} />

        <Button mode="contained" onPress={handleRegister} loading={loading} disabled={loading} style={styles.button}>
          Crear cuenta
        </Button>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  card: { padding: 24, borderRadius: 16, backgroundColor: 'white' },
  title: { textAlign: 'center', fontWeight: 'bold', marginBottom: 16 },
  error: { color: '#D32F2F', marginBottom: 12, textAlign: 'center' },
  segment: { marginBottom: 16 },
  input: { marginBottom: 10 },
  button: { marginTop: 8, paddingVertical: 6 },
  link: { textAlign: 'center', marginTop: 16, color: '#4A90D9' },
});

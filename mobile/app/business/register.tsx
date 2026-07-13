import { useState } from 'react';
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, SegmentedButtons } from 'react-native-paper';
import MapViewWrapper from '../../components/MapViewWrapper';
import * as businessService from '../../services/business';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { BusinessFormData } from '../../types';

const CATEGORIES = [
  'Restaurante', 'Cafetería', 'Tienda', 'Farmacia', 'Taller',
  'Supermercado', 'Indumentaria', 'Electrónica', 'Otro',
];

export default function RegisterBusinessScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<BusinessFormData>({
    name: '',
    description: '',
    category: '',
    latitude: -34.6037,
    longitude: -58.3816,
    address: '',
    phone: '',
    website: '',
  });

  const updateForm = (key: keyof BusinessFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMapPress = (lat: number, lng: number) => {
    updateForm('latitude', lat);
    updateForm('longitude', lng);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category) { setError('Completá nombre y categoría'); return; }
    setLoading(true);
    setError('');
    try {
      const { initPoint } = await businessService.createBusiness(form);
      if (initPoint) {
        await WebBrowser.openAuthSessionAsync(initPoint, 'mapsinteractive://business/success');
      }
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear comercio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleLarge" style={styles.title}>Registrar comercio</Text>
          <Text variant="bodySmall" style={styles.subtitle}>Suscripción $5.500 ARS/mes</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {step === 1 && (
            <>
              <TextInput label="Nombre del comercio" value={form.name} onChangeText={(v) => updateForm('name', v)} mode="outlined" style={styles.input} />
              <TextInput label="Descripción" value={form.description} onChangeText={(v) => updateForm('description', v)} mode="outlined" multiline numberOfLines={3} style={styles.input} />
              <Text variant="bodyMedium" style={styles.label}>Categoría</Text>
              <SegmentedButtons
                value={form.category}
                onValueChange={(v) => updateForm('category', v)}
                buttons={CATEGORIES.slice(0, 4).map((c) => ({ value: c, label: c }))}
              />
              <SegmentedButtons
                value={form.category}
                onValueChange={(v) => updateForm('category', v)}
                buttons={CATEGORIES.slice(4).map((c) => ({ value: c, label: c }))}
              />
              <TextInput label="Teléfono" value={form.phone} onChangeText={(v) => updateForm('phone', v)} mode="outlined" keyboardType="phone-pad" style={styles.input} />
              <TextInput label="Sitio web" value={form.website} onChangeText={(v) => updateForm('website', v)} mode="outlined" style={styles.input} />
              <Button mode="contained" onPress={() => setStep(2)} style={styles.button}>Siguiente</Button>
            </>
          )}

          {step === 2 && (
            <>
              <Text variant="bodyMedium" style={styles.label}>Seleccioná la ubicación en el mapa</Text>
              <TextInput label="Dirección" value={form.address} onChangeText={(v) => updateForm('address', v)} mode="outlined" style={styles.input} />
              <MapViewWrapper
                style={styles.map}
                selectedLocation={{ lat: form.latitude, lng: form.longitude }}
                onMapPress={handleMapPress}
              />
              <Text variant="bodySmall" style={styles.coords}>
                {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
              </Text>
              <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.button}>
                Confirmar y pagar ($5.500/mes)
              </Button>
            </>
          )}
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  card: { padding: 20, borderRadius: 16, backgroundColor: 'white' },
  title: { fontWeight: 'bold', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#4A90D9', marginBottom: 16 },
  error: { color: '#D32F2F', marginBottom: 8, textAlign: 'center' },
  label: { marginBottom: 8, fontWeight: '600' },
  input: { marginBottom: 12 },
  map: { height: 300, borderRadius: 12, marginBottom: 8 },
  coords: { textAlign: 'center', color: '#888', marginBottom: 12 },
  button: { marginTop: 8, paddingVertical: 6 },
});

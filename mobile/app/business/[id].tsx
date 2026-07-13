import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Surface, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import MapViewWrapper from '../../components/MapViewWrapper';
import * as businessService from '../../services/business';
import { Business } from '../../types';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await businessService.getBusinessById(id!);
        setBusiness(data);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (!business) {
    return <Text style={styles.notFound}>Comercio no encontrado</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.card} elevation={1}>
        <Text variant="headlineSmall" style={styles.name}>{business.name}</Text>
        {business.category && <Chip style={styles.chip}>{business.category}</Chip>}
        {business.description && <Text variant="bodyMedium" style={styles.desc}>{business.description}</Text>}
        {business.phone && (
          <Button icon="phone" mode="text" onPress={() => Linking.openURL(`tel:${business.phone}`)}>
            {business.phone}
          </Button>
        )}
        {business.address && <Text variant="bodySmall" style={styles.address}>{business.address}</Text>}
        {business.website && (
          <Button icon="web" mode="text" onPress={() => Linking.openURL(business.website!)}>
            Visitar sitio web
          </Button>
        )}
      </Surface>

      <Surface style={styles.mapCard} elevation={1}>
        <Text variant="titleSmall" style={styles.mapTitle}>Ubicación</Text>
        <MapViewWrapper
          style={styles.map}
          businesses={[business]}
        />
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center' },
  notFound: { textAlign: 'center', marginTop: 40, color: '#888' },
  card: { margin: 16, padding: 20, borderRadius: 16, backgroundColor: 'white' },
  name: { fontWeight: 'bold', marginBottom: 8 },
  chip: { alignSelf: 'flex-start', marginBottom: 12 },
  desc: { marginBottom: 12, lineHeight: 22 },
  address: { color: '#666', marginBottom: 8 },
  mapCard: { margin: 16, padding: 16, borderRadius: 16, backgroundColor: 'white' },
  mapTitle: { marginBottom: 12, fontWeight: '600' },
  map: { height: 250, borderRadius: 12 },
});

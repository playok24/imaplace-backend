import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, Linking, View } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { NearbyTouristPoint, TouristPoint } from '../types';

interface Props {
  point: (NearbyTouristPoint | TouristPoint) | null;
  onClose: () => void;
  onNavigate?: (lat: number, lng: number, name: string) => void;
}

export default function TouristPointPopup({ point, onClose, onNavigate }: Props) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (point) {
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        mass: 1,
        stiffness: 150,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [point]);

  if (!point) return null;

  const distance = 'distance' in point ? point.distance : null;
  const importanceLabel: Record<string, string> = {
    'must-see': 'Imperdible',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  };
  const importanceBg: Record<string, string> = {
    'must-see': '#C62828',
    high: '#E65100',
    medium: '#1565C0',
    low: '#888',
  };

  const lat = 'location' in point ? point.location.lat : point.latitude;
  const lng = 'location' in point ? point.location.lng : point.longitude;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <Card style={styles.card} elevation={5}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.name}>
              {point.name}
            </Text>
            {point.importance && (
              <View style={[styles.importanceBadge, { backgroundColor: importanceBg[point.importance] || '#888' }]}>
                <Text style={styles.importanceText}>{importanceLabel[point.importance] || point.importance}</Text>
              </View>
            )}
          </View>
          <Text variant="labelMedium" style={styles.category}>
            {point.category}
          </Text>
          {distance !== null && (
            <Text variant="bodyMedium" style={styles.distance}>
              A {distance}m de tu ubicación
            </Text>
          )}
          {point.description ? (
            <Text variant="bodySmall" style={styles.desc} numberOfLines={2}>
              {point.description}
            </Text>
          ) : null}
          <View style={styles.meta}>
            {'estimated_duration_minutes' in point && point.estimated_duration_minutes ? (
              <Text style={styles.metaText}>Duración: {point.estimated_duration_minutes} min</Text>
            ) : null}
            {'is_free' in point && point.is_free ? (
              <Text style={styles.metaFree}>Gratis</Text>
            ) : null}
          </View>
          {'tips' in point && point.tips ? (
            <Text variant="bodySmall" style={styles.tips}>💡 {point.tips}</Text>
          ) : null}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => onNavigate?.(lat, lng, point.name)}
            >
              <Text style={styles.btnText}>Cómo llegar</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  importanceText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  category: {
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 4,
  },
  distance: {
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  desc: {
    color: '#555',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  metaFree: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  tips: {
    color: '#FF9800',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    backgroundColor: '#4A90D9',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnText: {
    color: 'white',
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: '#FF9800',
  },
});

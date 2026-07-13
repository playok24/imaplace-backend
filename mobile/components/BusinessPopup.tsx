import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { View } from 'react-native';
import { NearbyBusiness } from '../types';

interface Props {
  business: NearbyBusiness | null;
  onClose: () => void;
  onViewDetails: (id: string) => void;
  onNavigate?: (lat: number, lng: number, name: string) => void;
}

export default function BusinessPopup({ business, onClose, onViewDetails, onNavigate }: Props) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (business) {
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
  }, [business]);

  if (!business) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <Card style={styles.card} elevation={5}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Card.Content>
          <Text variant="titleMedium" style={styles.name}>
            {business.name}
          </Text>
          {business.category && (
            <Text variant="labelMedium" style={styles.category}>
              {business.category}
            </Text>
          )}
          <Text variant="bodyMedium" style={styles.distance}>
            A {business.distance}m de tu ubicación
          </Text>
          {business.description && (
            <Text variant="bodySmall" style={styles.desc} numberOfLines={2}>
              {business.description}
            </Text>
          )}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => onViewDetails(business.id)}
            >
              <Text style={styles.btnText}>Ver más</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => onNavigate?.(business.lat, business.lng, business.name)}
            >
              <Text style={styles.btnText}>Cómo llegar</Text>
            </TouchableOpacity>
            {business.website && (
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => Linking.openURL(business.website!)}
              >
                <Text style={[styles.btnText, styles.btnSecondaryText]}>Sitio web</Text>
              </TouchableOpacity>
            )}
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
  name: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  category: {
    color: '#666',
    marginBottom: 4,
  },
  distance: {
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  desc: {
    color: '#555',
    marginBottom: 12,
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
    backgroundColor: '#34C759',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A90D9',
  },
  btnSecondaryText: {
    color: '#4A90D9',
  },
});

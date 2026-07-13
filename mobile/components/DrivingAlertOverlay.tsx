import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, Platform, Vibration, View } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import * as Speech from 'expo-speech';
import { NearbyBusiness } from '../types';

interface Props {
  business: NearbyBusiness | null;
  onDismiss: () => void;
  onNavigate: () => void;
}

const ALERT_SOUND = require('../assets/alert.mp3');

export default function DrivingAlertOverlay({ business, onDismiss, onNavigate }: Props) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const audioRef = useRef<any>(null);

  useEffect(() => {
    if (!business) {
      slideAnim.setValue(300);
      opacityAnim.setValue(0);
      return;
    }

    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 500, 200, 500]);
    }

    Speech.speak(`${business.name} está a ${business.distance} metros. ${business.category}`, {
      language: 'es-AR',
      pitch: 1.0,
      rate: 0.9,
    });

    const audio = new Audio(ALERT_SOUND);
    audioRef.current = audio;
    audio.play().catch(() => {});

    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      animateOut();
    }, 15000);

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [business]);

  const animateOut = () => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 300, damping: 20, stiffness: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!business) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      <Card style={styles.card} elevation={8}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.name}>
              {business.name}
            </Text>
            <TouchableOpacity onPress={animateOut} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text variant="labelMedium" style={styles.category}>
            {business.category} · {business.distance}m
          </Text>
          {business.description && (
            <Text variant="bodySmall" style={styles.desc} numberOfLines={2}>
              {business.description}
            </Text>
          )}
          <View style={styles.actions}>
            <Button mode="text" onPress={animateOut} style={styles.dismissBtn}>
              Descartar
            </Button>
            <Button mode="contained" onPress={() => { animateOut(); setTimeout(onNavigate, 300); }} style={styles.navigateBtn}>
              Cómo llegar
            </Button>
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
    zIndex: 2000,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: { fontWeight: 'bold', flex: 1 },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 18, color: '#666' },
  category: { color: '#F44336', fontWeight: '600', marginBottom: 4 },
  desc: { color: '#555', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  dismissBtn: { flex: 1, backgroundColor: 'transparent' },
  navigateBtn: { flex: 1, backgroundColor: '#F44336' },
});
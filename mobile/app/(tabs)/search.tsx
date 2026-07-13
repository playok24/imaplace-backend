import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, ScrollView, TouchableOpacity, FlatList, Keyboard,
} from 'react-native';
import { TextInput, Button, Text, Surface, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';
import MapViewWrapper from '../../components/MapViewWrapper';
import { getRoute } from '../../services/routing';
import { searchPlaces, reverseGeocode } from '../../services/geocoding';
import { useRoutingStore } from '../../stores/routingStore';
import type { GeocodingResult } from '../../services/geocoding';
import type { RouteStep } from '../../stores/routingStore';

export default function SearchScreen() {
  const {
    origin, destination, routeGeoJSON, routeInfo, profile,
    setOrigin, setDestination, setRoute, setProfile, clearRoute,
  } = useRoutingStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [originText, setOriginText] = useState('Ubicación actual');
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (destination && !searchQuery) {
      setSearchQuery(destination.name || '');
    }
  }, [destination]);

  const handleSearchInput = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchPlaces(text);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSearchLoading(false);
    }, 400);
  };

  const selectSuggestion = (item: GeocodingResult) => {
    setSearchQuery(item.displayName.split(',')[0]);
    setShowSuggestions(false);
    setDestination({ lat: item.lat, lng: item.lng, name: item.displayName.split(',')[0] });
    Keyboard.dismiss();
  };

  const setCurrentLocationAsOrigin = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = loc.coords;
    setOrigin({ lat: latitude, lng: longitude, name: 'Mi ubicación' });
    const addr = await reverseGeocode(latitude, longitude);
    setOriginText(addr.split(',')[0] || 'Mi ubicación');
  };

  const handleMapPress = async (lat: number, lng: number) => {
    if (!origin) {
      setOrigin({ lat, lng, name: 'Origen' });
      const addr = await reverseGeocode(lat, lng);
      setOriginText(addr.split(',')[0] || 'Origen');
    } else {
      setDestination({ lat, lng, name: 'Destino' });
      const addr = await reverseGeocode(lat, lng);
      setSearchQuery(addr.split(',')[0] || 'Destino');
    }
  };

  const calculateRoute = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    const result = await getRoute(origin.lat, origin.lng, destination.lat, destination.lng, profile);
    if (result) {
      setRoute(
        { type: 'Feature', properties: {}, geometry: JSON.parse(result.geometry) },
        { distance: result.distance, duration: result.duration, steps: result.steps },
      );
    }
    setLoading(false);
  };

  const formatDistance = (m: number) => {
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
    return `${Math.round(m)} m`;
  };

  const formatDuration = (s: number) => {
    if (s >= 3600) {
      const h = Math.floor(s / 3600);
      const m = Math.round((s % 3600) / 60);
      return `${h}h ${m}min`;
    }
    return `${Math.round(s / 60)} min`;
  };

  const clearAll = () => {
    clearRoute();
    setSearchQuery('');
    setOriginText('Ubicación actual');
    setOrigin(null);
  };

  return (
    <View style={styles.container}>
      <MapViewWrapper
        routeGeoJSON={routeGeoJSON}
        originCoords={origin || undefined}
        destCoords={destination || undefined}
        initialCenter={destination || origin || undefined}
        onMapPress={handleMapPress}
        showsUserLocation
      />

      <ScrollView style={styles.panel} keyboardShouldPersistTaps="handled">
        <Surface style={styles.card} elevation={4}>
          <Text variant="titleMedium" style={styles.title}>Planificar viaje</Text>

          <TouchableOpacity style={styles.originRow} onPress={setCurrentLocationAsOrigin}>
            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.originText}>{originText}</Text>
            {origin && (
              <TouchableOpacity onPress={() => { setOrigin(null); setOriginText('Ubicación actual'); }}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.destRow}>
            <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
            <TextInput
              placeholder="Buscar destino..."
              value={searchQuery}
              onChangeText={handleSearchInput}
              mode="flat"
              style={styles.searchInput}
              underlineStyle={{ display: 'none' }}
              right={searchLoading ? <ActivityIndicator size="small" /> : undefined}
            />
          </View>

          {showSuggestions && (
            <Surface style={styles.suggestions} elevation={6}>
              {suggestions.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestion}
                  onPress={() => selectSuggestion(item)}
                >
                  <Text variant="bodySmall" numberOfLines={2}>{item.displayName}</Text>
                  <Text style={styles.suggestionType}>{item.type}</Text>
                </TouchableOpacity>
              ))}
            </Surface>
          )}

          {!destination && (
            <Text style={styles.hint}>También podés tocar el mapa para marcar el destino</Text>
          )}

          <SegmentedButtons
            value={profile}
            onValueChange={(v) => setProfile(v as any)}
            buttons={[
              { value: 'driving', label: 'Auto', icon: 'car' },
              { value: 'walking', label: 'Caminar', icon: 'walk' },
              { value: 'cycling', label: 'Bici', icon: 'bike' },
            ]}
            style={styles.profileSelector}
          />

          <Button
            mode="contained"
            onPress={calculateRoute}
            loading={loading}
            disabled={!origin || !destination || loading}
            style={styles.button}
            icon="map-route"
          >
            Calcular ruta
          </Button>

          {routeInfo && (
            <Surface style={styles.routeInfo} elevation={2}>
              <View style={styles.routeInfoRow}>
                <Text style={styles.routeInfoLabel}>Distancia</Text>
                <Text style={styles.routeInfoValue}>{formatDistance(routeInfo.distance)}</Text>
              </View>
              <View style={styles.routeInfoRow}>
                <Text style={styles.routeInfoLabel}>Duración</Text>
                <Text style={styles.routeInfoValue}>{formatDuration(routeInfo.duration)}</Text>
              </View>
              <View style={styles.routeInfoRow}>
                <Text style={styles.routeInfoLabel}>Llegada</Text>
                <Text style={styles.routeInfoValue}>
                  {new Date(Date.now() + routeInfo.duration * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSteps(!showSteps)} style={styles.stepsToggle}>
                <Text style={styles.stepsToggleText}>
                  {showSteps ? 'Ocultar' : 'Ver'} indicaciones ({routeInfo.steps.length})
                </Text>
              </TouchableOpacity>
              {showSteps && (
                <View style={styles.stepsList}>
                  {routeInfo.steps.map((step, i) => (
                    <View key={i} style={styles.step}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{i + 1}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepInstruction}>{step.instruction}</Text>
                        <Text style={styles.stepMeta}>
                          {formatDistance(step.distance)} · {formatDuration(step.duration)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Surface>
          )}

          {(origin || destination) && (
            <Button onPress={clearAll} mode="text" compact style={{ marginTop: 8 }}>
              Limpiar ruta
            </Button>
          )}
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    maxHeight: '65%',
    zIndex: 10,
  },
  card: {
    margin: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  title: { fontWeight: 'bold', marginBottom: 12 },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  originText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  clearBtn: {
    fontSize: 16,
    color: '#999',
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 2,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 14,
    paddingHorizontal: 0,
  },
  suggestions: {
    position: 'absolute',
    top: 90,
    left: 30,
    right: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    maxHeight: 200,
    zIndex: 100,
  },
  suggestion: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionType: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginVertical: 8,
  },
  profileSelector: {
    marginVertical: 12,
  },
  button: {
    marginTop: 4,
    paddingVertical: 6,
  },
  routeInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  routeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  routeInfoLabel: { color: '#666', fontSize: 13 },
  routeInfoValue: { fontWeight: '600', fontSize: 13 },
  stepsToggle: { marginTop: 8, alignSelf: 'center' },
  stepsToggleText: { color: '#4A90D9', fontWeight: '600', fontSize: 13 },
  stepsList: { marginTop: 8 },
  step: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  stepContent: { flex: 1 },
  stepInstruction: { fontSize: 13, color: '#333' },
  stepMeta: { fontSize: 11, color: '#999', marginTop: 2 },
});

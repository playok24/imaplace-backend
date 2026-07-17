import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import {
  Map,
  Camera,
  UserLocation,
  Marker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';
import { MAP_STYLE } from '../constants/Api';
import { Business, TouristPoint } from '../types';

const DEFAULT_CENTER = { lng: -58.3816, lat: -34.6037 };

interface Props {
  businesses?: Business[];
  touristPoints?: TouristPoint[];
  routeGeoJSON?: any;
  selectedLocation?: { lat: number; lng: number };
  originCoords?: { lat: number; lng: number };
  destCoords?: { lat: number; lng: number };
  initialCenter?: { lat: number; lng: number };
  onMapPress?: (lat: number, lng: number) => void;
  onMarkerPress?: (business: Business) => void;
  onTouristPointPress?: (point: TouristPoint) => void;
  showsUserLocation?: boolean;
  onDidLoad?: () => void;
  style?: any;
}

export default function MapViewWrapper({
  businesses = [],
  touristPoints = [],
  routeGeoJSON,
  selectedLocation,
  originCoords,
  destCoords,
  initialCenter,
  onMapPress,
  onMarkerPress,
  onTouristPointPress,
  showsUserLocation = false,
  onDidLoad,
  style,
}: Props) {
  const center = initialCenter || DEFAULT_CENTER;
  const handlePress = (e: any) => {
    if (!onMapPress || !e?.nativeEvent?.lngLat) return;
    const [lng, lat] = e.nativeEvent.lngLat;
    onMapPress(lat, lng);
  };

  const sortedMarkers = [
    ...touristPoints.map((p) => ({ type: 'tourist' as const, data: p })),
    ...businesses.map((b) => ({ type: 'business' as const, data: b })),
  ].sort((a, b) => (b.data.priority ?? 5) - (a.data.priority ?? 5));

  return (
    <View style={[styles.container, style]}>
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE}
        onPress={handlePress}
        onDidFinishLoadingMap={onDidLoad}
      >
        <Camera
          key={`${center.lat}-${center.lng}`}
          centerCoordinate={[center.lng, center.lat]}
          zoomLevel={12}
        />

        {showsUserLocation && <UserLocation />}

        {sortedMarkers.map((item) => {
          if (item.type === 'business') {
            const b = item.data as Business;
            return (
              <Marker
                key={`biz-${b.id}`}
                id={`biz-${b.id}`}
                lngLat={[b.location.lng, b.location.lat]}
                anchor="bottom"
              >
                <TouchableOpacity
                  style={styles.marker}
                  onPress={() => onMarkerPress?.(b)}
                >
                  <View style={styles.markerDot} />
                </TouchableOpacity>
                <Text style={styles.markerLabel}>{b.name}</Text>
              </Marker>
            );
          }
          const p = item.data as TouristPoint;
          return (
            <Marker
              key={`tp-${p.id}`}
              id={`tp-${p.id}`}
              lngLat={[p.location.lng, p.location.lat]}
              anchor="bottom"
            >
              <TouchableOpacity
                style={styles.touristMarker}
                onPress={() => onTouristPointPress?.(p)}
              >
                <View style={styles.touristMarkerDot} />
              </TouchableOpacity>
              <Text style={styles.touristMarkerLabel}>{p.name}</Text>
            </Marker>
          );
        })}

        {selectedLocation && (
          <Marker
            id="selected"
            lngLat={[selectedLocation.lng, selectedLocation.lat]}
            anchor="bottom"
          >
            <View style={styles.selectedMarker}>
              <View style={styles.selectedDot} />
            </View>
          </Marker>
        )}

        {originCoords && (
          <Marker id="origin" lngLat={[originCoords.lng, originCoords.lat]} anchor="bottom">
            <View style={styles.originMarker}>
              <View style={styles.originDot} />
            </View>
          </Marker>
        )}

        {destCoords && (
          <Marker id="dest" lngLat={[destCoords.lng, destCoords.lat]} anchor="bottom">
            <View style={styles.destMarker}>
              <View style={styles.destDot} />
            </View>
          </Marker>
        )}

        {routeGeoJSON && (
          <GeoJSONSource id="routeSource" data={routeGeoJSON}>
            <Layer
              id="routeLine"
              type="line"
              style={{
                lineColor: '#4A90D9',
                lineWidth: 4,
                lineOpacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </GeoJSONSource>
        )}
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  map: { flex: 1 },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 3,
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  touristMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 3,
  },
  touristMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  markerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(74,144,217,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
    marginTop: 2,
    overflow: 'hidden',
    maxWidth: 120,
  },
  touristMarkerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255,152,0,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
    marginTop: 2,
    overflow: 'hidden',
    maxWidth: 120,
  },
  selectedMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 4,
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  originMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 4,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  destMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 4,
  },
  destDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
});

import { StyleSheet, View, TouchableOpacity } from 'react-native';
import {
  Map,
  Camera,
  UserLocation,
  Marker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';
import { MAP_STYLE } from '../constants/Api';
import { Business } from '../types';

const DEFAULT_CENTER = { lng: -58.3816, lat: -34.6037 };

interface Props {
  businesses?: Business[];
  routeGeoJSON?: any;
  selectedLocation?: { lat: number; lng: number };
  originCoords?: { lat: number; lng: number };
  destCoords?: { lat: number; lng: number };
  initialCenter?: { lat: number; lng: number };
  onMapPress?: (lat: number, lng: number) => void;
  onMarkerPress?: (business: Business) => void;
  showsUserLocation?: boolean;
  onDidLoad?: () => void;
  style?: any;
}

export default function MapViewWrapper({
  businesses = [],
  routeGeoJSON,
  selectedLocation,
  originCoords,
  destCoords,
  initialCenter,
  onMapPress,
  onMarkerPress,
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

        {businesses.map((b) => (
          <Marker
            key={b.id}
            id={b.id}
            lngLat={[b.location.lng, b.location.lat]}
            anchor="bottom"
          >
            <TouchableOpacity
              style={styles.marker}
              onPress={() => onMarkerPress?.(b)}
            >
              <View style={styles.markerDot} />
            </TouchableOpacity>
          </Marker>
        ))}

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

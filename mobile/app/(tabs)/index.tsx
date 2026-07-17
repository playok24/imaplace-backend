import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import MapViewWrapper from '../../components/MapViewWrapper';
import BusinessPopup from '../../components/BusinessPopup';
import DrivingAlertOverlay from '../../components/DrivingAlertOverlay';
import TouristPointPopup from '../../components/TouristPointPopup';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';
import { useDrivingStore } from '../../stores/drivingStore';
import { useRoutingStore } from '../../stores/routingStore';
import * as businessService from '../../services/business';
import * as socketService from '../../services/socket';
import { Business, NearbyBusiness, NearbyTouristPoint, TouristPoint } from '../../types';

export default function MapScreen() {
  const user = useAuthStore((s) => s.user);
  const { latitude, longitude, setLocation, addNearbyBusiness, addNearbyTouristPoint, setTracking } = useLocationStore();
  const isDriving = useDrivingStore((s) => s.isDriving);
  const { setOrigin, setDestination } = useRoutingStore.getState();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [touristPoints, setTouristPoints] = useState<TouristPoint[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<NearbyBusiness | null>(null);
  const [selectedTouristPoint, setSelectedTouristPoint] = useState<(NearbyTouristPoint | TouristPoint) | null>(null);
  const [drivingAlert, setDrivingAlert] = useState<NearbyBusiness | null>(null);
  const [drivingTouristAlert, setDrivingTouristAlert] = useState<NearbyTouristPoint | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    const socket = socketService.connectSocket(user.id);
    const unsubBiz = socketService.onBusinessNearby((business) => {
      addNearbyBusiness(business);
      if (isDriving) {
        setDrivingAlert(business);
      } else {
        setSelectedBusiness(business);
      }
    });
    const unsubTp = socketService.onTouristPointNearby((point) => {
      addNearbyTouristPoint(point);
      if (isDriving) {
        setDrivingTouristAlert(point);
      } else {
        setSelectedTouristPoint(point);
      }
    });
    return () => {
      unsubBiz();
      unsubTp();
      socketService.disconnectSocket();
    };
  }, [user?.id, isDriving]);

  useFocusEffect(
    useCallback(() => {
      let locationSub: any;

      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude: myLat, longitude: myLng } = loc.coords;
        setLocation(myLat, myLng);

        try {
          const [bizData, tpData] = await Promise.all([
            businessService.getActiveBusinesses(),
            businessService.getActiveTouristPoints(myLat, myLng),
          ]);
          setBusinesses(bizData);
          setTouristPoints(tpData.map((p) => ({ ...p, location: { lat: p.latitude, lng: p.longitude } })));
        } catch {}

        setTracking(true);
        locationSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: isDriving ? 15 : 50,
            timeInterval: isDriving ? 3000 : 10000,
          },
          async (loc) => {
            const { latitude, longitude } = loc.coords;
            setLocation(latitude, longitude);
            try {
              const result = await businessService.updateLocation(latitude, longitude);
              if (result.nearby?.length > 0) {
                if (isDriving) {
                  setDrivingAlert(result.nearby[0] as NearbyBusiness);
                } else {
                  setSelectedBusiness(result.nearby[0] as NearbyBusiness);
                }
              }
              if (result.nearbyTouristPoints?.length > 0) {
                if (isDriving) {
                  setDrivingTouristAlert(result.nearbyTouristPoints[0] as NearbyTouristPoint);
                } else {
                  setSelectedTouristPoint(result.nearbyTouristPoints[0] as NearbyTouristPoint);
                }
              }
            } catch {}
          }
        );
      })();

      return () => {
        setTracking(false);
        if (locationSub) locationSub.remove();
      };
    }, [isDriving])
  );

  const handleMarkerPress = (business: Business) => {
    setSelectedBusiness({ ...business, distance: 0 });
  };

  const handleTouristPointPress = (point: TouristPoint) => {
    setSelectedTouristPoint(point);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/business/${id}`);
  };

  const handleNavigate = (lat: number, lng: number, name: string) => {
    if (latitude && longitude) {
      setOrigin({ lat: latitude, lng: longitude, name: 'Mi ubicación' });
    }
    setDestination({ lat, lng, name });
    router.push('/(tabs)/search');
  };

  const handleDrivingNavigate = () => {
    if (!drivingAlert && !drivingTouristAlert) return;
    const target = drivingAlert || drivingTouristAlert;
    if (target) {
      handleNavigate('lat' in target ? target.lat : target.latitude, 'lng' in target ? target.lng : target.longitude, target.name);
    }
  };

  const { toggleDriving } = useDrivingStore.getState();

  const effectiveDrivingAlert = drivingAlert || drivingTouristAlert;

  return (
    <View style={styles.container}>
      <MapViewWrapper
        businesses={businesses}
        touristPoints={touristPoints}
        onMarkerPress={handleMarkerPress}
        onTouristPointPress={handleTouristPointPress}
        showsUserLocation
        onDidLoad={() => setMapReady(true)}
        initialCenter={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
      />
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      )}
      <BusinessPopup
        business={selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
        onViewDetails={handleViewDetails}
        onNavigate={handleNavigate}
      />
      <TouristPointPopup
        point={selectedTouristPoint}
        onClose={() => setSelectedTouristPoint(null)}
        onNavigate={handleNavigate}
      />
      {isDriving && effectiveDrivingAlert && (
        <DrivingAlertOverlay
          business={effectiveDrivingAlert}
          onDismiss={() => { setDrivingAlert(null); setDrivingTouristAlert(null); }}
          onNavigate={handleDrivingNavigate}
        />
      )}
      <TouchableOpacity
        style={[styles.drivingToggle, isDriving && styles.drivingToggleActive]}
        onPress={toggleDriving}
        activeOpacity={0.9}
      >
        <Text style={styles.drivingToggleText}>
          {isDriving ? '🚗 Modo Conducción ON' : '🚗 Modo Conducción OFF'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  drivingToggle: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  drivingToggleActive: {
    backgroundColor: '#4CAF50',
  },
  drivingToggleText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
});

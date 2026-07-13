import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import MapViewWrapper from '../../components/MapViewWrapper';
import BusinessPopup from '../../components/BusinessPopup';
import DrivingAlertOverlay from '../../components/DrivingAlertOverlay';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';
import { useDrivingStore } from '../../stores/drivingStore';
import { useRoutingStore } from '../../stores/routingStore';
import * as businessService from '../../services/business';
import * as socketService from '../../services/socket';
import { Business, NearbyBusiness } from '../../types';

export default function MapScreen() {
  const user = useAuthStore((s) => s.user);
  const { latitude, longitude, nearbyBusinesses, setLocation, addNearbyBusiness, setTracking } = useLocationStore();
  const isDriving = useDrivingStore((s) => s.isDriving);
  const { setOrigin, setDestination } = useRoutingStore.getState();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<NearbyBusiness | null>(null);
  const [drivingAlert, setDrivingAlert] = useState<NearbyBusiness | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    const socket = socketService.connectSocket(user.id);
    const unsubscribe = socketService.onBusinessNearby((business) => {
      addNearbyBusiness(business);
      if (isDriving) {
        setDrivingAlert(business);
      } else {
        setSelectedBusiness(business);
      }
    });
    return () => {
      unsubscribe();
      socketService.disconnectSocket();
    };
  }, [user?.id, isDriving]);

  useFocusEffect(
    useCallback(() => {
      let locationSub: any;

      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        try {
          const data = await businessService.getActiveBusinesses();
          setBusinesses(data);
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
    if (!drivingAlert) return;
    handleNavigate(drivingAlert.lat, drivingAlert.lng, drivingAlert.name);
  };

  const { toggleDriving } = useDrivingStore.getState();

  return (
    <View style={styles.container}>
      <MapViewWrapper
        businesses={businesses}
        onMarkerPress={handleMarkerPress}
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
      {isDriving && drivingAlert && (
        <DrivingAlertOverlay
          business={drivingAlert}
          onDismiss={() => setDrivingAlert(null)}
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

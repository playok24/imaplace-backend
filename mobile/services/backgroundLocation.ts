import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_URL } from '../constants/Api';

const BACKGROUND_LOCATION_TASK = 'background-location';

async function getToken() {
  const { useAuthStore } = require('../stores/authStore');
  return useAuthStore.getState().token;
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async (taskData: any) => {
  const { data, error } = taskData;
  if (error) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations?.length) return;

  const loc = locations[0];
  const { latitude, longitude } = loc.coords;

  const token = await getToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/location/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ latitude, longitude }),
    });
    const result = await response.json();

    if (result.nearby?.length > 0) {
      const biz = result.nearby[0];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📍 Comercio cercano',
          body: `${biz.name} está a ${Math.round(biz.distance)}m de distancia.`,
          data: { businessId: biz.id, lat: biz.lat, lng: biz.lng, name: biz.name },
          ...(Platform.OS === 'android' ? { channelId: 'nearby-business' } : {}),
        },
        trigger: null,
      });
    }
  } catch {}
});

export async function startBackgroundTracking() {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 15,
    timeInterval: 3000,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Maps Interactive',
      notificationBody: 'Buscando comercios cercanos en segundo plano...',
      notificationColor: '#4A90D9',
    },
    pausesUpdatesAutomatically: false,
  });

  // Create notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('nearby-business', {
      name: 'Comercios cercanos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A90D9',
    });
  }
}

export async function stopBackgroundTracking() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

export { BACKGROUND_LOCATION_TASK };

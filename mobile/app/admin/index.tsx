import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View } from 'react-native';
import { Text, Surface, Button, TextInput, Modal, Portal, Snackbar, FAB } from 'react-native-paper';
import api from '../../services/api';

interface Stats {
  totalUsers: number;
  totalBusinesses: number;
  activeSubscriptions: number;
  activeBusinesses: number;
}

export default function AdminScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [tab, setTab] = useState<'stats' | 'users' | 'businesses'>('stats');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [newBiz, setNewBiz] = useState({ name: '', category: '', latitude: '', longitude: '', address: '', phone: '', website: '', owner_id: '' });
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, businessesRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/businesses'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setBusinesses(businessesRes.data);
    } catch {}
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const toggleUser = async (id: string, isActive: boolean) => {
    await api.patch(`/api/admin/users/${id}/toggle`, { is_active: !isActive });
    loadData();
  };

  const toggleBusiness = async (id: string, isActive: boolean) => {
    await api.patch(`/api/admin/businesses/${id}/toggle`, { is_active: !isActive });
    loadData();
  };

  const createBusiness = async () => {
    const { name, category, latitude, longitude, address, phone, website, owner_id } = newBiz;
    if (!name || !category || !latitude || !longitude || !owner_id) return;
    setCreating(true);
    try {
      await api.post('/api/admin/businesses', {
        name, category,
        latitude: parseFloat(latitude), longitude: parseFloat(longitude),
        address: address || undefined, phone: phone || undefined, website: website || undefined, owner_id,
      });
      setModalVisible(false);
      setNewBiz({ name: '', category: '', latitude: '', longitude: '', address: '', phone: '', website: '', owner_id: '' });
      setSnackbar({ visible: true, message: 'Comercio creado correctamente' });
      loadData();
    } catch {
      setSnackbar({ visible: true, message: 'Error al crear comercio' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {stats && (
        <Surface style={styles.statsRow} elevation={1}>
          <StatBox label="Usuarios" value={stats.totalUsers} />
          <StatBox label="Comercios" value={stats.totalBusinesses} />
          <StatBox label="Suscripciones" value={stats.activeSubscriptions} />
          <StatBox label="Activos" value={stats.activeBusinesses} />
        </Surface>
      )}

      <Surface style={styles.tabs} elevation={1}>
        <Button mode={tab === 'stats' ? 'contained' : 'text'} onPress={() => setTab('stats')}>Dashboard</Button>
        <Button mode={tab === 'users' ? 'contained' : 'text'} onPress={() => setTab('users')}>Usuarios</Button>
        <Button mode={tab === 'businesses' ? 'contained' : 'text'} onPress={() => setTab('businesses')}>Comercios</Button>
      </Surface>

      {tab === 'users' && users.map((u) => (
        <Surface key={u.id} style={styles.row} elevation={1}>
          <Text variant="bodyMedium">{u.name}</Text>
          <Text variant="bodySmall">{u.email} - {u.role}</Text>
          <Button
            mode={u.is_active ? 'outlined' : 'contained'}
            onPress={() => toggleUser(u.id, u.is_active)}
            textColor={u.is_active ? '#D32F2F' : '#4CAF50'}
          >
            {u.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </Surface>
      ))}

      {tab === 'businesses' && (
        <View>
          {businesses.map((b) => (
            <Surface key={b.id} style={styles.row} elevation={1}>
              <Text variant="bodyMedium">{b.name}</Text>
              <Text variant="bodySmall">Dueño: {b.owner_name} | Sub: {b.subscription_status || 'inactiva'}</Text>
              <Button
                mode={b.is_active ? 'outlined' : 'contained'}
                onPress={() => toggleBusiness(b.id, b.is_active)}
                textColor={b.is_active ? '#D32F2F' : '#4CAF50'}
              >
                {b.is_active ? 'Desactivar' : 'Activar'}
              </Button>
            </Surface>
          ))}
        </View>
      )}

      {tab === 'businesses' && (
        <FAB
          icon="plus"
          label="Crear comercio"
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        />
      )}

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={{ marginBottom: 16 }}>Nuevo comercio</Text>

          <TextInput label="Nombre *" value={newBiz.name} onChangeText={(v) => setNewBiz({ ...newBiz, name: v })} style={styles.input} />
          <TextInput label="Categoría *" value={newBiz.category} onChangeText={(v) => setNewBiz({ ...newBiz, category: v })} style={styles.input} />
          <TextInput label="Latitud *" value={newBiz.latitude} onChangeText={(v) => setNewBiz({ ...newBiz, latitude: v })} keyboardType="numeric" style={styles.input} />
          <TextInput label="Longitud *" value={newBiz.longitude} onChangeText={(v) => setNewBiz({ ...newBiz, longitude: v })} keyboardType="numeric" style={styles.input} />
          <TextInput label="Dirección" value={newBiz.address} onChangeText={(v) => setNewBiz({ ...newBiz, address: v })} style={styles.input} />
          <TextInput label="Teléfono" value={newBiz.phone} onChangeText={(v) => setNewBiz({ ...newBiz, phone: v })} style={styles.input} />
          <TextInput label="Sitio web" value={newBiz.website} onChangeText={(v) => setNewBiz({ ...newBiz, website: v })} style={styles.input} />

          <Text variant="bodySmall" style={{ marginBottom: 4 }}>Dueño *</Text>
          <ScrollView style={{ maxHeight: 160, marginBottom: 16 }}>
            {users.map((u) => (
              <Button
                key={u.id}
                mode={newBiz.owner_id === u.id ? 'contained' : 'outlined'}
                onPress={() => setNewBiz({ ...newBiz, owner_id: u.id })}
                style={{ marginBottom: 4 }}
              >
                {u.name} ({u.email}) - {u.role}
              </Button>
            ))}
          </ScrollView>

          <Button mode="contained" onPress={createBusiness} loading={creating} disabled={creating}>
            Crear comercio
          </Button>
          <Button mode="text" onPress={() => setModalVisible(false)}>Cancelar</Button>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <Surface style={styles.statBox} elevation={0}>
      <Text variant="titleLarge" style={styles.statValue}>{value}</Text>
      <Text variant="bodySmall" style={styles.statLabel}>{label}</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  statsRow: { flexDirection: 'row', margin: 16, padding: 12, borderRadius: 12, backgroundColor: 'white' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontWeight: 'bold', color: '#4A90D9' },
  statLabel: { color: '#888' },
  tabs: { flexDirection: 'row', margin: 16, padding: 8, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center' },
  row: { marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12, backgroundColor: 'white' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#4A90D9' },
  modal: { backgroundColor: 'white', padding: 24, margin: 20, borderRadius: 12 },
  input: { marginBottom: 12 },
});

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getUserReservations, cancelReservation } from '../services/reservationService';
import { HOTEL_IMG_1, HOTEL_IMG_2, HOTEL_IMG_3 } from '../assets/images';

const IMAGE_MAP = { '1': HOTEL_IMG_1, '2': HOTEL_IMG_2, '3': HOTEL_IMG_3 };

const STATUS_LABEL = { confirmed: 'Confirmada', cancelled: 'Cancelada' };
const STATUS_COLOR = { confirmed: '#00C853', cancelled: '#FF3D00' };

function ReservationCard({ item, onCancel }) {
  const image = IMAGE_MAP[item.imageKey];
  const isConfirmed = item.status === 'confirmed';

  return (
    <View style={cardStyles.card}>
      {image && <Image source={image} style={cardStyles.image} />}
      <View style={cardStyles.body}>
        <View style={cardStyles.topRow}>
          <Text style={cardStyles.hotelName} numberOfLines={1}>{item.hotelName}</Text>
          <View style={[cardStyles.badge, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
            <Text style={[cardStyles.badgeText, { color: STATUS_COLOR[item.status] }]}>
              {STATUS_LABEL[item.status]}
            </Text>
          </View>
        </View>

        <Text style={cardStyles.location}>{item.hotelCity} — {item.hotelState}</Text>

        <View style={cardStyles.datesRow}>
          <View style={cardStyles.dateBlock}>
            <Text style={cardStyles.dateLabel}>Check-in</Text>
            <Text style={cardStyles.dateValue}>{item.checkIn}</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={16} color="#AAAACC" style={{ marginTop: 14 }} />
          <View style={cardStyles.dateBlock}>
            <Text style={cardStyles.dateLabel}>Check-out</Text>
            <Text style={cardStyles.dateValue}>{item.checkOut}</Text>
          </View>
          <View style={cardStyles.dateBlock}>
            <Text style={cardStyles.dateLabel}>Hóspedes</Text>
            <Text style={cardStyles.dateValue}>{item.guests}</Text>
          </View>
        </View>

        {isConfirmed && (
          <TouchableOpacity style={cardStyles.cancelBtn} onPress={() => onCancel(item)}>
            <Text style={cardStyles.cancelText}>Cancelar reserva</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#2D0060',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  image: { width: '100%', height: 110, resizeMode: 'cover' },
  body: { padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  hotelName: { fontSize: 15, fontWeight: '800', color: '#1A0033', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  location: { color: '#888899', fontSize: 12, marginBottom: 12 },
  datesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  dateBlock: { alignItems: 'flex-start' },
  dateLabel: { fontSize: 10, fontWeight: '700', color: '#AAAACC', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 14, fontWeight: '700', color: '#1A0033', marginTop: 2 },
  cancelBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#FF3D00',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#FF3D00', fontSize: 13, fontWeight: '700' },
});

export default function ReservationsScreen({ navigation }) {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    const data = await getUserReservations(user.uid);
    setReservations(data);
  }, [user?.uid]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleCancel = useCallback((item) => {
    Alert.alert(
      'Cancelar Reserva',
      `Deseja cancelar sua reserva no ${item.hotelName}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Cancelar Reserva',
          style: 'destructive',
          onPress: async () => {
            await cancelReservation(item.id);
            setReservations((prev) =>
              prev.map((r) => r.id === item.id ? { ...r, status: 'cancelled' } : r)
            );
          },
        },
      ]
    );
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D0D1A', '#1C0035', '#3A0080']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Minhas Reservas</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8B2FC9" />
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReservationCard item={item} onCancel={handleCancel} />
          )}
          contentContainerStyle={reservations.length === 0 ? styles.emptyContainer : { paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B2FC9']} tintColor="#8B2FC9" />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏨</Text>
              <Text style={styles.emptyTitle}>Nenhuma reserva ainda</Text>
              <Text style={styles.emptySub}>Explore nossos hotéis e faça sua primeira reserva</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.goBack()}>
                <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={styles.emptyBtnGrad}>
                  <Text style={styles.emptyBtnText}>Ver Hotéis</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FA' },
  header: { paddingBottom: 16 },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A0033', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#AAAACC', textAlign: 'center', marginBottom: 28 },
  emptyBtn: { width: 180, borderRadius: 14, overflow: 'hidden' },
  emptyBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  emptyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl, Modal, ScrollView, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { getUserReservations, cancelReservation, updateReservation } from '../services/reservationService';
import { HOTEL_IMG_1, HOTEL_IMG_2, HOTEL_IMG_3 } from '../assets/images';

const IMAGE_MAP = { '1': HOTEL_IMG_1, '2': HOTEL_IMG_2, '3': HOTEL_IMG_3 };

const STATUS_LABEL = { confirmed: 'Confirmada', cancelled: 'Cancelada' };
const STATUS_COLOR = { confirmed: '#00C853', cancelled: '#FF3D00' };

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseDate(str) {
  const [d, m, y] = str.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function ReservationCard({ item, onCancel, onEdit }) {
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
          <View style={cardStyles.actionsRow}>
            <TouchableOpacity style={cardStyles.editBtn} onPress={() => onEdit(item)} testID={`btn-editar-${item.id}`}>
              <Text style={cardStyles.editText}>Editar reserva</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cardStyles.cancelBtn} onPress={() => onCancel(item)} testID={`btn-cancelar-${item.id}`}>
              <Text style={cardStyles.cancelText}>Cancelar reserva</Text>
            </TouchableOpacity>
          </View>
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
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  editBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#8B2FC9',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editText: { color: '#8B2FC9', fontSize: 13, fontWeight: '700' },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#FF3D00',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#FF3D00', fontSize: 13, fontWeight: '700' },
});

function EditReservationModal({ visible, reservation, onClose, onSaved }) {
  const [checkIn, setCheckIn] = useState(todayMidnight);
  const [checkOut, setCheckOut] = useState(() => addDays(todayMidnight(), 1));
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);

  // pickerField: 'checkIn' | 'checkOut' | null
  const [pickerField, setPickerField] = useState(null);
  const [tempDate, setTempDate] = useState(todayMidnight);
  const sheetAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible && reservation) {
      setCheckIn(parseDate(reservation.checkIn));
      setCheckOut(parseDate(reservation.checkOut));
      setGuests(reservation.guests);
      setPickerField(null);
    }
  }, [visible, reservation]);

  useEffect(() => {
    if (pickerField !== null && Platform.OS === 'ios') {
      sheetAnim.setValue(500);
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    }
  }, [pickerField]);

  const nights = Math.max(0, Math.round((checkOut - checkIn) / 86400000));
  const minCheckOut = useMemo(() => addDays(checkIn, 1), [checkIn]);

  const openPicker = (field) => {
    setTempDate(field === 'checkIn' ? checkIn : checkOut);
    setPickerField(field);
  };

  const applyDate = (field, date) => {
    if (field === 'checkIn') {
      setCheckIn(date);
      if (checkOut <= date) setCheckOut(addDays(date, 1));
    } else {
      setCheckOut(date);
    }
  };

  const onAndroidChange = (event, date) => {
    setPickerField(null);
    if (event.type === 'set' && date) applyDate(pickerField, date);
  };

  const onIOSChange = (_, date) => { if (date) setTempDate(date); };
  const confirmIOS = () => { applyDate(pickerField, tempDate); setPickerField(null); };

  const handleConfirm = async () => {
    if (checkOut <= checkIn) {
      Alert.alert('Datas inválidas', 'O check-out deve ser posterior ao check-in.');
      return;
    }
    setLoading(true);
    try {
      const updated = {
        checkIn: formatDate(checkIn),
        checkOut: formatDate(checkOut),
        guests,
      };
      await updateReservation(reservation.id, updated);
      onSaved(reservation.id, updated);
      onClose();
      Alert.alert(
        'Reserva Atualizada!',
        `Check-in: ${updated.checkIn}  →  Check-out: ${updated.checkOut}\n${updated.guests} hóspede${updated.guests !== 1 ? 's' : ''}`,
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a reserva. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={editResStyles.container}>
        <View style={editResStyles.header}>
          <TouchableOpacity onPress={onClose} style={editResStyles.closeBtn}>
            <Text style={editResStyles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={editResStyles.title}>Editar Reserva</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={editResStyles.content} keyboardShouldPersistTaps="handled">
          <Text style={editResStyles.hotelName}>{reservation.hotelName}</Text>
          <Text style={editResStyles.hotelLocation}>{reservation.hotelCity} — {reservation.hotelState}</Text>

          <Text style={editResStyles.sectionLabel}>Check-in</Text>
          <TouchableOpacity style={editResStyles.dateField} onPress={() => openPicker('checkIn')}>
            <MaterialIcons name="calendar-today" size={18} color="#8B2FC9" />
            <Text style={editResStyles.dateFieldText}>{formatDate(checkIn)}</Text>
            <MaterialIcons name="chevron-right" size={18} color="#AAAACC" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <Text style={editResStyles.sectionLabel}>Check-out</Text>
          <TouchableOpacity style={editResStyles.dateField} onPress={() => openPicker('checkOut')}>
            <MaterialIcons name="calendar-today" size={18} color="#8B2FC9" />
            <Text style={editResStyles.dateFieldText}>{formatDate(checkOut)}</Text>
            <MaterialIcons name="chevron-right" size={18} color="#AAAACC" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {pickerField !== null && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickerField === 'checkIn' ? checkIn : checkOut}
              mode="date"
              display="default"
              minimumDate={pickerField === 'checkIn' ? todayMidnight() : minCheckOut}
              onChange={onAndroidChange}
            />
          )}

          <Text style={editResStyles.sectionLabel}>Hóspedes</Text>
          <View style={editResStyles.guestRow}>
            <TouchableOpacity style={editResStyles.guestBtn} onPress={() => setGuests((g) => Math.max(1, g - 1))}>
              <Text style={editResStyles.guestBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={editResStyles.guestCount}>{guests}</Text>
            <TouchableOpacity style={editResStyles.guestBtn} onPress={() => setGuests((g) => Math.min(10, g + 1))}>
              <Text style={editResStyles.guestBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {nights > 0 && (
            <View style={editResStyles.summaryCard}>
              <Text style={editResStyles.summaryText}>
                {nights} noite{nights !== 1 ? 's' : ''} · {guests} hóspede{guests !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={handleConfirm} disabled={loading} style={editResStyles.confirmWrap}>
            <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={editResStyles.confirmBtn}>
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={editResStyles.confirmText}>Salvar Alterações</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {Platform.OS === 'ios' && (
        <Modal visible={pickerField !== null} transparent animationType="none">
          <View style={editResStyles.iosOverlay}>
            <Animated.View style={[editResStyles.iosSheet, { transform: [{ translateY: sheetAnim }] }]}>
              <View style={editResStyles.iosSheetHeader}>
                <TouchableOpacity onPress={() => setPickerField(null)}>
                  <Text style={editResStyles.iosCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={editResStyles.iosSheetTitle}>
                  {pickerField === 'checkIn' ? 'Check-in' : 'Check-out'}
                </Text>
                <TouchableOpacity onPress={confirmIOS}>
                  <Text style={editResStyles.iosConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                minimumDate={pickerField === 'checkIn' ? todayMidnight() : minCheckOut}
                onChange={onIOSChange}
                style={editResStyles.iosPicker}
                accentColor="#8B2FC9"
                themeVariant="light"
              />
            </Animated.View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const editResStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0EDFA',
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#AAAACC', fontSize: 18, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#1A0033' },
  content: { padding: 24, paddingBottom: 48 },
  hotelName: { fontSize: 18, fontWeight: '800', color: '#1A0033', marginBottom: 4 },
  hotelLocation: { fontSize: 13, color: '#888899', marginBottom: 20 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#3D1A5C',
    marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8DEFF',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  dateFieldText: { fontSize: 15, fontWeight: '600', color: '#1A0033' },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 4 },
  guestBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#8B2FC9', justifyContent: 'center', alignItems: 'center',
  },
  guestBtnText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  guestCount: { fontSize: 22, fontWeight: '800', color: '#1A0033', minWidth: 30, textAlign: 'center' },
  summaryCard: {
    marginTop: 20, backgroundColor: '#F0E8FF', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  summaryText: { color: '#5C1A8C', fontSize: 14, fontWeight: '700' },
  confirmWrap: { marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  confirmBtn: { paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  iosOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  iosSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  iosSheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0EDFA',
  },
  iosSheetTitle: { fontSize: 15, fontWeight: '700', color: '#1A0033' },
  iosCancelText: { fontSize: 15, color: '#AAAACC', fontWeight: '600' },
  iosConfirmText: { fontSize: 15, color: '#8B2FC9', fontWeight: '700' },
  iosPicker: { alignSelf: 'center' },
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
            Alert.alert('Reserva Cancelada', `Sua reserva no ${item.hotelName} foi cancelada.`, [{ text: 'OK' }]);
          },
        },
      ]
    );
  }, []);

  const [editingReservation, setEditingReservation] = useState(null);

  const handleEdit = useCallback((item) => setEditingReservation(item), []);

  const handleEditSaved = useCallback((reservationId, updated) => {
    setReservations((prev) =>
      prev.map((r) => r.id === reservationId ? { ...r, ...updated } : r)
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
            <ReservationCard item={item} onCancel={handleCancel} onEdit={handleEdit} />
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

      <EditReservationModal
        visible={!!editingReservation}
        reservation={editingReservation}
        onClose={() => setEditingReservation(null)}
        onSaved={handleEditSaved}
      />
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

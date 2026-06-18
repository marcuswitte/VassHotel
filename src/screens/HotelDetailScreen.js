import { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert, Animated, ImageBackground, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { createReservation } from '../services/reservationService';

function StarRating({ rating }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1 <= Math.floor(rating) ? '★' : '☆');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={{ color: '#FFD700', fontSize: 18, letterSpacing: 2 }}>{stars.join('')}</Text>
      <Text style={{ color: '#5C1A8C', fontSize: 15, fontWeight: '700' }}>{rating.toFixed(1)}/5</Text>
    </View>
  );
}

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

function BookingModal({ visible, hotel, userId, onClose }) {
  const [checkIn, setCheckIn] = useState(todayMidnight);
  const [checkOut, setCheckOut] = useState(() => addDays(todayMidnight(), 1));
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);

  // pickerField: 'checkIn' | 'checkOut' | null
  const [pickerField, setPickerField] = useState(null);
  const [tempDate, setTempDate] = useState(todayMidnight);
  const sheetAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      const today = todayMidnight();
      setCheckIn(today);
      setCheckOut(addDays(today, 1));
      setGuests(1);
      setPickerField(null);
    }
  }, [visible]);

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
      await createReservation({
        userId,
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelCity: hotel.city,
        hotelState: hotel.state,
        imageKey: hotel.imageKey,
        checkIn: formatDate(checkIn),
        checkOut: formatDate(checkOut),
        guests,
      });
      onClose();
      Alert.alert(
        'Reserva Confirmada!',
        `${hotel.name}\nCheck-in: ${formatDate(checkIn)}  →  Check-out: ${formatDate(checkOut)}\n${nights} noite${nights !== 1 ? 's' : ''} · ${guests} hóspede${guests !== 1 ? 's' : ''}`,
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível fazer a reserva. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={bookingStyles.container}>
        <View style={bookingStyles.header}>
          <TouchableOpacity onPress={onClose} style={bookingStyles.closeBtn}>
            <Text style={bookingStyles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={bookingStyles.title}>Reservar</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={bookingStyles.content} keyboardShouldPersistTaps="handled">
          <Text style={bookingStyles.hotelName}>{hotel.name}</Text>
          <Text style={bookingStyles.hotelLocation}>{hotel.city} — {hotel.state}</Text>

          <Text style={bookingStyles.sectionLabel}>Check-in</Text>
          <TouchableOpacity style={bookingStyles.dateField} onPress={() => openPicker('checkIn')}>
            <MaterialIcons name="calendar-today" size={18} color="#8B2FC9" />
            <Text style={bookingStyles.dateFieldText}>{formatDate(checkIn)}</Text>
            <MaterialIcons name="chevron-right" size={18} color="#AAAACC" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <Text style={bookingStyles.sectionLabel}>Check-out</Text>
          <TouchableOpacity style={bookingStyles.dateField} onPress={() => openPicker('checkOut')}>
            <MaterialIcons name="calendar-today" size={18} color="#8B2FC9" />
            <Text style={bookingStyles.dateFieldText}>{formatDate(checkOut)}</Text>
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

          <Text style={bookingStyles.sectionLabel}>Hóspedes</Text>
          <View style={bookingStyles.guestRow}>
            <TouchableOpacity style={bookingStyles.guestBtn} onPress={() => setGuests((g) => Math.max(1, g - 1))}>
              <Text style={bookingStyles.guestBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={bookingStyles.guestCount}>{guests}</Text>
            <TouchableOpacity style={bookingStyles.guestBtn} onPress={() => setGuests((g) => Math.min(10, g + 1))}>
              <Text style={bookingStyles.guestBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {nights > 0 && (
            <View style={bookingStyles.summaryCard}>
              <Text style={bookingStyles.summaryText}>
                {nights} noite{nights !== 1 ? 's' : ''} · {guests} hóspede{guests !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          <TouchableOpacity testID="btn-confirmar-reserva" onPress={handleConfirm} disabled={loading} style={bookingStyles.confirmWrap}>
            <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={bookingStyles.confirmBtn}>
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={bookingStyles.confirmText}>Confirmar Reserva</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {Platform.OS === 'ios' && (
        <Modal visible={pickerField !== null} transparent animationType="none">
          <View style={bookingStyles.iosOverlay}>
            <Animated.View style={[bookingStyles.iosSheet, { transform: [{ translateY: sheetAnim }] }]}>
              <View style={bookingStyles.iosSheetHeader}>
                <TouchableOpacity onPress={() => setPickerField(null)}>
                  <Text style={bookingStyles.iosCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={bookingStyles.iosSheetTitle}>
                  {pickerField === 'checkIn' ? 'Check-in' : 'Check-out'}
                </Text>
                <TouchableOpacity onPress={confirmIOS}>
                  <Text style={bookingStyles.iosConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                minimumDate={pickerField === 'checkIn' ? todayMidnight() : minCheckOut}
                onChange={onIOSChange}
                style={bookingStyles.iosPicker}
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

const bookingStyles = StyleSheet.create({
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
  // iOS picker sheet
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

export default function HotelDetailScreen({ route, navigation }) {
  const { hotel } = route.params;
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showBooking, setShowBooking] = useState(false);

  const headerOpacity = scrollY.interpolate({
    inputRange: [80, 160],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const openInMaps = () => {
    const { latitude, longitude } = hotel.coordinates;
    const label = encodeURIComponent(hotel.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
          );
        }
      })
      .catch(() =>
        Alert.alert('Erro', 'Não foi possível abrir o aplicativo de mapas.')
      );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.fixedHeader, { opacity: headerOpacity }]}>
        <LinearGradient colors={['#0D0D1A', '#1C0035']} style={styles.fixedHeaderGradient}>
          <SafeAreaView edges={['top']}>
            <View style={styles.fixedHeaderContent}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.fixedHeaderTitle} numberOfLines={1}>{hotel.name}</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <ImageBackground source={hotel.image} style={styles.hero} imageStyle={styles.heroImage}>
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFill} />
          <SafeAreaView edges={['top']}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHero}>
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.heroContent}>
            <Text style={styles.heroCity}>{hotel.city} • {hotel.state}</Text>
            <Text style={styles.heroName}>{hotel.name}</Text>
            {hotel.realHotelName && (
              <Text style={styles.heroRealName}>{hotel.realHotelName}</Text>
            )}
          </View>
          <View style={[styles.availBadge, hotel.isAvailable === false ? styles.availFull : styles.availOpen]}>
            <Text style={styles.availText}>{hotel.isAvailable === false ? 'Sem disponibilidade' : 'Quartos disponíveis'}</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.card}>
            <StarRating rating={hotel.rating} />
            <Text style={styles.ratingCount}>{hotel.totalRatings} avaliações de hóspedes</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre o Hotel</Text>
            <Text style={styles.description}>{hotel.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localização</Text>
            <Text style={styles.addressText}>📍 {hotel.address}</Text>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: hotel.coordinates.latitude,
                longitude: hotel.coordinates.longitude,
                latitudeDelta: 0.012,
                longitudeDelta: 0.012,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={hotel.coordinates}
                title={hotel.name}
                description={hotel.address}
                pinColor="#8B2FC9"
              />
            </MapView>

            <TouchableOpacity style={styles.mapOverlayBtn} onPress={openInMaps}>
              <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={styles.mapOverlayGradient}>
                <Text style={styles.mapOverlayIcon}>🗺️</Text>
                <Text style={styles.mapOverlayText}>Abrir no Mapa</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contato</Text>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${hotel.phone.replace(/\D/g, '')}`)}
            >
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactText}>{hotel.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`mailto:${hotel.email}`)}
            >
              <Text style={styles.contactIcon}>✉️</Text>
              <Text style={styles.contactText}>{hotel.email}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comodidades</Text>
            <View style={styles.amenitiesGrid}>
              {hotel.amenities.map((a, i) => (
                <View key={i} style={styles.amenityItem}>
                  <Text style={styles.amenityDot}>✦</Text>
                  <Text style={styles.amenityLabel}>{a}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            testID="btn-reserve"
            style={styles.reserveWrap}
            disabled={hotel.isAvailable === false}
            onPress={() => setShowBooking(true)}
          >
            <LinearGradient
              colors={hotel.isAvailable === false ? ['#CCCCDD', '#BBBBCC'] : ['#8B2FC9', '#5C1A8C']}
              style={styles.reserveBtn}
            >
              <Text style={styles.reserveBtnText}>
                {hotel.isAvailable === false ? 'Hotel Lotado' : 'Reservar Agora'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </Animated.ScrollView>

      <BookingModal
        visible={showBooking}
        hotel={hotel}
        userId={user?.uid}
        onClose={() => setShowBooking(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FA' },
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  fixedHeaderGradient: { paddingBottom: 8 },
  fixedHeaderContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  fixedHeaderTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center' },
  backBtn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  backBtnHero: {
    width: 50, height: 50, marginLeft: 16, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 25, marginTop: 8,
  },
  hero: { minHeight: 260, justifyContent: 'flex-end', paddingBottom: 24 },
  heroImage: { resizeMode: 'cover' },
  heroContent: { paddingHorizontal: 20, marginBottom: 12 },
  heroCity: {
    color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },
  heroName: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', lineHeight: 30 },
  heroRealName: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600', fontStyle: 'italic', marginTop: 2 },
  availBadge: {
    marginHorizontal: 20, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  availOpen: { backgroundColor: 'rgba(0,200,83,0.8)' },
  availFull: { backgroundColor: 'rgba(255,61,0,0.8)' },
  availText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  body: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#2D0060', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  ratingCount: { color: '#AAAACC', fontSize: 12, marginTop: 4 },
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#2D0060', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: '#1A0033', marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  description: { color: '#444455', fontSize: 14, lineHeight: 22 },
  addressText: { color: '#444455', fontSize: 14, lineHeight: 20 },
  mapContainer: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 12, height: 220,
    shadowColor: '#2D0060', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  map: { flex: 1 },
  mapOverlayBtn: {
    position: 'absolute', bottom: 12, right: 12, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  mapOverlayGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  mapOverlayIcon: { fontSize: 16 },
  mapOverlayText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  contactIcon: { fontSize: 18 },
  contactText: { color: '#5C1A8C', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', width: '47%', gap: 6 },
  amenityDot: { color: '#8B2FC9', fontSize: 10 },
  amenityLabel: { color: '#333344', fontSize: 13 },
  reserveWrap: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  reserveBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  reserveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
});

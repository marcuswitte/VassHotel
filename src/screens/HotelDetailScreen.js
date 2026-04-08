import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert, Animated, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

function StarRating({ rating }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1 <= Math.round(rating) ? '★' : '☆');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={{ color: '#FFD700', fontSize: 18, letterSpacing: 2 }}>{stars.join('')}</Text>
      <Text style={{ color: '#5C1A8C', fontSize: 15, fontWeight: '700' }}>{rating.toFixed(1)}/5</Text>
    </View>
  );
}

export default function HotelDetailScreen({ route, navigation }) {
  const { hotel } = route.params;
  const scrollY = useRef(new Animated.Value(0)).current;

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
          // fallback para Google Maps via browser
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
      {/* Header fixo com título (aparece ao rolar) */}
      <Animated.View style={[styles.fixedHeader, { opacity: headerOpacity }]}>
        <LinearGradient colors={['#0D0D1A', '#1C0035']} style={styles.fixedHeaderGradient}>
          <SafeAreaView edges={['top']}>
            <View style={styles.fixedHeaderContent}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backBtnText}>←</Text>
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
        {/* Hero com foto do hotel */}
        <ImageBackground source={hotel.image} style={styles.hero} imageStyle={styles.heroImage}>
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFill} />
          <SafeAreaView edges={['top']}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHero}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.heroContent}>
            <Text style={styles.heroCity}>{hotel.city} • {hotel.state}</Text>
            <Text style={styles.heroName}>{hotel.name}</Text>
          </View>
          <View style={[styles.availBadge, hotel.isFull ? styles.availFull : styles.availOpen]}>
            <Text style={styles.availText}>{hotel.isFull ? 'Sem disponibilidade' : 'Quartos disponíveis'}</Text>
          </View>
        </ImageBackground>

        {/* Corpo */}
        <View style={styles.body}>
          {/* Rating */}
          <View style={styles.card}>
            <StarRating rating={hotel.rating} />
            <Text style={styles.ratingCount}>{hotel.totalRatings} avaliações de hóspedes</Text>
          </View>

          {/* Descrição */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre o Hotel</Text>
            <Text style={styles.description}>{hotel.description}</Text>
          </View>

          {/* Endereço */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localização</Text>
            <Text style={styles.addressText}>📍 {hotel.address}</Text>
          </View>

          {/* Mapa */}
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

            {/* Overlay para abrir mapa completo */}
            <TouchableOpacity style={styles.mapOverlayBtn} onPress={openInMaps}>
              <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={styles.mapOverlayGradient}>
                <Text style={styles.mapOverlayIcon}>🗺️</Text>
                <Text style={styles.mapOverlayText}>Abrir no Mapa</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Contato */}
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

          {/* Comodidades */}
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

          {/* Botão de reserva */}
          <TouchableOpacity
            style={styles.reserveWrap}
            disabled={hotel.isFull}
            onPress={() =>
              Alert.alert(
                'Reserva',
                `Reserva no ${hotel.name} em breve estará disponível no app!`,
                [{ text: 'OK' }]
              )
            }
          >
            <LinearGradient
              colors={hotel.isFull ? ['#CCCCDD', '#BBBBCC'] : ['#8B2FC9', '#5C1A8C']}
              style={styles.reserveBtn}
            >
              <Text style={styles.reserveBtnText}>
                {hotel.isFull ? 'Hotel Lotado' : 'Reservar Agora'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FA',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fixedHeaderGradient: {
    paddingBottom: 8,
  },
  fixedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  fixedHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnHero: {
    width: 40,
    height: 40,
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20,
    marginTop: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  hero: {
    minHeight: 260,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroContent: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  heroCity: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  availBadge: {
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  availOpen: {
    backgroundColor: 'rgba(0,200,83,0.8)',
  },
  availFull: {
    backgroundColor: 'rgba(255,61,0,0.8)',
  },
  availText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  body: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2D0060',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  ratingCount: {
    color: '#AAAACC',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2D0060',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A0033',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    color: '#444455',
    fontSize: 14,
    lineHeight: 22,
  },
  addressText: {
    color: '#444455',
    fontSize: 14,
    lineHeight: 20,
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    height: 220,
    shadowColor: '#2D0060',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  mapOverlayBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  mapOverlayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  mapOverlayIcon: {
    fontSize: 16,
  },
  mapOverlayText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  contactIcon: {
    fontSize: 18,
  },
  contactText: {
    color: '#5C1A8C',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    gap: 6,
  },
  amenityDot: {
    color: '#8B2FC9',
    fontSize: 10,
  },
  amenityLabel: {
    color: '#333344',
    fontSize: 13,
  },
  reserveWrap: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  reserveBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  reserveBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, RefreshControl, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getHotelsWithAvailability } from '../data/hotels';
import { LOGO_TRANSPARENT } from '../assets/images';

function StarRating({ rating }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1 <= Math.round(rating) ? '★' : '☆');
  return (
    <View style={starStyles.row}>
      <Text style={starStyles.stars}>{stars.join('')}</Text>
      <Text style={starStyles.value}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stars: { color: '#FFD700', fontSize: 15, letterSpacing: 1 },
  value: { color: '#666680', fontSize: 13, marginLeft: 6, fontWeight: '600' },
});

function HotelCard({ hotel, onPress }) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Header com foto do hotel */}
      <ImageBackground source={hotel.image} style={cardStyles.header} imageStyle={cardStyles.headerImage}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)']} style={cardStyles.headerOverlay} />
        <View style={[cardStyles.badge, hotel.isFull ? cardStyles.badgeFull : cardStyles.badgeAvail]}>
          <Text style={cardStyles.badgeText}>{hotel.isFull ? 'Lotado' : 'Disponível'}</Text>
        </View>
      </ImageBackground>

      {/* Conteúdo */}
      <View style={cardStyles.body}>
        <Text style={cardStyles.name}>{hotel.name}</Text>
        <Text style={cardStyles.address}>{hotel.city} — {hotel.state}</Text>
        <StarRating rating={hotel.rating} />
        <Text style={cardStyles.ratingCount}>({hotel.totalRatings} avaliações)</Text>

        {/* Amenidades */}
        <View style={cardStyles.amenitiesRow}>
          {hotel.amenities.slice(0, 3).map((a, i) => (
            <View key={i} style={cardStyles.amenityChip}>
              <Text style={cardStyles.amenityText}>{a}</Text>
            </View>
          ))}
          {hotel.amenities.length > 3 && (
            <View style={cardStyles.amenityChip}>
              <Text style={cardStyles.amenityText}>+{hotel.amenities.length - 3}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[cardStyles.ctaBtn, hotel.isFull && cardStyles.ctaBtnDisabled]}
          onPress={hotel.isFull ? undefined : onPress}
          disabled={hotel.isFull}
        >
          <Text style={cardStyles.ctaText}>
            {hotel.isFull ? 'Indisponível' : 'Ver detalhes'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#2D0060',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    height: 160,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  headerImage: {
    resizeMode: 'cover',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 1,
  },
  badgeAvail: {
    backgroundColor: 'rgba(0,200,83,0.85)',
  },
  badgeFull: {
    backgroundColor: 'rgba(255,61,0,0.85)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    padding: 16,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A0033',
    marginBottom: 2,
  },
  address: {
    color: '#888899',
    fontSize: 13,
  },
  ratingCount: {
    color: '#AAAACC',
    fontSize: 12,
    marginTop: 2,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  amenityChip: {
    backgroundColor: '#F3F0FA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  amenityText: {
    color: '#5C1A8C',
    fontSize: 11,
    fontWeight: '600',
  },
  ctaBtn: {
    marginTop: 14,
    backgroundColor: '#8B2FC9',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: '#CCCCDD',
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default function HotelListScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [hotels, setHotels] = useState(() => getHotelsWithAvailability());
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'Hóspede';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setHotels(getHotelsWithAvailability());
      setRefreshing(false);
    }, 700);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Deseja sair do VassHotel?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const ListHeader = () => (
    <View>
      {/* Header com gradiente */}
      <LinearGradient colors={['#0D0D1A', '#1C0035', '#3A0080']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Image source={LOGO_TRANSPARENT} style={styles.headerLogo} resizeMode="contain" />
              <View>
                <Text style={styles.headerGreeting}>Olá, {firstName}</Text>
                <Text style={styles.headerSub}>Encontre o seu hotel ideal</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <MaterialIcons name="logout" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Foto de perfil */}
          {user?.photoUri && (
            <View style={styles.profileBar}>
              <Image source={{ uri: user.photoUri }} style={styles.profilePhoto} />
              <View>
                <Text style={styles.profileName}>{user.name}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nossas Unidades</Text>
        <Text style={styles.sectionSub}>Puxe para atualizar disponibilidade</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={hotels}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <HotelCard
            hotel={item}
            onPress={() => navigation.navigate('HotelDetail', { hotel: item })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B2FC9']}
            tintColor="#8B2FC9"
          />
        }
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FA',
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  headerGreeting: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 1,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 10,
    gap: 12,
  },
  profilePhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A0033',
  },
  sectionSub: {
    fontSize: 12,
    color: '#AAAACC',
    marginTop: 2,
  },
});

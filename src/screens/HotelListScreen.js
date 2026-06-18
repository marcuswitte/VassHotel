import { useState, useCallback, useEffect, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, RefreshControl, ImageBackground, Modal, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { changeUserPassword } from '../services/authService';
import { getHotels, seedHotels } from '../services/hotelService';
import { LOGO_TRANSPARENT, HOTEL_IMG_1, HOTEL_IMG_2, HOTEL_IMG_3 } from '../assets/images';
import { compressToBase64 } from '../utils/imageUtils';

const IMAGE_MAP = { '1': HOTEL_IMG_1, '2': HOTEL_IMG_2, '3': HOTEL_IMG_3 };

function StarRating({ rating }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1 <= Math.floor(rating) ? '★' : '☆');
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
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.88} testID={`card-hotel-${hotel.id}`}>
      <ImageBackground source={hotel.image} style={cardStyles.header} imageStyle={cardStyles.headerImage}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)']} style={cardStyles.headerOverlay} />
        <View style={[cardStyles.badge, hotel.isFull ? cardStyles.badgeFull : cardStyles.badgeAvail]}>
          <Text style={cardStyles.badgeText}>{hotel.isFull ? 'Lotado' : 'Disponível'}</Text>
        </View>
      </ImageBackground>

      <View style={cardStyles.body}>
        <Text style={cardStyles.name}>{hotel.name}</Text>
        {hotel.realHotelName && (
          <Text style={cardStyles.realName}>{hotel.realHotelName}</Text>
        )}
        <Text style={cardStyles.address}>{hotel.city} — {hotel.state}</Text>
        <StarRating rating={hotel.rating} />
        <Text style={cardStyles.ratingCount}>({hotel.totalRatings} avaliações)</Text>

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
          testID={`btn-ver-detalhes-${hotel.id}`}
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
  header: { height: 160, justifyContent: 'flex-end', overflow: 'hidden' },
  headerImage: { resizeMode: 'cover' },
  headerOverlay: { ...StyleSheet.absoluteFillObject },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 1,
  },
  badgeAvail: { backgroundColor: 'rgba(0,200,83,0.85)' },
  badgeFull: { backgroundColor: 'rgba(255,61,0,0.85)' },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  body: { padding: 16 },
  name: { fontSize: 17, fontWeight: '800', color: '#1A0033', marginBottom: 2 },
  realName: { color: '#9B6CC9', fontSize: 12, fontWeight: '600', fontStyle: 'italic', marginBottom: 2 },
  address: { color: '#888899', fontSize: 13 },
  ratingCount: { color: '#AAAACC', fontSize: 12, marginTop: 2 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  amenityChip: { backgroundColor: '#F3F0FA', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  amenityText: { color: '#5C1A8C', fontSize: 11, fontWeight: '600' },
  ctaBtn: { marginTop: 14, backgroundColor: '#8B2FC9', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  ctaBtnDisabled: { backgroundColor: '#CCCCDD' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});

// Definido fora do componente para ter referência estável — FlatList não desmonta o header ao digitar
const HotelListHeader = memo(function HotelListHeader({ user, firstName, searchQuery, onSearchChange, onLogout, onEditProfile, onReservations }) {
  return (
    <View>
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
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={onReservations} style={styles.logoutBtn} testID="btn-reservations">
                <MaterialIcons name="bookmark" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} testID="btn-logout">
                <MaterialIcons name="logout" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileBar}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Text style={styles.profilePhotoInitial}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
            <TouchableOpacity onPress={onEditProfile} style={styles.editProfileBtn} testID="btn-edit-profile">
              <MaterialIcons name="edit" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nossas Unidades</Text>
        <Text style={styles.sectionSub}>Puxe para atualizar disponibilidade</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9999BB" style={styles.searchIcon} />
        <TextInput
          testID="input-search"
          style={styles.searchInput}
          placeholder="Buscar hotéis..."
          placeholderTextColor="#9999BB"
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.searchClear}>
            <MaterialIcons name="close" size={18} color="#9999BB" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

function EditProfileModal({ visible, user, onClose, updateUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setPhoto(user.photoUri ?? null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [visible, user]);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      cameraType: 'front',
    });
    if (!result.canceled) {
      const base64Uri = await compressToBase64(result.assets[0].uri);
      setPhoto(base64Uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'O nome não pode estar vazio.');
      return;
    }
    setLoading(true);
    await updateUser({ name: name.trim(), email: email.trim(), photoUri: photo });
    setLoading(false);
    onClose();
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Campos obrigatórios', 'Preencha a senha atual e a nova senha.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Senha muito curta', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'A nova senha e a confirmação não coincidem.');
      return;
    }

    setPwLoading(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Sucesso', 'Sua senha foi alterada.');
    } catch (error) {
      let message = 'Não foi possível alterar a senha. Tente novamente.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Senha atual incorreta.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A nova senha é muito fraca.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas. Tente novamente mais tarde.';
      }
      Alert.alert('Erro', message);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={editStyles.container}>
        <View style={editStyles.header}>
          <TouchableOpacity onPress={onClose} style={editStyles.closeBtn}>
            <MaterialIcons name="close" size={24} color="#5C1A8C" />
          </TouchableOpacity>
          <Text style={editStyles.title}>Editar Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'android' ? 'padding' : 'height'}
        >
        <ScrollView contentContainerStyle={editStyles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={editStyles.photoSection}>
            <TouchableOpacity onPress={handleTakePhoto} style={editStyles.photoWrapper}>
              {photo ? (
                <Image source={{ uri: photo }} style={editStyles.photo} />
              ) : (
                <View style={editStyles.photoPlaceholder}>
                  <Text style={editStyles.photoInitial}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              <View style={editStyles.photoEditBadge}>
                <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={editStyles.photoHint}>Toque para alterar a foto</Text>
          </View>

          <Text style={editStyles.fieldLabel}>Nome Completo</Text>
          <TextInput
            style={editStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor="#AAAACC"
            autoCapitalize="words"
          />

          <Text style={editStyles.fieldLabel}>E-mail</Text>
          <TextInput
            style={editStyles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor="#AAAACC"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity onPress={handleSave} disabled={loading} style={editStyles.saveWrap}>
            <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={editStyles.saveBtn}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={editStyles.saveBtnText}>Salvar Alterações</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={editStyles.divider} />

          <Text style={editStyles.sectionTitle}>Alterar Senha</Text>

          <Text style={editStyles.fieldLabel}>Senha Atual</Text>
          <TextInput
            testID="input-current-password"
            style={editStyles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Digite sua senha atual"
            placeholderTextColor="#AAAACC"
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={editStyles.fieldLabel}>Nova Senha</Text>
          <TextInput
            testID="input-new-password"
            style={editStyles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Mínimo de 6 caracteres"
            placeholderTextColor="#AAAACC"
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={editStyles.fieldLabel}>Confirmar Nova Senha</Text>
          <TextInput
            testID="input-confirm-password"
            style={editStyles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repita a nova senha"
            placeholderTextColor="#AAAACC"
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity onPress={handleChangePassword} disabled={pwLoading} style={editStyles.saveWrap}>
            <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={editStyles.saveBtn}>
              {pwLoading ? <ActivityIndicator color="#FFF" /> : <Text style={editStyles.saveBtnText}>Alterar Senha</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const editStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDFA',
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#1A0033' },
  content: { padding: 24, paddingBottom: 48 },
  photoSection: { alignItems: 'center', marginBottom: 28 },
  photoWrapper: { position: 'relative', marginBottom: 8 },
  photo: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#8B2FC9' },
  photoPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#8B2FC9', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#5C1A8C',
  },
  photoInitial: { fontSize: 36, color: '#FFFFFF', fontWeight: '700' },
  photoEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#5C1A8C', borderRadius: 14,
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  photoHint: { color: '#AAAACC', fontSize: 12 },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: '#3D1A5C',
    marginBottom: 5, marginTop: 16,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8DEFF',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: '#1A0033',
  },
  saveWrap: { marginTop: 28, borderRadius: 14, overflow: 'hidden' },
  saveBtn: { paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#E8DEFF', marginTop: 36, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A0033', marginTop: 8 },
});

export default function HotelListScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'Hóspede';

  const loadHotels = useCallback(async () => {
    await seedHotels();
    const data = await getHotels();
    setHotels(data.map((h) => ({ ...h, image: IMAGE_MAP[h.imageKey] })));
  }, []);

  useEffect(() => { loadHotels(); }, [loadHotels]);

  const filteredHotels = searchQuery.trim()
    ? hotels.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : hotels;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHotels();
    setRefreshing(false);
  }, [loadHotels]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sair da Conta',
      'Deseja sair do VassHotel?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  }, [logout]);

  const handleOpenEdit = useCallback(() => setShowEditModal(true), []);
  const handleReservations = useCallback(() => navigation.navigate('Reservations'), [navigation]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredHotels}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <HotelListHeader
            user={user}
            firstName={firstName}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onLogout={handleLogout}
            onEditProfile={handleOpenEdit}
            onReservations={handleReservations}
          />
        }
        renderItem={({ item }) => (
          <HotelCard
            hotel={item}
            onPress={() => navigation.navigate('HotelDetail', { hotel: item })}
          />
        )}
        ListEmptyComponent={() =>
          searchQuery ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum hotel encontrado</Text>
              <Text style={styles.emptyStateSub}>Tente outro termo de busca</Text>
            </View>
          ) : null
        }
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

      <EditProfileModal
        visible={showEditModal}
        user={user}
        onClose={() => setShowEditModal(false)}
        updateUser={updateUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FA' },
  header: { paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo: { width: 40, height: 40 },
  headerGreeting: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  profileBar: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 14, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 10, gap: 12,
  },
  profilePhoto: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  profilePhotoPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(139,47,201,0.6)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  profilePhotoInitial: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  profileName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  profileEmail: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  editProfileBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1A0033' },
  sectionSub: { fontSize: 12, color: '#AAAACC', marginTop: 2 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    marginHorizontal: 16, marginBottom: 16,
    paddingHorizontal: 12, paddingVertical: 10,
    shadowColor: '#2D0060', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A0033', paddingVertical: 0 },
  searchClear: { padding: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyStateText: { color: '#AAAACC', fontSize: 16, fontWeight: '600' },
  emptyStateSub: { color: '#CCCCDD', fontSize: 13, marginTop: 4 },
});

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, TextInput, ScrollView, Alert, Image, Dimensions, Platform, ActivityIndicator, LayoutAnimation, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { LOGO_TRANSPARENT } from '../assets/images';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AUTH_HEIGHT_REGISTER = SCREEN_HEIGHT * 0.73;

export default function WelcomeScreen() {
  const { login } = useAuth();

  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhoto, setRegPhoto] = useState(null);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const authAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoAnim, {
          toValue: -90,
          useNativeDriver: true,
          tension: 45,
          friction: 9,
        }),
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const openContainer = (tab) => {
    setActiveTab(tab);
    setShowAuth(true);
    authAnim.setValue(SCREEN_HEIGHT);
    Animated.timing(buttonsOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    Animated.spring(authAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  };

  const closeContainer = () => {
    Animated.spring(authAnim, {
      toValue: SCREEN_HEIGHT,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start(() => {
      setShowAuth(false);
      Animated.timing(buttonsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const switchTab = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Precisamos de acesso à câmera para tirar sua foto de perfil.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setRegPhoto(result.assets[0].uri);
    }
  };

  const handleEnrollBiometric = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert('Não Disponível', 'Seu dispositivo não suporta autenticação biométrica.');
      return;
    }
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      Alert.alert('Biometria Não Configurada', 'Configure sua digital ou Face ID nas configurações do dispositivo.');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirme sua biometria para o cadastro no VassHotel',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (result.success) {
      setBiometricEnrolled(true);
    } else {
      Alert.alert('Falha', 'Não foi possível registrar a biometria. Tente novamente.');
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      Alert.alert('Campos Obrigatórios', 'Preencha e-mail e senha para entrar.');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      await login({
        name: loginEmail.split('@')[0].replace(/[._]/g, ' '),
        email: loginEmail.trim().toLowerCase(),
        photoUri: null,
      });
      setLoading(false);
    }, 900);
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      Alert.alert('Campos Obrigatórios', 'Preencha nome, e-mail e senha.');
      return;
    }
    if (regPassword.length < 6) {
      Alert.alert('Senha Fraca', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (!regPhoto) {
      Alert.alert('Foto Necessária', 'Tire uma foto para identificação do perfil.');
      return;
    }
    if (!biometricEnrolled) {
      Alert.alert('Biometria Necessária', 'Registre sua biometria para proteger sua conta.');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      await login({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        photoUri: regPhoto,
      });
      setLoading(false);
    }, 900);
  };

  return (
    <LinearGradient colors={['#0D0D1A', '#1C0035', '#2D0060']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* Logo + botões de acesso */}
        <View style={styles.logoArea}>
          <Animated.View style={{ transform: [{ translateY: logoAnim }], alignItems: 'center' }}>
            <Image source={LOGO_TRANSPARENT} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>VASSHOTEIS</Text>
          </Animated.View>

          <Animated.View style={[styles.actionButtons, { opacity: buttonsOpacity }]}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => openContainer('login')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={styles.btnPrimaryGradient}>
                <Text style={styles.btnPrimaryText}>Entrar</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => openContainer('register')}
              activeOpacity={0.75}
            >
              <Text style={styles.btnSecondaryText}>Criar conta</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Container de autenticação */}
        {showAuth && (
          <Animated.View
            style={[
              styles.authContainer,
              activeTab === 'register' && styles.authContainerTall,
              { transform: [{ translateY: authAnim }] },
            ]}
          >
            {/* Barra superior: handle + fechar */}
            <View style={styles.topBar}>
              <View style={{ flex: 1 }} />
              <View style={styles.handleBar} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <TouchableOpacity onPress={closeContainer} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'login' && styles.tabActive]}
                onPress={() => switchTab('login')}
              >
                <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>
                  Entrar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'register' && styles.tabActive]}
                onPress={() => switchTab('register')}
              >
                <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
                  Cadastrar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login — container pequeno, sem scroll */}
            {activeTab === 'login' && (
              <View style={styles.loginForm}>
                <Text style={styles.fieldLabel}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#AAAACC"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.fieldLabel}>Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#AAAACC"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry
                />
                <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.submitWrap}>
                  <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={styles.submitBtn}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Entrar</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Cadastro — container alto com scroll */}
            {activeTab === 'register' && (
              <View style={{ flex: 1 }}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.registerScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  automaticallyAdjustKeyboardInsets
                >
                  <Text style={styles.fieldLabel}>Nome Completo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome"
                    placeholderTextColor="#AAAACC"
                    value={regName}
                    onChangeText={setRegName}
                    autoCapitalize="words"
                  />

                  <Text style={styles.fieldLabel}>E-mail</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor="#AAAACC"
                    value={regEmail}
                    onChangeText={setRegEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Text style={styles.fieldLabel}>Senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#AAAACC"
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry
                  />

                  <Text style={styles.fieldLabel}>Foto do Perfil *</Text>
                  <TouchableOpacity
                    style={[styles.optionBtn, regPhoto && styles.optionBtnDone]}
                    onPress={handleTakePhoto}
                  >
                    {regPhoto ? (
                      <Text style={styles.optionTextDone}>Foto capturada</Text>
                    ) : (
                      <>
                        <Text style={styles.optionIcon}>📷</Text>
                        <Text style={styles.optionText}>Tirar foto com a câmera</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.fieldLabel}>Biometria *</Text>
                  <TouchableOpacity
                    style={[styles.optionBtn, biometricEnrolled && styles.optionBtnDone]}
                    onPress={handleEnrollBiometric}
                  >
                    {biometricEnrolled ? (
                      <Text style={styles.optionTextDone}>Biometria registrada</Text>
                    ) : (
                      <>
                        <Text style={styles.optionIcon}>🔐</Text>
                        <Text style={styles.optionText}>Registrar biometria</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.submitWrap}>
                    <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={styles.submitBtn}>
                      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Criar Conta</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </Animated.View>
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  logoArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { width: 160, height: 160 },
  tagline: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 13,
    letterSpacing: 5,
    marginTop: 10,
    fontWeight: '700',
  },

  actionButtons: {
    marginTop: 40,
    width: 240,
    alignItems: 'center',
  },
  btnPrimary: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  btnPrimaryGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnSecondary: {
    paddingVertical: 8,
  },
  btnSecondaryText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  authContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  authContainerTall: {
    height: AUTH_HEIGHT_REGISTER,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  handleBar: {
    width: 44,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#AAAACC',
    fontSize: 16,
    fontWeight: '600',
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F0FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#8B2FC9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9999BB' },
  tabTextActive: { color: '#5C1A8C' },

  loginForm: {
    paddingTop: 6,
    paddingBottom: 36,
  },
  registerScrollContent: {
    paddingTop: 6,
    paddingBottom: 40,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3D1A5C',
    marginBottom: 5,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8F5FF',
    borderWidth: 1.5,
    borderColor: '#E8DEFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A0033',
  },

  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8DEFF',
    borderRadius: 12,
    backgroundColor: '#F8F5FF',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  optionBtnDone: {
    borderColor: '#52B788',
    backgroundColor: '#F0FFF8',
    justifyContent: 'center',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B2FC9',
  },
  optionTextDone: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D6A4F',
  },

  submitWrap: {
    marginTop: 18,
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

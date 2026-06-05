import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AuthContext';
import { LOGO_TRANSPARENT } from '../assets/images';

export default function BiometricLockScreen() {
  const { user, unlock, logout } = useAuth();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const timer = setTimeout(() => authenticate(), 700);

    return () => {
      pulse.stop();
      clearTimeout(timer);
    };
  }, []);

  const authenticate = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      Alert.alert(
        'Biometria Indisponível',
        'Confirme com senha para acessar.',
        [{ text: 'OK', onPress: unlock }]
      );
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autentique-se para acessar o VassHotel',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });

    if (result.success) {
      unlock();
    } else if 
      (result.error === 'user_cancel' || result.error === 'system_cancel') {
    } else {
      Alert.alert('Falha na Autenticação', 'Tente novamente ou use a senha do dispositivo.');
    }
  };

  const firstName = user?.name?.split(' ')[0] ?? 'Usuário';

  return (
    <LinearGradient colors={['#0D0D1A', '#1C0035', '#2D0060']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Image source={LOGO_TRANSPARENT} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>VassHotel</Text>
          {user?.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={styles.userPhoto} />) : (
            <View style={styles.userPhotoPlaceholder}>
              <Text style={styles.userPhotoInitial}>{firstName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.greeting}>Bem-vindo de volta,</Text>
          <Text style={styles.userName}>{firstName}</Text>
          <Text style={styles.subtitle}>Autentique-se para continuar</Text>
          <TouchableOpacity onPress={authenticate} activeOpacity={0.8}>
            <Animated.View style={[styles.biometricCircle, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient colors={['#8B2FC9', '#5C1A8C']} style={styles.biometricGradient}>
                <Text style={styles.biometricIcon}>🔐</Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity onPress={authenticate} style={styles.authBtn}>
            <Text style={styles.authBtnText}>Autenticar com Biometria</Text>
          </TouchableOpacity>

          {/* Sair */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() =>
              Alert.alert(
                'Sair da Conta',
                'Deseja realmente sair? Precisará fazer login novamente.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Sair', style: 'destructive', onPress: logout },
                ]
              )
            }
          >
            <Text style={styles.logoutText}>Trocar de conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 4,
  },
  appName: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  userPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(139,47,201,0.7)',
    marginBottom: 16,
  },
  userPhotoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(139,47,201,0.35)',
    borderWidth: 3,
    borderColor: 'rgba(139,47,201,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userPhotoInitial: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  greeting: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    marginBottom: 4,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  biometricCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#8B2FC9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  biometricGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricIcon: {
    fontSize: 34,
  },
  authBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 48,
  },
  authBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  logoutBtn: {
    position: 'absolute',
    bottom: 32,
  },
  logoutText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

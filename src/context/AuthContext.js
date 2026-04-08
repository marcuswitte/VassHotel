import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

const STORAGE_KEY = '@vasshotel_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setUser(JSON.parse(raw));
        setIsLocked(true);
      }
    } catch (e) {
      console.error('Erro ao carregar usuário:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    setIsLocked(false);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setIsLocked(false);
  };

  const unlock = () => setIsLocked(false);
  const lock = () => setIsLocked(true);

  return (
    <AuthContext.Provider value={{ user, isLoading, isLocked, login, logout, unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { logoutUser } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          name: profile?.name ?? firebaseUser.email,
          email: firebaseUser.email,
          photoUri: profile?.photoUri ?? null,
        });
        setIsLocked(true);
      } else {
        setUser(null);
        setIsLocked(false);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsLocked(false);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setIsLocked(false);
  };

  const updateUser = async (updatedData) => {
    if (user?.uid) {
      await updateUserProfile(user.uid, updatedData);
    }
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const unlock = () => setIsLocked(false);
  const lock = () => setIsLocked(true);

  return (
    <AuthContext.Provider value={{ user, isLoading, isLocked, login, logout, unlock, lock, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

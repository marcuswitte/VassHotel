import { db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export const createUserProfile = async (uid, { name, email, photoUri }) => {
  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    photoUri: photoUri ?? null,
    createdAt: new Date().toISOString(),
  });
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), data);
};

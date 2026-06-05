import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';

export const createReservation = async ({ userId, hotelId, hotelName, hotelCity, hotelState, imageKey, checkIn, checkOut, guests }) => {
  return await addDoc(collection(db, 'reservations'), {
    userId,
    hotelId,
    hotelName,
    hotelCity,
    hotelState,
    imageKey,
    checkIn,
    checkOut,
    guests,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  });
};

export const getUserReservations = async (userId) => {
  const q = query(collection(db, 'reservations'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const cancelReservation = async (reservationId) => {
  await updateDoc(doc(db, 'reservations', reservationId), { status: 'cancelled' });
};

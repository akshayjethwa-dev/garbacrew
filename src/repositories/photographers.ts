import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  Query,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Photographer, PhotographerPackage } from '../types';
import { photographerConverter } from '../lib/converters';

const photographersCol = collection(db, 'photographers').withConverter(photographerConverter);

export function subscribePhotographers(
  city: string | null,
  callback: (list: Photographer[]) => void,
  onError: (e: Error) => void
) {
  const constraints: any[] = [
    where('isActive', '==', true),
    where('isVerified', '==', true),
    orderBy('rating', 'desc'),
    limit(50),
  ];
  if (city) constraints.splice(2, 0, where('city', '==', city));
  const q = query(photographersCol, ...constraints);
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data())), onError);
}

export function subscribePhotographer(
  id: string,
  callback: (p: Photographer | null) => void,
  onError: (e: Error) => void
) {
  return onSnapshot(doc(photographersCol, id), (snap) => callback(snap.exists() ? snap.data() : null), onError);
}

export function subscribePackages(
  photographerId: string,
  callback: (pkgs: PhotographerPackage[]) => void,
  onError: (e: Error) => void
) {
  const q = query(
    collection(db, 'photographers', photographerId, 'packages'),
    where('isActive', '==', true),
    orderBy('price', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PhotographerPackage, 'id'>) }))),
    onError
  );
}
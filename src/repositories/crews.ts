import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Crew, CrewMember, JoinRequest } from '../types';
import { crewConverter } from '../lib/converters';

const crewsCol = collection(db, 'crews').withConverter(crewConverter);

export function subscribeCrewsForEvent(
  eventId: string,
  isMale: boolean,
  callback: (crews: Crew[]) => void,
  onError: (e: Error) => void
) {
  const q = query(
    crewsCol,
    where('eventId', '==', eventId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      let crews = snap.docs.map((d) => d.data());
      if (isMale) crews = crews.filter((c) => c.genderPreference !== 'women_only');
      callback(crews);
    },
    onError
  );
}

export function subscribeMyCrews(uid: string, callback: (crews: Crew[]) => void, onError: (e: Error) => void) {
  const q = query(
    crewsCol,
    where('memberUids', 'array-contains', uid),
    where('isActive', '==', true),
    orderBy('lastMessageAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data())), onError);
}

export function subscribeCrew(crewId: string, callback: (crew: Crew | null) => void, onError: (e: Error) => void) {
  return onSnapshot(doc(crewsCol, crewId), (snap) => callback(snap.exists() ? snap.data() : null), onError);
}

export function subscribeCrewMembers(crewId: string, callback: (members: CrewMember[]) => void, onError: (e: Error) => void) {
  const q = query(collection(db, 'crews', crewId, 'members'), orderBy('joinedAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<CrewMember, 'uid'>) }))),
    onError
  );
}

export function subscribeJoinRequests(crewId: string, callback: (reqs: JoinRequest[]) => void, onError: (e: Error) => void) {
  const q = query(collection(db, 'crews', crewId, 'joinRequests'), orderBy('requestedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<JoinRequest, 'uid'>) }))),
    onError
  );
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createCrew(params: {
  eventId: string;
  eventName: string;
  name: string;
  vibeTag: string;
  maxMembers: number;
  genderPreference: 'any' | 'women_only';
  adminUid: string;
  adminName: string;
  adminPhotoUrl: string | null;
}): Promise<string> {
  const inviteCode = generateInviteCode();
  const ref = await addDoc(collection(db, 'crews'), {
    eventId: params.eventId,
    eventName: params.eventName,
    name: params.name,
    vibeTag: params.vibeTag,
    maxMembers: params.maxMembers,
    memberCount: 1,
    genderPreference: params.genderPreference,
    adminUid: params.adminUid,
    adminName: params.adminName,
    adminPhotoUrl: params.adminPhotoUrl,
    inviteCode,
    memberUids: [params.adminUid],
    isActive: true,
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    lastMessage: null,
  });

  await addDoc(collection(db, 'crews', ref.id, 'members'), {
    name: params.adminName,
    photoUrl: params.adminPhotoUrl,
    role: 'admin',
    joinedAt: serverTimestamp(),
  }).catch(async () => {
    // If addDoc fails, use setDoc with uid as doc ID
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'crews', ref.id, 'members', params.adminUid), {
      name: params.adminName,
      photoUrl: params.adminPhotoUrl,
      role: 'admin',
      joinedAt: serverTimestamp(),
    });
  });

  return ref.id;
}

export async function sendJoinRequest(crewId: string, user: { uid: string; name: string; photoUrl: string | null; age: number | null; bio: string | null }, message: string | null) {
  const { setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'crews', crewId, 'joinRequests', user.uid), {
    name: user.name,
    photoUrl: user.photoUrl,
    age: user.age,
    bio: user.bio,
    message,
    requestedAt: serverTimestamp(),
  });
}

export async function approveJoinRequest(crewId: string, request: JoinRequest) {
  const crewRef = doc(db, 'crews', crewId);
  const reqRef = doc(db, 'crews', crewId, 'joinRequests', request.uid);
  const memberRef = doc(db, 'crews', crewId, 'members', request.uid);

  await runTransaction(db, async (tx) => {
    const crewSnap = await tx.get(crewRef);
    if (!crewSnap.exists()) throw new Error('Crew not found');
    const data = crewSnap.data();
    const max = data.maxMembers ?? 6;
    const count = data.memberCount ?? 0;
    if (count >= max) throw new Error('Crew is full');

    tx.update(crewRef, {
      memberUids: arrayUnion(request.uid),
      memberCount: increment(1),
    });
    tx.set(memberRef, {
      name: request.name,
      photoUrl: request.photoUrl,
      role: 'member',
      joinedAt: serverTimestamp(),
    });
    tx.delete(reqRef);
  });
}

export async function declineJoinRequest(crewId: string, uid: string) {
  await deleteDoc(doc(db, 'crews', crewId, 'joinRequests', uid));
}

export async function leaveCrew(crewId: string, uid: string) {
  const crewRef = doc(db, 'crews', crewId);
  const snap = await getDoc(crewRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const isAdmin = data.adminUid === uid;

  await updateDoc(crewRef, {
    memberUids: arrayRemove(uid),
    memberCount: increment(-1),
    ...(isAdmin ? { isActive: false } : {}),
  });
  await deleteDoc(doc(db, 'crews', crewId, 'members', uid));
}
import {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from 'firebase/firestore';
import { Crew, CrewMember, JoinRequest, Photographer, PhotographerPackage } from '../types';

const crewConverter = {
  toFirestore: (c: Crew) => ({ ...c }),
  fromFirestore: (snap: QueryDocumentSnapshot, opts: SnapshotOptions): Crew => {
    const d = snap.data(opts);
    return {
      id: snap.id,
      eventId: d.eventId ?? '',
      eventName: d.eventName ?? '',
      name: d.name ?? '',
      vibeTag: d.vibeTag ?? 'traditional',
      maxMembers: d.maxMembers ?? 6,
      memberCount: d.memberCount ?? 0,
      genderPreference: d.genderPreference ?? 'any',
      adminUid: d.adminUid ?? '',
      adminName: d.adminName ?? '',
      adminPhotoUrl: d.adminPhotoUrl ?? null,
      inviteCode: d.inviteCode ?? '',
      memberUids: d.memberUids ?? [],
      lastMessage: d.lastMessage ?? null,
      lastMessageAt: d.lastMessageAt ?? null,
      isActive: d.isActive ?? true,
      createdAt: d.createdAt ?? Timestamp.now(),
    };
  },
};

const photographerConverter = {
  toFirestore: (p: Photographer) => ({ ...p }),
  fromFirestore: (snap: QueryDocumentSnapshot, opts: SnapshotOptions): Photographer => {
    const d = snap.data(opts);
    return {
      id: snap.id,
      name: d.name ?? '',
      photoUrl: d.photoUrl ?? null,
      city: d.city ?? '',
      serviceAreas: d.serviceAreas ?? [],
      bio: d.bio ?? '',
      portfolioUrls: d.portfolioUrls ?? [],
      rating: d.rating ?? 0,
      totalBookings: d.totalBookings ?? 0,
      isVerified: d.isVerified ?? false,
      isActive: d.isActive ?? true,
      startingPrice: d.startingPrice ?? 0,
      createdAt: d.createdAt ?? Timestamp.now(),
    };
  },
};

export { crewConverter, photographerConverter };
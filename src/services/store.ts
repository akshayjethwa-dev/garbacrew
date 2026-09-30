import { AppUser, Crew, CrewMember, JoinRequest, Photographer, PhotographerPackage } from '../types';
import { INITIAL_CREWS, INITIAL_CREW_MEMBERS, INITIAL_PACKAGES, INITIAL_PHOTOGRAPHERS } from '../data/initialData';

const STORAGE_KEY_USER = 'garbacrew_user';
const STORAGE_KEY_CREWS = 'garbacrew_crews';
const STORAGE_KEY_MEMBERS = 'garbacrew_members';
const STORAGE_KEY_REQUESTS = 'garbacrew_requests';

export class AppStore {
  private static user: AppUser | null = null;
  private static crews: Crew[] = [];
  private static crewMembers: Record<string, CrewMember[]> = {};
  private static joinRequests: Record<string, JoinRequest[]> = {};
  private static photographers: Photographer[] = INITIAL_PHOTOGRAPHERS;
  private static packages: Record<string, PhotographerPackage[]> = INITIAL_PACKAGES;
  private static listeners: Set<() => void> = new Set();
  private static initialized = false;

  public static init() {
    if (this.initialized) return;
    this.initialized = true;

    // Load from localStorage
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        this.user = JSON.parse(savedUser);
      }

      const savedCrews = localStorage.getItem(STORAGE_KEY_CREWS);
      if (savedCrews) {
        this.crews = JSON.parse(savedCrews);
      } else {
        this.crews = [...INITIAL_CREWS];
        this.saveCrews();
      }

      const savedMembers = localStorage.getItem(STORAGE_KEY_MEMBERS);
      if (savedMembers) {
        this.crewMembers = JSON.parse(savedMembers);
      } else {
        this.crewMembers = { ...INITIAL_CREW_MEMBERS };
        this.saveMembers();
      }

      const savedReqs = localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (savedReqs) {
        this.joinRequests = JSON.parse(savedReqs);
      } else {
        this.joinRequests = {};
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
      this.crews = [...INITIAL_CREWS];
      this.crewMembers = { ...INITIAL_CREW_MEMBERS };
      this.joinRequests = {};
    }
  }

  public static subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private static saveUser() {
    try {
      if (this.user) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch {}
  }

  private static saveCrews() {
    try {
      localStorage.setItem(STORAGE_KEY_CREWS, JSON.stringify(this.crews));
    } catch {}
  }

  private static saveMembers() {
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(this.crewMembers));
    } catch {}
  }

  private static saveRequests() {
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(this.joinRequests));
    } catch {}
  }

  // --- User / Auth ---
  public static getUser(): AppUser | null {
    return this.user;
  }

  public static createDemoSession(phone: string): AppUser {
    const uid = 'user_' + Math.random().toString(36).substring(2, 9);
    const newUser: AppUser = {
      uid,
      phone: `+91${phone}`,
      name: '',
      age: 22,
      gender: 'male',
      city: 'Ahmedabad',
      area: 'Satellite',
      bio: '',
      photoUrl: null,
      isVerified: false,
      profileComplete: false,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };
    this.user = newUser;
    this.saveUser();
    this.notify();
    return newUser;
  }

  public static updateProfile(updates: Partial<AppUser>) {
    if (!this.user) return;
    this.user = {
      ...this.user,
      ...updates,
      profileComplete: true,
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };
    this.saveUser();
    this.notify();
  }

  public static signOut() {
    this.user = null;
    this.saveUser();
    this.notify();
  }

  // Quick switch / demo login for evaluation
  public static loginAsDemo() {
    const demoUser: AppUser = {
      uid: 'user-demo-dancer',
      phone: '+919876543210',
      name: 'Aarav Patel',
      age: 24,
      gender: 'male',
      city: 'Ahmedabad',
      area: 'Satellite',
      bio: 'Loves high-energy 3-Taali and Dodhiya! Looking for enthusiastic dancers.',
      photoUrl: null,
      isVerified: true,
      profileComplete: true,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };
    this.user = demoUser;
    this.saveUser();
    this.notify();
  }

  // --- Crews ---
  public static getCrews(): Crew[] {
    return this.crews;
  }

  public static getMyCrews(uid?: string): Crew[] {
    if (!uid) return [];
    return this.crews.filter((c) => c.memberUids.includes(uid) && c.isActive);
  }

  public static getCrew(id: string): Crew | undefined {
    return this.crews.find((c) => c.id === id);
  }

  public static getCrewMembers(crewId: string): CrewMember[] {
    return this.crewMembers[crewId] || [];
  }

  public static getJoinRequests(crewId: string): JoinRequest[] {
    return this.joinRequests[crewId] || [];
  }

  public static createCrew(params: {
    eventId: string;
    eventName: string;
    name: string;
    vibeTag: string;
    maxMembers: number;
    genderPreference: 'any' | 'women_only';
  }): Crew {
    if (!this.user) throw new Error('Must be signed in to create a crew');

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let inviteCode = '';
    for (let i = 0; i < 6; i++) inviteCode += chars[Math.floor(Math.random() * chars.length)];

    const crewId = 'crew_' + Date.now();
    const newCrew: Crew = {
      id: crewId,
      eventId: params.eventId,
      eventName: params.eventName,
      name: params.name,
      vibeTag: params.vibeTag,
      maxMembers: params.maxMembers,
      memberCount: 1,
      genderPreference: params.genderPreference,
      adminUid: this.user.uid,
      adminName: this.user.name || 'Anonymous Dancer',
      adminPhotoUrl: this.user.photoUrl,
      inviteCode,
      memberUids: [this.user.uid],
      lastMessage: 'Crew created! Welcome to ' + params.name,
      lastMessageAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
      isActive: true,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };

    const adminMember: CrewMember = {
      uid: this.user.uid,
      name: this.user.name || 'Admin',
      photoUrl: this.user.photoUrl,
      role: 'admin',
      joinedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };

    this.crews = [newCrew, ...this.crews];
    this.crewMembers[crewId] = [adminMember];
    this.joinRequests[crewId] = [];

    this.saveCrews();
    this.saveMembers();
    this.saveRequests();
    this.notify();

    return newCrew;
  }

  public static sendJoinRequest(crewId: string, message: string = '') {
    if (!this.user) throw new Error('Must be logged in to join');
    const crew = this.getCrew(crewId);
    if (!crew) throw new Error('Crew not found');

    if (crew.genderPreference === 'women_only' && this.user.gender === 'male') {
      throw new Error('This crew is women only');
    }

    if (crew.memberCount >= crew.maxMembers) {
      throw new Error('This crew is currently full');
    }

    const requests = this.joinRequests[crewId] || [];
    if (requests.some((r) => r.uid === this.user!.uid)) {
      throw new Error('Join request already submitted');
    }

    const newReq: JoinRequest = {
      uid: this.user.uid,
      name: this.user.name || 'Garba Lover',
      photoUrl: this.user.photoUrl,
      age: this.user.age,
      bio: this.user.bio,
      message: message || 'Hey, would love to join your Garba crew!',
      requestedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };

    this.joinRequests[crewId] = [...requests, newReq];
    this.saveRequests();
    this.notify();
  }

  public static approveJoinRequest(crewId: string, request: JoinRequest) {
    const crew = this.getCrew(crewId);
    if (!crew) return;
    if (crew.memberCount >= crew.maxMembers) {
      throw new Error('Crew is already full');
    }

    // Add to members
    const members = this.crewMembers[crewId] || [];
    const newMember: CrewMember = {
      uid: request.uid,
      name: request.name,
      photoUrl: request.photoUrl,
      role: 'member',
      joinedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };

    this.crewMembers[crewId] = [...members, newMember];

    // Remove from requests
    this.joinRequests[crewId] = (this.joinRequests[crewId] || []).filter((r) => r.uid !== request.uid);

    // Update crew member list and count
    this.crews = this.crews.map((c) => {
      if (c.id === crewId) {
        return {
          ...c,
          memberUids: [...c.memberUids, request.uid],
          memberCount: c.memberCount + 1,
        };
      }
      return c;
    });

    this.saveCrews();
    this.saveMembers();
    this.saveRequests();
    this.notify();
  }

  public static declineJoinRequest(crewId: string, uid: string) {
    this.joinRequests[crewId] = (this.joinRequests[crewId] || []).filter((r) => r.uid !== uid);
    this.saveRequests();
    this.notify();
  }

  public static leaveCrew(crewId: string, uid: string) {
    const crew = this.getCrew(crewId);
    if (!crew) return;

    const isAdmin = crew.adminUid === uid;
    this.crewMembers[crewId] = (this.crewMembers[crewId] || []).filter((m) => m.uid !== uid);

    this.crews = this.crews
      .map((c) => {
        if (c.id === crewId) {
          return {
            ...c,
            memberUids: c.memberUids.filter((id) => id !== uid),
            memberCount: Math.max(0, c.memberCount - 1),
            isActive: isAdmin ? false : c.isActive,
          };
        }
        return c;
      })
      .filter((c) => c.isActive);

    this.saveCrews();
    this.saveMembers();
    this.notify();
  }

  // --- Photographers ---
  public static getPhotographers(city?: string): Photographer[] {
    if (!city || city === 'All Cities') {
      return this.photographers;
    }
    return this.photographers.filter((p) => p.city.toLowerCase() === city.toLowerCase());
  }

  public static getPhotographer(id: string): Photographer | undefined {
    return this.photographers.find((p) => p.id === id);
  }

  public static getPackages(photographerId: string): PhotographerPackage[] {
    return this.packages[photographerId] || [];
  }
}

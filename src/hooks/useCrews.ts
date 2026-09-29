import { useEffect, useState } from 'react';
import { Crew, JoinRequest } from '../types';
import {
  subscribeCrewsForEvent,
  subscribeMyCrews,
  subscribeCrew,
  subscribeJoinRequests,
} from '../repositories/crews';

export function useCrewsForEvent(eventId: string, isMale: boolean) {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    const unsub = subscribeCrewsForEvent(
      eventId,
      isMale,
      (c) => { setCrews(c); setLoading(false); setError(null); },
      (e) => { setError(e); setLoading(false); }
    );
    return unsub;
  }, [eventId, isMale]);

  return { crews, loading, error };
}

export function useMyCrews(uid: string | undefined) {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const unsub = subscribeMyCrews(
      uid,
      (c) => { setCrews(c); setLoading(false); setError(null); },
      (e) => { setError(e); setLoading(false); }
    );
    return unsub;
  }, [uid]);

  return { crews, loading, error };
}

export function useCrew(crewId: string) {
  const [crew, setCrew] = useState<Crew | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!crewId) return;
    const unsub = subscribeCrew(
      crewId,
      (c) => { setCrew(c); setLoading(false); },
      (e) => { setError(e); setLoading(false); }
    );
    return unsub;
  }, [crewId]);

  return { crew, loading, error };
}

export function useJoinRequests(crewId: string) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!crewId) return;
    const unsub = subscribeJoinRequests(
      crewId,
      (r) => { setRequests(r); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, [crewId]);

  return { requests, loading };
}
import { useEffect, useState } from 'react';
import { Photographer, PhotographerPackage } from '../types';
import {
  subscribePhotographers,
  subscribePhotographer,
  subscribePackages,
} from '../repositories/photographers';

export function usePhotographers(city: string | null = null) {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribePhotographers(
      city,
      (list) => {
        setPhotographers(list);
        setLoading(false);
        setError(null);
      },
      (e) => {
        setError(e);
        setLoading(false);
      }
    );
    return unsub;
  }, [city]);

  return { photographers, loading, error };
}

export function usePhotographer(id: string) {
  const [photographer, setPhotographer] = useState<Photographer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribePhotographer(
      id,
      (p) => {
        setPhotographer(p);
        setLoading(false);
      },
      (e) => {
        setError(e);
        setLoading(false);
      }
    );
    return unsub;
  }, [id]);

  return { photographer, loading, error };
}

export function usePhotographerPackages(id: string) {
  const [packages, setPackages] = useState<PhotographerPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribePackages(
      id,
      (pkgs) => {
        setPackages(pkgs);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [id]);

  return { packages, loading };
}
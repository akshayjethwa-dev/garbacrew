/// <reference types="vite/client" />

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module 'react-dom/client' {
  import { ReactNode } from 'react';
  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }
  export function createRoot(container: Element | DocumentFragment): Root;
  export function hydrateRoot(container: Element | DocumentFragment, children: ReactNode): Root;
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  export type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; className?: string }>;
  export const Users: LucideIcon;
  export const Camera: LucideIcon;
  export const User: LucideIcon;
  export const Sparkles: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const X: LucideIcon;
  export const Heart: LucideIcon;
  export const Shield: LucideIcon;
  export const Copy: LucideIcon;
  export const Check: LucideIcon;
  export const LogOut: LucideIcon;
  export const UserPlus: LucideIcon;
  export const Plus: LucideIcon;
  export const Search: LucideIcon;
  export const Star: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const MapPin: LucideIcon;
  export const Clock: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Edit3: LucideIcon;
  export const Phone: LucideIcon;
}

declare module 'vite' {
  export function defineConfig(config: any): any;
  export interface UserConfig {
    [key: string]: any;
  }
}

declare module '@vitejs/plugin-react' {
  export default function react(options?: any): any;
}

declare module '@tailwindcss/vite' {
  export default function tailwindcss(): any;
}

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
  interface Process {
    env: ProcessEnv;
  }
}

declare const process: any;

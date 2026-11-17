import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Stockage clé → valeur asynchrone (même forme que celui attendu par supabase-js). */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** expo-secure-store déconseille les valeurs de plus de 2 ko : on découpe en morceaux. */
const CHUNK_SIZE = 1800;
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

/** Stockage chiffré du téléphone (Keychain iOS, Keystore Android), avec découpage. */
export function createSecureStorage(store: typeof SecureStore = SecureStore): KeyValueStorage {
  return {
    async getItem(key) {
      const k = safeKey(key);
      const count = await store.getItemAsync(`${k}.n`);
      if (count === null) return store.getItemAsync(k);
      const parts: string[] = [];
      for (let i = 0; i < Number(count); i += 1) {
        const part = await store.getItemAsync(`${k}.${i}`);
        if (part === null) return null;
        parts.push(part);
      }
      return parts.join('');
    },
    async setItem(key, value) {
      const k = safeKey(key);
      await this.removeItem(key);
      if (value.length <= CHUNK_SIZE) {
        await store.setItemAsync(k, value);
        return;
      }
      const count = Math.ceil(value.length / CHUNK_SIZE);
      for (let i = 0; i < count; i += 1) {
        await store.setItemAsync(`${k}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
      }
      await store.setItemAsync(`${k}.n`, String(count));
    },
    async removeItem(key) {
      const k = safeKey(key);
      const count = await store.getItemAsync(`${k}.n`);
      if (count !== null) {
        for (let i = 0; i < Number(count); i += 1) await store.deleteItemAsync(`${k}.${i}`);
        await store.deleteItemAsync(`${k}.n`);
      }
      await store.deleteItemAsync(k);
    },
  };
}

/** Stockage en mémoire (tests, ou navigateur sans localStorage). */
export function createMemoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
}

function createWebStorage(): KeyValueStorage {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return createMemoryStorage();
    return {
      getItem: async (key) => ls.getItem(key),
      setItem: async (key, value) => ls.setItem(key, value),
      removeItem: async (key) => ls.removeItem(key),
    };
  } catch {
    return createMemoryStorage();
  }
}

let current: KeyValueStorage | undefined;

/** Stockage de l'app : sécurisé sur téléphone, localStorage sur le web. */
export function getStorage(): KeyValueStorage {
  current ??= Platform.OS === 'web' ? createWebStorage() : createSecureStorage();
  return current;
}

/** Remplace le stockage (tests). */
export function setStorage(storage: KeyValueStorage): void {
  current = storage;
}

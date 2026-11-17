import * as SecureStore from 'expo-secure-store';

import { createSecureStorage } from '@/lib/storage';

describe('stockage sécurisé', () => {
  it('découpe les longues valeurs (session) et les relit à l’identique', async () => {
    const storage = createSecureStorage(SecureStore);
    const long = 'x'.repeat(5000);
    await storage.setItem('alt.auth.session', long);
    expect(await storage.getItem('alt.auth.session')).toBe(long);
    await storage.setItem('alt.auth.session', 'court');
    expect(await storage.getItem('alt.auth.session')).toBe('court');
    await storage.removeItem('alt.auth.session');
    expect(await storage.getItem('alt.auth.session')).toBeNull();
  });
});

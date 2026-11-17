import { parsePublicEnv } from '@/config/env';

describe('parsePublicEnv', () => {
  it('accepte une URL et une clé publique', () => {
    expect(
      parsePublicEnv({ supabaseUrl: 'http://127.0.0.1:54321', supabaseAnonKey: 'cle-publique' }),
    ).toEqual({ supabaseUrl: 'http://127.0.0.1:54321', supabaseAnonKey: 'cle-publique' });
  });

  it('ignore toute autre valeur (seules URL et clé publique sont exposées)', () => {
    const env = parsePublicEnv({
      supabaseUrl: 'https://exemple.supabase.co',
      supabaseAnonKey: 'cle-publique',
      autre: 'valeur',
    });
    expect(Object.keys(env).sort()).toEqual(['supabaseAnonKey', 'supabaseUrl']);
  });

  it('explique clairement ce qui manque', () => {
    expect(() => parsePublicEnv(undefined)).toThrow(/\.env\.example/);
    expect(() => parsePublicEnv({ supabaseUrl: 'pas-une-url', supabaseAnonKey: '' })).toThrow(
      /EXPO_PUBLIC_SUPABASE_URL[\s\S]*EXPO_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });
});

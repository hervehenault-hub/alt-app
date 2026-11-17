import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Complète app.json avec les variables d'environnement PUBLIQUES (fichier .env, voir .env.example).
 * Tout ce qui est dans `extra` est embarqué dans l'application et donc lisible par n'importe qui :
 * URL Supabase, clé publique (anon), identifiants OAuth Google (publics par nature), mode démo.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  const plugins: ExpoConfig['plugins'] = [
    ...(config.plugins ?? []),
    'expo-secure-store',
    'expo-apple-authentication',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Alt. utilise votre position pour trier les lieux par distance. Elle reste sur votre téléphone.',
      },
    ],
  ];
  // Le module Google exige le « URL scheme » iOS : ajouté seulement une fois les identifiants créés.
  if (googleIosUrlScheme) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: googleIosUrlScheme },
    ]);
  }
  return {
    ...config,
    name: config.name ?? 'Alt.',
    slug: config.slug ?? 'alt',
    ios: { ...config.ios, usesAppleSignIn: true },
    plugins,
    extra: {
      ...config.extra,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      demoMode: process.env.EXPO_PUBLIC_DEMO === '1',
    },
  };
};

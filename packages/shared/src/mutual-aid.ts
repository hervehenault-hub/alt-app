/**
 * Entraide (lot 8) : règles pures, sans dépendance à l'app.
 */
export const HELP_SERVICES = ['repair_help', 'carpool', 'childcare', 'tool_sharing'] as const;
export type HelpService = (typeof HELP_SERVICES)[number];
export type HelpPostType = 'offer' | 'request';

export const HELP_POST_MAX_LENGTH = 500;
export const HELP_POST_TTL_DAYS = 30;

export type ContactWarning = 'phone' | 'email' | 'address';

const PHONE = /(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const ADDRESS =
  /\b\d{1,4}\s?(?:bis|ter)?,?\s+(?:rue|avenue|av\.|boulevard|bd|cours|place|quai|allée|impasse|chemin|route)\b/i;

/**
 * Coordonnées détectées dans une annonce (T8.3) : l'app avertit avant publication,
 * pour éviter de publier un numéro ou une adresse exacte.
 */
export function detectContactInfo(text: string): ContactWarning[] {
  const found: ContactWarning[] = [];
  if (PHONE.test(text)) found.push('phone');
  if (EMAIL.test(text)) found.push('email');
  if (ADDRESS.test(text)) found.push('address');
  return found;
}

/** Une annonce est visible tant qu'elle est ouverte et non expirée. */
export function isHelpPostVisible(
  post: { status: 'open' | 'closed' | 'hidden'; expiresAt: string },
  now: Date,
): boolean {
  return post.status === 'open' && Date.parse(post.expiresAt) > now.getTime();
}

import { formatDistance, parisCalendarDate, type PlaceStatus } from '@alt/shared';

import type { ReliabilityStatus } from '@/components';
import { t, type TranslationKey } from '@/i18n';

/** Badge de fiabilité affiché pour un lieu. */
export function reliabilityOf(place: {
  status: PlaceStatus;
  needsRecheck: boolean;
}): ReliabilityStatus {
  if (place.needsRecheck) return 'to_recheck';
  if (place.status === 'merchant_confirmed') return 'confirmed_by_business';
  if (place.status === 'multi_confirmed') return 'confirmed_by_users';
  return 'community';
}

/** « 4 », « 4,50 » : montant en euros à la française. */
export function formatEuros(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace('.', ',');
}

/** « 10 novembre 2026 » (heure de Paris), sans dépendre d'Intl. */
export function formatVerifiedDate(iso: string): string {
  const { year, month, day } = parisCalendarDate(new Date(iso));
  return `${day} ${t(`places.months.${month}` as TranslationKey)} ${year}`;
}

export function formatPlaceDistance(distanceM: number | null): string | null {
  return distanceM === null ? null : formatDistance(distanceM);
}

export function openLabel(isOpen: boolean | null): string {
  if (isOpen === null) return t('places.list.noHours');
  return isOpen ? t('places.list.open') : t('places.list.closed');
}

/**
 * Converts a timestamp to a relative time string in Polish
 * Returns null if timestamp is older than 30 days (expired)
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string or null if expired
 */
export function getRelativeTime(timestamp: number): string | null {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  // Expired (30+ days)
  if (diffDays >= 30) {
    return null;
  }

  // Less than 1 hour
  if (diffMinutes < 60) {
    if (diffMinutes < 1) return 'Przed chwilą';
    if (diffMinutes === 1) return '1 minutę temu';
    if (diffMinutes < 5) return `${diffMinutes} minuty temu`;
    return `${diffMinutes} minut temu`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    if (diffHours === 1) return '1 godzinę temu';
    if (diffHours < 5) return `${diffHours} godziny temu`;
    return `${diffHours} godzin temu`;
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Wczoraj';
  }

  // 2-6 days
  if (diffDays < 7) {
    return `${diffDays} dni temu`;
  }

  // 7-29 days (weeks)
  if (diffWeeks === 1) {
    return '1 tydzień temu';
  }
  if (diffWeeks < 5) {
    return `${diffWeeks} tygodnie temu`;
  }
  return `${diffWeeks} tygodni temu`;
}

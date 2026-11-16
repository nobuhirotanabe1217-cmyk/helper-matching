// Live date and staleness utilities (never hardcode today's date in runtime behavior)

export const STALE_PROVIDER_DAYS_THRESHOLD = 30;

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatIsoDateTime(date: Date): string {
  const datePart = formatIsoDate(date);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${datePart} ${hh}:${mm}`;
}

export function getTodayIso(now: Date = new Date()): string {
  return formatIsoDate(now);
}

export function getNowDateTime(now: Date = new Date()): string {
  return formatIsoDateTime(now);
}

export function getCurrentYearMonth(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function addDaysToIso(isoDate: string, days: number): string {
  const parsed = parseIsoDateLocal(isoDate);
  if (!parsed) return isoDate;
  const copy = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + days);
  return formatIsoDate(copy);
}

export function addMonthsToIso(isoDate: string, months: number): string {
  const parsed = parseIsoDateLocal(isoDate);
  if (!parsed) return isoDate;
  const copy = new Date(parsed.getFullYear(), parsed.getMonth() + months, parsed.getDate());
  return formatIsoDate(copy);
}

export function parseIsoDateLocal(isoOrDateTime: string): Date | null {
  if (!isoOrDateTime || typeof isoOrDateTime !== 'string') return null;
  const dateOnly = isoOrDateTime.trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const constructed = new Date(y, m - 1, d);
  if (
    constructed.getFullYear() !== y ||
    constructed.getMonth() !== m - 1 ||
    constructed.getDate() !== d
  ) {
    return null;
  }
  return constructed;
}

export function daysSinceIsoDate(
  targetIsoDate: string | undefined,
  referenceDate: Date = new Date()
): number {
  if (!targetIsoDate) return 999;
  const parsed = parseIsoDateLocal(targetIsoDate);
  if (!parsed) return 999;
  const refLocal = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const diffMs = refLocal.getTime() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function isProviderStale(
  updatedAt: string | undefined,
  referenceDate: Date = new Date(),
  thresholdDays: number = STALE_PROVIDER_DAYS_THRESHOLD
): boolean {
  return daysSinceIsoDate(updatedAt, referenceDate) >= thresholdDays;
}

export function formatJapaneseDate(isoDate: string | undefined): string {
  const parsed = isoDate ? parseIsoDateLocal(isoDate) : null;
  if (!parsed) return '未更新';
  return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`;
}

export function formatJapaneseMonthDay(isoDate: string | undefined): string {
  const parsed = isoDate ? parseIsoDateLocal(isoDate) : null;
  if (!parsed) return '未設定';
  return `${parsed.getMonth() + 1}月${parsed.getDate()}日`;
}

export function formatJapaneseMonthOnly(isoDate: string | undefined): string {
  const parsed = isoDate ? parseIsoDateLocal(isoDate) : null;
  if (!parsed) return '';
  return `${parsed.getMonth() + 1}月`;
}

export function getEffectiveReferenceDate(
  offsetDays: number = 0,
  baseDate: Date = new Date()
): Date {
  if (!offsetDays) return baseDate;
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + offsetDays,
    baseDate.getHours(),
    baseDate.getMinutes(),
    baseDate.getSeconds()
  );
}

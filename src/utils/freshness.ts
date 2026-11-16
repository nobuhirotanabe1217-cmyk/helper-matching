import {
  ConfirmedInterviewRecord,
  DisclosureConsent,
  ProviderDiscrepancyReport,
  ProviderProfile,
  UserProfile,
  UserRecruitmentStatus,
} from '../types/domain';
import {
  daysSinceIsoDate,
  formatJapaneseMonthDay,
  formatJapaneseMonthOnly,
} from './date';

export const PROVIDER_REMINDER_DAYS = 25;
export const PROVIDER_FRESH_MAX_DAYS = 30;
export const PROVIDER_PAUSE_THRESHOLD_DAYS = 61;
export const USER_AUTO_PAUSE_THRESHOLD_DAYS = 90;
export const REPORT_UNDER_REVIEW_THRESHOLD = 3;

export type ProviderFreshnessTier = 'fresh' | 'warning' | 'paused';

export interface ProviderFreshnessInfo {
  tier: ProviderFreshnessTier;
  daysElapsed: number;
  updatedAt: string;
  monthDayLabel: string;
  badgeText: string;
  isApproachingReminder: boolean;
  isStaleWarning: boolean;
  isAutoPaused: boolean;
  pauseNoticeText: string | null;
}

export function getProviderFreshnessInfo(
  updatedAt: string | undefined,
  referenceDate: Date = new Date()
): ProviderFreshnessInfo {
  const safeUpdatedAt = updatedAt || '';
  const daysElapsed = daysSinceIsoDate(updatedAt, referenceDate);
  const monthDayLabel = formatJapaneseMonthDay(updatedAt);

  let tier: ProviderFreshnessTier = 'fresh';
  let badgeText = `${monthDayLabel}に確認済み`;

  if (daysElapsed >= PROVIDER_PAUSE_THRESHOLD_DAYS) {
    tier = 'paused';
    badgeText = '60日以上未更新・要確認';
  } else if (daysElapsed > PROVIDER_FRESH_MAX_DAYS) {
    tier = 'warning';
    badgeText = '30日以上、未更新です';
  }

  const isAutoPaused = tier === 'paused';

  return {
    tier,
    daysElapsed,
    updatedAt: safeUpdatedAt,
    monthDayLabel,
    badgeText,
    isApproachingReminder: daysElapsed >= PROVIDER_REMINDER_DAYS,
    isStaleWarning: daysElapsed > PROVIDER_FRESH_MAX_DAYS,
    isAutoPaused,
    pauseNoticeText: isAutoPaused
      ? '事業所の情報確認中です。更新されると再開します'
      : null,
  };
}

export interface UserFreshnessInfo {
  confirmedAt: string;
  daysElapsed: number;
  monthDayLabel: string;
  confirmedLabel: string;
  manualStatus: UserRecruitmentStatus;
  effectiveStatus: UserRecruitmentStatus;
  isAutoPaused: boolean;
  shouldHighlightConfirmation: boolean;
}

export function getUserFreshnessInfo(
  profile: Pick<
    UserProfile,
    'confirmedAt' | 'registeredAt' | 'recruitmentStatus'
  >,
  referenceDate: Date = new Date()
): UserFreshnessInfo {
  const baseDateStr = profile.confirmedAt || profile.registeredAt || '';
  const daysElapsed = baseDateStr
    ? daysSinceIsoDate(baseDateStr, referenceDate)
    : 0;
  const monthDayLabel = baseDateStr
    ? formatJapaneseMonthDay(baseDateStr)
    : '本日';
  const manualStatus: UserRecruitmentStatus =
    profile.recruitmentStatus || '募集中';
  const isAutoPaused = daysElapsed >= USER_AUTO_PAUSE_THRESHOLD_DAYS;
  const effectiveStatus: UserRecruitmentStatus =
    isAutoPaused || manualStatus === '休止中' ? '休止中' : '募集中';

  return {
    confirmedAt: baseDateStr,
    daysElapsed,
    monthDayLabel,
    confirmedLabel: `${monthDayLabel}に希望を確認済み`,
    manualStatus,
    effectiveStatus,
    isAutoPaused,
    shouldHighlightConfirmation:
      daysElapsed >= 30 || isAutoPaused || manualStatus === '休止中',
  };
}

export interface ProviderDiscrepancySummary {
  providerId: string;
  count: number;
  isUnderReview: boolean;
  label: string | null;
  reports: ProviderDiscrepancyReport[];
}

export function getProviderDiscrepancySummary(
  providerId: string,
  reports: ProviderDiscrepancyReport[]
): ProviderDiscrepancySummary {
  const providerReports = reports.filter((r) => r.providerId === providerId);
  const count = providerReports.length;
  const isUnderReview = count >= REPORT_UNDER_REVIEW_THRESHOLD;
  return {
    providerId,
    count,
    isUnderReview,
    label: isUnderReview ? '情報の確認中です' : null,
    reports: providerReports,
  };
}

export interface ProviderInterviewTrustInfo {
  hasRecord: boolean;
  latestMonthLabel: string | null;
  badgeText: string | null;
  count: number;
}

export function getProviderInterviewTrustBadge(
  providerId: string,
  records: ConfirmedInterviewRecord[],
  disclosures: DisclosureConsent[] = []
): ProviderInterviewTrustInfo {
  const matchingRecords = records.filter((r) => r.providerId === providerId);
  const disclosureDates = disclosures
    .filter((d) => d.providerId === providerId && Boolean(d.scheduleDecidedAt))
    .map((d) => d.scheduleDecidedAt as string);

  const allDates = [
    ...matchingRecords.map((r) => r.confirmedAt),
    ...disclosureDates,
  ].filter(Boolean);

  if (allDates.length === 0) {
    return {
      hasRecord: false,
      latestMonthLabel: null,
      badgeText: null,
      count: 0,
    };
  }

  const sortedDates = [...allDates].sort((a, b) => b.localeCompare(a));
  const latestIso = sortedDates[0];
  const recordWithLabel = matchingRecords.find(
    (r) => r.confirmedAt === latestIso && r.confirmedMonthLabel
  );
  const monthLabel =
    recordWithLabel?.confirmedMonthLabel || formatJapaneseMonthOnly(latestIso);

  if (!monthLabel) {
    return {
      hasRecord: false,
      latestMonthLabel: null,
      badgeText: null,
      count: allDates.length,
    };
  }

  return {
    hasRecord: true,
    latestMonthLabel: monthLabel,
    badgeText: `${monthLabel}に面談が決まった実績があります`,
    count: allDates.length,
  };
}

export interface FreshnessDashboardMetrics {
  totalProviders: number;
  updatedWithin30Count: number;
  updateRatePercent: number;
  warningProvidersCount: number;
  pausedProvidersCount: number;
  providersByStaleness: Array<{
    provider: ProviderProfile;
    freshness: ProviderFreshnessInfo;
    reportCount: number;
    isUnderReview: boolean;
  }>;
  reportedProviders: Array<{
    provider: ProviderProfile;
    freshness: ProviderFreshnessInfo;
    summary: ProviderDiscrepancySummary;
  }>;
  totalUsers: number;
  recruitingUsersCount: number;
  pausedUsersCount: number;
  autoPausedUsersCount: number;
  pausedUsers: Array<{
    user: UserProfile;
    freshness: UserFreshnessInfo;
  }>;
}

export function calculateFreshnessDashboardMetrics(params: {
  providers: ProviderProfile[];
  users: UserProfile[];
  reports: ProviderDiscrepancyReport[];
  referenceDate?: Date;
}): FreshnessDashboardMetrics {
  const ref = params.referenceDate || new Date();
  const totalProviders = params.providers.length;

  const providerRows = params.providers.map((provider) => {
    const freshness = getProviderFreshnessInfo(provider.updatedAt, ref);
    const summary = getProviderDiscrepancySummary(provider.id, params.reports);
    return {
      provider,
      freshness,
      summary,
    };
  });

  const updatedWithin30Count = providerRows.filter(
    (r) => r.freshness.tier === 'fresh'
  ).length;
  const warningProvidersCount = providerRows.filter(
    (r) => r.freshness.tier === 'warning'
  ).length;
  const pausedProvidersCount = providerRows.filter(
    (r) => r.freshness.tier === 'paused'
  ).length;
  const updateRatePercent =
    totalProviders > 0
      ? Math.round((updatedWithin30Count / totalProviders) * 100)
      : 100;

  const providersByStaleness = [...providerRows]
    .sort((a, b) => b.freshness.daysElapsed - a.freshness.daysElapsed)
    .map((r) => ({
      provider: r.provider,
      freshness: r.freshness,
      reportCount: r.summary.count,
      isUnderReview: r.summary.isUnderReview,
    }));

  const reportedProviders = providerRows
    .filter((r) => r.summary.count > 0)
    .sort((a, b) => b.summary.count - a.summary.count);

  const userRows = params.users.map((user) => ({
    user,
    freshness: getUserFreshnessInfo(user, ref),
  }));

  const pausedUsers = userRows.filter(
    (u) => u.freshness.effectiveStatus === '休止中'
  );
  const autoPausedUsersCount = pausedUsers.filter(
    (u) => u.freshness.isAutoPaused
  ).length;
  const recruitingUsersCount = userRows.length - pausedUsers.length;

  return {
    totalProviders,
    updatedWithin30Count,
    updateRatePercent,
    warningProvidersCount,
    pausedProvidersCount,
    providersByStaleness,
    reportedProviders,
    totalUsers: params.users.length,
    recruitingUsersCount,
    pausedUsersCount: pausedUsers.length,
    autoPausedUsersCount,
    pausedUsers,
  };
}

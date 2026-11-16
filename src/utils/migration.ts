import {
  ProviderAvailability,
  ProviderCapabilities,
  ProviderProfile,
  ProviderSubscription,
  UserProfile,
  UserSupportNeeds,
  DisclosureConsent,
  DisclosureHistoryEntry,
  CoordinatorProfile,
  SharedCaseToCoordinator,
  SubscriptionPlanDefinition,
  ProviderDiscrepancyReport,
  ConfirmedInterviewRecord,
} from '../types/domain';
import { formatJapaneseMonthOnly, getTodayIso } from './date';
import { DEFAULT_SUBSCRIPTION_PLANS } from './subscription';

/**
 * 既存のLocalStorageデータが消えないよう、新項目に初期値を補完して移行する純粋関数
 */
export function migratePersistedState(rawSaved: Record<string, any>): Record<string, any> {
  const today = getTodayIso();

  const migratedUserProfiles: UserProfile[] = Array.isArray(rawSaved.userProfiles)
    ? rawSaved.userProfiles.map((u: any) => ({
        ...u,
        confirmedAt: u.confirmedAt || today,
        recruitmentStatus: u.recruitmentStatus || '募集中',
        familyShareToken: u.familyShareToken || `fam_${u.id || 'share'}`,
        sharedCoordinatorIds: Array.isArray(u.sharedCoordinatorIds)
          ? u.sharedCoordinatorIds
          : [],
        disclosableInfo: {
          contactPersonRole: u.disclosableInfo?.contactPersonRole || '本人・ご家族',
          nearestStationArea: u.disclosableInfo?.nearestStationArea || '最寄り駅は相談時に案内',
          preferredContactMethod: u.disclosableInfo?.preferredContactMethod || 'アプリ内チャット',
          consultationSupportOffice: u.disclosableInfo?.consultationSupportOffice || '未設定',
          detailedScheduleNote: u.disclosableInfo?.detailedScheduleNote || '',
        },
      }))
    : [];

  const migratedUserNeeds: UserSupportNeeds[] = Array.isArray(rawSaved.userNeeds)
    ? rawSaved.userNeeds.map((n: any) => ({
        ...n,
        dislikesAndAccommodations: n.dislikesAndAccommodations ?? '',
      }))
    : [];

  const migratedProviderProfiles: ProviderProfile[] = Array.isArray(
    rawSaved.providerProfiles
  )
    ? rawSaved.providerProfiles.map((p: any, idx: number) => ({
        ...p,
        designatedNumber:
          p.designatedNumber || `131150${String(1000 + idx).slice(0, 4)}`,
        updatedAt: p.updatedAt || today,
        appealMessage:
          p.appealMessage ||
          p.messageFromProvider?.slice(0, 45) ||
          'ご希望の曜日・介助内容に合わせて丁寧に対応します。',
        filterOnlyMatchingRequests: Boolean(p.filterOnlyMatchingRequests),
        staffMembers: Array.isArray(p.staffMembers) ? p.staffMembers : [],
        branches: Array.isArray(p.branches) ? p.branches : [],
        updateHistory: Array.isArray(p.updateHistory) ? p.updateHistory : [],
      }))
    : [];

  const migratedCapabilities: ProviderCapabilities[] = Array.isArray(
    rawSaved.providerCapabilities
  )
    ? rawSaved.providerCapabilities.map((c: any) => ({
        ...c,
        supportsBehavioralDisorder:
          c.supportsBehavioralDisorder ||
          (Array.isArray(c.supportedDisabilities) &&
          c.supportedDisabilities.includes('行動面で配慮が必要な方')
            ? '対応可能'
            : '条件付きで相談可'),
        supportsMedicalCare:
          c.supportsMedicalCare ||
          (Array.isArray(c.supportedDisabilities) &&
          c.supportedDisabilities.includes('医療的な配慮が必要な方')
            ? '対応可能'
            : '条件付きで相談可'),
        supportsEpilepsyResponse: c.supportsEpilepsyResponse || '条件付きで相談可',
        supportedCommunicationMethods: Array.isArray(c.supportedCommunicationMethods)
          ? c.supportedCommunicationMethods
          : ['言葉・音声での対話', 'ゆっくり・短い言葉での説明'],
        supportsTransport:
          typeof c.supportsTransport === 'boolean' ? c.supportsTransport : false,
        transportRangeText: c.transportRangeText || '事業所の周辺エリア（要相談）',
      }))
    : [];

  const migratedAvailabilities: ProviderAvailability[] = Array.isArray(
    rawSaved.providerAvailabilities
  )
    ? rawSaved.providerAvailabilities.map((a: any) => ({
        ...a,
        updatedAt: a.updatedAt || today,
      }))
    : [];

  const migratedDisclosures: DisclosureConsent[] = Array.isArray(rawSaved.disclosures)
    ? rawSaved.disclosures.map((d: any) => ({
        ...d,
        disclosedFields: {
          nicknameAndRole: d.disclosedFields?.nicknameAndRole ?? true,
          conditionProfile:
            d.disclosedFields?.conditionProfile ?? (d.stage >= 2),
          nearestStationArea: d.disclosedFields?.nearestStationArea ?? false,
          preferredContactMethod: d.disclosedFields?.preferredContactMethod ?? false,
          consultationSupportOffice:
            d.disclosedFields?.consultationSupportOffice ?? false,
          detailedScheduleNote: d.disclosedFields?.detailedScheduleNote ?? false,
          piiContactAccess: d.disclosedFields?.piiContactAccess ?? d.stage >= 3,
        },
      }))
    : [];

  const migratedSubscriptions: ProviderSubscription[] = Array.isArray(
    rawSaved.providerSubscriptions
  )
    ? rawSaved.providerSubscriptions.map((s: any) => ({
        ...s,
        billingCycle: s.billingCycle || 'monthly',
      }))
    : [];

  const migratedPlans: SubscriptionPlanDefinition[] = DEFAULT_SUBSCRIPTION_PLANS.map(
    (defPlan) => {
      const savedPlan = Array.isArray(rawSaved.subscriptionPlans)
        ? rawSaved.subscriptionPlans.find((sp: any) => sp.id === defPlan.id)
        : null;
      return savedPlan
        ? {
            ...defPlan,
            monthlyPriceYen:
              typeof savedPlan.monthlyPriceYen === 'number'
                ? savedPlan.monthlyPriceYen
                : defPlan.monthlyPriceYen,
          }
        : defPlan;
    }
  );

  const disclosureHistory: DisclosureHistoryEntry[] = Array.isArray(
    rawSaved.disclosureHistory
  )
    ? rawSaved.disclosureHistory
    : [];

  const coordinators: CoordinatorProfile[] = Array.isArray(rawSaved.coordinators)
    ? rawSaved.coordinators
    : [];

  const sharedCases: SharedCaseToCoordinator[] = Array.isArray(rawSaved.sharedCases)
    ? rawSaved.sharedCases
    : [];

  const providerReports: ProviderDiscrepancyReport[] = Array.isArray(
    rawSaved.providerReports
  )
    ? rawSaved.providerReports
    : [];

  const derivedInterviewsFromDisclosures: ConfirmedInterviewRecord[] =
    migratedDisclosures
      .filter((d) => Boolean(d.scheduleDecidedAt))
      .map((d, idx) => {
        const dateStr = (d.scheduleDecidedAt || today).slice(0, 10);
        return {
          id: `ci-mig-${idx}`,
          providerId: d.providerId,
          userId: d.userId,
          confirmedAt: dateStr,
          confirmedMonthLabel: formatJapaneseMonthOnly(dateStr) || '今月',
          kind: 'interview',
        };
      });

  const confirmedInterviews: ConfirmedInterviewRecord[] = Array.isArray(
    rawSaved.confirmedInterviews
  )
    ? rawSaved.confirmedInterviews
    : derivedInterviewsFromDisclosures;

  const timeTravelDaysOffset =
    typeof rawSaved.timeTravelDaysOffset === 'number' &&
    Number.isFinite(rawSaved.timeTravelDaysOffset)
      ? rawSaved.timeTravelDaysOffset
      : 0;

  return {
    ...rawSaved,
    userProfiles: migratedUserProfiles,
    userNeeds: migratedUserNeeds,
    providerProfiles: migratedProviderProfiles,
    providerCapabilities: migratedCapabilities,
    providerAvailabilities: migratedAvailabilities,
    disclosures: migratedDisclosures,
    providerSubscriptions: migratedSubscriptions,
    subscriptionPlans: migratedPlans,
    disclosureHistory,
    coordinators,
    sharedCases,
    providerReports,
    confirmedInterviews,
    timeTravelDaysOffset,
  };
}

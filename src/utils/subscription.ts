import {
  CareNeedItem,
  ChatRequest,
  DayOfWeek,
  DAYS_OF_WEEK,
  MatchingInteraction,
  ProviderAvailability,
  ProviderCapabilities,
  ProviderProfile,
  ProviderSubscription,
  ServiceType,
  SubscriptionPlanDefinition,
  UserPreferences,
  UserProfile,
  UserSupportNeeds,
} from '../types/domain';
import { getCurrentYearMonth } from './date';

export const CORE_SUBSCRIPTION_MESSAGE =
  'まずは無料で掲載できます。有料プランは、受入条件を発信して、条件の合う希望を受け取り、進捗を管理するための道具です。';

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  {
    id: 'free',
    name: '無料プラン',
    monthlyPriceYen: 0,
    annualPriceYen: 0,
    badgeText: 'まずは無料掲載',
    description:
      'まずは無料で掲載できます。受入条件カードを掲載し、利用者からのチャット受信・返信まで0円で行えます。',
    features: [
      '事業所登録・検索掲載（指定事業所番号の登録済みマーク表示）',
      '受入条件カードの掲載・更新',
      '利用者からのチャット受信・返信（制限なし）',
      '事業所からのチャット申請は月1件まで',
    ],
    monthlyOutboundRequestLimit: 1,
    canSendChatRequest: true,
    canManageCases: false,
    canReceiveNewAlerts: false,
    canManageStaff: false,
    canHighlightCard: false,
    canManageMultiBranches: false,
    canViewRegionalAnalytics: false,
    isAvailableNow: true,
  },
  {
    id: 'standard',
    name: '有料プラン',
    monthlyPriceYen: 3980,
    annualPriceYen: 43800,
    badgeText: '業務効率化・おすすめ',
    description:
      'まずは無料で掲載できます。有料プランは、受入条件を発信して、条件の合う希望を受け取り、進捗を管理するための道具です。',
    features: [
      '事業所からのチャット申請が無制限',
      '相性の高い利用者の新着通知',
      '受入条件に合う希望だけが届く設定',
      '候補者の進捗管理・複数スタッフ管理',
      '受入条件カードの強調表示（※相性％は変わりません）',
    ],
    monthlyOutboundRequestLimit: null,
    canSendChatRequest: true,
    canManageCases: true,
    canReceiveNewAlerts: true,
    canManageStaff: true,
    canHighlightCard: true,
    canManageMultiBranches: false,
    canViewRegionalAnalytics: false,
    isAvailableNow: true,
  },
  {
    id: 'pro',
    name: '上位プラン',
    monthlyPriceYen: 9800,
    annualPriceYen: 108000,
    badgeText: '複数拠点・地域分析',
    description:
      '複数拠点を展開する法人様向けに、拠点横断の管理と地域の希望条件の傾向が見える分析画面を備えた上位プランです。',
    features: [
      '有料プランのすべての業務機能（申請無制限・進捗／スタッフ管理）',
      '複数拠点の一元管理・切り替え',
      '地域の希望条件の傾向が見られる分析画面',
      '年払い選択時は請求書払い（銀行振込）に対応',
    ],
    monthlyOutboundRequestLimit: null,
    canSendChatRequest: true,
    canManageCases: true,
    canReceiveNewAlerts: true,
    canManageStaff: true,
    canHighlightCard: true,
    canManageMultiBranches: true,
    canViewRegionalAnalytics: true,
    isAvailableNow: true,
  },
];

export function getProviderPlanDefinition(
  subscription: ProviderSubscription | undefined,
  plans: SubscriptionPlanDefinition[]
): SubscriptionPlanDefinition {
  const freeFallback =
    plans.find((p) => p.id === 'free') || DEFAULT_SUBSCRIPTION_PLANS[0];
  if (!subscription || subscription.status !== 'active') {
    return freeFallback;
  }
  return plans.find((p) => p.id === subscription.planId) || freeFallback;
}

/**
 * 事業所が有料プラン（スタンダードまたは上位プラン）契約中かどうか
 */
export function isPaidPlanActive(
  subscription: ProviderSubscription | undefined,
  plans: SubscriptionPlanDefinition[] = DEFAULT_SUBSCRIPTION_PLANS
): boolean {
  if (!subscription) return false;
  if (subscription.status !== 'active') return false;
  if (subscription.accountApprovalStatus === 'suspended') return false;
  const plan = getProviderPlanDefinition(subscription, plans);
  return plan.id === 'standard' || plan.id === 'pro';
}

export function isProPlanActive(
  subscription: ProviderSubscription | undefined,
  plans: SubscriptionPlanDefinition[] = DEFAULT_SUBSCRIPTION_PLANS
): boolean {
  if (!isPaidPlanActive(subscription, plans)) return false;
  return subscription?.planId === 'pro';
}

/**
 * 指定月（YYYY-MM）に事業所側が送信した申請件数を数える
 */
export function countProviderMonthlyOutboundRequests(
  chatRequests: ChatRequest[],
  providerId: string,
  yearMonth: string = getCurrentYearMonth()
): number {
  return chatRequests.filter(
    (req) =>
      req.providerId === providerId &&
      req.initiatedBy === 'provider' &&
      req.requestedAt.startsWith(yearMonth)
  ).length;
}

/**
 * 事業所によるチャット送受信・開始申請の権限検証
 * - 利用者から開始されたスレッドへの受信・返信はどのプランでも無料・無制限
 * - 無料プランでも「事業所からの新規申請」を月1件まで送信可能
 * - 有料・上位プランは月間申請件数が無制限
 */
export function verifyProviderChatAccess(params: {
  subscription: ProviderSubscription | undefined;
  plans?: SubscriptionPlanDefinition[];
  chatRequest?: ChatRequest;
  allProviderChatRequests?: ChatRequest[];
  currentYearMonth?: string;
}): {
  canRequestChat: boolean;
  canSendMessage: boolean;
  monthlyOutboundUsed: number;
  monthlyOutboundLimit: number | null;
  remainingFreeRequests: number | null;
  reason: string;
} {
  const {
    subscription,
    plans = DEFAULT_SUBSCRIPTION_PLANS,
    chatRequest,
    allProviderChatRequests = [],
    currentYearMonth = getCurrentYearMonth(),
  } = params;

  const plan = getProviderPlanDefinition(subscription, plans);
  const monthlyLimit = plan.monthlyOutboundRequestLimit;
  const monthlyUsed = subscription
    ? countProviderMonthlyOutboundRequests(
        allProviderChatRequests,
        subscription.providerId,
        currentYearMonth
      )
    : 0;
  const remaining =
    monthlyLimit === null ? null : Math.max(0, monthlyLimit - monthlyUsed);

  if (!subscription || subscription.accountApprovalStatus === 'suspended') {
    return {
      canRequestChat: false,
      canSendMessage: false,
      monthlyOutboundUsed: monthlyUsed,
      monthlyOutboundLimit: monthlyLimit,
      remainingFreeRequests: remaining,
      reason: '事業所アカウントが停止中または未登録のため利用できません。',
    };
  }

  // 利用者から届いた相談または承認済みスレッドはプランに関わらず返信可能
  if (
    chatRequest &&
    (chatRequest.initiatedBy === 'user' || chatRequest.status === 'approved')
  ) {
    return {
      canRequestChat: false,
      canSendMessage: true,
      monthlyOutboundUsed: monthlyUsed,
      monthlyOutboundLimit: monthlyLimit,
      remainingFreeRequests: remaining,
      reason: 'チャットが承認・開通しています。このままメッセージを送信できます。',
    };
  }

  if (!chatRequest) {
    if (monthlyLimit !== null && monthlyUsed >= monthlyLimit) {
      return {
        canRequestChat: false,
        canSendMessage: false,
        monthlyOutboundUsed: monthlyUsed,
        monthlyOutboundLimit: monthlyLimit,
        remainingFreeRequests: 0,
        reason: `無料プランでの事業所からの申請上限（月${monthlyLimit}件まで）に達しています。無制限で申請するには有料プランをご利用ください。`,
      };
    }

    return {
      canRequestChat: true,
      canSendMessage: false,
      monthlyOutboundUsed: monthlyUsed,
      monthlyOutboundLimit: monthlyLimit,
      remainingFreeRequests: remaining,
      reason:
        monthlyLimit !== null
          ? `今月の無料申請枠（残り ${remaining} 件 / 月${monthlyLimit}件）で申請できます。`
          : '利用希望者へチャット開始申請を送信できます（回数無制限）。',
    };
  }

  if (chatRequest.status === 'pending') {
    return {
      canRequestChat: false,
      canSendMessage: false,
      monthlyOutboundUsed: monthlyUsed,
      monthlyOutboundLimit: monthlyLimit,
      remainingFreeRequests: remaining,
      reason: 'チャット開始申請を送信済みです。利用者・ご家族の承認をお待ちください。',
    };
  }

  if (chatRequest.status === 'declined') {
    return {
      canRequestChat: false,
      canSendMessage: false,
      monthlyOutboundUsed: monthlyUsed,
      monthlyOutboundLimit: monthlyLimit,
      remainingFreeRequests: remaining,
      reason: '今回のチャット申請は見送りとなりました。',
    };
  }

  return {
    canRequestChat: false,
    canSendMessage: true,
    monthlyOutboundUsed: monthlyUsed,
    monthlyOutboundLimit: monthlyLimit,
    remainingFreeRequests: remaining,
    reason: '利用者・ご家族の承認済みです。',
  };
}

/**
 * 有料プラン：「受入条件に合う希望だけが届く設定」の判定
 */
export function doesUserMatchProviderAcceptanceFilter(params: {
  providerProfile: ProviderProfile;
  providerCapabilities: ProviderCapabilities;
  providerAvailability: ProviderAvailability;
  userNeeds: UserSupportNeeds;
  userPreferences: UserPreferences;
  userProfile: UserProfile;
}): boolean {
  const {
    providerProfile,
    providerCapabilities,
    providerAvailability,
    userNeeds,
    userPreferences,
    userProfile,
  } = params;

  const hasService =
    userNeeds.desiredServices.length === 0 ||
    userNeeds.desiredServices.some((s) => providerProfile.serviceTypes.includes(s));
  if (!hasService) return false;

  const targetAreas =
    userPreferences.preferredAreas.length > 0
      ? userPreferences.preferredAreas
      : [userProfile.city];
  const hasArea = targetAreas.some(
    (area) =>
      providerProfile.coverageAreas.includes(area) ||
      providerProfile.locationCity === area
  );
  if (!hasArea) return false;

  const availableDays = providerAvailability.weeklySchedule
    .filter((d) => d.available)
    .map((d) => d.day);
  const hasDay =
    userPreferences.preferredDays.length === 0 ||
    userPreferences.preferredDays.some((d) => availableDays.includes(d));
  if (!hasDay) return false;

  const essential =
    userNeeds.essentialCareNeeds.length > 0
      ? userNeeds.essentialCareNeeds
      : userNeeds.careNeeds;
  const coversEssential = essential.every((c) =>
    providerCapabilities.supportedCareItems.includes(c)
  );
  return coversEssential;
}

/**
 * 上位プラン向け：地域の希望条件の傾向分析
 */
export interface RegionalDemandAnalytics {
  totalUsers: number;
  demandByArea: { area: string; count: number }[];
  demandByService: { service: ServiceType; count: number }[];
  demandByDay: { day: DayOfWeek; count: number }[];
  topCareNeeds: { item: CareNeedItem; count: number }[];
}

export function calculateRegionalDemandAnalytics(params: {
  userProfiles: UserProfile[];
  userNeeds: UserSupportNeeds[];
  userPreferences: UserPreferences[];
}): RegionalDemandAnalytics {
  const { userProfiles, userNeeds, userPreferences } = params;

  const areaCounts: Record<string, number> = {};
  for (const u of userProfiles) {
    const prefs = userPreferences.find((p) => p.userId === u.id);
    const areas =
      prefs && prefs.preferredAreas.length > 0 ? prefs.preferredAreas : [u.city];
    for (const a of areas) {
      areaCounts[a] = (areaCounts[a] || 0) + 1;
    }
  }
  const demandByArea = Object.entries(areaCounts)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);

  const services: ServiceType[] = [
    '移動支援',
    '居宅介護',
    '重度訪問介護',
    '同行援護',
  ];
  const demandByService = services
    .map((service) => ({
      service,
      count: userNeeds.filter((n) => n.desiredServices.includes(service)).length,
    }))
    .sort((a, b) => b.count - a.count);

  const demandByDay = DAYS_OF_WEEK.map((day) => ({
    day,
    count: userPreferences.filter((p) => p.preferredDays.includes(day)).length,
  }));

  const careCounts: Record<string, number> = {};
  for (const need of userNeeds) {
    for (const item of need.careNeeds) {
      careCounts[item] = (careCounts[item] || 0) + 1;
    }
  }
  const topCareNeeds = Object.entries(careCounts)
    .map(([item, count]) => ({ item: item as CareNeedItem, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totalUsers: userProfiles.length,
    demandByArea,
    demandByService,
    demandByDay,
    topCareNeeds,
  };
}

export interface AdminBusinessMetrics {
  totalUsers: number;
  newArrivalUsers: number;
  totalProviders: number;
  targetProvidersGoal: number;
  freeProvidersCount: number;
  paidProvidersCount: number;
  paidConversionRatePercent: number;
  standardPlanMonthlyPriceYen: number;
  estimatedMonthlyRevenueYen: number;
  simulatedTarget50RevenueYen: number;
  providersByArea: Record<string, number>;
  providersByService: Record<ServiceType, number>;
  totalChatRequests: number;
  pendingChatRequests: number;
  approvedChatRequests: number;
  declinedChatRequests: number;
  activeCasesCount: number;
}

export function calculateAdminBusinessMetrics(params: {
  users: UserProfile[];
  providers: ProviderProfile[];
  subscriptions: ProviderSubscription[];
  plans: SubscriptionPlanDefinition[];
  chatRequests: ChatRequest[];
  interactions: MatchingInteraction[];
}): AdminBusinessMetrics {
  const {
    users,
    providers,
    subscriptions,
    plans,
    chatRequests,
    interactions,
  } = params;

  const standardPlan =
    plans.find((p) => p.id === 'standard') || DEFAULT_SUBSCRIPTION_PLANS[1];
  const standardPrice = standardPlan.monthlyPriceYen;

  let freeCount = 0;
  let paidCount = 0;
  let monthlyRevenue = 0;

  for (const prov of providers) {
    const sub = subscriptions.find((s) => s.providerId === prov.id);
    if (isPaidPlanActive(sub, plans)) {
      paidCount += 1;
      const planDef = getProviderPlanDefinition(sub, plans);
      monthlyRevenue += planDef.monthlyPriceYen;
    } else {
      freeCount += 1;
    }
  }

  const totalProviders = providers.length;
  const conversionRate =
    totalProviders > 0 ? Math.round((paidCount / totalProviders) * 100) : 0;

  const effectiveRate = conversionRate > 0 ? conversionRate / 100 : 0.6;
  const simulatedTarget50RevenueYen = Math.round(
    50 * effectiveRate * standardPrice
  );

  const providersByArea: Record<string, number> = {
    杉並区: 0,
    中野区: 0,
    練馬区: 0,
    世田谷区: 0,
  };
  for (const p of providers) {
    providersByArea[p.locationCity] =
      (providersByArea[p.locationCity] || 0) + 1;
  }

  const providersByService: Record<ServiceType, number> = {
    居宅介護: 0,
    重度訪問介護: 0,
    移動支援: 0,
    同行援護: 0,
  };
  for (const p of providers) {
    for (const s of p.serviceTypes) {
      providersByService[s] = (providersByService[s] || 0) + 1;
    }
  }

  const pendingChatRequests = chatRequests.filter(
    (r) => r.status === 'pending'
  ).length;
  const approvedChatRequests = chatRequests.filter(
    (r) => r.status === 'approved'
  ).length;
  const declinedChatRequests = chatRequests.filter(
    (r) => r.status === 'declined'
  ).length;

  const activeCasesCount = interactions.filter(
    (i) => i.caseStatus === '対応中' || i.providerReaction === '対応を検討したい'
  ).length;

  return {
    totalUsers: users.length,
    newArrivalUsers: users.filter((u) => u.isNewArrival).length,
    totalProviders,
    targetProvidersGoal: 50,
    freeProvidersCount: freeCount,
    paidProvidersCount: paidCount,
    paidConversionRatePercent: conversionRate,
    standardPlanMonthlyPriceYen: standardPrice,
    estimatedMonthlyRevenueYen: monthlyRevenue,
    simulatedTarget50RevenueYen,
    providersByArea,
    providersByService,
    totalChatRequests: chatRequests.length,
    pendingChatRequests,
    approvedChatRequests,
    declinedChatRequests,
    activeCasesCount,
  };
}

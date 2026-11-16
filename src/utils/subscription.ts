import {
  ChatRequest,
  MatchingInteraction,
  ProviderProfile,
  ProviderSubscription,
  ServiceType,
  SubscriptionPlanDefinition,
  UserProfile,
} from '../types/domain';

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  {
    id: 'free',
    name: '無料プラン',
    monthlyPriceYen: 0,
    badgeText: '初期登録・受信返信OK',
    description:
      '事業所登録・検索掲載・適合度確認に加え、利用者・ご家族から届いたチャット相談への返信も無料で行えます。',
    features: [
      '事業所アカウント登録・検索掲載（0円）',
      '対応サービス・対応地域・空き曜日の登録',
      '匿名化された利用希望者ニーズと適合度（％）の閲覧',
      '利用者・ご家族から届いたチャットへの返信対応',
    ],
    canSendChatRequest: false,
    canManageCases: false,
    canReceiveNewAlerts: false,
    isAvailableNow: true,
  },
  {
    id: 'standard',
    name: '有料プラン（スタンダード）',
    monthlyPriceYen: 3980,
    badgeText: '定額DXサブスク',
    description:
      '契約成立ごとの紹介手数料は一切なし。事業所側からの積極的なチャット開始申請や新着通知、案件進捗DXが使える月額定額プランです。',
    features: [
      '無料プランの全機能（登録・掲載・受信チャット返信）',
      '事業所側から利用希望者へのチャット開始申請（積極アプローチ）',
      '新着利用希望者の通知・問い合わせ状況の一元管理',
      '対応中・検討中・対応不可の案件進捗DX管理',
      '契約成立時の成果報酬・斡旋手数料は一切0円（定額利用料のみ）',
    ],
    canSendChatRequest: true,
    canManageCases: true,
    canReceiveNewAlerts: true,
    isAvailableNow: true,
  },
  {
    id: 'pro',
    name: '上位プラン（プレミアム・将来拡張枠）',
    monthlyPriceYen: 4980,
    badgeText: '将来拡張予定',
    description:
      '複数サ責アカウント共有や優先通知、月次レポート機能などを備えた上位プラン（将来の拡張用定義）。',
    features: [
      '有料プラン（スタンダード）のすべての機能',
      '複数担当者（サービス提供責任者）での案件共有',
      '地域内の新着ニーズ優先通知・月次マッチング分析',
    ],
    canSendChatRequest: true,
    canManageCases: true,
    canReceiveNewAlerts: true,
    isAvailableNow: false,
  },
];

/**
 * 事業所の現在のプラン定義を取得する
 */
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
 * 事業所が有料プラン（積極アプローチ・案件管理DX可能）かどうかを判定する（サーバー側権限チェック模倣）
 */
export function isPaidPlanActive(
  subscription: ProviderSubscription | undefined,
  plans: SubscriptionPlanDefinition[] = DEFAULT_SUBSCRIPTION_PLANS
): boolean {
  if (!subscription) return false;
  if (subscription.status !== 'active') return false;
  if (subscription.accountApprovalStatus === 'suspended') return false;
  const plan = getProviderPlanDefinition(subscription, plans);
  return plan.canSendChatRequest;
}

/**
 * 事業所によるチャット送受信・開始申請の権限検証
 * - 無料プランでも「利用者・ご家族から開始されたチャット（approved / initiatedBy === "user"）」への返信は可能
 * - 「事業所側からのチャット開始申請（スカウト・新規アプローチ）」は有料DXサブスクが必要
 */
export function verifyProviderChatAccess(params: {
  subscription: ProviderSubscription | undefined;
  plans?: SubscriptionPlanDefinition[];
  chatRequest?: ChatRequest;
}): {
  canRequestChat: boolean;
  canSendMessage: boolean;
  reason: string;
} {
  const { subscription, plans = DEFAULT_SUBSCRIPTION_PLANS, chatRequest } =
    params;

  if (!subscription || subscription.accountApprovalStatus === 'suspended') {
    return {
      canRequestChat: false,
      canSendMessage: false,
      reason: '事業所アカウントが停止中または未登録のため利用できません。',
    };
  }

  // 利用者側から問い合わせが始まったスレッド（または既に承認済みスレッド）は無料プランでも返信可能
  if (
    chatRequest &&
    (chatRequest.initiatedBy === 'user' || chatRequest.status === 'approved')
  ) {
    return {
      canRequestChat: false,
      canSendMessage: true,
      reason:
        '利用者・ご家族からの相談スレッドです。無料プランでもこのまま返信できます。',
    };
  }

  const paid = isPaidPlanActive(subscription, plans);
  if (!paid) {
    return {
      canRequestChat: false,
      canSendMessage: false,
      reason:
        '事業所からのチャット開始申請は有料プラン（月額定額DXサブスク）でご利用いただけます。利用者から届いた相談への返信は無料のまま可能です。',
    };
  }

  if (!chatRequest) {
    return {
      canRequestChat: true,
      canSendMessage: false,
      reason: '利用希望者へチャット開始申請を送信できます（承認後にチャット開始）。',
    };
  }

  if (chatRequest.status === 'pending') {
    return {
      canRequestChat: false,
      canSendMessage: false,
      reason: 'チャット開始申請を送信済みです。利用者・ご家族の承認をお待ちください。',
    };
  }

  if (chatRequest.status === 'declined') {
    return {
      canRequestChat: false,
      canSendMessage: false,
      reason: '今回のチャット申請は辞退されました。',
    };
  }

  return {
    canRequestChat: false,
    canSendMessage: true,
    reason: '利用者・ご家族の承認済みです。チャットでメッセージを交換できます。',
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

/**
 * 運営管理者向けの事業KPI・売上試算を計算する純粋関数
 */
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

  // 初期目標50事業所登録時に同じ有料契約率（または最低60%）だった場合の月額売上試算
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

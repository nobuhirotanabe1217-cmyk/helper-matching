import React, { useState } from 'react';
import {
  Building2,
  Plus,
  FileEdit,
  MessageSquare,
  ArrowRight,
  MapPin,
  CreditCard,
  Sparkles,
  UserPlus,
  Send,
  Check,
  BadgeCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Users,
  BarChart3,
  Trash2,
  Filter,
  History,
  CheckCircle2,
  PauseCircle,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  CaseManagementStatus,
  DAYS_OF_WEEK,
  DayOfWeek,
  ProviderAcceptanceStatus,
} from '../types/domain';
import { calculateMatchResult } from '../utils/matching';
import {
  formatJapaneseDate,
  getCurrentYearMonth,
} from '../utils/date';
import {
  getProviderDiscrepancySummary,
  getProviderFreshnessInfo,
  getProviderInterviewTrustBadge,
  getUserFreshnessInfo,
} from '../utils/freshness';
import {
  calculateRegionalDemandAnalytics,
  CORE_SUBSCRIPTION_MESSAGE,
  doesUserMatchProviderAcceptanceFilter,
  isProPlanActive,
  verifyProviderChatAccess,
} from '../utils/subscription';
import {
  CandidateCaseProgressBar,
  MatchBreakdownBarGraph,
  MatchScoreRing,
  NotificationStatusBadge,
  ProviderMatchingProgressBoard,
  StepMatchingIcon,
  StepProfileIcon,
  StepScheduleIcon,
  WeeklyDayStrip,
} from './VisualHelpers';
import {
  ProviderFreshnessBadge,
  ProviderInterviewTrustBadge,
  ProviderReportWarningBadge,
  UserConfirmedDateBadge,
  UserRecruitmentStatusBadge,
} from './FreshnessBadges';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import {
  buildProviderDashboardSpeechText,
  buildUserDetailForProviderSpeechText,
} from '../utils/speech';

const ACCEPTANCE_STATUS_OPTIONS: ProviderAcceptanceStatus[] = [
  '新規利用者を積極的に募集中',
  '条件によって受け入れ相談可能',
  '一部の曜日・時間帯のみ受け入れ可能',
  '現在は受け入れ困難',
];

const CASE_STATUS_OPTIONS: CaseManagementStatus[] = [
  '未対応',
  '検討中',
  '対応中',
  '対応不可',
];

export const ProviderDashboard: React.FC = () => {
  const {
    providerProfiles,
    activeProviderId,
    setActiveProviderId,
    currentProviderBundle,
    userProfiles,
    userNeeds,
    userPreferences,
    getUserBundleById,
    interactions,
    disclosures,
    chatRequests,
    subscriptionPlans,
    currentProviderSubscription,
    currentProviderPlanDef,
    isCurrentProviderPaid,
    getProviderSubscription,
    subscribeProviderToPlan,
    markProviderNoChangeToday,
    effectiveReferenceDate,
    providerReports,
    confirmedInterviews,
    toggleProviderMatchFilter,
    addProviderStaffMember,
    removeProviderStaffMember,
    addProviderBranch,
    removeProviderBranch,
    sendChatRequest,
    navigateTo,
    openUserDetailForProvider,
    openChatWith,
    setProviderWizardStep,
    updateProviderAcceptanceStatus,
    updateCaseManagementStatus,
    setShowChatUpgradeModal,
    openRegistrationScreen,
  } = useAppState();

  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [sentNotice, setSentNotice] = useState<string>('');
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffRole, setNewStaffRole] = useState<string>('ホームヘルパー');
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [newBranchCity, setNewBranchCity] = useState<string>('中野区');
  const [newBranchNumber, setNewBranchNumber] = useState<string>('1311509999');

  if (providerProfiles.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="flex justify-end">
            <HelpTooltip guideKey="provider-dashboard" tone="indigo" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            まだ事業所が登録されていません
          </h1>
          <p className="text-sm text-slate-600">
            まずは指定事業所番号を入力して事業所を新規登録してください（掲載は無料です）。
          </p>
          <button
            type="button"
            onClick={() => openRegistrationScreen('provider')}
            className="min-h-[48px] px-6 py-3 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>事業所を新規登録する</span>
          </button>
        </div>
      </div>
    );
  }

  const { profile, capabilities, availability } = currentProviderBundle;
  const updatedAt = profile.updatedAt || availability.updatedAt;
  const freshnessInfo = getProviderFreshnessInfo(
    updatedAt,
    effectiveReferenceDate
  );
  const discrepancySummary = getProviderDiscrepancySummary(
    activeProviderId,
    providerReports
  );
  const interviewTrust = getProviderInterviewTrustBadge(
    activeProviderId,
    confirmedInterviews,
    disclosures
  );
  const hasDesignatedNumber = /^\d{10}$/.test(
    (profile.designatedNumber || '').replace(/[-\s]/g, '')
  );
  const isProPlan = isProPlanActive(
    currentProviderSubscription,
    subscriptionPlans
  );

  const chatQuotaCheck = verifyProviderChatAccess({
    subscription: currentProviderSubscription,
    plans: subscriptionPlans,
    allProviderChatRequests: chatRequests,
    currentYearMonth: getCurrentYearMonth(effectiveReferenceDate),
  });

  const allEvaluatedMatches = userProfiles
    .map((u) => {
      const uBundle = getUserBundleById(u.id);
      if (!uBundle) return null;
      const result = calculateMatchResult(
        uBundle,
        currentProviderBundle,
        effectiveReferenceDate
      );
      const userFreshness = getUserFreshnessInfo(u, effectiveReferenceDate);
      const interaction = interactions.find(
        (i) => i.userId === u.id && i.providerId === activeProviderId
      );
      const chatReq = chatRequests.find(
        (r) => r.userId === u.id && r.providerId === activeProviderId
      );
      const matchesFilter = doesUserMatchProviderAcceptanceFilter({
        providerProfile: profile,
        providerCapabilities: capabilities,
        providerAvailability: availability,
        userNeeds: uBundle.needs,
        userPreferences: uBundle.preferences,
        userProfile: uBundle.profile,
      });
      return {
        user: uBundle,
        userFreshness,
        result,
        caseStatus: interaction?.caseStatus || '未対応',
        chatReq,
        matchesFilter,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      if (a.userFreshness.effectiveStatus !== b.userFreshness.effectiveStatus) {
        return a.userFreshness.effectiveStatus === '募集中' ? -1 : 1;
      }
      return b.result.breakdown.totalScore - a.result.breakdown.totalScore;
    });

  const candidateMatches =
    isCurrentProviderPaid && profile.filterOnlyMatchingRequests
      ? allEvaluatedMatches.filter((m) => m.matchesFilter)
      : allEvaluatedMatches;

  const newArrivalAlerts = allEvaluatedMatches.filter(
    (c) => c.user.profile.isNewArrival && c.result.breakdown.totalScore >= 70
  );

  const regionalAnalytics = calculateRegionalDemandAnalytics({
    userProfiles,
    userNeeds,
    userPreferences,
  });

  const myChatRequests = chatRequests.filter(
    (r) => r.providerId === activeProviderId
  );
  const waitingReplyCount = myChatRequests.filter(
    (r) => r.status === 'pending'
  ).length;
  const approvedRequestsCount = myChatRequests.filter(
    (r) => r.status === 'approved'
  ).length;
  const activeCasesCount = interactions.filter(
    (i) =>
      i.providerId === activeProviderId &&
      (i.caseStatus === '対応中' || i.providerReaction === '対応を検討したい')
  ).length;
  const declinedOrUnavailableCount = allEvaluatedMatches.filter(
    (c) => c.caseStatus === '対応不可' || c.chatReq?.status === 'declined'
  ).length;
  const uncontactedCount = Math.max(
    0,
    allEvaluatedMatches.length -
      Math.max(activeCasesCount, approvedRequestsCount) -
      waitingReplyCount -
      declinedOrUnavailableCount
  );

  const availableDays = availability.weeklySchedule
    .filter((d) => d.available)
    .map((d) => d.day);

  const isStep1Done =
    checkedSteps[1] ??
    Boolean(
      capabilities.supportedCareItems.length >= 2 &&
        profile.coverageAreas.length >= 1
    );
  const isStep2Done = checkedSteps[2] ?? Boolean(availableDays.length >= 1);
  const isStep3Done =
    checkedSteps[3] ?? Boolean(allEvaluatedMatches.length > 0);
  const completedStepsCount = [isStep1Done, isStep2Done, isStep3Done].filter(
    Boolean
  ).length;

  const toggleStepCheck = (stepNumber: number, currentVal: boolean) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepNumber]: !currentVal,
    }));
  };

  const handleNoChangeUpdateToday = () => {
    const res = markProviderNoChangeToday(activeProviderId);
    setSentNotice(
      `更新しました。前回の更新から${res.daysSincePrevious}日ぶりです（最新確認日：${formatJapaneseDate(
        res.updatedAt
      )}）。`
    );
  };

  const handleQuickChatRequest = (userId: string, anonymousCode: string) => {
    const existingReq = chatRequests.find(
      (r) => r.userId === userId && r.providerId === activeProviderId
    );
    const access = verifyProviderChatAccess({
      subscription: currentProviderSubscription,
      plans: subscriptionPlans,
      chatRequest: existingReq,
      allProviderChatRequests: chatRequests,
      currentYearMonth: getCurrentYearMonth(effectiveReferenceDate),
    });
    if (!access.canRequestChat && !access.canSendMessage) {
      setShowChatUpgradeModal(true);
      return;
    }
    const res = sendChatRequest(
      userId,
      activeProviderId,
      'provider',
      'ご登録の希望条件と当事業所の受入条件カードが一致しております。ぜひ一度ご相談ください。'
    );
    if (!res.ok) {
      setShowChatUpgradeModal(true);
      return;
    }
    setSentNotice(
      `「${anonymousCode}」へチャット開始申請を送信しました。上部の「利用者画面」に切り替えると承認テストができます。`
    );
    setTimeout(() => setSentNotice(''), 5000);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    addProviderStaffMember(activeProviderId, {
      name: newStaffName.trim(),
      roleTitle: newStaffRole.trim() || '担当ヘルパー',
      qualifications: '介護職員初任者研修等',
      active: true,
    });
    setNewStaffName('');
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    addProviderBranch(activeProviderId, {
      name: newBranchName.trim(),
      designatedNumber: newBranchNumber.trim() || '1311509999',
      city: newBranchCity.trim() || '杉並区',
      addressNote: `${newBranchCity}サテライト`,
      serviceTypes: profile.serviceTypes,
      isMain: false,
    });
    setNewBranchName('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-24 space-y-5">
      {/* 鮮度アラートバナー（61日以上で受付確認中 ／ 25日以上でそろそろ確認時期） */}
      {freshnessInfo.isAutoPaused ? (
        <div
          role="alert"
          data-testid="provider-paused-banner"
          className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm">
            <PauseCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-extrabold">
                現在「受付確認中」のため、利用者側でチャット受付が一時停止されています（{freshnessInfo.daysElapsed}日未更新）
              </p>
              <p className="text-rose-900">
                「内容に変更なし（今日の日付で更新）」を押すか、受入条件を保存するとすぐに通常表示へ再開します。
              </p>
            </div>
          </div>
        </div>
      ) : freshnessInfo.isApproachingReminder ? (
        <div
          role="status"
          data-testid="provider-freshness-reminder-banner"
          className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-extrabold">そろそろ情報の確認時期です</p>
              <p className="text-amber-900">
                前回の更新から {freshnessInfo.daysElapsed}日 経過しています。変更がなければ下の「内容に変更なし（今日の日付で更新）」ボタンを1タップで完了できます。
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* 1. 事業所マイページ・更新鮮度＆進捗ボード */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-900 text-white text-xs font-bold whitespace-nowrap">
                <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>事業所マイページ</span>
              </span>
              {hasDesignatedNumber && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-950 text-xs font-bold tabular-nums whitespace-nowrap">
                  <BadgeCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" aria-hidden="true" />
                  <span>事業所番号登録済み（{profile.designatedNumber}）</span>
                </span>
              )}
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-md border tabular-nums whitespace-nowrap ${
                  isCurrentProviderPaid
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                    : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                {currentProviderPlanDef.name}（月額
                {currentProviderPlanDef.monthlyPriceYen.toLocaleString()}円）
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {profile.name}
            </h1>
            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-700" />
                {profile.coverageAreas.join('・')}
              </span>
              <span>·</span>
              <span>提供：{profile.serviceTypes.join(' / ')}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-bold tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>最終更新日：{formatJapaneseDate(updatedAt)}</span>
              </span>
              <ProviderFreshnessBadge info={freshnessInfo} />
              <ProviderReportWarningBadge summary={discrepancySummary} />
              <ProviderInterviewTrustBadge info={interviewTrust} />
            </div>
          </div>

          {/* 1タップ鮮度更新アクション（確認ダイアログなし） */}
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 text-xs">
              <p className="font-extrabold text-teal-950">
                1タップ情報更新（更新が新しい事業所ほど検索上位に表示されます）
              </p>
              <p className="text-teal-900">
                現在の受入条件・空き状況に変更がない場合は、確認ダイアログなしで即座に本日付で更新できます。
              </p>
            </div>
            <button
              type="button"
              data-testid="provider-no-change-update-btn"
              onClick={handleNoChangeUpdateToday}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-xs shrink-0"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>内容に変更なし（今日の日付で更新）</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {providerProfiles.length > 1 && (
              <select
                aria-label="登録した事業所を切替"
                value={activeProviderId}
                onChange={(e) => setActiveProviderId(e.target.value)}
                className="min-h-[38px] max-w-full sm:max-w-[260px] px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 truncate"
              >
                {providerProfiles.map((p) => {
                  const sub = getProviderSubscription(p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      [{sub.planId === 'free' ? '無料' : sub.planId === 'pro' ? '上位' : '有料'}] {p.name}
                    </option>
                  );
                })}
              </select>
            )}

            <button
              type="button"
              onClick={() => {
                setProviderWizardStep(1);
                navigateTo('provider-wizard');
              }}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <FileEdit className="w-3.5 h-3.5 text-indigo-700" />
              <span>受入条件カード編集</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('provider-billing')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>料金プラン・お支払い</span>
            </button>

            <SpeechButton
              speechId="screen-provider-dashboard"
              isPrimaryScreenReader
              tone="indigo"
              getText={() =>
                buildProviderDashboardSpeechText({
                  providerName: profile.name,
                  planName: currentProviderPlanDef.name,
                  acceptanceStatus: availability.acceptanceStatus,
                  candidateCount: candidateMatches.length,
                  waitingReplyCount,
                  activeCaseCount: Math.max(activeCasesCount, approvedRequestsCount),
                  completedStepsCount,
                })
              }
            />

            <HelpTooltip guideKey="provider-dashboard" tone="indigo" />
          </div>
        </div>

        {/* プラン方針・月間枠案内バナー */}
        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5 text-indigo-950">
            <p className="font-bold">{CORE_SUBSCRIPTION_MESSAGE}</p>
            <p className="text-slate-700 tabular-nums">
              {isCurrentProviderPaid
                ? `ご契約中：${currentProviderPlanDef.name}（次回更新：${currentProviderSubscription.nextRenewalDate}${
                    currentProviderSubscription.paymentSummary
                      ? ` ／ ${currentProviderSubscription.paymentSummary.displayLabel}`
                      : ''
                  }）`
                : `無料プラン利用中：利用者からのチャット受信・返信は無制限 ／ 事業所からの新規申請は月1件まで（今月残り ${
                    chatQuotaCheck.remainingFreeRequests ?? 0
                  } 件）`}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              subscribeProviderToPlan(
                activeProviderId,
                isCurrentProviderPaid ? 'free' : 'standard'
              )
            }
            className="min-h-[34px] px-3 py-1.5 rounded-lg border border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-950 font-bold shrink-0 cursor-pointer"
          >
            {isCurrentProviderPaid ? '無料プランで確認' : '有料プラン機能を確認'}
          </button>
        </div>

        {/* 受入状況ワンタップ切替 ＆ 対応曜日 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="quick-acceptance-select"
              className="text-xs font-bold text-slate-700"
            >
              現在の受け入れ状況:
            </label>
            <select
              id="quick-acceptance-select"
              value={availability.acceptanceStatus}
              onChange={(e) =>
                updateProviderAcceptanceStatus(
                  activeProviderId,
                  e.target.value as ProviderAcceptanceStatus,
                  availability.acceptableConditionsNote
                )
              }
              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-indigo-200 bg-white text-xs font-bold text-indigo-950"
            >
              {ACCEPTANCE_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-600">対応曜日:</span>
            <WeeklyDayStrip activeDays={availableDays} />
          </div>
        </div>

        <ProviderMatchingProgressBoard
          totalUsersCount={allEvaluatedMatches.length}
          unapproachedCount={uncontactedCount}
          pendingRequestCount={waitingReplyCount}
          activeCaseCount={Math.max(activeCasesCount, approvedRequestsCount)}
          declinedOrUnavailableCount={declinedOrUnavailableCount}
          disclosedCount={
            disclosures.filter(
              (c) => c.providerId === activeProviderId && c.stage === 3
            ).length
          }
          providerActiveDays={availableDays}
          demandByDay={DAYS_OF_WEEK.reduce((acc, day) => {
            acc[day] = allEvaluatedMatches.filter((c) =>
              c.user.preferences.preferredDays.includes(day)
            ).length;
            return acc;
          }, {} as Record<DayOfWeek, number>)}
        />
      </section>

      {sentNotice && (
        <div
          role="status"
          data-testid="provider-update-feedback"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-extrabold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
          <span>{sentNotice}</span>
        </div>
      )}

      {/* 2. まず最初にやるべき3ステップ */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-800 text-white text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              3ステップガイド
            </span>
            <h2 className="text-base font-bold text-slate-900">
              受入条件の発信・確認ステップ
            </h2>
          </div>
          <span className="text-xs font-bold text-indigo-900 tabular-nums">
            {completedStepsCount}/3 完了
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <StepProfileIcon className="w-9 h-9 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  1. 受入条件カード作成
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setProviderWizardStep(1);
                    navigateTo('provider-wizard');
                  }}
                  className="text-[11px] font-bold text-indigo-800 underline cursor-pointer"
                >
                  編集する →
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleStepCheck(1, isStep1Done)}
              className="cursor-pointer shrink-0"
            >
              <NotificationStatusBadge
                status={isStep1Done ? 'completed' : 'pending'}
                customLabel={isStep1Done ? '完了' : '未完了'}
                size="sm"
              />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <StepScheduleIcon className="w-9 h-9 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  2. 曜日・時間帯の設定
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setProviderWizardStep(3);
                    navigateTo('provider-wizard');
                  }}
                  className="text-[11px] font-bold text-indigo-800 underline cursor-pointer"
                >
                  曜日設定 →
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleStepCheck(2, isStep2Done)}
              className="cursor-pointer shrink-0"
            >
              <NotificationStatusBadge
                status={isStep2Done ? 'completed' : 'pending'}
                customLabel={isStep2Done ? '完了' : '未完了'}
                size="sm"
              />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <StepMatchingIcon className="w-9 h-9 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  3. 利用希望者との照合
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo('provider-search')}
                  className="text-[11px] font-bold text-indigo-800 underline cursor-pointer"
                >
                  一覧へ →
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleStepCheck(3, isStep3Done)}
              className="cursor-pointer shrink-0"
            >
              <NotificationStatusBadge
                status={isStep3Done ? 'completed' : 'new'}
                customLabel={isStep3Done ? '完了' : '未確認'}
                size="sm"
              />
            </button>
          </div>
        </div>
      </section>

      {/* 3. 利用希望者とのマッチング候補一覧 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
              受入条件に合う利用希望者（匿名表示・{candidateMatches.length}名）
            </h2>
            <p className="text-xs text-slate-600">
              相性％（適合度100点満点）と4段階の進捗を確認し、相談を開始できます。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isCurrentProviderPaid && (
              <button
                type="button"
                data-testid="toggle-match-filter-btn"
                onClick={() => toggleProviderMatchFilter(activeProviderId)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                  profile.filterOnlyMatchingRequests
                    ? 'bg-indigo-800 border-indigo-800 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>
                  {profile.filterOnlyMatchingRequests
                    ? '条件一致のみ表示中'
                    : '受入条件に合う希望のみ絞る'}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => openRegistrationScreen('user')}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>テスト利用者を登録</span>
            </button>
          </div>
        </div>

        {/* 有料プラン新着アラート */}
        {isCurrentProviderPaid && newArrivalAlerts.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
            <span className="font-bold">
              新着アラート：受入条件と適合度70%以上の新着希望者が {newArrivalAlerts.length}名 います（{newArrivalAlerts.map((n) => `${n.user.profile.anonymousCode}:${n.result.breakdown.totalScore}%`).join('、')}）
            </span>
          </div>
        )}

        {candidateMatches.length === 0 ? (
          <div className="p-6 rounded-2xl bg-teal-50/40 border border-dashed border-teal-300 text-center space-y-3">
            <p className="text-base font-bold text-slate-900">
              {allEvaluatedMatches.length === 0
                ? 'まだ利用希望者が登録されていません（現在 0名）'
                : '「受入条件に合う希望だけ」に一致する利用者が現在ありません'}
            </p>
            {allEvaluatedMatches.length === 0 ? (
              <button
                type="button"
                onClick={() => openRegistrationScreen('user')}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>テスト用の利用者を新規登録する</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleProviderMatchFilter(activeProviderId)}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold cursor-pointer"
              >
                すべての利用希望者を表示する
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidateMatches.map(
              ({ user, userFreshness, result, caseStatus, chatReq }) => {
                const isUserPaused = userFreshness.effectiveStatus === '休止中';
                const stage:
                  | 'unapproached'
                  | 'considering'
                  | 'pending'
                  | 'active'
                  | 'declined' =
                  caseStatus === '対応不可' || chatReq?.status === 'declined'
                    ? 'declined'
                    : caseStatus === '対応中' || chatReq?.status === 'approved'
                    ? 'active'
                    : chatReq?.status === 'pending'
                    ? 'pending'
                    : caseStatus === '検討中'
                    ? 'considering'
                    : 'unapproached';

                const disc = disclosures.find(
                  (d) =>
                    d.userId === user.profile.id &&
                    d.providerId === activeProviderId
                );

                return (
                  <div
                    key={user.profile.id}
                    className={`border rounded-2xl p-4 flex flex-col justify-between gap-3 ${
                      isUserPaused
                        ? 'border-slate-300 bg-slate-100/80 opacity-75'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <UserRecruitmentStatusBadge
                          info={userFreshness}
                          showAutoReason={false}
                        />
                        <UserConfirmedDateBadge info={userFreshness} />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-indigo-800">
                              {user.needs.desiredServices.join(' / ')}
                            </span>
                            <NotificationStatusBadge
                              status={
                                chatReq?.status === 'approved'
                                  ? 'completed'
                                  : chatReq?.status === 'pending'
                                  ? 'pending'
                                  : 'new'
                              }
                              customLabel={
                                chatReq?.status === 'approved'
                                  ? 'チャット開通'
                                  : chatReq?.status === 'pending'
                                  ? '承認待ち'
                                  : '新着'
                              }
                              size="sm"
                            />
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">
                            {user.profile.anonymousCode}（{user.profile.city}）
                          </h3>
                          <span className="text-xs text-slate-500">
                            第{disc?.stage || 1}段階 ／ 希望：{user.preferences.preferredDays.join('・')}曜
                          </span>
                        </div>
                        <MatchScoreRing
                          score={result.breakdown.totalScore}
                          judgment={result.judgment}
                          size="sm"
                        />
                      </div>

                    <CandidateCaseProgressBar stage={stage} />

                    <MatchBreakdownBarGraph
                      breakdown={result.breakdown}
                      compact={true}
                    />

                    {/* 有料プラン：候補者の進捗管理ボタン */}
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {CASE_STATUS_OPTIONS.map((st) => {
                        const active = caseStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              if (!isCurrentProviderPaid) {
                                setShowChatUpgradeModal(true);
                                return;
                              }
                              updateCaseManagementStatus(
                                user.profile.id,
                                activeProviderId,
                                st
                              );
                            }}
                            className={`min-h-[30px] px-1 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                              active
                                ? 'bg-indigo-800 border-indigo-800 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <SpeechButton
                      compact
                      tone="indigo"
                      speechId={`prov-dash-cand-${user.profile.id}`}
                      label="読み上げ"
                      getText={() =>
                        buildUserDetailForProviderSpeechText({
                          anonymousCode: user.profile.anonymousCode,
                          city: user.profile.city,
                          desiredServices: user.needs.desiredServices,
                          careNeeds: user.needs.careNeeds,
                          preferredDays: user.preferences.preferredDays,
                          score: result.breakdown.totalScore,
                          judgment: result.judgment,
                          disclosureStage: disc?.stage || 1,
                        })
                      }
                    />

                    {chatReq?.status === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => openChatWith(user.profile.id)}
                        className="flex-1 min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>チャットを開く</span>
                      </button>
                    ) : chatReq?.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => openUserDetailForProvider(user.profile.id)}
                        className="flex-1 min-h-[38px] px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <span>承認待ち</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickChatRequest(
                            user.profile.id,
                            user.profile.anonymousCode
                          )
                        }
                        className="flex-1 min-h-[38px] px-2.5 py-1.5 rounded-xl border border-indigo-700 text-indigo-900 bg-white hover:bg-indigo-50 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>チャット申請</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openUserDetailForProvider(user.profile.id)}
                      className="flex-1 min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>詳細を見る</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. 有料プラン：複数スタッフ管理 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-700" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">
              複数スタッフ管理（{profile.staffMembers?.length || 0}名登録中）
            </h2>
          </div>
          {!isCurrentProviderPaid && (
            <button
              type="button"
              onClick={() => navigateTo('provider-billing')}
              className="text-xs font-bold text-indigo-800 underline cursor-pointer"
            >
              有料プラン（3,980円/月）で複数スタッフを追加 →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(profile.staffMembers || []).map((st) => (
            <div
              key={st.id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900">{st.name}</p>
                <p className="text-slate-600">
                  {st.roleTitle} ／ {st.qualifications}
                </p>
              </div>
              {isCurrentProviderPaid && (profile.staffMembers || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProviderStaffMember(activeProviderId, st.id)}
                  aria-label={`${st.name}を削除`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {isCurrentProviderPaid && (
          <form onSubmit={handleAddStaff} className="flex flex-wrap gap-2 pt-1">
            <input
              type="text"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              placeholder="スタッフ氏名（例：佐藤 花子）"
              className="flex-1 min-w-[160px] min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
            />
            <input
              type="text"
              value={newStaffRole}
              onChange={(e) => setNewStaffRole(e.target.value)}
              placeholder="役割（例：サービス提供責任者）"
              className="min-w-[140px] min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="min-h-[38px] px-4 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold cursor-pointer"
            >
              ＋ スタッフ追加
            </button>
          </form>
        )}
      </section>

      {/* 5. 上位プラン（月額9,800円）：複数拠点管理 ＆ 地域の希望条件の傾向分析 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-700" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                上位プラン機能：複数拠点管理・地域の希望条件の傾向分析
              </h2>
              <p className="text-xs text-slate-600">
                上位プラン（月額9,800円・税込）で複数事業所の拠点切り替えと地域需要の分析が利用できます。
              </p>
            </div>
          </div>
          {!isProPlan && (
            <button
              type="button"
              onClick={() => navigateTo('provider-billing')}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold cursor-pointer"
            >
              上位プランを見る（月額9,800円）
            </button>
          )}
        </div>

        {/* 複数拠点管理 */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            複数拠点の管理（{profile.branches?.length || 1}拠点）
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(profile.branches || []).map((br) => (
              <div
                key={br.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {br.name} {br.isMain ? '（主拠点）' : ''}
                  </p>
                  <p className="text-slate-600 tabular-nums">
                    指定番号：{br.designatedNumber} ／ {br.city}
                  </p>
                </div>
                {isProPlan && !br.isMain && (
                  <button
                    type="button"
                    onClick={() => removeProviderBranch(activeProviderId, br.id)}
                    aria-label={`${br.name}を削除`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isProPlan && (
            <form onSubmit={handleAddBranch} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="新拠点名（例：中野サテライト）"
                className="flex-1 min-w-[160px] min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
              <input
                type="text"
                value={newBranchNumber}
                onChange={(e) => setNewBranchNumber(e.target.value)}
                placeholder="指定番号10桁"
                className="w-[120px] min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
              />
              <input
                type="text"
                value={newBranchCity}
                onChange={(e) => setNewBranchCity(e.target.value)}
                placeholder="地域（例：中野区）"
                className="w-[100px] min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
              <button
                type="submit"
                className="min-h-[38px] px-4 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold cursor-pointer"
              >
                ＋ 拠点を追加
              </button>
            </form>
          )}
        </div>

        {/* 地域の希望条件の傾向分析 */}
        {isProPlan ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">エリア別の希望件数</p>
              {regionalAnalytics.demandByArea.slice(0, 5).map((item) => (
                <div key={item.area} className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-700">{item.area}</span>
                  <span className="font-bold text-indigo-900 tabular-nums">
                    {item.count}名
                  </span>
                </div>
              ))}
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">ニーズの多いサービス・介助内容</p>
              {regionalAnalytics.demandByService.map((s) => (
                <div key={s.service} className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-700">{s.service}</span>
                  <span className="font-bold text-teal-900 tabular-nums">
                    {s.count}件
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            ※上位プランへアップグレードすると、地域別の利用希望傾向（サービス・エリア・曜日の需要分析）を確認して受け入れ体制の計画に役立てられます。
          </div>
        )}
      </section>

      {/* 6. 情報の更新履歴（鮮度管理ログ） */}
      <section
        data-testid="provider-update-history"
        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-800" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">
              直近の更新履歴（{profile.updateHistory?.length || 0}件）
            </h2>
          </div>
          {discrepancySummary.count > 0 && (
            <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
              利用者からの情報確認報告：{discrepancySummary.count}件
            </span>
          )}
        </div>

        {!profile.updateHistory || profile.updateHistory.length === 0 ? (
          <p className="text-xs text-slate-600">
            まだ更新履歴はありません。「内容に変更なし（今日の日付で更新）」または受入条件の編集保存を行うとここに記録されます。
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {profile.updateHistory.slice(0, 6).map((item) => (
              <li
                key={item.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-slate-600 tabular-nums">
                    {item.timestamp}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold border ${
                      item.kind === 'no_change'
                        ? 'bg-teal-50 border-teal-200 text-teal-900'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                    }`}
                  >
                    {item.kind === 'no_change' ? '変更なし' : '内容変更'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {item.actorName}
                  </span>
                </div>
                {item.summary && (
                  <span className="text-slate-600">{item.summary}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

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
    getUserBundleById,
    interactions,
    disclosures,
    chatRequests,
    currentProviderPlanDef,
    isCurrentProviderPaid,
    getProviderSubscription,
    subscribeProviderToPlan,
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

  // 万一まだ事業所が0社の場合は事業所登録へ案内
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
            まずは事業所として新規登録を行ってください。
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

  const candidateMatches = userProfiles
    .map((u) => {
      const uBundle = getUserBundleById(u.id);
      if (!uBundle) return null;
      const result = calculateMatchResult(uBundle, currentProviderBundle);
      const interaction = interactions.find(
        (i) => i.userId === u.id && i.providerId === activeProviderId
      );
      const chatReq = chatRequests.find(
        (r) => r.userId === u.id && r.providerId === activeProviderId
      );
      return {
        user: uBundle,
        result,
        caseStatus: interaction?.caseStatus || '未対応',
        chatReq,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort(
      (a, b) => b.result.breakdown.totalScore - a.result.breakdown.totalScore
    );

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
  const declinedOrUnavailableCount = candidateMatches.filter(
    (c) => c.caseStatus === '対応不可' || c.chatReq?.status === 'declined'
  ).length;
  const uncontactedCount = Math.max(
    0,
    candidateMatches.length -
      Math.max(activeCasesCount, approvedRequestsCount) -
      waitingReplyCount -
      declinedOrUnavailableCount
  );

  const availableDays = availability.weeklySchedule
    .filter((d) => d.available)
    .map((d) => d.day);

  // 3ステップの完了状態
  const isStep1Done =
    checkedSteps[1] ??
    Boolean(
      capabilities.supportedCareItems.length >= 2 &&
        profile.coverageAreas.length >= 1
    );
  const isStep2Done = checkedSteps[2] ?? Boolean(availableDays.length >= 1);
  const isStep3Done =
    checkedSteps[3] ?? Boolean(candidateMatches.length > 0);
  const completedStepsCount = [isStep1Done, isStep2Done, isStep3Done].filter(
    Boolean
  ).length;

  const toggleStepCheck = (stepNumber: number, currentVal: boolean) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepNumber]: !currentVal,
    }));
  };

  const handleQuickChatRequest = (userId: string, anonymousCode: string) => {
    if (!isCurrentProviderPaid) {
      setShowChatUpgradeModal(true);
      return;
    }
    sendChatRequest(
      userId,
      activeProviderId,
      'provider',
      'ご登録の希望条件を拝見しました。ご希望の曜日・介助内容にて対応可能ですので、ぜひ一度ご相談ください。'
    );
    setSentNotice(
      `「${anonymousCode}」へチャット開始申請を送信しました！上部の「利用者画面」に切り替えると承認テストができます。`
    );
    setTimeout(() => setSentNotice(''), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-24 space-y-5">
      {/* 1. 事業所ホーム：基本情報・プラン切替 ＆ マッチング進捗・曜日別グラフ */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3.5 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-900 text-white text-xs font-bold">
                <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>事業所ホーム</span>
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-md border tabular-nums ${
                  isCurrentProviderPaid
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                    : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                {currentProviderPlanDef.name}（月額
                {currentProviderPlanDef.monthlyPriceYen.toLocaleString()}円）
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">
              {profile.name}
            </h1>
            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-700" />
              {profile.coverageAreas.join('・')} · 提供：
              {profile.serviceTypes.join(' / ')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {providerProfiles.length > 1 && (
              <select
                aria-label="登録した事業所を切替"
                value={activeProviderId}
                onChange={(e) => setActiveProviderId(e.target.value)}
                className="min-h-[36px] px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900"
              >
                {providerProfiles.map((p) => {
                  const sub = getProviderSubscription(p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      [{sub.planId === 'free' ? '無料' : '有料'}] {p.name}
                    </option>
                  );
                })}
              </select>
            )}

            <button
              type="button"
              onClick={() =>
                subscribeProviderToPlan(
                  activeProviderId,
                  isCurrentProviderPaid ? 'free' : 'standard'
                )
              }
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-xs font-bold cursor-pointer whitespace-nowrap transition-colors"
            >
              {isCurrentProviderPaid ? '無料へ切替' : '有料へ切替'}
            </button>

            <button
              type="button"
              onClick={() => {
                setProviderWizardStep(1);
                navigateTo('provider-wizard');
              }}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              <FileEdit className="w-3.5 h-3.5 text-indigo-700" />
              <span>条件・空き枠</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('provider-billing')}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>料金プラン</span>
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

        {/* 受入状況ワンタップ切替 ＆ 空き曜日（1行） */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="quick-acceptance-select"
              className="text-xs font-bold text-slate-700"
            >
              現在の受入状況:
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
            <span className="text-xs font-bold text-slate-600">空き曜日:</span>
            <WeeklyDayStrip activeDays={availableDays} />
          </div>
        </div>

        {/* マッチング進捗バー ＆ 曜日別希望者グラフ */}
        <ProviderMatchingProgressBoard
          totalUsersCount={candidateMatches.length}
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
            acc[day] = candidateMatches.filter((c) =>
              c.user.preferences.preferredDays.includes(day)
            ).length;
            return acc;
          }, {} as Record<DayOfWeek, number>)}
        />
      </section>

      {/* 2. 新規登録した事業所向け「まず最初にやるべき3ステップ」（進捗バー付き） */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-800 text-white text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              3ステップガイド
            </span>
            <h2 className="text-base font-bold text-slate-900">
              まず最初にやるべき3ステップ
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-900 tabular-nums">
              {completedStepsCount}/3 完了
            </span>
            <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-indigo-700 h-full transition-all"
                style={{ width: `${(completedStepsCount / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <StepProfileIcon className="w-9 h-9 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  1. プロフィール充実
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
                  2. 受入状況の登録
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setProviderWizardStep(3);
                    navigateTo('provider-wizard');
                  }}
                  className="text-[11px] font-bold text-indigo-800 underline cursor-pointer"
                >
                  空き曜日設定 →
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
                  3. マッチング確認
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo('provider-search')}
                  className="text-[11px] font-bold text-indigo-800 underline cursor-pointer"
                >
                  候補者一覧へ →
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

      {sentNotice && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-bold"
        >
          {sentNotice}
        </div>
      )}

      {/* 3. マッチング候補（利用希望者）一覧 ＆ 案件進捗バー（0名なら利用者登録ボタンを表示） */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
              登録されている利用希望者一覧（匿名表示・{candidateMatches.length}名）
            </h2>
            <p className="text-xs text-slate-600">
              相性％と4段階進捗バー（25%〜100%）を確認し、チャット申請を送ることができます。
            </p>
          </div>
          {candidateMatches.length > 0 && (
            <button
              type="button"
              onClick={() => openRegistrationScreen('user')}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>別の利用者を新規登録して追加テスト</span>
            </button>
          )}
        </div>

        {candidateMatches.length === 0 ? (
          <div className="p-6 rounded-2xl bg-teal-50/40 border border-dashed border-teal-300 text-center space-y-3">
            <p className="text-base font-bold text-slate-900">
              まだ利用希望者が登録されていません（現在 0名）
            </p>
            <p className="text-xs text-slate-600">
              マッチングやチャット申請をテストするには、続けて「利用者」を1名新規登録してみてください。
            </p>
            <button
              type="button"
              onClick={() => openRegistrationScreen('user')}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>テスト用の利用者を新規登録する</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidateMatches.map(({ user, result, caseStatus, chatReq }) => {
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

              return (
                <div
                  key={user.profile.id}
                  className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-slate-50/50"
                >
                  <div className="space-y-3">
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
                                ? '完了（チャット開通）'
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
                          希望曜日：{user.preferences.preferredDays.join('・')}曜
                        </span>
                      </div>
                      <MatchScoreRing
                        score={result.breakdown.totalScore}
                        judgment={result.judgment}
                        size="sm"
                      />
                    </div>

                    {/* 4段階案件進捗バー（25% / 50% / 75% / 100%） */}
                    <CandidateCaseProgressBar stage={stage} />

                    <MatchBreakdownBarGraph
                      breakdown={result.breakdown}
                      compact={true}
                    />

                    {/* 案件ステータス切替ボタン */}
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
                          disclosureStage:
                            disclosures.find(
                              (d) =>
                                d.userId === user.profile.id &&
                                d.providerId === activeProviderId
                            )?.stage || 1,
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
    </div>
  );
};

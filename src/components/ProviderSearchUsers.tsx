import React, { useState } from 'react';
import {
  ArrowRight,
  MessageSquare,
  SlidersHorizontal,
  RotateCcw,
  ShieldCheck,
  MapPin,
  Calendar,
  Lock,
  Send,
  Check,
  Sparkles,
  Clock,
  Filter,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  AREA_OPTIONS,
  CaseManagementStatus,
  CHAT_TEMPLATES_PROVIDER,
  DayOfWeek,
  DAYS_OF_WEEK,
  SERVICE_TYPES,
  ServiceType,
} from '../types/domain';
import { getCurrentYearMonth } from '../utils/date';
import { getUserFreshnessInfo } from '../utils/freshness';
import { calculateMatchResult } from '../utils/matching';
import {
  doesUserMatchProviderAcceptanceFilter,
  verifyProviderChatAccess,
} from '../utils/subscription';
import {
  CareNeedsIconGrid,
  MatchScoreRing,
  ServiceIllustration,
  WeeklyDayStrip,
} from './VisualHelpers';
import {
  UserConfirmedDateBadge,
  UserRecruitmentStatusBadge,
} from './FreshnessBadges';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import {
  buildProviderSearchSpeechText,
  buildUserDetailForProviderSpeechText,
} from '../utils/speech';

const CASE_STATUSES: CaseManagementStatus[] = [
  '未対応',
  '検討中',
  '対応中',
  '対応不可',
];

export const ProviderSearchUsers: React.FC = () => {
  const {
    activeProviderId,
    currentProviderBundle,
    currentProviderPlanDef,
    currentProviderSubscription,
    subscriptionPlans,
    isCurrentProviderPaid,
    userProfiles,
    getUserBundleById,
    interactions,
    chatRequests,
    getDisclosureStage,
    getChatRequestBetween,
    sendChatRequest,
    updateCaseManagementStatus,
    toggleProviderMatchFilter,
    openUserDetailForProvider,
    openChatWith,
    setShowChatUpgradeModal,
    navigateTo,
    openRegistrationScreen,
    effectiveReferenceDate,
  } = useAppState();

  const [filterService, setFilterService] = useState<ServiceType | 'all'>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<DayOfWeek | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'recruiting'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [requestingUserId, setRequestingUserId] = useState<string | null>(null);
  const [requestMessageText, setRequestMessageText] = useState<string>(
    CHAT_TEMPLATES_PROVIDER[0]
  );
  const [requestSentBanner, setRequestSentBanner] = useState<string>('');

  const resetFilters = () => {
    setFilterService('all');
    setFilterArea('all');
    setFilterDay('all');
    setStatusFilter('all');
  };

  const overallAccess = verifyProviderChatAccess({
    subscription: currentProviderSubscription,
    plans: subscriptionPlans,
    allProviderChatRequests: chatRequests,
    currentYearMonth: getCurrentYearMonth(effectiveReferenceDate),
  });

  const evaluatedUsers = userProfiles
    .map((u) => {
      const bundle = getUserBundleById(u.id);
      if (!bundle) return null;
      const userFreshness = getUserFreshnessInfo(u, effectiveReferenceDate);
      const match = calculateMatchResult(
        bundle,
        currentProviderBundle,
        effectiveReferenceDate
      );
      const interaction = interactions.find(
        (i) => i.userId === u.id && i.providerId === activeProviderId
      );
      const disclosure = getDisclosureStage(u.id, activeProviderId);
      const chatReq = getChatRequestBetween(u.id, activeProviderId);
      const matchesAcceptance = doesUserMatchProviderAcceptanceFilter({
        providerProfile: currentProviderBundle.profile,
        providerCapabilities: currentProviderBundle.capabilities,
        providerAvailability: currentProviderBundle.availability,
        userNeeds: bundle.needs,
        userPreferences: bundle.preferences,
        userProfile: bundle.profile,
      });
      return {
        bundle,
        userFreshness,
        match,
        caseStatus: interaction?.caseStatus || '未対応',
        isUserFavoritedUs: Boolean(interaction?.isUserFavorite),
        disclosure,
        chatReq,
        matchesAcceptance,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((item) => {
      if (
        isCurrentProviderPaid &&
        currentProviderBundle.profile.filterOnlyMatchingRequests &&
        !item.matchesAcceptance
      ) {
        return false;
      }
      if (filterService !== 'all') {
        if (!item.bundle.needs.desiredServices.includes(filterService)) {
          return false;
        }
      }
      if (filterArea !== 'all') {
        if (
          item.bundle.profile.city !== filterArea &&
          !item.bundle.preferences.preferredAreas.includes(filterArea)
        ) {
          return false;
        }
      }
      if (statusFilter === 'recruiting' && item.userFreshness.effectiveStatus !== '募集中') {
        return false;
      }
      if (filterDay !== 'all') {
        if (!item.bundle.preferences.preferredDays.includes(filterDay)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (a.userFreshness.effectiveStatus !== b.userFreshness.effectiveStatus) {
        return a.userFreshness.effectiveStatus === '募集中' ? -1 : 1;
      }
      if (
        a.match.judgment === 'マッチング対象外' &&
        b.match.judgment !== 'マッチング対象外'
      ) {
        return 1;
      }
      if (
        a.match.judgment !== 'マッチング対象外' &&
        b.match.judgment === 'マッチング対象外'
      ) {
        return -1;
      }
      return b.match.breakdown.totalScore - a.match.breakdown.totalScore;
    });

  const handleOpenChatOrRequest = (userId: string) => {
    const existingReq = getChatRequestBetween(userId, activeProviderId);
    if (existingReq?.status === 'approved') {
      openChatWith(userId);
      return;
    }
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
    setRequestingUserId(userId);
    setRequestMessageText(CHAT_TEMPLATES_PROVIDER[0]);
  };

  const handleSubmitChatRequest = (userId: string, anonymousCode: string) => {
    const res = sendChatRequest(
      userId,
      activeProviderId,
      'provider',
      requestMessageText
    );
    if (!res.ok) {
      setShowChatUpgradeModal(true);
      return;
    }
    setRequestingUserId(null);
    setRequestSentBanner(
      `「${anonymousCode}」へチャット開始申請を送信しました。ご本人・ご家族が承認すると匿名相談からチャットが始まります。`
    );
    setTimeout(() => setRequestSentBanner(''), 5000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-24 space-y-5">
      {/* ヘッダー＆プラン案内 */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-teal-800">
                {currentProviderBundle.profile.name}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                  isCurrentProviderPaid
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {currentProviderPlanDef.name}
              </span>
              {!isCurrentProviderPaid && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 tabular-nums">
                  今月の新規申請 残り {overallAccess.remainingFreeRequests ?? 0} / 1件
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              利用希望者との条件マッチング一覧（段階的情報開示）
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              第1段階（匿名相談）では障害詳細や連絡先は非表示です。利用者が第2段階「条件の開示」・第3段階「連絡先の開示」に同意すると段階的に情報が開示されます。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isCurrentProviderPaid && (
              <button
                type="button"
                onClick={() => toggleProviderMatchFilter(activeProviderId)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                  currentProviderBundle.profile.filterOnlyMatchingRequests
                    ? 'bg-indigo-800 border-indigo-800 text-white'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>
                  {currentProviderBundle.profile.filterOnlyMatchingRequests
                    ? '受入条件に一致のみ表示中'
                    : '受入条件一致のみ表示'}
                </span>
              </button>
            )}
            {!isCurrentProviderPaid && (
              <button
                type="button"
                onClick={() => navigateTo('provider-billing')}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-teal-700 bg-teal-50/70 hover:bg-teal-100 text-teal-950 text-xs font-bold shrink-0 cursor-pointer"
              >
                有料プランを見る →
              </button>
            )}
            <SpeechButton
              speechId="screen-provider-search"
              isPrimaryScreenReader
              tone="indigo"
              getText={() =>
                buildProviderSearchSpeechText({
                  providerName: currentProviderBundle.profile.name,
                  planName: currentProviderPlanDef.name,
                  resultCount: evaluatedUsers.length,
                  topUser: evaluatedUsers[0]
                    ? {
                        anonymousCode: evaluatedUsers[0].bundle.profile.anonymousCode,
                        city: evaluatedUsers[0].bundle.profile.city,
                        score: evaluatedUsers[0].match.breakdown.totalScore,
                      }
                    : undefined,
                })
              }
            />
            <HelpTooltip guideKey="provider-search" tone="indigo" />
          </div>
        </div>

        {requestSentBanner && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-teal-50 border-2 border-teal-700 text-teal-950 font-bold text-sm"
          >
            {requestSentBanner}
          </div>
        )}

        {/* 絞り込みバー */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                <span>
                  条件で絞り込む{showFilters ? '（閉じる）' : '（開く）'}
                </span>
              </button>

              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  すべて表示
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('recruiting')}
                  className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    statusFilter === 'recruiting'
                      ? 'bg-teal-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  募集中のみ
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              リセット
            </button>
          </div>

          {showFilters && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label
                  htmlFor="prov-filter-service"
                  className="block text-xs font-bold text-slate-700"
                >
                  希望サービス
                </label>
                <select
                  id="prov-filter-service"
                  value={filterService}
                  onChange={(e) =>
                    setFilterService(e.target.value as ServiceType | 'all')
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900"
                >
                  <option value="all">すべてのサービス</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="prov-filter-area"
                  className="block text-xs font-bold text-slate-700"
                >
                  希望地域
                </label>
                <select
                  id="prov-filter-area"
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900"
                >
                  <option value="all">すべての地域</option>
                  {AREA_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="prov-filter-day"
                  className="block text-xs font-bold text-slate-700"
                >
                  希望曜日
                </label>
                <select
                  id="prov-filter-day"
                  value={filterDay}
                  onChange={(e) =>
                    setFilterDay(e.target.value as DayOfWeek | 'all')
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900"
                >
                  <option value="all">すべての曜日</option>
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}曜日
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {userProfiles.length === 0 && (
        <div className="bg-white border-2 border-dashed border-teal-300 rounded-3xl p-8 text-center space-y-4">
          <p className="text-lg font-extrabold text-slate-900">
            まだ利用希望者が登録されていません（0名）
          </p>
          <button
            type="button"
            onClick={() => openRegistrationScreen('user')}
            className="min-h-[48px] px-6 py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-sm cursor-pointer"
          >
            ＋ 利用者を新規登録してテストする
          </button>
        </div>
      )}

      <div className="space-y-4">
        {evaluatedUsers.map(
          ({
            bundle,
            userFreshness,
            match,
            caseStatus,
            isUserFavoritedUs,
            disclosure,
            chatReq,
          }) => {
            const { profile, needs, preferences } = bundle;
            const timeLabels = preferences.preferredTimeSlots
              .map((s) => s.split('（')[0])
              .join('・');
            const stage2Unlocked = disclosure.stage >= 2;
            const isPausedUser = userFreshness.effectiveStatus === '休止中';

            return (
              <article
                key={profile.id}
                data-testid={`provider-user-card-${profile.id}`}
                className={`rounded-3xl border p-5 sm:p-6 space-y-4 transition-opacity ${
                  isPausedUser
                    ? 'bg-slate-100/80 border-slate-300 opacity-75'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <ServiceIllustration
                      service={needs.desiredServices[0] || '居宅介護'}
                      className="w-12 h-12 sm:w-14 sm:h-14 shrink-0"
                    />
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                        <UserRecruitmentStatusBadge info={userFreshness} />
                        <UserConfirmedDateBadge info={userFreshness} />
                        <span className="font-bold text-teal-800">
                          希望サービス：{needs.desiredServices.join(' / ')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>登録：{profile.registeredAt || '最新'}</span>
                        {profile.isNewArrival && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px]">
                            <Sparkles className="w-3 h-3" />
                            新着
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px]">
                          第{disclosure.stage}段階
                        </span>
                        {disclosure.stage === 3 && (
                          <span className="text-teal-900 font-bold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            連絡先開示済
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                        {profile.anonymousCode}
                        {stage2Unlocked && (
                          <span className="text-sm font-medium text-slate-600 ml-2">
                            （{profile.nickname} · {profile.ageGroup} · 区分：
                            {needs.supportCategory}）
                          </span>
                        )}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-teal-700" />
                          希望地域：{profile.city}
                        </span>
                        <span>
                          希望時間帯：{timeLabels}（{preferences.frequency}）
                        </span>
                      </div>

                      {isUserFavoritedUs && (
                        <p className="text-xs font-bold text-amber-800 pt-0.5">
                          ★貴事業所をお気に入りに保存しています
                        </p>
                      )}
                    </div>
                  </div>

                  <MatchScoreRing
                    score={match.breakdown.totalScore}
                    judgment={match.judgment}
                    size="md"
                  />
                </div>

                {/* 主な支援ニーズ＆希望曜日ストリップ */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100">
                  <div className="md:col-span-7 space-y-1.5">
                    <span className="text-xs font-bold text-slate-500 block">
                      主な支援ニーズ（✓＝貴事業所で対応可）：
                    </span>
                    <CareNeedsIconGrid
                      items={needs.careNeeds}
                      supportedItems={
                        currentProviderBundle.capabilities.supportedCareItems
                      }
                    />
                  </div>

                  <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-1.5">
                    <span className="text-xs font-bold text-slate-500 inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      希望曜日
                    </span>
                    <WeeklyDayStrip activeDays={preferences.preferredDays} />
                  </div>
                </div>

                {/* 段階的情報開示の要約表示 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 space-y-1">
                  <span className="font-bold text-slate-900 block">
                    {stage2Unlocked
                      ? '第2段階開示済み（障害特性・配慮事項）：'
                      : '第1段階（匿名相談）での希望概要：'}
                  </span>
                  {stage2Unlocked ? (
                    <div className="space-y-1">
                      <p>
                        障害種別：{needs.disabilityTypes.join('・')} ／{' '}
                        {needs.communicationConsiderations.join('・')}
                      </p>
                      {needs.dislikesAndAccommodations && (
                        <p className="text-slate-800">
                          苦手なこと・配慮してほしいこと：{needs.dislikesAndAccommodations}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <p>
                        {profile.briefSummaryForFreePlan ||
                          `${needs.physicalConditions.join('・')} ／ ${
                            preferences.helperGenderPreference
                          }`}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        第1段階（匿名相談）のため、障害特性の詳細・連絡先は非表示です（利用者の第2・第3段階同意後に開示されます）。
                      </p>
                    </>
                  )}
                </div>

                {/* チャット開始申請インラインフォーム */}
                {requestingUserId === profile.id && (
                  <div className="p-4 rounded-2xl bg-teal-50/70 border-2 border-teal-700 space-y-3">
                    <p className="text-sm font-bold text-slate-900">
                      「{profile.anonymousCode}」へチャット開始申請を送る
                    </p>
                    <p className="text-xs text-slate-600">
                      利用者が承認すると第1段階「匿名相談」からやり取りが始まります。
                    </p>
                    <textarea
                      rows={2}
                      value={requestMessageText}
                      onChange={(e) => setRequestMessageText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900"
                      aria-label="チャット開始申請の初回メッセージ"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSubmitChatRequest(
                            profile.id,
                            profile.anonymousCode
                          )
                        }
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        チャット開始申請を送信する
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequestingUserId(null)}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}

                {/* 下段アクションボタン */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 mr-1">
                      案件進捗：
                    </span>
                    {CASE_STATUSES.map((st) => {
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
                              profile.id,
                              activeProviderId,
                              st
                            );
                          }}
                          className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                            active
                              ? 'bg-teal-800 border-teal-800 text-white'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <SpeechButton
                      compact
                      tone="indigo"
                      speechId={`prov-search-card-${profile.id}`}
                      label="読み上げ"
                      getText={() =>
                        buildUserDetailForProviderSpeechText({
                          anonymousCode: profile.anonymousCode,
                          city: profile.city,
                          desiredServices: needs.desiredServices,
                          careNeeds: needs.careNeeds,
                          preferredDays: preferences.preferredDays,
                          score: match.breakdown.totalScore,
                          judgment: match.judgment,
                          disclosureStage: disclosure.stage,
                        })
                      }
                    />
                    {chatReq?.status === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => openChatWith(profile.id)}
                        className="min-h-[46px] px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" aria-hidden="true" />
                        承認済・チャットを開く
                      </button>
                    ) : chatReq?.status === 'pending' ? (
                      <span className="min-h-[46px] px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-800" aria-hidden="true" />
                        チャット申請済（承認待ち）
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenChatOrRequest(profile.id)}
                        className="min-h-[46px] px-4 py-2 rounded-xl border-2 border-teal-700 text-teal-900 bg-white hover:bg-teal-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" aria-hidden="true" />
                        <span>チャット開始申請</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openUserDetailForProvider(profile.id)}
                      className="min-h-[46px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>詳細を見る</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          }
        )}
      </div>
    </div>
  );
};

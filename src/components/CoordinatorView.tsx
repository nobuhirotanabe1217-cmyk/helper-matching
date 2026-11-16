import React, { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  PauseCircle,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  calculateMatchResult,
  compareProvidersForUserSearch,
} from '../utils/matching';
import {
  getProviderDiscrepancySummary,
  getProviderFreshnessInfo,
  getProviderInterviewTrustBadge,
  getUserFreshnessInfo,
} from '../utils/freshness';
import { isPaidPlanActive } from '../utils/subscription';
import { AREA_OPTIONS, PROVIDER_CARE_LABELS } from '../types/domain';
import { AcceptanceCardView } from './AcceptanceCardView';
import {
  ProviderFreshnessBadge,
  ProviderInterviewTrustBadge,
  ProviderReportWarningBadge,
  UserConfirmedDateBadge,
  UserRecruitmentStatusBadge,
} from './FreshnessBadges';
import { MatchBreakdownBarGraph, MatchScoreRing } from './VisualHelpers';
import { SpeechButton } from './SpeechButton';

export const CoordinatorView: React.FC = () => {
  const {
    coordinators,
    currentCoordinator,
    sharedCases,
    userProfiles,
    userNeeds,
    userPreferences,
    providerProfiles,
    providerCapabilities,
    providerAvailabilities,
    providerSubscriptions,
    subscriptionPlans,
    startAsCoordinatorDemo,
    registerCoordinator,
    navigateTo,
    openProviderDetail,
    startAsUserDemo,
    effectiveReferenceDate,
    providerReports,
    confirmedInterviews,
    disclosures,
  } = useAppState();

  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    sharedCases[0]?.id || ''
  );
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
    null
  );
  const [areaFilter, setAreaFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'newest_update'>('default');
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const [newName, setNewName] = useState('');
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState('');

  // 当該専門員に共有されたケースを優先しつつ、プロトタイプとして共有ケース一覧を参照可能
  const visibleCases = useMemo(() => {
    if (!currentCoordinator) return sharedCases;
    const assigned = sharedCases.filter(
      (c) => c.coordinatorId === currentCoordinator.id
    );
    return assigned.length > 0 ? assigned : sharedCases;
  }, [sharedCases, currentCoordinator]);

  const activeCase =
    visibleCases.find((c) => c.id === selectedCaseId) || visibleCases[0];

  const activeUserBundle = useMemo(() => {
    if (!activeCase) return null;
    const profile = userProfiles.find((u) => u.id === activeCase.userId);
    const needs = userNeeds.find((n) => n.userId === activeCase.userId);
    const preferences = userPreferences.find(
      (p) => p.userId === activeCase.userId
    );
    if (!profile || !needs || !preferences) return null;
    return { profile, needs, preferences };
  }, [activeCase, userProfiles, userNeeds, userPreferences]);

  const matchedProviders = useMemo(() => {
    if (!activeUserBundle) return [];
    const list = providerProfiles
      .map((profile) => {
        const capabilities = providerCapabilities.find(
          (c) => c.providerId === profile.id
        );
        const availability = providerAvailabilities.find(
          (a) => a.providerId === profile.id
        );
        if (!capabilities || !availability) return null;
        const bundle = { profile, capabilities, availability };
        const match = calculateMatchResult(
          activeUserBundle,
          bundle,
          effectiveReferenceDate
        );
        const sub = providerSubscriptions.find(
          (s) => s.providerId === profile.id
        );
        const isPaid = isPaidPlanActive(sub, subscriptionPlans);
        const updatedAt = profile.updatedAt || availability.updatedAt;
        const freshness = getProviderFreshnessInfo(
          updatedAt,
          effectiveReferenceDate
        );
        const discrepancy = getProviderDiscrepancySummary(
          profile.id,
          providerReports
        );
        const interviewTrust = getProviderInterviewTrustBadge(
          profile.id,
          confirmedInterviews,
          disclosures
        );
        return { bundle, match, isPaid, freshness, discrepancy, interviewTrust };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item) => {
        if (areaFilter === 'ALL') return true;
        return (
          item.bundle.profile.coverageAreas.includes(areaFilter) ||
          item.bundle.profile.locationCity === areaFilter
        );
      });

    return list.sort((a, b) =>
      compareProvidersForUserSearch(a, b, {
        prioritizeFavorites: false,
        sortBy,
      })
    );
  }, [
    activeUserBundle,
    providerProfiles,
    providerCapabilities,
    providerAvailabilities,
    providerSubscriptions,
    subscriptionPlans,
    areaFilter,
    sortBy,
    effectiveReferenceDate,
    providerReports,
    confirmedInterviews,
    disclosures,
  ]);

  const handleRegisterCoordinator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newOfficeName.trim() || !newArea.trim()) {
      setFormError('お名前・所属相談支援事業所名・担当エリアをすべて入力してください。');
      return;
    }
    setFormError('');
    registerCoordinator(
      {
        name: newName.trim(),
        officeName: newOfficeName.trim(),
        area: newArea.trim(),
        email: newEmail.trim() || undefined,
      },
      true
    );
    setShowRegisterForm(false);
    setFeedback(`${newName.trim()} 様の相談支援専門員アカウントを登録・切り替えました（無料）。`);
    setNewName('');
    setNewOfficeName('');
    setNewArea('');
    setNewEmail('');
  };

  return (
    <div
      data-testid="coordinator-workspace"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-24"
    >
      {/* ヘッダーバナー */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-950 text-xs font-bold whitespace-nowrap">
                  <UserCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  相談支援専門員（無料ワークスペース）
                </span>
                {currentCoordinator && (
                  <span className="text-xs font-bold text-slate-600">
                    {currentCoordinator.officeName} ／ 担当：{currentCoordinator.name}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                共有ケースの事業所検索・受入条件照合
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                利用者・ご家族から共有された支援ニーズ・特性プロフィールをもとに、受け入れ可能な事業所候補を比較・提案できます。相談支援専門員は完全無料でご利用いただけます。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <SpeechButton
                speechId="screen-coordinator-workspace"
                isPrimaryScreenReader
                tone="slate"
                label="画面を読み上げる"
                getText={() =>
                  `相談支援専門員のワークスペースです。共有されている相談ケースは${visibleCases.length}件あります。利用者の希望条件と事業所の受入条件カードを照合できます。`
                }
              />
              {coordinators.length > 0 && (
                <select
                  aria-label="相談支援専門員を切り替え"
                  value={currentCoordinator?.id || ''}
                  onChange={(e) => startAsCoordinatorDemo(e.target.value)}
                  className="min-h-[42px] max-w-full sm:max-w-[260px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 truncate"
                >
                  {coordinators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}（{c.officeName}）
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => setShowRegisterForm((v) => !v)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-sky-800 hover:bg-sky-900 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>新規専門員を無料登録</span>
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* 簡易登録フォーム */}
        {showRegisterForm && (
          <form
            onSubmit={handleRegisterCoordinator}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900">
              相談支援専門員の簡易登録（無料）
            </h2>
            {formError && (
              <p className="text-xs font-bold text-red-700">{formError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  お名前【必須】
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例：高橋 健一"
                  className="w-full min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  所属事業所名【必須】
                </label>
                <input
                  type="text"
                  value={newOfficeName}
                  onChange={(e) => setNewOfficeName(e.target.value)}
                  placeholder="例：すぎなみ相談支援センター"
                  className="w-full min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  担当エリア【必須】
                </label>
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="例：杉並区・中野区"
                  className="w-full min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  メールアドレス（任意）
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="example@office.jp"
                  className="w-full min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-800 hover:bg-sky-900 text-white text-xs font-bold cursor-pointer"
              >
                無料で登録して開始
              </button>
            </div>
          </form>
        )}
      </section>

      {visibleCases.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-lg font-bold text-slate-900">
            まだ共有されている相談ケースがありません
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            利用者マイページの「相談支援専門員に共有する」ボタンから共有すると、ここにケースが表示されます。
          </p>
          <button
            type="button"
            onClick={() => navigateTo('top')}
            className="min-h-[44px] px-5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-bold text-slate-800 cursor-pointer"
          >
            トップ画面へ戻る
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左カラム（4列）：共有された相談ケース一覧＋選択中の特性プロフィール */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-sky-700" aria-hidden="true" />
                共有された利用者ケース（{visibleCases.length}件）
              </h2>
              <div className="space-y-2">
                {visibleCases.map((c) => {
                  const u = userProfiles.find((p) => p.id === c.userId);
                  const active = c.id === activeCase?.id;
                  const uFresh = u
                    ? getUserFreshnessInfo(u, effectiveReferenceDate)
                    : null;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCaseId(c.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                        active
                          ? 'bg-sky-50 border-sky-700 text-sky-950'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm">
                          {u ? `${u.nickname}（${u.city}）` : c.userId}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                          {c.sharedAt.slice(0, 10)}
                        </span>
                      </div>
                      {uFresh && (
                        <div className="flex flex-wrap items-center gap-1">
                          <UserRecruitmentStatusBadge info={uFresh} />
                          <UserConfirmedDateBadge info={uFresh} />
                        </div>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {c.noteToCoordinator || '希望条件に合う事業所候補を探しています。'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 選択中利用者の希望条件＆特性プロフィール */}
            {activeUserBundle && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    特性プロフィール＆希望条件
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      startAsUserDemo(activeUserBundle.profile.id, 'user-dashboard')
                    }
                    className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
                  >
                    利用者画面で見る
                  </button>
                </div>
                {(() => {
                  const uFresh = getUserFreshnessInfo(
                    activeUserBundle.profile,
                    effectiveReferenceDate
                  );
                  return (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <UserRecruitmentStatusBadge info={uFresh} />
                      <UserConfirmedDateBadge info={uFresh} />
                    </div>
                  );
                })()}

                {activeCase?.noteToCoordinator && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <span className="font-bold block">本人・家族からの共有メモ：</span>
                    <p>{activeCase.noteToCoordinator}</p>
                  </div>
                )}

                <dl className="space-y-2.5 text-xs">
                  <div>
                    <dt className="font-bold text-slate-500">希望サービス</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">
                      {activeUserBundle.needs.desiredServices.join('・') || '未設定'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">障害種別・区分</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">
                      {activeUserBundle.needs.disabilityTypes.join('・')} ／{' '}
                      {activeUserBundle.needs.supportCategory}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">必要な介助</dt>
                    <dd className="text-slate-800 mt-0.5">
                      {activeUserBundle.needs.careNeeds
                        .map((c) => PROVIDER_CARE_LABELS[c] || c)
                        .join('・') || '未設定'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">コミュニケーション方法</dt>
                    <dd className="text-slate-800 mt-0.5">
                      {activeUserBundle.needs.communicationConsiderations.join('／') ||
                        '標準'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">
                      苦手なこと・配慮してほしいこと
                    </dt>
                    <dd className="text-slate-800 mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      {activeUserBundle.needs.dislikesAndAccommodations ||
                        '特記事項なし'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">希望曜日・時間帯・エリア</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">
                      {activeUserBundle.preferences.preferredDays.join('・')}曜 ／{' '}
                      {activeUserBundle.preferences.preferredTimeSlots.join('・')} ／{' '}
                      {activeUserBundle.preferences.preferredAreas.join('・') ||
                        activeUserBundle.profile.city}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </aside>

          {/* 右カラム（8列）：受入可能事業所の検索・比較一覧 */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-800" aria-hidden="true" />
                <span className="text-sm font-bold text-slate-900">
                  受入可能条件カードによる適合事業所一覧（{matchedProviders.length}件）
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="coord-sort-select"
                    className="text-xs font-bold text-slate-600"
                  >
                    並び順：
                  </label>
                  <select
                    id="coord-sort-select"
                    data-testid="coord-sort-select"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'default' | 'newest_update')
                    }
                    className="min-h-[38px] px-3 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900"
                  >
                    <option value="default">標準（適合度と更新の新しい順）</option>
                    <option value="newest_update">更新が新しい順</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="coord-area-filter"
                    className="text-xs font-bold text-slate-600"
                  >
                    地域絞り込み：
                  </label>
                  <select
                    id="coord-area-filter"
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="min-h-[38px] px-3 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900"
                  >
                    <option value="ALL">すべてのエリア</option>
                    {AREA_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {matchedProviders.map(
              ({ bundle, match, isPaid, freshness, discrepancy, interviewTrust }) => {
                const isExpanded = expandedProviderId === bundle.profile.id;
                return (
                  <article
                    key={bundle.profile.id}
                    className={`rounded-2xl border p-5 space-y-4 transition-opacity ${
                      freshness.isAutoPaused
                        ? 'bg-slate-100/80 border-slate-300 opacity-75'
                        : isPaid
                        ? 'bg-white border-indigo-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <ProviderFreshnessBadge info={freshness} />
                          <ProviderReportWarningBadge summary={discrepancy} />
                          <ProviderInterviewTrustBadge info={interviewTrust} />
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-950 text-xs font-bold tabular-nums">
                            <BadgeCheck className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                            事業所番号登録済み（{bundle.profile.designatedNumber}）
                          </span>
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-950 text-[11px] font-bold">
                              <Sparkles className="w-3 h-3" aria-hidden="true" />
                              条件強調
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                          <span>{bundle.profile.name}</span>
                        </h3>
                        <p className="text-xs text-slate-600">
                          所在地：{bundle.profile.locationCity} ／ 対応：
                          {bundle.profile.coverageAreas.join('・')} ／ 最終更新：
                          {bundle.profile.updatedAt}
                        </p>
                      </div>

                      <div className="shrink-0 flex sm:flex-col items-center gap-3">
                        <MatchScoreRing
                          score={match.breakdown.totalScore}
                          judgment={match.judgment}
                        />
                      </div>
                    </div>

                    {freshness.isAutoPaused && freshness.pauseNoticeText && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs font-extrabold flex items-center gap-2">
                        <PauseCircle className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />
                        <span>受付確認中：{freshness.pauseNoticeText}</span>
                      </div>
                    )}

                  {bundle.profile.appealMessage && (
                    <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-xs sm:text-sm font-bold text-teal-950">
                      「{bundle.profile.appealMessage}」
                    </div>
                  )}

                  {match.matchingPoints.length > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <p className="text-xs font-bold text-emerald-950">
                        利用者様の希望と合っている点：
                      </p>
                      <ul className="text-xs text-emerald-950 space-y-0.5">
                        {match.matchingPoints.slice(0, 4).map((pt, i) => (
                          <li key={i}>✓ {pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <MatchBreakdownBarGraph
                    breakdown={match.breakdown}
                    compact
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedProviderId(
                          isExpanded ? null : bundle.profile.id
                        )
                      }
                      className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      {isExpanded
                        ? '受入条件カード詳細を閉じる'
                        : '受入条件カード・支援細目をすべて見る'}
                    </button>
                    {activeUserBundle && (
                      <button
                        type="button"
                        onClick={() => {
                          startAsUserDemo(
                            activeUserBundle.profile.id,
                            'user-provider-detail'
                          );
                          openProviderDetail(bundle.profile.id);
                        }}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-sky-800 hover:bg-sky-900 text-white text-xs font-bold cursor-pointer"
                      >
                        利用者視点で事業所詳細を確認 →
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="pt-2">
                      <AcceptanceCardView
                        bundle={bundle}
                        matchingPoints={match.matchingPoints}
                        isPaidHighlighted={isPaid}
                        referenceDate={effectiveReferenceDate}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  User,
  FileEdit,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Check,
  X,
  MapPin,
  Building2,
  Bookmark,
  Plus,
  StickyNote,
  Share2,
  Copy,
  UsersRound,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  calculateMatchResult,
  compareProvidersForUserSearch,
} from '../utils/matching';
import { formatJapaneseDate } from '../utils/date';
import {
  getFavoriteInteractionsForUser,
  isProviderFavorited,
} from '../utils/favorites';
import {
  CareNeedsIconGrid,
  MatchBreakdownBarGraph,
  MatchScoreRing,
  NotificationStatusBadge,
  NotificationStatusIcon,
  UserMatchingProgressBoard,
  WeeklyDayStrip,
} from './VisualHelpers';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import {
  buildProviderCardSpeechText,
  buildUserDashboardSpeechText,
} from '../utils/speech';

export const UserDashboard: React.FC = () => {
  const {
    userProfiles,
    activeUserId,
    setActiveUserId,
    currentUserBundle,
    providerProfiles,
    getProviderBundleById,
    interactions,
    disclosures,
    chatRequests,
    coordinators,
    sharedCases,
    respondToChatRequest,
    toggleUserFavoriteProvider,
    shareUserWithCoordinator,
    startAsCoordinatorDemo,
    navigateTo,
    openProviderDetail,
    openChatWith,
    setUserWizardStep,
    openRegistrationScreen,
  } = useAppState();

  const [showFamilyShareBox, setShowFamilyShareBox] = useState(false);
  const [familyCopied, setFamilyCopied] = useState(false);
  const [showCoordShareBox, setShowCoordShareBox] = useState(false);
  const [selectedCoordId, setSelectedCoordId] = useState<string>(
    coordinators[0]?.id || ''
  );
  const [coordNote, setCoordNote] = useState('');
  const [coordSharedMsg, setCoordSharedMsg] = useState('');

  // 万一まだ利用者が0名の場合は新規登録へ案内
  if (userProfiles.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="flex justify-end">
            <HelpTooltip guideKey="user-dashboard" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            まだ利用者が登録されていません
          </h1>
          <p className="text-sm text-slate-600">
            まずは利用者として新規登録を行ってください。
          </p>
          <button
            type="button"
            onClick={() => openRegistrationScreen('user')}
            className="min-h-[48px] px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>利用者を新規登録する</span>
          </button>
        </div>
      </div>
    );
  }

  const { profile, needs, preferences } = currentUserBundle;

  const matchedProviders = providerProfiles
    .map((p) => {
      const pBundle = getProviderBundleById(p.id);
      if (!pBundle) return null;
      const result = calculateMatchResult(currentUserBundle, pBundle);
      return { provider: pBundle, result, match: result };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => compareProvidersForUserSearch(a, b, false));

  const highMatchCount = matchedProviders.filter(
    (m) => m.result.breakdown.totalScore >= 80
  ).length;
  const mediumMatchCount = matchedProviders.filter(
    (m) =>
      m.result.breakdown.totalScore >= 60 && m.result.breakdown.totalScore < 80
  ).length;
  const lowMatchCount = matchedProviders.filter(
    (m) => m.result.breakdown.totalScore < 60
  ).length;

  const incomingRequests = chatRequests.filter(
    (r) =>
      r.userId === activeUserId &&
      r.initiatedBy === 'provider' &&
      r.status === 'pending'
  );

  const approvedChatRequests = chatRequests.filter(
    (r) => r.userId === activeUserId && r.status === 'approved'
  );

  const stage3DisclosedCount = disclosures.filter(
    (d) => d.userId === activeUserId && d.stage === 3
  ).length;

  const favoriteInteractions = getFavoriteInteractionsForUser(
    interactions,
    activeUserId
  );
  const favoriteCount = favoriteInteractions.length;

  const favoriteProviders = matchedProviders
    .map((entry) => {
      const favInter = favoriteInteractions.find(
        (i) => i.providerId === entry.provider.profile.id
      );
      if (!favInter) return null;
      return {
        ...entry,
        favoriteNote: favInter.userFavoriteNote || '',
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // 進行中の事業所ステータス進捗バー一覧
  const activeProviderProgressItems = matchedProviders
    .map(({ provider, result }) => {
      const pId = provider.profile.id;
      const req = chatRequests.find(
        (r) => r.userId === activeUserId && r.providerId === pId
      );
      const disc = disclosures.find(
        (d) => d.userId === activeUserId && d.providerId === pId
      );
      const inter = interactions.find(
        (i) => i.userId === activeUserId && i.providerId === pId
      );

      if (disc?.stage === 3) {
        return {
          providerId: pId,
          providerName: provider.profile.name,
          matchScore: result.breakdown.totalScore,
          stage: 'disclosed' as const,
          stageLabel: '連絡先開示・契約調整',
          progressPct: 100,
          onAction: () => openChatWith(pId),
        };
      }
      if (req?.status === 'approved') {
        return {
          providerId: pId,
          providerName: provider.profile.name,
          matchScore: result.breakdown.totalScore,
          stage: 'chatting' as const,
          stageLabel: '匿名チャット相談中',
          progressPct: 75,
          onAction: () => openChatWith(pId),
        };
      }
      if (req?.status === 'pending') {
        return {
          providerId: pId,
          providerName: provider.profile.name,
          matchScore: result.breakdown.totalScore,
          stage: 'pending' as const,
          stageLabel: 'チャット申請・承認待ち',
          progressPct: 50,
          onAction: () => openProviderDetail(pId),
        };
      }
      if (inter?.isUserFavorite) {
        return {
          providerId: pId,
          providerName: provider.profile.name,
          matchScore: result.breakdown.totalScore,
          stage: 'favorite' as const,
          stageLabel: 'お気に入り保存済',
          progressPct: 25,
          onAction: () => openProviderDetail(pId),
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-24 space-y-5">
      {/* 1. 利用者マイページ：登録条件 ＆ マッチング進捗バー・グラフ */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-900 text-white text-xs font-bold">
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span>利用者マイページ（完全無料）</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">
              {profile.nickname} さん
            </h1>
            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              {profile.city} · {needs.desiredServices.join(' / ')} ·{' '}
              {preferences.helperGenderPreference}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {userProfiles.length > 1 && (
              <select
                aria-label="登録した利用者を切替"
                value={activeUserId}
                onChange={(e) => setActiveUserId(e.target.value)}
                className="min-h-[38px] max-w-full sm:max-w-[240px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 truncate"
              >
                {userProfiles.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nickname}（{u.city}）
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => {
                setUserWizardStep(1);
                navigateTo('user-wizard');
              }}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              <FileEdit className="w-3.5 h-3.5 text-teal-800" />
              <span>希望条件を変更</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('user-privacy')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span className="tabular-nums">開示設定({stage3DisclosedCount}社)</span>
            </button>

            <SpeechButton
              speechId="screen-user-dashboard"
              isPrimaryScreenReader
              getText={() =>
                buildUserDashboardSpeechText({
                  nickname: profile.nickname,
                  city: profile.city,
                  services: needs.desiredServices,
                  helperGenderPreference: preferences.helperGenderPreference,
                  highMatchCount,
                  totalProviders: matchedProviders.length,
                  favoriteCount,
                  pendingRequestsCount: incomingRequests.length,
                  approvedChatCount: approvedChatRequests.length,
                  disclosedCount: stage3DisclosedCount,
                })
              }
            />

            <HelpTooltip guideKey="user-dashboard" />
          </div>
        </div>

        {/* 登録している介助＆曜日（1行） */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
          <CareNeedsIconGrid items={needs.careNeeds} maxShow={5} />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-600">希望曜日:</span>
            <WeeklyDayStrip activeDays={preferences.preferredDays} />
          </div>
        </div>

        {/* マッチング進捗バー＆相性グラフコンポーネント */}
        <UserMatchingProgressBoard
          highCount={highMatchCount}
          midCount={mediumMatchCount}
          lowCount={lowMatchCount}
          favoriteCount={favoriteCount}
          pendingRequestCount={incomingRequests.length}
          approvedChatCount={approvedChatRequests.length}
          disclosedCount={stage3DisclosedCount}
          activeProviders={activeProviderProgressItems}
          onOpenFavorites={() => navigateTo('user-favorites')}
        />
      </section>

      {/* 1.5 自分の特性プロフィール＆家族・相談支援専門員への共有 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              あなたの特性プロフィール（ご家族・相談支援専門員と共有できます）
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              障害種別や配慮してほしいことをまとめておき、ご家族や担当の相談支援専門員と一緒に事業所を検討できます。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="share-family-btn"
              onClick={() => setShowFamilyShareBox(!showFamilyShareBox)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-teal-700 bg-teal-50 hover:bg-teal-100 text-teal-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>家族と共有する</span>
            </button>
            <button
              type="button"
              data-testid="share-coordinator-btn"
              onClick={() => setShowCoordShareBox(!showCoordShareBox)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <UsersRound className="w-3.5 h-3.5 text-teal-800" aria-hidden="true" />
              <span>相談支援専門員に共有する</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-500 block">障害種別</span>
            <p className="font-bold text-slate-900">
              {needs.disabilityTypes.length > 0
                ? needs.disabilityTypes.join('・')
                : '未選択'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-500 block">
              コミュニケーションの方法
            </span>
            <p className="font-medium text-slate-800">
              {needs.communicationConsiderations.length > 0
                ? needs.communicationConsiderations.join('・')
                : '未設定'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-500">
                苦手なこと・配慮してほしいこと
              </span>
              <button
                type="button"
                onClick={() => {
                  setUserWizardStep(3);
                  navigateTo('user-wizard');
                }}
                className="text-[11px] font-bold text-teal-800 underline cursor-pointer"
              >
                編集
              </button>
            </div>
            <p className="font-medium text-slate-800">
              {needs.dislikesAndAccommodations ||
                needs.communicationFreeText ||
                'まだ記入されていません'}
            </p>
          </div>
        </div>

        {/* 家族共有モーダル／パネル */}
        {showFamilyShareBox && (
          <div
            data-testid="family-share-panel"
            className="p-4 rounded-xl bg-teal-50/70 border border-teal-300 space-y-2.5 text-xs"
          >
            <p className="font-bold text-teal-950">
              ご家族と検討するための共有用リンク（氏名・電話番号は含まれません）
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                aria-label="家族共有リンク"
                value={`${
                  typeof window !== 'undefined' ? window.location.origin : ''
                }/?familyShare=${profile.familyShareToken || profile.id}`}
                className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-teal-200 bg-white font-mono text-slate-800"
              />
              <button
                type="button"
                data-testid="copy-family-share-btn"
                onClick={() => {
                  const url = `${
                    typeof window !== 'undefined' ? window.location.origin : ''
                  }/?familyShare=${profile.familyShareToken || profile.id}`;
                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(url).catch(() => {});
                  }
                  setFamilyCopied(true);
                  setTimeout(() => setFamilyCopied(false), 3000);
                }}
                className="min-h-[38px] px-4 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {familyCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>コピーしました</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>リンクをコピー</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 相談支援専門員への共有パネル */}
        {showCoordShareBox && (
          <div
            data-testid="coordinator-share-panel"
            className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-slate-900">
                相談支援専門員に希望条件と特性プロフィールを共有する
              </p>
              {coordinators.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    startAsCoordinatorDemo(selectedCoordId || coordinators[0].id)
                  }
                  className="text-xs font-bold text-teal-800 underline cursor-pointer"
                >
                  相談支援専門員画面で確認する →
                </button>
              )}
            </div>

            {coordinators.length === 0 ? (
              <p className="text-slate-600">
                現在登録されている相談支援専門員がいません。トップ画面から無料で簡易登録できます。
              </p>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="coord-select"
                      className="block font-bold text-slate-700 mb-1"
                    >
                      共有先の相談支援専門員
                    </label>
                    <select
                      id="coord-select"
                      value={selectedCoordId || coordinators[0]?.id || ''}
                      onChange={(e) => setSelectedCoordId(e.target.value)}
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                    >
                      {coordinators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.officeName} / {c.name}（{c.area}）
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="coord-note"
                      className="block font-bold text-slate-700 mb-1"
                    >
                      専門員への相談メモ（任意）
                    </label>
                    <input
                      id="coord-note"
                      type="text"
                      value={coordNote}
                      onChange={(e) => setCoordNote(e.target.value)}
                      placeholder="例：土曜に外出支援ができる事業所を一緒に探したいです"
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="confirm-share-coordinator-btn"
                    onClick={() => {
                      const targetCoordId =
                        selectedCoordId || coordinators[0].id;
                      shareUserWithCoordinator(
                        activeUserId,
                        targetCoordId,
                        coordNote
                      );
                      const target = coordinators.find(
                        (c) => c.id === targetCoordId
                      );
                      setCoordSharedMsg(
                        `${target?.officeName || ''}（${
                          target?.name || ''
                        }）に共有しました。`
                      );
                    }}
                    className="min-h-[38px] px-4 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer"
                  >
                    この内容で相談支援専門員に共有する
                  </button>
                  {coordSharedMsg && (
                    <span className="text-emerald-800 font-bold">
                      {coordSharedMsg}
                    </span>
                  )}
                </div>
              </div>
            )}

            {sharedCases.some((sc) => sc.userId === activeUserId) && (
              <p className="text-[11px] text-slate-600 pt-1">
                現在共有中の相談支援専門員：
                {sharedCases
                  .filter((sc) => sc.userId === activeUserId)
                  .map((sc) => {
                    const c = coordinators.find(
                      (item) => item.id === sc.coordinatorId
                    );
                    return c ? `${c.officeName}（${c.name}）` : sc.coordinatorId;
                  })
                  .join('・')}
              </p>
            )}
          </div>
        )}
      </section>

      {/* 2. 事業所から届いたチャット申請（承認待ちがある場合のみ表示） */}
      {incomingRequests.length > 0 && (
        <section className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <NotificationStatusBadge
              status="pending"
              customLabel="承認待ち"
              size="sm"
            />
            <h2 className="text-base font-bold text-slate-900 tabular-nums">
              事業所からチャット相談の申請が届いています（{incomingRequests.length}件）
            </h2>
          </div>

          <div className="space-y-2">
            {incomingRequests.map((req) => {
              const prov = providerProfiles.find(
                (p) => p.id === req.providerId
              );
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl p-3.5 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <NotificationStatusIcon
                      status="pending"
                      className="w-9 h-9 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {prov?.name || '事業所'} からのチャット申請
                      </p>
                      <p className="text-xs text-slate-600 truncate">
                        「{req.initialMessage}」
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        respondToChatRequest(req.id, 'approved');
                        openChatWith(req.providerId);
                      }}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>承認してチャット開始</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => respondToChatRequest(req.id, 'declined')}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <X className="w-4 h-4" />
                      <span>見送る</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. お気に入り登録済みの事業所（登録がある場合） */}
      {favoriteProviders.length > 0 && (
        <section
          data-testid="dashboard-favorites-section"
          className="bg-white border border-amber-200 rounded-2xl p-5 space-y-3.5 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <Bookmark className="w-4 h-4 fill-amber-500 text-amber-600" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tabular-nums">
                  お気に入り登録済みの事業所（{favoriteProviders.length}社）
                </h2>
                <p className="text-xs text-slate-500">
                  検討中の事業所をすぐ比較・連絡できます
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <HelpTooltip
                guideKey="user-favorites-memo"
                compact
                label="お気に入りメモの使い方"
              />
              <button
                type="button"
                onClick={() => navigateTo('user-favorites')}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
              >
                <span>お気に入り管理・メモ編集</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {favoriteProviders.map(({ provider, result, favoriteNote }) => (
              <div
                key={provider.profile.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-teal-800 block truncate">
                      {provider.profile.locationCity} · {provider.profile.serviceTypes.join(' / ')}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                      {provider.profile.name}
                    </h3>
                    {favoriteNote && (
                      <p className="mt-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 flex items-center gap-1.5 truncate">
                        <StickyNote className="w-3 h-3 text-amber-600 shrink-0" aria-hidden="true" />
                        <span className="truncate">{favoriteNote}</span>
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-teal-900 tabular-nums shrink-0">
                    相性 {result.breakdown.totalScore}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      toggleUserFavoriteProvider(activeUserId, provider.profile.id)
                    }
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    解除
                  </button>
                  <button
                    type="button"
                    onClick={() => openChatWith(provider.profile.id)}
                    className="flex-1 min-h-[34px] px-3 py-1 rounded-lg bg-white hover:bg-teal-50 border border-teal-700 text-teal-900 text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>チャット</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openProviderDetail(provider.profile.id)}
                    className="flex-1 min-h-[34px] px-3 py-1 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span>詳細</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. 登録されている事業所との相性一覧（0社なら事業所登録ボタンを表示） */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
              登録されている事業所との相性一覧（{matchedProviders.length}社）
            </h2>
            <p className="text-xs text-slate-600">
              あなたの希望条件と事業所の受入条件から相性％を自動計算しています。気になる事業所はお気に入りに登録できます。
            </p>
          </div>
          {matchedProviders.length > 0 && (
            <button
              type="button"
              onClick={() => openRegistrationScreen('provider')}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>別の事業所を追加登録</span>
            </button>
          )}
        </div>

        {matchedProviders.length === 0 ? (
          <div className="p-6 rounded-2xl bg-indigo-50/40 border border-dashed border-indigo-300 text-center space-y-3">
            <p className="text-base font-bold text-slate-900">
              まだ事業所が登録されていません（現在 0社）
            </p>
            <p className="text-xs text-slate-600">
              マッチングや相性グラフをテストするには、続けて「事業所」を1社新規登録してみてください。
            </p>
            <button
              type="button"
              onClick={() => openRegistrationScreen('provider')}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Building2 className="w-4 h-4" />
              <span>テスト用の事業所を新規登録する</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedProviders.map(({ provider, result }) => {
              const isFav = isProviderFavorited(
                interactions,
                activeUserId,
                provider.profile.id
              );
              const updatedAt =
                provider.profile.updatedAt || provider.availability.updatedAt;

              return (
                <div
                  key={provider.profile.id}
                  className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-slate-50/50"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-teal-800 block">
                          {provider.profile.locationCity} ·{' '}
                          {provider.profile.serviceTypes.join('/')}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 truncate mt-0.5">
                          {provider.profile.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-600">
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
                            最終更新：{formatJapaneseDate(updatedAt)}
                          </span>
                          {result.isStaleProvider && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-950 font-bold">
                              <AlertTriangle className="w-3 h-3 text-amber-700" aria-hidden="true" />
                              情報が古い可能性
                            </span>
                          )}
                        </div>
                      </div>
                      <MatchScoreRing
                        score={result.breakdown.totalScore}
                        judgment={result.judgment}
                        size="sm"
                      />
                    </div>

                    {provider.profile.appealMessage && (
                      <p className="text-xs text-teal-950 bg-teal-50/70 border border-teal-200 rounded-lg px-2.5 py-1.5 font-medium">
                        「{provider.profile.appealMessage}」
                      </p>
                    )}

                    <CareNeedsIconGrid
                      items={needs.careNeeds}
                      supportedItems={provider.capabilities.supportedCareItems}
                      maxShow={4}
                    />

                    <MatchBreakdownBarGraph
                      breakdown={result.breakdown}
                      compact={true}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <SpeechButton
                      compact
                      speechId={`dash-card-${provider.profile.id}`}
                      label="読み上げ"
                      getText={() =>
                        buildProviderCardSpeechText({
                          name: provider.profile.name,
                          score: result.breakdown.totalScore,
                          judgment: result.judgment,
                          locationCity: provider.profile.locationCity,
                          coverageAreas: provider.profile.coverageAreas,
                          services: provider.profile.serviceTypes,
                          acceptanceStatus: provider.availability.acceptanceStatus,
                          availableDays: provider.availability.weeklySchedule
                            .filter((d) => d.available)
                            .map((d) => d.day),
                          isFavorite: isFav,
                          summaryText: result.summaryText,
                        })
                      }
                    />

                    <button
                      type="button"
                      data-testid={`dash-fav-btn-${provider.profile.id}`}
                      aria-pressed={isFav}
                      onClick={() =>
                        toggleUserFavoriteProvider(
                          activeUserId,
                          provider.profile.id
                        )
                      }
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                        isFav
                          ? 'bg-amber-50 border-amber-400 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${
                          isFav ? 'fill-amber-500 text-amber-600' : ''
                        }`}
                        aria-hidden="true"
                      />
                      <span>{isFav ? 'お気に入り済' : 'お気に入り'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openChatWith(provider.profile.id)}
                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-teal-700 text-teal-900 bg-white hover:bg-teal-50 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>チャット相談</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openProviderDetail(provider.profile.id)}
                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <span>詳細を見る</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
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

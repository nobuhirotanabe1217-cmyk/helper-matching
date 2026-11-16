import React, { useState } from 'react';
import {
  User,
  Bookmark,
  MessageSquare,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  FileEdit,
  MapPin,
  Users,
  Calendar,
  Lightbulb,
  Check,
  Plus,
  StickyNote,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  AREA_OPTIONS,
  CareNeedItem,
  DayOfWeek,
  DAYS_OF_WEEK,
  PROVIDER_CARE_LABELS,
  SERVICE_TYPES,
  ServiceType,
  TIME_SLOTS,
  TimeSlot,
} from '../types/domain';
import { calculateMatchResult } from '../utils/matching';
import { countUserFavorites } from '../utils/favorites';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import {
  buildProviderCardSpeechText,
  buildUserSearchSpeechText,
} from '../utils/speech';
import {
  CareNeedsIconGrid,
  MatchBreakdownBarGraph,
  MatchScoreRing,
  ServiceIllustration,
  WeeklyDayStrip,
} from './VisualHelpers';

interface UserSearchProvidersProps {
  favoritesOnly?: boolean;
}

const KEY_CARE_FILTERS: CareNeedItem[] = [
  '車いすの操作・介助',
  '移乗の介助',
  '入浴の介助',
  '排泄の介助',
  '外出時の付き添い',
  '通院時の付き添い',
  '家事援助',
];

export const UserSearchProviders: React.FC<UserSearchProvidersProps> = ({
  favoritesOnly = false,
}) => {
  const {
    activeUserId,
    currentUserBundle,
    providerProfiles,
    getProviderBundleById,
    interactions,
    toggleUserFavoriteProvider,
    updateUserFavoriteNote,
    openProviderDetail,
    openChatWith,
    navigateTo,
    setUserWizardStep,
    openRegistrationScreen,
  } = useAppState();

  const [filterService, setFilterService] = useState<ServiceType | 'all'>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<DayOfWeek | 'all'>('all');
  const [filterTimeSlot, setFilterTimeSlot] = useState<TimeSlot | 'all'>('all');
  const [filterGender, setFilterGender] = useState<'all' | '女性' | '男性'>('all');
  const [filterCareItem, setFilterCareItem] = useState<CareNeedItem | 'all'>('all');
  const [onlyConsultable, setOnlyConsultable] = useState<boolean>(true);
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savedNoteIds, setSavedNoteIds] = useState<Record<string, boolean>>({});

  const userFavoriteCount = countUserFavorites(interactions, activeUserId);

  const resetFilters = () => {
    setFilterService('all');
    setFilterArea('all');
    setFilterDay('all');
    setFilterTimeSlot('all');
    setFilterGender('all');
    setFilterCareItem('all');
    setOnlyConsultable(true);
  };

  const handleSaveNote = (providerId: string, currentSavedNote: string) => {
    const draft = noteDrafts[providerId] ?? currentSavedNote;
    updateUserFavoriteNote(activeUserId, providerId, draft);
    setSavedNoteIds((prev) => ({ ...prev, [providerId]: true }));
    setTimeout(() => {
      setSavedNoteIds((prev) => ({ ...prev, [providerId]: false }));
    }, 2500);
  };

  const evaluatedProviders = providerProfiles
    .map((p) => {
      const bundle = getProviderBundleById(p.id);
      if (!bundle) return null;
      const match = calculateMatchResult(currentUserBundle, bundle);
      const interaction = interactions.find(
        (i) => i.userId === activeUserId && i.providerId === p.id
      );
      return {
        bundle,
        match,
        isFavorite: Boolean(interaction?.isUserFavorite),
        favoriteNote: interaction?.userFavoriteNote || '',
        providerReaction: interaction?.providerReaction || '未対応',
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((item) => {
      if (favoritesOnly) {
        return item.isFavorite;
      }
      if (filterService !== 'all') {
        if (!item.bundle.profile.serviceTypes.includes(filterService)) {
          return false;
        }
      }
      if (filterArea !== 'all') {
        if (
          !item.bundle.profile.coverageAreas.includes(filterArea) &&
          item.bundle.profile.locationCity !== filterArea
        ) {
          return false;
        }
      }
      if (filterDay !== 'all') {
        const dayObj = item.bundle.availability.weeklySchedule.find(
          (d) => d.day === filterDay
        );
        if (!dayObj || !dayObj.available) return false;
        if (
          filterTimeSlot !== 'all' &&
          !dayObj.timeSlots.includes(filterTimeSlot)
        ) {
          return false;
        }
      } else if (filterTimeSlot !== 'all') {
        const hasSlot = item.bundle.availability.weeklySchedule.some(
          (d) => d.available && d.timeSlots.includes(filterTimeSlot)
        );
        if (!hasSlot) return false;
      }
      if (filterGender !== 'all') {
        if (
          !item.bundle.capabilities.availableHelperGenders.includes(filterGender)
        ) {
          return false;
        }
      }
      if (filterCareItem !== 'all') {
        if (
          !item.bundle.capabilities.supportedCareItems.includes(filterCareItem)
        ) {
          return false;
        }
      }
      if (onlyConsultable) {
        if (
          item.bundle.availability.acceptanceStatus === '現在は受け入れ困難'
        ) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-24 space-y-5">
      {/* ヘッダー＆自分の条件コンパクト表示 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3.5">
          <div className="space-y-1.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-900 text-white text-xs font-bold">
              {favoritesOnly ? (
                <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <User className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>
                {favoritesOnly
                  ? 'お気に入り事業所一覧'
                  : 'ご利用者・ご家族向け検索'}
              </span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {favoritesOnly
                ? 'お気に入り登録した事業所'
                : '相性の良い事業所一覧（比較グラフ）'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {currentUserBundle.profile.nickname ||
                currentUserBundle.profile.anonymousCode}
              さんの希望（{currentUserBundle.profile.city} ·{' '}
              {currentUserBundle.needs.desiredServices.join(' / ')}）で自動計算しています
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* クイック切替セグメント */}
            <div
              role="group"
              aria-label="表示切替"
              className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200"
            >
              <button
                type="button"
                data-testid="search-tab-all"
                onClick={() => navigateTo('user-search')}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap tabular-nums transition-colors ${
                  !favoritesOnly
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                すべて ({providerProfiles.length})
              </button>
              <button
                type="button"
                data-testid="search-tab-favorites"
                onClick={() => navigateTo('user-favorites')}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap tabular-nums transition-colors ${
                  favoritesOnly
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${
                    favoritesOnly ? 'fill-amber-500 text-amber-600' : ''
                  }`}
                  aria-hidden="true"
                />
                <span>お気に入りのみ ({userFavoriteCount})</span>
              </button>
            </div>

            {!favoritesOnly && (
              <button
                type="button"
                onClick={() => {
                  setUserWizardStep(1);
                  navigateTo('user-wizard');
                }}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <FileEdit className="w-4 h-4 text-teal-800" aria-hidden="true" />
                <span>希望条件を変更</span>
              </button>
            )}

            <SpeechButton
              speechId={favoritesOnly ? 'screen-user-favorites' : 'screen-user-search'}
              isPrimaryScreenReader
              getText={() =>
                buildUserSearchSpeechText({
                  favoritesOnly,
                  nickname:
                    currentUserBundle.profile.nickname ||
                    currentUserBundle.profile.anonymousCode,
                  city: currentUserBundle.profile.city,
                  resultCount: evaluatedProviders.length,
                  topProvider: evaluatedProviders[0]
                    ? {
                        name: evaluatedProviders[0].bundle.profile.name,
                        score: evaluatedProviders[0].match.breakdown.totalScore,
                        judgment: evaluatedProviders[0].match.judgment,
                      }
                    : undefined,
                })
              }
            />

            <HelpTooltip
              guideKey={favoritesOnly ? 'user-favorites' : 'user-search'}
            />
          </div>
        </div>

        {/* 現在の希望介助アイコンバー */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500 block">
              あなたの希望介助・曜日：
            </span>
            <CareNeedsIconGrid items={currentUserBundle.needs.careNeeds} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <WeeklyDayStrip
              activeDays={currentUserBundle.preferences.preferredDays}
            />
          </div>
        </div>

        {/* 絞り込み検索パネル */}
        {!favoritesOnly && (
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              aria-expanded={showFilterPanel}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              <span>
                条件で絞り込む{showFilterPanel ? '（閉じる）' : '（開く）'}
              </span>
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>リセット</span>
            </button>
          </div>
        )}

        {showFilterPanel && !favoritesOnly && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label
                htmlFor="filter-service"
                className="block text-xs font-bold text-slate-700"
              >
                サービス種別
              </label>
              <select
                id="filter-service"
                value={filterService}
                onChange={(e) =>
                  setFilterService(e.target.value as ServiceType | 'all')
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900"
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
                htmlFor="filter-area"
                className="block text-xs font-bold text-slate-700"
              >
                対応地域
              </label>
              <select
                id="filter-area"
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900"
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
                htmlFor="filter-day"
                className="block text-xs font-bold text-slate-700"
              >
                曜日
              </label>
              <select
                id="filter-day"
                value={filterDay}
                onChange={(e) =>
                  setFilterDay(e.target.value as DayOfWeek | 'all')
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900"
              >
                <option value="all">すべての曜日</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}曜日
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="filter-timeslot"
                className="block text-xs font-bold text-slate-700"
              >
                時間帯
              </label>
              <select
                id="filter-timeslot"
                value={filterTimeSlot}
                onChange={(e) =>
                  setFilterTimeSlot(e.target.value as TimeSlot | 'all')
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900"
              >
                <option value="all">すべての時間帯</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="filter-gender"
                className="block text-xs font-bold text-slate-700"
              >
                ヘルパー性別
              </label>
              <select
                id="filter-gender"
                value={filterGender}
                onChange={(e) =>
                  setFilterGender(e.target.value as 'all' | '女性' | '男性')
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900"
              >
                <option value="all">指定なし</option>
                <option value="女性">女性ヘルパー在籍</option>
                <option value="男性">男性ヘルパー在籍</option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="filter-care"
                className="block text-xs font-bold text-slate-700"
              >
                介助項目
              </label>
              <select
                id="filter-care"
                value={filterCareItem}
                onChange={(e) =>
                  setFilterCareItem(e.target.value as CareNeedItem | 'all')
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900"
              >
                <option value="all">すべての介助内容</option>
                {KEY_CARE_FILTERS.map((c) => (
                  <option key={c} value={c}>
                    {PROVIDER_CARE_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={onlyConsultable}
                  onChange={(e) => setOnlyConsultable(e.target.checked)}
                  className="w-4 h-4 accent-teal-800 rounded"
                />
                <span>現在相談可能な事業所のみ表示する</span>
              </label>
            </div>
          </div>
        )}
      </section>

      {/* 事業所カード一覧 */}
      {providerProfiles.length === 0 ? (
        <div className="bg-white border border-dashed border-indigo-300 rounded-2xl p-8 text-center space-y-4">
          <p className="text-lg font-bold text-slate-900">
            まだ事業所が登録されていません（0社）
          </p>
          <p className="text-xs sm:text-sm text-slate-600">
            マッチングをテストするには、続けてテスト用の「事業所」を新規登録してください。
          </p>
          <button
            type="button"
            onClick={() => openRegistrationScreen('provider')}
            className="min-h-[48px] px-6 py-3 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>事業所を新規登録してテストする</span>
          </button>
        </div>
      ) : favoritesOnly && evaluatedProviders.length === 0 ? (
        <div
          data-testid="favorites-empty-state"
          className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-2xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-slate-900">
              お気に入り登録された事業所はまだありません
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              事業所一覧で「お気に入り」を押すと、ここに保存して個人メモ付きで比較できます。
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('user-search')}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <span>事業所一覧から探す</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ) : evaluatedProviders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
          <p className="text-lg font-bold text-slate-900">
            条件に該当する事業所が見つかりませんでした
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-teal-800 text-white font-bold text-sm cursor-pointer"
          >
            絞り込み条件をリセットする
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluatedProviders.map(
            ({ bundle, match, isFavorite, favoriteNote, providerReaction }) => {
              const { profile, capabilities, availability } = bundle;
              const availableDays = availability.weeklySchedule
                .filter((d) => d.available)
                .map((d) => d.day);
              const draftValue =
                noteDrafts[profile.id] !== undefined
                  ? noteDrafts[profile.id]
                  : favoriteNote;
              const isJustSaved = Boolean(savedNoteIds[profile.id]);

              return (
                <article
                  key={profile.id}
                  data-testid={`provider-card-${profile.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs"
                >
                  {/* 上段：サービスアイコン＋事業所名＋円形相性リング */}
                  <div className="flex items-start justify-between gap-2.5 sm:gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <ServiceIllustration
                        service={profile.serviceTypes[0] || '居宅介護'}
                        className="w-10 h-10 sm:w-14 sm:h-14 shrink-0"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-600">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 font-bold text-teal-800 leading-snug">
                            {availability.acceptanceStatus}
                          </span>
                          <span className="font-medium text-slate-600">
                            {profile.serviceTypes.join(' / ')}
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                          {profile.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {profile.coverageAreas.join('・')}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {capabilities.helperGenderPolicy}
                          </span>
                        </div>
                      </div>
                    </div>

                    <MatchScoreRing
                      score={match.breakdown.totalScore}
                      judgment={match.judgment}
                      size="md"
                    />
                  </div>

                  {/* 中段：視覚的なアイコン照合（希望介助＆対応曜日カレンダー） */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                    <div className="md:col-span-7 space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 block">
                        あなたの希望介助への対応（✓＝対応可）：
                      </span>
                      <CareNeedsIconGrid
                        items={currentUserBundle.needs.careNeeds}
                        supportedItems={capabilities.supportedCareItems}
                      />
                    </div>

                    <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-1.5">
                      <span className="text-xs font-bold text-slate-500 inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        空き曜日（濃い色＝あなたの希望日と一致）
                      </span>
                      <WeeklyDayStrip
                        activeDays={availableDays}
                        highlightDays={
                          currentUserBundle.preferences.preferredDays
                        }
                      />
                    </div>
                  </div>

                  {/* 5項目別◎○△×バーグラフ */}
                  <MatchBreakdownBarGraph breakdown={match.breakdown} />

                  {/* 1行ポイント説明 */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{match.summaryText}</span>
                  </p>

                  {providerReaction !== '未対応' && (
                    <p className="text-xs sm:text-sm font-bold text-teal-900 bg-teal-50/80 border border-teal-200 rounded-xl px-3 py-2">
                      事業所からのアプローチ：「{providerReaction}」
                    </p>
                  )}

                  {/* お気に入り個人メモ（お気に入り登録中のみ表示） */}
                  {isFavorite && (
                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                      <label
                        htmlFor={`fav-note-${profile.id}`}
                        className="text-xs font-bold text-amber-950 flex items-center gap-1.5"
                      >
                        <StickyNote className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                        <span>お気に入りメモ（個人用・事業所には非公開）</span>
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          id={`fav-note-${profile.id}`}
                          data-testid={`fav-note-input-${profile.id}`}
                          type="text"
                          value={draftValue}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({
                              ...prev,
                              [profile.id]: e.target.value,
                            }))
                          }
                          placeholder="例：水曜午前に空きあり、面談候補として比較中"
                          className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          data-testid={`fav-note-save-${profile.id}`}
                          onClick={() => handleSaveNote(profile.id, favoriteNote)}
                          className="min-h-[38px] px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                        >
                          {isJustSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>保存しました</span>
                            </>
                          ) : (
                            <span>メモを保存</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 下段：アクションボタン */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <SpeechButton
                        compact
                        speechId={`search-card-${profile.id}`}
                        label="この事業所を読み上げ"
                        getText={() =>
                          buildProviderCardSpeechText({
                            name: profile.name,
                            score: match.breakdown.totalScore,
                            judgment: match.judgment,
                            locationCity: profile.locationCity,
                            coverageAreas: profile.coverageAreas,
                            services: profile.serviceTypes,
                            acceptanceStatus: availability.acceptanceStatus,
                            availableDays,
                            isFavorite,
                            favoriteNote,
                            summaryText: match.summaryText,
                          })
                        }
                      />

                      <button
                        type="button"
                        data-testid={`search-fav-btn-${profile.id}`}
                        onClick={() =>
                          toggleUserFavoriteProvider(activeUserId, profile.id)
                        }
                        aria-pressed={isFavorite}
                        className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                          isFavorite
                            ? 'bg-amber-50 border-amber-400 text-amber-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${
                            isFavorite ? 'fill-amber-500 text-amber-600' : ''
                          }`}
                          aria-hidden="true"
                        />
                        <span>{isFavorite ? 'お気に入り済' : 'お気に入り'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                      <button
                        type="button"
                        onClick={() => openChatWith(profile.id)}
                        className="min-h-[44px] px-4 py-2 rounded-xl border border-teal-700 text-teal-900 bg-white hover:bg-teal-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <MessageSquare className="w-4 h-4" aria-hidden="true" />
                        <span>チャット相談</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openProviderDetail(profile.id)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
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
      )}
    </div>
  );
};

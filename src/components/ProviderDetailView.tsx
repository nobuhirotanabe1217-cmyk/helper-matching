import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  Bookmark,
  ShieldCheck,
  Check,
  AlertTriangle,
  StickyNote,
  BadgeCheck,
  Clock,
  Lock,
  PauseCircle,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { calculateMatchResult } from '../utils/matching';
import { formatJapaneseDate } from '../utils/date';
import {
  getProviderDiscrepancySummary,
  getProviderFreshnessInfo,
  getProviderInterviewTrustBadge,
} from '../utils/freshness';
import { isPaidPlanActive } from '../utils/subscription';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import { buildProviderDetailSpeechText } from '../utils/speech';
import { AcceptanceCardView } from './AcceptanceCardView';
import {
  ProviderFreshnessBadge,
  ProviderInterviewTrustBadge,
  ProviderReportWarningBadge,
} from './FreshnessBadges';

export const ProviderDetailView: React.FC = () => {
  const {
    activeUserId,
    currentUserBundle,
    userPIIList,
    selectedProviderIdForDetail,
    getProviderBundleById,
    getProviderSubscription,
    subscriptionPlans,
    interactions,
    disclosures,
    providerReports,
    confirmedInterviews,
    effectiveReferenceDate,
    toggleUserFavoriteProvider,
    updateUserFavoriteNote,
    openChatWith,
    navigateTo,
    getDisclosureStage,
    grantStage2Disclosure,
    grantStage3Disclosure,
    revokeDisclosureToStage,
    revokeStage3Disclosure,
  } = useAppState();

  const providerId = selectedProviderIdForDetail || 'prov-001';
  const providerBundle = getProviderBundleById(providerId);

  const interaction = interactions.find(
    (i) => i.userId === activeUserId && i.providerId === providerId
  );
  const savedFavoriteNote = interaction?.userFavoriteNote || '';

  const [showStage3Confirm, setShowStage3Confirm] = useState<boolean>(false);
  const [disclosureFeedback, setDisclosureFeedback] = useState<string>('');
  const [disclosureError, setDisclosureError] = useState<string>('');
  const [noteDraft, setNoteDraft] = useState<string>(savedFavoriteNote);
  const [noteSaved, setNoteSaved] = useState<boolean>(false);

  useEffect(() => {
    setNoteDraft(savedFavoriteNote);
  }, [providerId, savedFavoriteNote]);

  if (!providerBundle) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p>事業所情報が見つかりませんでした。</p>
        <button
          type="button"
          onClick={() => navigateTo('user-search')}
          className="mt-4 min-h-[48px] px-4 py-2 rounded-xl bg-teal-800 text-white font-bold cursor-pointer"
        >
          一覧へ戻る
        </button>
      </div>
    );
  }

  const { profile, availability } = providerBundle;
  const match = calculateMatchResult(
    currentUserBundle,
    providerBundle,
    effectiveReferenceDate
  );
  const subscription = getProviderSubscription(providerId);
  const isPaid = isPaidPlanActive(subscription, subscriptionPlans);
  const isFavorite = Boolean(interaction?.isUserFavorite);
  const disclosure = getDisclosureStage(activeUserId, providerId);
  const userPii = userPIIList.find((p) => p.userId === activeUserId);
  const updatedAt = profile.updatedAt || availability.updatedAt;
  const freshness = getProviderFreshnessInfo(updatedAt, effectiveReferenceDate);
  const discrepancy = getProviderDiscrepancySummary(providerId, providerReports);
  const interviewTrust = getProviderInterviewTrustBadge(
    providerId,
    confirmedInterviews,
    disclosures
  );
  const hasDesignatedNumber = /^\d{10}$/.test(
    (profile.designatedNumber || '').replace(/[-\s]/g, '')
  );

  const handleGrantStage2 = () => {
    grantStage2Disclosure(activeUserId, providerId);
    setDisclosureError('');
    setDisclosureFeedback(
      `「${profile.name}」への第2段階「条件の開示」（障害種別・特性プロフィール・介助内容・希望曜日）を行いました。`
    );
  };

  const handleConfirmStage3Disclosure = () => {
    const res = grantStage3Disclosure(activeUserId, providerId, true);
    if (!res.ok) {
      setDisclosureError(
        res.message ||
          '氏名・電話番号・メールアドレスは面談または見学の日程決定後に開示できます。'
      );
      setShowStage3Confirm(false);
      return;
    }
    setShowStage3Confirm(false);
    setDisclosureError('');
    setDisclosureFeedback(
      `「${profile.name}」への第3段階「連絡先の開示」（氏名・電話番号・メールアドレス）に同意しました。`
    );
  };

  const handleSaveMemo = () => {
    updateUserFavoriteNote(activeUserId, profile.id, noteDraft);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* 戻るボタン */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigateTo('user-search')}
          className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200/70 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          事業所一覧へ戻る
        </button>
        <div className="flex items-center gap-2">
          <SpeechButton
            speechId={`detail-${profile.id}`}
            isPrimaryScreenReader
            getText={() =>
              buildProviderDetailSpeechText({
                name: profile.name,
                locationCity: profile.locationCity,
                acceptanceStatus: availability.acceptanceStatus,
                services: profile.serviceTypes,
                score: match.breakdown.totalScore,
                judgment: match.judgment,
                introduction: profile.introduction,
                messageFromProvider: profile.messageFromProvider,
                availableDays: availability.weeklySchedule
                  .filter((d) => d.available)
                  .map((d) => d.day),
                disclosureStage: disclosure.stage,
                isFavorite,
              })
            }
          />
          <HelpTooltip guideKey="user-provider-detail" />
        </div>
      </div>

      {/* 事業所基本ヘッダー */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <ProviderFreshnessBadge info={freshness} />
              <ProviderReportWarningBadge summary={discrepancy} />
              <ProviderInterviewTrustBadge info={interviewTrust} />
              {hasDesignatedNumber && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-950 font-bold tabular-nums">
                  <BadgeCheck className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                  <span>事業所番号登録済み（{profile.designatedNumber}）</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-bold tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>最終更新日：{formatJapaneseDate(updatedAt)}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {profile.name}
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-700">
              所在地域：{profile.locationCity} · 受入方針：{availability.acceptanceStatus}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-right shrink-0">
            <span className="block text-xs font-bold text-slate-600">
              {match.judgment}
            </span>
            <span className="block text-2xl font-bold font-mono tabular-nums text-teal-900">
              適合度 {match.breakdown.totalScore}%
            </span>
          </div>
        </div>

        {freshness.isAutoPaused && freshness.pauseNoticeText && (
          <div
            data-testid="detail-paused-banner"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs sm:text-sm font-extrabold flex items-center gap-2"
          >
            <PauseCircle className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />
            <span>受付確認中：{freshness.pauseNoticeText}</span>
          </div>
        )}

        <p className="text-base text-slate-800 leading-relaxed">
          {profile.introduction}
        </p>

        {/* 事業所からのメッセージ */}
        <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-1">
          <p className="text-sm font-bold text-teal-950">
            事業所からのご案内（担当：{profile.contactPersonName}）
          </p>
          <p className="text-base text-slate-800 leading-relaxed">
            {profile.messageFromProvider}
          </p>
        </div>

        {/* 主要アクションボタン */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            type="button"
            disabled={freshness.isAutoPaused}
            onClick={() => openChatWith(profile.id)}
            className={`flex-1 min-h-[50px] px-6 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xs ${
              freshness.isAutoPaused
                ? 'bg-slate-200 border border-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-teal-800 hover:bg-teal-900 text-white cursor-pointer'
            }`}
          >
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
            <span>
              {freshness.isAutoPaused
                ? '受付確認中（再開まで停止）'
                : '匿名チャットで相談する'}
            </span>
          </button>

          <button
            type="button"
            data-testid="detail-fav-btn"
            onClick={() => toggleUserFavoriteProvider(activeUserId, profile.id)}
            aria-pressed={isFavorite}
            className={`min-h-[50px] px-5 py-3 rounded-xl border font-bold text-base flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-colors ${
              isFavorite
                ? 'bg-amber-50 border-amber-400 text-amber-950'
                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Bookmark
              className={`w-5 h-5 ${
                isFavorite ? 'fill-amber-500 text-amber-600' : ''
              }`}
              aria-hidden="true"
            />
            <span>{isFavorite ? 'お気に入り登録済み' : 'お気に入り登録'}</span>
          </button>
        </div>

        {/* お気に入り登録時の個人用メモ */}
        {isFavorite && (
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
            <label
              htmlFor="detail-fav-note-input"
              className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5"
            >
              <StickyNote className="w-4 h-4 text-amber-700" aria-hidden="true" />
              <span>お気に入りメモ（個人用・事業所には非公開）</span>
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                id="detail-fav-note-input"
                data-testid="detail-fav-note-input"
                type="text"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="例：通院付き添いの相談候補・比較メモ"
                className="flex-1 min-h-[40px] px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                data-testid="detail-fav-note-save"
                onClick={handleSaveMemo}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {noteSaved ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>保存しました</span>
                  </>
                ) : (
                  <span>メモを保存</span>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 受入可能条件カード（全7項目＆希望との一致ポイント） */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900 px-1">
          事業所の受入可能条件カード
        </h2>
        <AcceptanceCardView
          bundle={providerBundle}
          matchingPoints={match.matchingPoints}
          isPaidHighlighted={isPaid}
          hideHeaderMeta={true}
          referenceDate={effectiveReferenceDate}
        />
        {availability.acceptableConditionsNote && (
          <p className="text-xs sm:text-sm text-slate-600 px-1">
            受入条件補足メモ：{availability.acceptableConditionsNote}
          </p>
        )}
      </section>

      {/* 適合度（100点満点）の詳細内訳 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              あなたの希望条件との適合度（100点満点の内訳）
            </h2>
            <p className="text-sm text-slate-600">{match.summaryText}</p>
          </div>
          <HelpTooltip
            guideKey="matching-score-chart"
            compact
            label="相性スコアの見方"
          />
        </div>

        {match.criticalWarnings.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
            <p className="font-bold text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-800" />
              事前に確認が必要な重要項目
            </p>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              {match.criticalWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-sm sm:text-base">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="py-3 px-4 font-bold">適合度チェック項目</th>
                <th className="py-3 px-4 font-bold text-right">配点</th>
                <th className="py-3 px-4 font-bold text-right">算出スコア</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">
                  対応サービスとの一致
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                  25点
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                  {match.breakdown.serviceScore}点
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">
                  介助内容との一致
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                  25点
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                  {match.breakdown.careNeedsScore}点
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">
                  障害特性・支援細目との一致
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                  20点
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                  {match.breakdown.disabilityExpScore}点
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">
                  希望曜日・時間帯との一致
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                  15点
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                  {match.breakdown.scheduleScore}点
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">
                  対応エリアとの一致
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                  10点
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                  {match.breakdown.areaScore}点
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">
                  ヘルパーの性別に関する希望との一致
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                  5点
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                  {match.breakdown.genderScore}点
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="py-3 px-4 text-slate-900">合計適合度</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                  100点
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-900 text-lg">
                  {match.breakdown.totalScore}点
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          ※適合度（％）は受入可能条件と希望条件の一致のみで算出されており、事業所の有料プラン契約有無によって変わることはありません。
        </p>
      </section>

      {/* 3段階の個人情報開示コントロール */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="w-6 h-6 text-teal-800 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              個人情報の3段階開示設定（この事業所への公開範囲）
            </h2>
            <p className="text-sm text-slate-700">
              現在の開示段階：
              <strong className="text-teal-900 ml-1">
                第{disclosure.stage}段階（
                {disclosure.stage === 1
                  ? '匿名相談：ニックネーム・希望概要のみ'
                  : disclosure.stage === 2
                  ? '条件の開示：障害種別・特性・希望曜日まで開示済み'
                  : '連絡先の開示：面談/見学日程決定後の連絡先を開示済み'}
                ）
              </strong>
            </p>
          </div>
        </div>

        {disclosureFeedback && (
          <div
            role="status"
            className="p-4 rounded-xl bg-teal-50 border border-teal-600 text-teal-950 font-bold text-sm"
          >
            {disclosureFeedback}
          </div>
        )}

        {disclosureError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-amber-50 border border-amber-400 text-amber-950 font-bold text-sm"
          >
            {disclosureError}
          </div>
        )}

        {disclosure.stage === 1 && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p className="text-sm text-slate-700">
              現在は「第1段階（匿名相談）」です。障害種別・特性プロフィール・必要な介助・希望曜日をこの事業所に伝えるには、第2段階「条件の開示」を行ってください（連絡先はまだ開示されません）。
            </p>
            <button
              type="button"
              data-testid="detail-grant-stage2-btn"
              onClick={handleGrantStage2}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm cursor-pointer"
            >
              第2段階「条件の開示」に進む（詳細条件を開示）
            </button>
          </div>
        )}

        {disclosure.stage === 2 && (
          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-teal-950">
                <p className="font-bold">
                  第2段階「条件の開示」が有効です（障害特性・希望曜日を開示中）。
                </p>
                <p className="text-xs text-slate-700 mt-0.5">
                  氏名・電話番号・メールアドレスは、面談または見学の日程が決まった後に第3段階で開示します。
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  revokeDisclosureToStage(activeUserId, providerId, 1);
                  setDisclosureFeedback(
                    '第2段階の条件開示を取り消し、第1段階（匿名相談）に戻しました。'
                  );
                }}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold cursor-pointer shrink-0"
              >
                第1段階（匿名）へ戻す
              </button>
            </div>

            {!disclosure.scheduleDecidedAt ? (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-amber-950 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    第3段階「連絡先の開示」は、チャットで「面談」または「見学」の日程が確定した後に利用できます。
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openChatWith(profile.id)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold cursor-pointer shrink-0"
                >
                  チャットで日程を決める
                </button>
              </div>
            ) : !showStage3Confirm ? (
              <button
                type="button"
                data-testid="detail-open-stage3-confirm-btn"
                onClick={() => setShowStage3Confirm(true)}
                className="min-h-[48px] px-5 py-2.5 rounded-xl border-2 border-teal-700 text-teal-900 bg-teal-50 hover:bg-teal-100 font-bold text-sm cursor-pointer"
              >
                開示する連絡先を確認する（第3段階へ進む）
              </button>
            ) : (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border-2 border-teal-700 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  【確認画面】「{profile.name}」に開示される連絡先（{disclosure.scheduleSummary}）
                </h3>
                <dl className="space-y-2 text-sm bg-white p-4 rounded-xl border border-slate-200">
                  <div>
                    <dt className="text-slate-500">お名前</dt>
                    <dd className="font-bold text-slate-900">
                      {userPii?.fullName || currentUserBundle.profile.nickname}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">電話番号</dt>
                    <dd className="font-bold text-slate-900 font-mono">
                      {userPii?.phoneNumber || '未登録'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">メールアドレス</dt>
                    <dd className="font-bold text-slate-900 font-mono">
                      {userPii?.email || '未登録'}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    data-testid="detail-confirm-stage3-btn"
                    onClick={handleConfirmStage3Disclosure}
                    className="min-h-[48px] px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    この連絡先を開示する（同意する）
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStage3Confirm(false)}
                    className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm cursor-pointer"
                  >
                    今は開示しない（キャンセル）
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {disclosure.stage === 3 && (
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-teal-950 font-medium space-y-1">
              <p>
                現在この事業所には第3段階「連絡先の開示」（氏名・電話番号・メールアドレス）を行っています（同意日時：{disclosure.consentedAt || '本日'}）。
              </p>
              {disclosure.scheduleSummary && (
                <p className="text-xs text-teal-900">
                  確定日程：{disclosure.scheduleSummary}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  revokeStage3Disclosure(activeUserId, providerId);
                  setDisclosureFeedback(
                    '連絡先の開示を取り消し、第2段階（条件の開示）へ戻しました。'
                  );
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                第2段階へ戻す
              </button>
              <button
                type="button"
                onClick={() => {
                  revokeDisclosureToStage(activeUserId, providerId, 1);
                  setDisclosureFeedback(
                    'すべての詳細・連絡先開示を取り消し、第1段階（匿名相談）に戻しました。'
                  );
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                匿名（第1段階）へ戻す
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

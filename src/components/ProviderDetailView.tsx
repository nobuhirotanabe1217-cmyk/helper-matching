import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  Bookmark,
  ShieldCheck,
  Check,
  AlertTriangle,
  StickyNote,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { PROVIDER_CARE_LABELS } from '../types/domain';
import { calculateMatchResult } from '../utils/matching';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import { buildProviderDetailSpeechText } from '../utils/speech';

export const ProviderDetailView: React.FC = () => {
  const {
    activeUserId,
    currentUserBundle,
    selectedProviderIdForDetail,
    getProviderBundleById,
    interactions,
    toggleUserFavoriteProvider,
    updateUserFavoriteNote,
    openChatWith,
    navigateTo,
    getDisclosureStage,
    grantStage3Disclosure,
    revokeStage3Disclosure,
  } = useAppState();

  const providerId = selectedProviderIdForDetail || 'prov-001';
  const providerBundle = getProviderBundleById(providerId);

  const interaction = interactions.find(
    (i) => i.userId === activeUserId && i.providerId === providerId
  );
  const savedFavoriteNote = interaction?.userFavoriteNote || '';

  const [showDisclosureConfirm, setShowDisclosureConfirm] =
    useState<boolean>(false);
  const [disclosureFeedback, setDisclosureFeedback] = useState<string>('');
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

  const { profile, capabilities, availability } = providerBundle;
  const match = calculateMatchResult(currentUserBundle, providerBundle);
  const isFavorite = Boolean(interaction?.isUserFavorite);
  const disclosure = getDisclosureStage(activeUserId, providerId);

  const handleConfirmDisclosure = () => {
    grantStage3Disclosure(activeUserId, providerId);
    setShowDisclosureConfirm(false);
    setDisclosureFeedback(
      `「${profile.name}」への第3段階（詳細相談用情報）の開示に同意しました。事業所側の画面で最寄り駅エリアや相談支援事業所名が閲覧可能になりました。`
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
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-teal-800">
              所在地域：{profile.locationCity} · 現在の受け入れ状況：
              {availability.acceptanceStatus}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {profile.name}
            </h1>
            <p className="text-base font-medium text-slate-700">
              対応サービス：{profile.serviceTypes.join(' · ')}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-right shrink-0">
            <span className="block text-xs font-bold text-slate-600">
              {match.judgment}
            </span>
            <span className="block text-2xl font-bold font-mono tabular-nums text-teal-900">
              相性 {match.breakdown.totalScore}%
            </span>
          </div>
        </div>

        <p className="text-base text-slate-800 leading-relaxed">
          {profile.introduction}
        </p>

        {/* 事業所からのメッセージ */}
        <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-1">
          <p className="text-sm font-bold text-teal-950">
            事業所からのメッセージ（担当：{profile.contactPersonName}）
          </p>
          <p className="text-base text-slate-800 leading-relaxed">
            {profile.messageFromProvider}
          </p>
        </div>

        {/* 主要アクションボタン */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => openChatWith(profile.id)}
            className="flex-1 min-h-[50px] px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
            <span>この事業所に問い合わせ・メッセージを送る</span>
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

      {/* マッチングスコア（100点満点）の詳細内訳 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              あなたの希望条件との照合結果（100点満点の内訳）
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
                <th className="py-3 px-4 font-bold">照合項目</th>
                <th className="py-3 px-4 font-bold text-right">配点</th>
                <th className="py-3 px-4 font-bold text-right">算出スコア</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">
                  希望サービスとの一致
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
                  支援内容・介助内容との一致
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
                  希望曜日・時間帯との一致
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                  20点
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                  {match.breakdown.scheduleScore}点
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">
                  対応地域との一致
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
                  障害特性・支援経験との一致
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                  10点
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                  {match.breakdown.disabilityExpScore}点
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">
                  ヘルパーの性別に関する希望との一致
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                  10点
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                  {match.breakdown.genderScore}点
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="py-3 px-4 text-slate-900">合計マッチング度</td>
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
          ※このスコアは試作品上の参考スコアであり、最終的な受け入れ可否は事業所との面談・契約調整により判断されます。
        </p>
      </section>

      {/* 事業所の詳細な対応条件・曜日別スケジュール */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">
          事業所の対応能力・受け入れ条件の詳細
        </h2>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base">
          <div>
            <dt className="text-sm font-bold text-slate-500">対応地域</dt>
            <dd className="text-slate-900 font-bold mt-1">
              {profile.coverageAreas.join(' · ')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-slate-500">
              営業日・営業時間
            </dt>
            <dd className="text-slate-900 font-medium mt-1">
              {profile.businessDaysHours}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-bold text-slate-500">
              対応可能な支援・介助内容（●はあなたが希望している項目）
            </dt>
            <dd className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {capabilities.supportedCareItems.map((item) => {
                const isUserNeeded =
                  currentUserBundle.needs.careNeeds.includes(item);
                return (
                  <div
                    key={item}
                    className={`p-2.5 rounded-lg border ${
                      isUserNeeded
                        ? 'bg-teal-50 border-teal-600 text-teal-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {isUserNeeded ? '● ' : ''}
                    {PROVIDER_CARE_LABELS[item]}
                  </div>
                );
              })}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-slate-500">
              対応可能な障害特性・支援経験
            </dt>
            <dd className="text-slate-900 font-medium mt-1">
              {capabilities.supportedDisabilities.join(' · ')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-slate-500">
              ヘルパーの性別に関する対応方針
            </dt>
            <dd className="text-slate-900 font-bold mt-1">
              {capabilities.helperGenderPolicy}（在籍ヘルパー：
              {capabilities.availableHelperGenders.join('・')}）
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-bold text-slate-500">
              医療的な配慮・移乗・2人介助の対応範囲
            </dt>
            <dd className="text-slate-800 mt-1">
              {capabilities.medicalCareRangeText} ／ 移乗介助：
              {capabilities.supportsWheelchairTransfer ? '対応可' : '要相談'}{' '}
              ／ 2人介助：
              {capabilities.supportsTwoPersonCare ? '対応可' : '原則1人介助'}
            </dd>
          </div>
        </dl>

        {/* 曜日別の対応可能時間帯テーブル */}
        <div className="space-y-2 pt-2">
          <h3 className="text-lg font-bold text-slate-900">
            曜日ごとの対応可能な時間帯
          </h3>
          <p className="text-sm text-slate-600">
            受け入れ条件メモ：{availability.acceptableConditionsNote}
          </p>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-2.5 px-3 font-bold w-20">曜日</th>
                  <th className="py-2.5 px-3 font-bold w-28">対応可否</th>
                  <th className="py-2.5 px-3 font-bold">対応時間帯・詳細</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {availability.weeklySchedule.map((dayRow) => {
                  const isUserPreferredDay =
                    currentUserBundle.preferences.preferredDays.includes(
                      dayRow.day
                    );
                  return (
                    <tr
                      key={dayRow.day}
                      className={isUserPreferredDay ? 'bg-teal-50/40' : ''}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {dayRow.day}曜
                        {isUserPreferredDay ? '（希望）' : ''}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {dayRow.available ? (
                          <span className="text-teal-900">対応可能</span>
                        ) : (
                          <span className="text-slate-400">対応不可</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        {dayRow.note}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 第3段階：本人の同意による情報開示セクション（仕様書第8章） */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="w-6 h-6 text-teal-800 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              個人情報の段階的開示設定（この事業所への公開範囲）
            </h2>
            <p className="text-sm text-slate-700">
              あなたの個人情報は本人の同意なく事業所に公開されません。現在の開示段階：
              <strong className="text-teal-900 ml-1">
                第{disclosure.stage}段階（
                {disclosure.stage === 1
                  ? '匿名情報のみ'
                  : disclosure.stage === 2
                  ? '匿名チャット相談中'
                  : '本人同意による詳細相談情報を開示済み'}
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

        {disclosure.stage < 3 ? (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-slate-600">
              具体的な面談や契約の調整を進める段階で、下のボタンを押して内容を確認したうえで「この情報を事業所に開示する」を選ぶと、この事業所にのみ以下の情報が公開されます。
            </p>

            {!showDisclosureConfirm ? (
              <button
                type="button"
                onClick={() => setShowDisclosureConfirm(true)}
                className="min-h-[48px] px-5 py-2.5 rounded-xl border-2 border-teal-700 text-teal-900 bg-teal-50 hover:bg-teal-100 font-bold text-sm cursor-pointer"
              >
                開示する情報を確認する（第3段階へ進む）
              </button>
            ) : (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border-2 border-teal-700 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  【確認画面】「{profile.name}」に新しく見えるようになる情報
                </h3>
                <dl className="space-y-2 text-sm bg-white p-4 rounded-xl border border-slate-200">
                  <div>
                    <dt className="text-slate-500">ニックネーム・登録者の立場</dt>
                    <dd className="font-bold text-slate-900">
                      {currentUserBundle.profile.nickname}（
                      {currentUserBundle.profile.disclosableInfo.contactPersonRole}
                      ）
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">最寄り駅・大まかなエリア</dt>
                    <dd className="font-bold text-slate-900">
                      {currentUserBundle.profile.disclosableInfo.nearestStationArea}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">担当相談支援事業所</dt>
                    <dd className="font-bold text-slate-900">
                      {
                        currentUserBundle.profile.disclosableInfo
                          .consultationSupportOffice
                      }
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">具体的な希望日時メモ</dt>
                    <dd className="font-bold text-slate-900">
                      {
                        currentUserBundle.profile.disclosableInfo
                          .detailedScheduleNote
                      }
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmDisclosure}
                    className="min-h-[48px] px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    この情報を事業所に開示する（同意する）
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisclosureConfirm(false)}
                    className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm cursor-pointer"
                  >
                    今は開示しない（キャンセル）
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-teal-950 font-medium">
              現在この事業所には第3段階（最寄り駅エリア・相談支援事業所等）の情報を開示中です（同意日時：
              {disclosure.consentedAt || '本日'}）。
            </p>
            <button
              type="button"
              onClick={() => {
                revokeStage3Disclosure(activeUserId, providerId);
                setDisclosureFeedback(
                  '第3段階の情報開示を取り消し、匿名段階（第2段階）に戻しました。'
                );
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold shrink-0 cursor-pointer"
            >
              開示を取り消す
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

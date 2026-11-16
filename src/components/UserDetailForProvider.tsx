import React, { useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  Lock,
  Check,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  PROVIDER_CARE_LABELS,
  ProviderReactionStatus,
  UserPII,
} from '../types/domain';
import { calculateMatchResult } from '../utils/matching';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import { buildUserDetailForProviderSpeechText } from '../utils/speech';

export const UserDetailForProvider: React.FC = () => {
  const {
    activeProviderId,
    currentProviderBundle,
    currentProviderPlanDef,
    isCurrentProviderPaid,
    selectedUserIdForDetail,
    getUserBundleById,
    interactions,
    setProviderReactionToUser,
    getDisclosureStage,
    getChatRequestBetween,
    sendChatRequest,
    getPiiIfPermitted,
    openChatWith,
    setShowChatUpgradeModal,
    navigateTo,
  } = useAppState();

  const userId = selectedUserIdForDetail || 'user-001';
  const userBundle = getUserBundleById(userId);
  const [actionBanner, setActionBanner] = useState<string>('');
  const [piiData, setPiiData] = useState<UserPII | null>(null);
  const [piiCheckStatus, setPiiCheckStatus] = useState<
    'idle' | 'granted' | 'denied'
  >('idle');
  const [piiCheckMessage, setPiiCheckMessage] = useState<string>('');

  const handleRequestPiiVerification = () => {
    if (!isCurrentProviderPaid) {
      setShowChatUpgradeModal(true);
      return;
    }
    const result = getPiiIfPermitted(userId);
    if (result.permitted && result.data) {
      setPiiData(result.data);
      setPiiCheckStatus('granted');
      setPiiCheckMessage(
        '【認可成功】本人による第3段階同意（連絡先開示）およびRBACアクセス権限の検証に合格しました。連絡先情報を表示します（監査ログ記録済）。'
      );
    } else {
      setPiiData(null);
      setPiiCheckStatus('denied');
      setPiiCheckMessage(
        `【403 Forbidden / Zero-Trust拒否】${result.reason}。サーバーサイドで領域A（本人特定情報）へのアクセスが即時遮断されました。不正アクセス試行としてセキュリティ監査ログに記録されました。`
      );
    }
  };

  if (!userBundle) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p>利用希望者情報が見つかりませんでした。</p>
        <button
          type="button"
          onClick={() => navigateTo('provider-search')}
          className="mt-4 min-h-[48px] px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
        >
          一覧へ戻る
        </button>
      </div>
    );
  }

  const { profile, needs, preferences } = userBundle;
  const match = calculateMatchResult(userBundle, currentProviderBundle);
  const interaction = interactions.find(
    (i) => i.userId === userId && i.providerId === activeProviderId
  );
  const currentReaction = interaction?.providerReaction || '未対応';
  const disclosure = getDisclosureStage(userId, activeProviderId);
  const chatReq = getChatRequestBetween(userId, activeProviderId);

  const handleSelectReaction = (reaction: ProviderReactionStatus) => {
    if (!isCurrentProviderPaid) {
      setShowChatUpgradeModal(true);
      return;
    }
    setProviderReactionToUser(userId, activeProviderId, reaction);
    if (reaction === 'メッセージを送る') {
      if (chatReq?.status === 'approved') {
        openChatWith(userId);
      } else {
        sendChatRequest(
          userId,
          activeProviderId,
          'provider',
          'ご登録の希望条件を拝見しました。一度詳しくお話を伺いたいです。'
        );
        setActionBanner(
          `「${profile.anonymousCode}」へチャット開始申請を送信しました。利用者・ご家族が承認するとチャット画面でメッセージ交換が可能になります。`
        );
      }
      return;
    }
    setActionBanner(
      `「${profile.anonymousCode}」への対応ステータスを「${reaction}」に設定しました。利用者側の画面にも通知されます。`
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigateTo('provider-search')}
          className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200/70 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          利用希望者一覧へ戻る
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-xl ${
              isCurrentProviderPaid
                ? 'bg-teal-800 text-white'
                : 'bg-slate-200 text-slate-800'
            }`}
          >
            現在の契約：{currentProviderPlanDef.name}
          </span>
          <SpeechButton
            speechId={`prov-user-detail-${profile.id}`}
            isPrimaryScreenReader
            tone="indigo"
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
          <HelpTooltip guideKey="provider-user-detail" tone="indigo" />
        </div>
      </div>

      {/* 基本ヘッダー＆4つの事業所リアクションボタン */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-teal-800">
              情報開示レベル：第{disclosure.stage}段階（
              {disclosure.stage === 3
                ? '本人同意により詳細相談情報を開示済み'
                : '匿名情報のみ公開'}
              ） · 登録時期：{profile.registeredAt || '2026年11月'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              【{profile.anonymousCode}】希望地域：{profile.city}
              {isCurrentProviderPaid && `（${profile.ageGroup}・${profile.gender}）`}
            </h1>
            <p className="text-base text-slate-700 font-medium">
              希望サービス：{needs.desiredServices.join(' · ')} ／ 受給者証：
              {profile.certificateStatus}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-right shrink-0">
            <span className="block text-xs font-bold text-slate-600">
              {match.judgment}
            </span>
            <span className="block text-2xl font-bold font-mono tabular-nums text-teal-900">
              マッチング度 {match.breakdown.totalScore}%
            </span>
          </div>
        </div>

        {actionBanner && (
          <div
            role="status"
            className="p-4 rounded-xl bg-teal-50 border border-teal-600 text-teal-950 font-bold text-sm"
          >
            {actionBanner}
          </div>
        )}

        {/* 事業所が利用者に関心を持った場合の操作 */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">
              この利用希望者への対応アクション・ステータス管理（現在：
              <span className="text-teal-900">{currentReaction}</span>）
            </h2>
            {!isCurrentProviderPaid && (
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg">
                ※チャット開始申請・案件管理は有料プラン機能です
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSelectReaction('対応を検討したい')}
              aria-pressed={currentReaction === '対応を検討したい'}
              className={`min-h-[52px] px-4 py-3 rounded-xl border-2 font-bold text-base flex items-center justify-between gap-2 cursor-pointer ${
                currentReaction === '対応を検討したい'
                  ? 'bg-teal-800 border-teal-800 text-white'
                  : 'bg-white border-teal-700 text-teal-900 hover:bg-teal-50'
              }`}
            >
              <span>1. 対応中・検討したい</span>
              {currentReaction === '対応を検討したい' && (
                <Check className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectReaction('詳しい条件を確認したい')}
              aria-pressed={currentReaction === '詳しい条件を確認したい'}
              className={`min-h-[52px] px-4 py-3 rounded-xl border-2 font-bold text-base flex items-center justify-between gap-2 cursor-pointer ${
                currentReaction === '詳しい条件を確認したい'
                  ? 'bg-teal-800 border-teal-800 text-white'
                  : 'bg-white border-teal-700 text-teal-900 hover:bg-teal-50'
              }`}
            >
              <span>2. 詳しい条件を確認したい</span>
              {currentReaction === '詳しい条件を確認したい' && (
                <Check className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectReaction('メッセージを送る')}
              className="min-h-[52px] px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
              <span>
                {chatReq?.status === 'approved'
                  ? '3. チャット画面を開く（承認済）'
                  : chatReq?.status === 'pending'
                  ? '3. チャット開始申請済（承認待ち）'
                  : '3. チャット開始申請を送る'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectReaction('今回は対応が難しい')}
              aria-pressed={currentReaction === '今回は対応が難しい'}
              className={`min-h-[52px] px-4 py-3 rounded-xl border-2 font-bold text-base flex items-center justify-between gap-2 cursor-pointer ${
                currentReaction === '今回は対応が難しい'
                  ? 'bg-slate-200 border-slate-600 text-slate-900'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>4. 今回は対応不可</span>
              {currentReaction === '今回は対応が難しい' && (
                <Check className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 段階的情報開示ステータス表示（第1・2段階 vs 第3段階同意後） */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          {disclosure.stage === 3 ? (
            <ShieldCheck className="w-6 h-6 text-teal-800" />
          ) : (
            <Lock className="w-5 h-5 text-slate-600" />
          )}
          本人の同意による追加開示情報（第3段階）
        </h2>

        {disclosure.stage === 3 ? (
          <div className="p-4 sm:p-5 rounded-xl bg-teal-50/70 border border-teal-300 space-y-3">
            <p className="text-sm font-bold text-teal-950">
              利用者本人の同意により、以下の相談・連絡用情報が開示されています（同意日時：
              {disclosure.consentedAt || '本日'}）
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl border border-teal-200">
              <div>
                <dt className="text-slate-500">ニックネーム・登録者の立場</dt>
                <dd className="font-bold text-slate-900 text-base mt-0.5">
                  {profile.nickname}（{profile.disclosableInfo.contactPersonRole}
                  ）
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">最寄り駅・訪問エリア詳細</dt>
                <dd className="font-bold text-slate-900 text-base mt-0.5">
                  {profile.disclosableInfo.nearestStationArea}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">担当相談支援事業所</dt>
                <dd className="font-bold text-slate-900 text-base mt-0.5">
                  {profile.disclosableInfo.consultationSupportOffice}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">具体的な希望日時メモ</dt>
                <dd className="font-bold text-slate-900 text-base mt-0.5">
                  {profile.disclosableInfo.detailedScheduleNote}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 space-y-1.5">
            <p className="font-bold text-slate-900">
              現在は第{disclosure.stage}段階（匿名状態）のため、最寄り駅や担当相談支援事業所などの情報は非公開です。
            </p>
            <p>
              チャットで相談を進め、利用者側が「この情報を事業所に開示する」ボタンを押した場合にのみ、ここに詳細情報が表示されます。
            </p>
          </div>
        )}

        {/* 領域A（本人特定情報）アクセス制御＆Zero-Trust検証カード */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded">
                領域A: 本人特定情報（氏名・電話番号・詳細住所）
              </span>
              <p className="text-xs text-slate-600">
                本人の明示的同意がない限り事業所側へのAPI提供は拒否されます（Zero-Trust設計）。
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestPiiVerification}
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-slate-800 hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              連絡先情報のアクセス権限を検証
            </button>
          </div>

          {piiCheckStatus !== 'idle' && (
            <div
              role="alert"
              className={`p-4 rounded-xl border text-xs sm:text-sm space-y-2.5 ${
                piiCheckStatus === 'granted'
                  ? 'bg-teal-50/80 border-teal-600 text-teal-950'
                  : 'bg-red-50/80 border-red-500 text-red-950'
              }`}
            >
              <div className="flex items-start gap-2 font-bold">
                {piiCheckStatus === 'granted' ? (
                  <ShieldCheck className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                )}
                <span>{piiCheckMessage}</span>
              </div>

              {piiCheckStatus === 'granted' && piiData && (
                <div className="p-3 bg-white rounded-lg border border-teal-200 text-xs text-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="text-slate-500">氏名（架空）：</span>
                    <strong className="text-slate-900 ml-1">
                      {piiData.fullName}（{piiData.fullNameKana}）
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">電話番号：</span>
                    <strong className="text-slate-900 ml-1 font-mono">
                      {piiData.phoneNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">メールアドレス：</span>
                    <strong className="text-slate-900 ml-1 font-mono">
                      {piiData.email}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">詳細住所（番地等）：</span>
                    <strong className="text-slate-900 ml-1">
                      {piiData.detailedAddress}
                    </strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">緊急連絡先：</span>
                    <strong className="text-slate-900 ml-1">
                      {piiData.emergencyContactName}（{piiData.emergencyContactPhone}）
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 詳しい支援ニーズ・身体状況・配慮事項 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">
          利用希望者の詳しい支援ニーズ・希望条件
        </h2>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base">
          <div>
            <dt className="text-sm font-bold text-slate-500">
              障害種別・障害支援区分
            </dt>
            <dd className="font-bold text-slate-900 mt-1">
              {needs.disabilityTypes.join(' · ')} ／ 支援区分：
              {needs.supportCategory}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-bold text-slate-500">
              ヘルパーの性別に関する希望
            </dt>
            <dd className="font-bold text-slate-900 mt-1">
              {preferences.helperGenderPreference}
              {preferences.isGenderPreferenceStrict
                ? '（必須条件）'
                : '（できれば希望）'}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-sm font-bold text-slate-500">
              日常生活上の支援ニーズ（●は貴事業所で対応可能な項目）
            </dt>
            <dd className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {needs.careNeeds.map((c) => {
                const canSupport =
                  currentProviderBundle.capabilities.supportedCareItems.includes(
                    c
                  );
                return (
                  <div
                    key={c}
                    className={`p-2.5 rounded-lg border font-bold ${
                      canSupport
                        ? 'bg-teal-50 border-teal-600 text-teal-950'
                        : 'bg-amber-50 border-amber-400 text-amber-950'
                    }`}
                  >
                    {canSupport ? '● 対応可：' : '▲ 要確認：'}
                    {c}
                  </div>
                );
              })}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-bold text-slate-500">
              身体状況・介助方法
            </dt>
            <dd className="font-medium text-slate-900 mt-1">
              {needs.physicalConditions.join(' · ') || '特になし'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-bold text-slate-500">
              コミュニケーション・行動面の配慮
            </dt>
            <dd className="font-medium text-slate-900 mt-1">
              {needs.communicationConsiderations.join(' · ') || '特になし'}
            </dd>
          </div>

          {needs.communicationFreeText && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-bold text-slate-500">
                コミュニケーション・介助手順の補足（自由記述）
              </dt>
              {isCurrentProviderPaid ? (
                <dd className="text-slate-800 mt-1 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  {needs.communicationFreeText}
                </dd>
              ) : (
                <dd className="text-xs sm:text-sm text-slate-600 mt-1 p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    個人の推測・特定を防ぐため、無料プランでは自由記述の詳細な相談内容は非表示となっています（概要：{profile.briefSummaryForFreePlan}）。
                  </span>
                </dd>
              )}
            </div>
          )}

          <div>
            <dt className="text-sm font-bold text-slate-500">
              希望曜日・希望時間帯
            </dt>
            <dd className="font-bold text-slate-900 mt-1">
              {preferences.preferredDays.join('・')}曜日 ／{' '}
              {preferences.preferredTimeSlots.join('・')}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-bold text-slate-500">
              希望頻度・利用開始希望時期
            </dt>
            <dd className="font-bold text-slate-900 mt-1">
              {preferences.frequency} ／ {preferences.startTiming}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-sm font-bold text-slate-500">
              事業所に知っておいてほしいこと（自由記述）
            </dt>
            {isCurrentProviderPaid ? (
              <dd className="text-slate-900 mt-1 p-4 rounded-xl bg-teal-50/50 border border-teal-200">
                {preferences.freeMessageToProvider || '記載なし'}
              </dd>
            ) : (
              <dd className="text-xs sm:text-sm text-slate-600 mt-1 p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  無料プランでは自由記述の相談内容は表示されません。有料プラン契約および本人承認後に詳細をご確認いただけます。
                </span>
              </dd>
            )}
          </div>
        </dl>
      </section>
    </div>
  );
};

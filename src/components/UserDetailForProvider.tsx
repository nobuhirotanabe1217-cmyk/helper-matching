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
import { getCurrentYearMonth } from '../utils/date';
import { calculateMatchResult } from '../utils/matching';
import { verifyProviderChatAccess } from '../utils/subscription';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import { buildUserDetailForProviderSpeechText } from '../utils/speech';

export const UserDetailForProvider: React.FC = () => {
  const {
    activeProviderId,
    currentProviderBundle,
    currentProviderPlanDef,
    currentProviderSubscription,
    subscriptionPlans,
    isCurrentProviderPaid,
    selectedUserIdForDetail,
    getUserBundleById,
    interactions,
    chatRequests,
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

  // 第3段階連絡先開示の権限検証（プランに関わらず利用者の第3段階同意有無のみで厳密に検証）
  const handleRequestPiiVerification = () => {
    const result = getPiiIfPermitted(userId);
    if (result.permitted && result.data) {
      setPiiData(result.data);
      setPiiCheckStatus('granted');
      setPiiCheckMessage(
        '【認可成功】面談/見学日程確定後の第3段階「連絡先開示」に利用者が同意済みのため、連絡先情報を表示します。'
      );
    } else {
      setPiiData(null);
      setPiiCheckStatus('denied');
      setPiiCheckMessage(
        `【アクセス制限】${result.reason}（氏名・電話番号・メールは第3段階同意まで遮断されます）。`
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
  const stage2Unlocked = disclosure.stage >= 2;
  const stage3Unlocked =
    disclosure.stage === 3 && Boolean(disclosure.disclosedFields.piiContactAccess);

  const handleSelectReaction = (reaction: ProviderReactionStatus) => {
    if (reaction === 'メッセージを送る') {
      if (chatReq?.status === 'approved') {
        openChatWith(userId);
        return;
      }
      const access = verifyProviderChatAccess({
        subscription: currentProviderSubscription,
        plans: subscriptionPlans,
        chatRequest: chatReq,
        allProviderChatRequests: chatRequests,
        currentYearMonth: getCurrentYearMonth(),
      });
      if (!access.canRequestChat && !access.canSendMessage) {
        setShowChatUpgradeModal(true);
        return;
      }
      const res = sendChatRequest(
        userId,
        activeProviderId,
        'provider',
        'ご登録の希望条件を拝見しました。まずは匿名相談にて一度詳しくお話を伺いたいです。'
      );
      if (!res.ok) {
        setShowChatUpgradeModal(true);
        return;
      }
      setProviderReactionToUser(userId, activeProviderId, reaction);
      setActionBanner(
        `「${profile.anonymousCode}」へチャット開始申請を送信しました。利用者が承認すると第1段階「匿名相談」が始まります。`
      );
      return;
    }

    if (!isCurrentProviderPaid) {
      setShowChatUpgradeModal(true);
      return;
    }
    setProviderReactionToUser(userId, activeProviderId, reaction);
    setActionBanner(
      `「${profile.anonymousCode}」への進捗ステータスを「${reaction}」に更新しました。`
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

      {/* 基本ヘッダー＆対応アクション */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-teal-800">
              現在の情報開示段階：
              {disclosure.stage === 1
                ? '第1段階「匿名相談」（連絡先・障害詳細非公開）'
                : disclosure.stage === 2
                ? '第2段階「条件の開示済み」（障害種別・特性・希望曜日公開）'
                : '第3段階「連絡先開示済み」（面談/見学日程確定後）'}
              {' · '}登録：{profile.registeredAt || '最新'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              【{profile.anonymousCode}】希望地域：{profile.city}
              {stage2Unlocked && `（${profile.nickname}・${profile.ageGroup}）`}
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
              適合度 {match.breakdown.totalScore}%
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

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">
              この利用希望者への対応アクション・進捗（現在：
              <span className="text-teal-900">{currentReaction}</span>）
            </h2>
            {!isCurrentProviderPaid && (
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg">
                ※候補者の進捗記録管理は有料プラン機能です（申請は月1件まで無料可）
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
              <span>1. 対応を検討したい</span>
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

      {/* 段階的情報開示ステータス表示（第1・2・3段階） */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          {stage3Unlocked ? (
            <ShieldCheck className="w-6 h-6 text-teal-800" />
          ) : (
            <Lock className="w-5 h-5 text-slate-600" />
          )}
          第3段階「連絡先の開示」状況（面談・見学日程決定後）
        </h2>

        {disclosure.scheduleSummary && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950">
            確定日程：{disclosure.scheduleSummary}（確定日時：{disclosure.scheduleDecidedAt}）
          </div>
        )}

        <div className="pt-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded">
                保護対象：氏名・電話番号・メールアドレス
              </span>
              <p className="text-xs text-slate-600">
                チャットで「面談」または「見学」の日程が決まり、本人が第3段階開示に同意した場合のみ取得できます。
              </p>
            </div>
            <button
              type="button"
              data-testid="verify-pii-access-btn"
              onClick={handleRequestPiiVerification}
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-slate-800 hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              連絡先情報（第3段階）を確認する
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
                    <span className="text-slate-500">氏名：</span>
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
                    <span className="text-slate-500">詳細住所：</span>
                    <strong className="text-slate-900 ml-1">
                      {piiData.detailedAddress}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 第2段階「条件の開示」領域 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h2 className="text-xl font-bold text-slate-900">
            支援ニーズ・特性プロフィール（第2段階開示）
          </h2>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
              stage2Unlocked
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {stage2Unlocked ? '第2段階：条件開示済み' : '第1段階（詳細マスク中）'}
          </span>
        </div>

        {!stage2Unlocked ? (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-sm text-slate-700">
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              現在は第1段階「匿名相談」のため、障害種別・特性プロフィールの詳細は非公開です。
            </p>
            <p>
              希望概要：{profile.briefSummaryForFreePlan || `${profile.city}での${needs.desiredServices.join('・')}希望`}
            </p>
            <p className="text-xs text-slate-600">
              チャット上で相談を進め、利用者が「第2段階：条件の開示」に同意すると、障害種別・介助内容・特性（苦手なこと・配慮してほしいこと）・希望曜日がここに表示されます。
            </p>
          </div>
        ) : (
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
                必要な介助内容（●＝貴事業所で対応可能）
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
                      {PROVIDER_CARE_LABELS[c] || c}
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
                コミュニケーションの方法
              </dt>
              <dd className="font-medium text-slate-900 mt-1">
                {needs.communicationConsiderations.join(' · ') || '特になし'}
              </dd>
            </div>

            {needs.dislikesAndAccommodations && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-bold text-slate-500">
                  特性プロフィール：苦手なこと・配慮してほしいこと
                </dt>
                <dd className="text-slate-900 mt-1 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-sm">
                  {needs.dislikesAndAccommodations}
                </dd>
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
                自由記述・メッセージ
              </dt>
              <dd className="text-slate-900 mt-1 p-4 rounded-xl bg-teal-50/50 border border-teal-200 text-sm">
                {preferences.freeMessageToProvider || needs.communicationFreeText || '記載なし'}
              </dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  );
};

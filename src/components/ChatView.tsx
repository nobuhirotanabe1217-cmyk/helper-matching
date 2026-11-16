import React, { useEffect, useState } from 'react';
import {
  Send,
  ShieldCheck,
  Check,
  MessageSquare,
  ArrowLeft,
  Lock,
  Clock,
  X,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  CHAT_TEMPLATES_PROVIDER,
  CHAT_TEMPLATES_USER,
} from '../types/domain';
import { SubscriptionPlanIllustration } from './VisualHelpers';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import {
  buildChatSpeechText,
  buildSingleChatMessageSpeechText,
} from '../utils/speech';

export const ChatView: React.FC = () => {
  const {
    role,
    activeUserId,
    activeProviderId,
    activeChatPartnerId,
    openChatWith,
    userProfiles,
    providerProfiles,
    messages,
    sendMessage,
    markMessagesRead,
    getDisclosureStage,
    grantStage3Disclosure,
    revokeStage3Disclosure,
    getChatRequestBetween,
    sendChatRequest,
    respondToChatRequest,
    isCurrentProviderPaid,
    currentProviderPlanDef,
    navigateTo,
    currentUserBundle,
  } = useAppState();

  const isUserMode = role !== 'provider';

  // 無料プランの事業所でも「利用者側から開始されたチャット（または承認済み）」には返信できる
  const hasAnyReplyableThreadForFreeProvider =
    !isUserMode &&
    !isCurrentProviderPaid &&
    userProfiles.some((u) => {
      const req = getChatRequestBetween(u.id, activeProviderId);
      const hasUserMsg = messages.some(
        (m) =>
          m.userId === u.id &&
          m.providerId === activeProviderId &&
          m.senderType === 'user'
      );
      return (
        req?.initiatedBy === 'user' ||
        req?.status === 'approved' ||
        hasUserMsg
      );
    });

  if (!isUserMode && !isCurrentProviderPaid && !hasAnyReplyableThreadForFreeProvider) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-28">
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-xs">
          <div className="flex justify-end">
            <HelpTooltip guideKey="chat" tone="indigo" />
          </div>
          <div className="flex justify-center">
            <SubscriptionPlanIllustration className="w-24 h-20" />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              現在の契約：{currentProviderPlanDef.name}（0円）
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              事業所からのチャット開始申請は有料プランでご利用いただけます。
            </h1>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-lg mx-auto">
              利用者・ご家族から先に届いた相談には無料プランのまま返信できます。事業所側から利用希望者へ積極的にチャット開始申請（スカウト）を送るには、月額定額DXプラン（斡旋手数料なし）をご契約ください。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigateTo('provider-billing')}
              className="w-full sm:w-auto min-h-[50px] px-6 py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm sm:text-base cursor-pointer"
            >
              有料プランの詳細を見る
            </button>
            <button
              type="button"
              onClick={() => navigateTo('provider-dashboard')}
              className="w-full sm:w-auto min-h-[50px] px-6 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm sm:text-base cursor-pointer"
            >
              今は申し込まない
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Determine conversation partners
  const partnerList = isUserMode
    ? providerProfiles.map((p) => {
        const thread = messages.filter(
          (m) => m.userId === activeUserId && m.providerId === p.id
        );
        const unread = thread.filter(
          (m) => m.senderType === 'provider' && !m.readByRecipient
        ).length;
        const lastMsg = thread[thread.length - 1];
        const req = getChatRequestBetween(activeUserId, p.id);
        return {
          id: p.id,
          title: p.name,
          subtitle: `${p.locationCity} · ${p.serviceTypes.join('/')}`,
          unread,
          lastMsg,
          reqStatus: req?.status,
        };
      })
    : userProfiles
        .filter((u) => {
          if (isCurrentProviderPaid) return true;
          const req = getChatRequestBetween(u.id, activeProviderId);
          const hasUserMsg = messages.some(
            (m) =>
              m.userId === u.id &&
              m.providerId === activeProviderId &&
              m.senderType === 'user'
          );
          return (
            req?.initiatedBy === 'user' ||
            req?.status === 'approved' ||
            hasUserMsg
          );
        })
        .map((u) => {
          const thread = messages.filter(
            (m) => m.userId === u.id && m.providerId === activeProviderId
          );
          const unread = thread.filter(
            (m) => m.senderType === 'user' && !m.readByRecipient
          ).length;
          const lastMsg = thread[thread.length - 1];
          const disc = getDisclosureStage(u.id, activeProviderId);
          const req = getChatRequestBetween(u.id, activeProviderId);
          return {
            id: u.id,
            title:
              disc.stage === 3
                ? `${u.anonymousCode}（${u.nickname}）`
                : u.anonymousCode,
            subtitle: `${u.ageGroup} · ${u.city} · 第${disc.stage}段階`,
            unread,
            lastMsg,
            reqStatus: req?.status,
          };
        });

  const selectedPartnerId =
    activeChatPartnerId || partnerList[0]?.id || (isUserMode ? 'prov-001' : 'user-001');

  const currentUserId = isUserMode ? activeUserId : selectedPartnerId;
  const currentProviderId = isUserMode ? selectedPartnerId : activeProviderId;
  const currentChatReq = getChatRequestBetween(
    currentUserId,
    currentProviderId
  );

  const [inputText, setInputText] = useState<string>('');
  const [showDisclosureModal, setShowDisclosureModal] =
    useState<boolean>(false);
  const messageListRef = React.useRef<HTMLDivElement | null>(null);

  // Mark messages as read when viewing thread
  useEffect(() => {
    markMessagesRead(
      currentUserId,
      currentProviderId,
      isUserMode ? 'user' : 'provider'
    );
  }, [currentUserId, currentProviderId, isUserMode, messages.length]);

  const threadMessages = messages.filter(
    (m) => m.userId === currentUserId && m.providerId === currentProviderId
  );

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [threadMessages.length, currentUserId, currentProviderId]);

  const disclosure = getDisclosureStage(currentUserId, currentProviderId);
  const partnerObj = partnerList.find((p) => p.id === selectedPartnerId);
  const targetUserProfile = userProfiles.find((u) => u.id === currentUserId);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    if (!isUserMode && currentChatReq?.status !== 'approved') {
      sendChatRequest(
        currentUserId,
        currentProviderId,
        'provider',
        inputText.trim()
      );
      setInputText('');
      return;
    }
    sendMessage(
      currentUserId,
      currentProviderId,
      isUserMode ? 'user' : 'provider',
      inputText
    );
    setInputText('');
  };

  const handleTemplateClick = (templateText: string) => {
    setInputText(templateText);
  };

  const templates = isUserMode ? CHAT_TEMPLATES_USER : CHAT_TEMPLATES_PROVIDER;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* 上部戻るナビ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            navigateTo(isUserMode ? 'user-dashboard' : 'provider-dashboard')
          }
          className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200/70 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {isUserMode ? '利用者ホームへ戻る' : '事業所ホームへ戻る'}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-teal-900">
            {isUserMode
              ? `利用者（${currentUserBundle.profile.anonymousCode}）としてチャット中`
              : '事業所担当者としてチャット中'}
          </span>
          <SpeechButton
            speechId="screen-chat"
            isPrimaryScreenReader
            tone={isUserMode ? 'teal' : 'indigo'}
            getText={() =>
              buildChatSpeechText({
                isUserMode,
                partnerTitle: partnerObj?.title || '相手',
                disclosureStage: disclosure.stage,
                messages: threadMessages.map((m) => ({
                  senderType: m.senderType,
                  text: m.text,
                  createdAt: m.createdAt,
                })),
              })
            }
          />
          <HelpTooltip
            guideKey="chat"
            tone={isUserMode ? 'teal' : 'indigo'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左カラム：やり取りの一覧（スマートフォンでも切り替えやすいリスト） */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3 h-fit">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2 px-1">
            <MessageSquare className="w-5 h-5 text-teal-800" aria-hidden="true" />
            やり取りの一覧
          </h1>

          <div className="space-y-2">
            {partnerList.map((partner) => {
              const isSelected = partner.id === selectedPartnerId;
              return (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => openChatWith(partner.id)}
                  className={`w-full min-h-[64px] p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 border-teal-700 text-teal-950'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-base truncate">
                      {partner.title}
                    </span>
                    {partner.unread > 0 && (
                      <span className="text-xs font-bold text-red-700 shrink-0">
                        未読 {partner.unread}件
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {partner.subtitle}
                  </p>
                  {partner.lastMsg && (
                    <p className="text-xs text-slate-700 mt-1 truncate">
                      {partner.lastMsg.text}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* 右カラム：LINE風チャットルーム＆段階的情報開示 */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
          {/* チャット相手ヘッダー＆情報開示ステータス */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {partnerObj?.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  {partnerObj?.subtitle} · 情報開示段階：
                  <strong className="text-teal-900">
                    第{disclosure.stage}段階（
                    {disclosure.stage === 3
                      ? '本人同意により詳細開示済み'
                      : '匿名でのメッセージ相談'}
                    ）
                  </strong>
                </p>
              </div>

              {isUserMode && (
                <div>
                  {disclosure.stage < 3 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowDisclosureModal(!showDisclosureModal)
                      }
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-teal-700 bg-white hover:bg-teal-50 text-teal-900 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      <span>個人情報の開示確認（第3段階へ）</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        revokeStage3Disclosure(currentUserId, currentProviderId)
                      }
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      詳細情報の開示を取り消す
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* チャット開始申請ステータスバナー */}
            {currentChatReq && currentChatReq.status === 'pending' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 space-y-2.5">
                {isUserMode ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-bold text-amber-950">
                        「{partnerObj?.title}」からチャット開始申請が届いています
                      </p>
                      <p className="text-xs text-slate-700">
                        承認するまであなたの氏名・連絡先は公開されません。匿名のままやり取りを始められます。
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          respondToChatRequest(currentChatReq.id, 'approved')
                        }
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold cursor-pointer"
                      >
                        承認する
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          respondToChatRequest(currentChatReq.id, 'declined')
                        }
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        辞退する
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-amber-950">
                      現在チャット開始申請中です（利用者・ご家族さまの承認待ち）
                    </p>
                    <p className="text-xs text-slate-700">
                      利用者さまが申請を承認すると、双方向でのメッセージやり取りが開始されます（申請日時：{currentChatReq.requestedAt}）。
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 利用者側：第3段階情報開示の確認パネル */}
            {isUserMode && showDisclosureModal && targetUserProfile && (
              <div className="p-4 rounded-xl bg-white border-2 border-teal-700 space-y-3 text-sm">
                <p className="font-bold text-slate-900">
                  【確認】「{partnerObj?.title}
                  」に以下の相談用情報を開示しますか？
                </p>
                <p className="text-xs text-slate-600">
                  第2段階（メッセージ交換中）では自動公開されていません。下のボタンを押した場合のみ相手に公開されます。
                </p>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs sm:text-sm">
                  <p>
                    ・ニックネームと立場：{targetUserProfile.nickname}（
                    {targetUserProfile.disclosableInfo.contactPersonRole}）
                  </p>
                  <p>
                    ・最寄り駅エリア：
                    {targetUserProfile.disclosableInfo.nearestStationArea}
                  </p>
                  <p>
                    ・担当相談支援事業所：
                    {
                      targetUserProfile.disclosableInfo
                        .consultationSupportOffice
                    }
                  </p>
                  <p>
                    ・具体的な希望日時メモ：
                    {targetUserProfile.disclosableInfo.detailedScheduleNote}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      grantStage3Disclosure(currentUserId, currentProviderId);
                      setShowDisclosureModal(false);
                      sendMessage(
                        currentUserId,
                        currentProviderId,
                        'user',
                        '【システム通知】具体的な面談・相談を進めるため、第3段階（最寄り駅エリア・担当相談支援事業所等）の情報を開示しました。'
                      );
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    この情報を事業所に開示する
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisclosureModal(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm cursor-pointer"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* 事業所側：第3段階開示済みの場合は開示情報を表示 */}
            {!isUserMode && disclosure.stage === 3 && targetUserProfile && (
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-300 text-xs sm:text-sm space-y-1">
                <p className="font-bold text-teal-950">
                  ★ご本人の同意により開示された情報（第3段階）：
                </p>
                <p className="text-slate-800">
                  最寄り駅：{targetUserProfile.disclosableInfo.nearestStationArea}{' '}
                  ／ 相談支援事業所：
                  {targetUserProfile.disclosableInfo.consultationSupportOffice}
                </p>
              </div>
            )}
          </div>

          {/* メッセージ履歴（LINEのように送信側と受信側の吹き出しを分ける） */}
          <div
            ref={messageListRef}
            role="log"
            aria-live="polite"
            aria-label="チャットメッセージ履歴"
            className="p-4 sm:p-6 space-y-4 min-h-[320px] max-h-[460px] overflow-y-auto bg-slate-100/70"
          >
            {threadMessages.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-base font-bold text-slate-700">
                  まだメッセージのやり取りはありません
                </p>
                <p className="text-sm text-slate-600">
                  下の「定型文ボタン」をタップすると、簡単に最初の質問メッセージを作成できます。
                </p>
              </div>
            ) : (
              threadMessages.map((msg) => {
                const isMine =
                  (isUserMode && msg.senderType === 'user') ||
                  (!isUserMode && msg.senderType === 'provider');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isMine ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-500 mb-1 px-1">
                      {isMine
                        ? 'あなた（送信）'
                        : `${partnerObj?.title || '相手'}（受信）`}
                    </span>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
                        isMine
                          ? 'bg-teal-800 text-white rounded-br-sm'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1 text-xs text-slate-500 font-mono tabular-nums">
                      <span>{msg.createdAt}</span>
                      {isMine && (
                        <span>{msg.readByRecipient ? '既読' : '送信済'}</span>
                      )}
                      <SpeechButton
                        compact
                        speechId={`chat-msg-${msg.id}`}
                        label="読み上げ"
                        tone={isUserMode ? 'teal' : 'indigo'}
                        getText={() =>
                          buildSingleChatMessageSpeechText({
                            isMine,
                            partnerTitle: partnerObj?.title || '相手',
                            text: msg.text,
                            createdAt: msg.createdAt,
                          })
                        }
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 定型文ボタン＆メッセージ入力フォーム */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-4">
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-600">
                定型文をタップして入力欄に挿入できます：
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => handleTemplateClick(tpl)}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-teal-50 hover:border-teal-700 text-left text-xs sm:text-sm font-bold text-slate-800 transition-colors cursor-pointer"
                  >
                    「{tpl}」
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleSend}
              className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
            >
              <div className="flex-1">
                <label htmlFor="chat-message-input" className="sr-only">
                  メッセージを入力
                </label>
                <textarea
                  id="chat-message-input"
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="メッセージを入力してください（または上の定型文を選んでください）"
                  className="w-full p-3.5 rounded-xl border border-slate-300 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
              <button
                type="submit"
                className="min-h-[52px] px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>送信する</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

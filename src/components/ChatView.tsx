import React, { useEffect, useState } from 'react';
import {
  Send,
  ShieldCheck,
  Check,
  MessageSquare,
  ArrowLeft,
  Lock,
  Calendar,
  CalendarCheck,
  Building2,
  AlertCircle,
  X,
  Flag,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  CHAT_TEMPLATES_PROVIDER,
  CHAT_TEMPLATES_USER,
  ChatMessageKind,
  DAYS_OF_WEEK,
  DayOfWeek,
  DISCREPANCY_REPORT_REASONS,
  DiscrepancyReportReason,
  ScheduleCandidateSlot,
  TIME_SLOTS,
  TimeSlot,
  UserPII,
} from '../types/domain';
import { getCurrentYearMonth } from '../utils/date';
import {
  getProviderDiscrepancySummary,
  getProviderFreshnessInfo,
} from '../utils/freshness';
import { verifyProviderChatAccess } from '../utils/subscription';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import {
  buildChatSpeechText,
  buildSingleChatMessageSpeechText,
} from '../utils/speech';
import {
  ProviderFreshnessBadge,
  ProviderReportWarningBadge,
} from './FreshnessBadges';

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
    chatRequests,
    sendMessage,
    confirmInterviewOrVisitSchedule,
    markMessagesRead,
    getDisclosureStage,
    grantStage2Disclosure,
    grantStage3Disclosure,
    revokeDisclosureToStage,
    getChatRequestBetween,
    sendChatRequest,
    respondToChatRequest,
    currentProviderSubscription,
    subscriptionPlans,
    currentProviderPlanDef,
    isCurrentProviderPaid,
    getPiiIfPermitted,
    getUserBundleById,
    navigateTo,
    currentUserBundle,
    effectiveReferenceDate,
    providerReports,
    submitProviderReport,
  } = useAppState();

  const isUserMode = role !== 'provider';

  const providerOverallChatAccess = verifyProviderChatAccess({
    subscription: currentProviderSubscription,
    plans: subscriptionPlans,
    allProviderChatRequests: chatRequests,
    currentYearMonth: getCurrentYearMonth(effectiveReferenceDate),
  });

  // パートナー一覧の構築（無料プランの事業所も利用者からの返信＆月1件の申請枠内なら利用可能）
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
          const canInit =
            providerOverallChatAccess.monthlyOutboundLimit === null ||
            (providerOverallChatAccess.remainingFreeRequests ?? 0) > 0;
          return (
            req?.initiatedBy === 'user' ||
            req?.status === 'approved' ||
            req?.status === 'pending' ||
            hasUserMsg ||
            canInit
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
              disc.stage >= 2
                ? `${u.anonymousCode}（${u.nickname}）`
                : u.anonymousCode,
            subtitle:
              disc.stage >= 2
                ? `${u.ageGroup} · ${u.city} · 第${disc.stage}段階`
                : `${u.city} · 第1段階（匿名相談）`,
            unread,
            lastMsg,
            reqStatus: req?.status,
          };
        });

  const selectedPartnerId =
    activeChatPartnerId && partnerList.some((p) => p.id === activeChatPartnerId)
      ? activeChatPartnerId
      : partnerList[0]?.id || '';

  const currentUserId = isUserMode ? activeUserId : selectedPartnerId;
  const currentProviderId = isUserMode ? selectedPartnerId : activeProviderId;
  const currentChatReq =
    currentUserId && currentProviderId
      ? getChatRequestBetween(currentUserId, currentProviderId)
      : undefined;

  const threadAccessCheck = !isUserMode
    ? verifyProviderChatAccess({
        subscription: currentProviderSubscription,
        plans: subscriptionPlans,
        chatRequest: currentChatReq,
        allProviderChatRequests: chatRequests,
        currentYearMonth: getCurrentYearMonth(effectiveReferenceDate),
      })
    : null;

  const [inputText, setInputText] = useState<string>('');
  const [disclosurePanelMode, setDisclosurePanelMode] = useState<
    'none' | 'stage2' | 'stage3'
  >('none');
  const [stageNotice, setStageNotice] = useState<string>('');
  const [stageError, setStageError] = useState<string>('');
  const [revealedPii, setRevealedPii] = useState<UserPII | null>(null);

  const [showReportPanel, setShowReportPanel] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<DiscrepancyReportReason>(
    DISCREPANCY_REPORT_REASONS[0]
  );
  const [reportNote, setReportNote] = useState<string>('');

  // 型のある構造化アクション（「面談を申し込む」「日程の候補を送る」「見学を申し込む」）
  const [scheduleComposerKind, setScheduleComposerKind] = useState<
    'interview_request' | 'visit_request' | 'schedule_proposal' | null
  >(null);
  const [selectedScheduleDays, setSelectedScheduleDays] = useState<DayOfWeek[]>([
    '水',
  ]);
  const [selectedScheduleTimeSlot, setSelectedScheduleTimeSlot] =
    useState<TimeSlot>('午前（9時〜12時）');
  const [scheduleNote, setScheduleNote] = useState<string>('');

  const messageListRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentUserId && currentProviderId) {
      markMessagesRead(
        currentUserId,
        currentProviderId,
        isUserMode ? 'user' : 'provider'
      );
    }
    setRevealedPii(null);
    setStageError('');
    setStageNotice('');
    setDisclosurePanelMode('none');
    setShowReportPanel(false);
  }, [currentUserId, currentProviderId, isUserMode]);

  const threadMessages = messages.filter(
    (m) => m.userId === currentUserId && m.providerId === currentProviderId
  );

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [threadMessages.length, currentUserId, currentProviderId]);

  const disclosure =
    currentUserId && currentProviderId
      ? getDisclosureStage(currentUserId, currentProviderId)
      : {
          userId: '',
          providerId: '',
          stage: 1 as const,
          disclosedFields: {
            nicknameAndRole: true,
            conditionProfile: false,
            nearestStationArea: false,
            preferredContactMethod: false,
            consultationSupportOffice: false,
            detailedScheduleNote: false,
            piiContactAccess: false,
          },
        };

  const partnerObj = partnerList.find((p) => p.id === selectedPartnerId);
  const targetUserBundle = currentUserId
    ? getUserBundleById(currentUserId)
    : undefined;
  const targetProviderProfile = currentProviderId
    ? providerProfiles.find((p) => p.id === currentProviderId)
    : undefined;
  const targetProviderFreshness = targetProviderProfile
    ? getProviderFreshnessInfo(
        targetProviderProfile.updatedAt,
        effectiveReferenceDate
      )
    : null;
  const targetProviderDiscrepancy = currentProviderId
    ? getProviderDiscrepancySummary(currentProviderId, providerReports)
    : null;

  const handleSubmitDiscrepancyReport = () => {
    if (!currentProviderId || !currentUserId) return;
    const { reportCount } = submitProviderReport({
      providerId: currentProviderId,
      userId: currentUserId,
      reason: reportReason,
      note: reportNote.trim() || undefined,
    });
    setShowReportPanel(false);
    setReportNote('');
    setStageError('');
    setStageNotice(
      reportCount >= 3
        ? `「情報と違った」を報告しました（累計 ${reportCount}件）。複数件の報告が集まったため、この事業所には「情報の確認中です」表示が出ます。`
        : `「情報と違った（${reportReason}）」を運営へ報告しました（現在 ${reportCount}件）。情報の正確性向上にご協力ありがとうございます。`
    );
  };

  useEffect(() => {
    if (!isUserMode && disclosure.stage === 3 && disclosure.disclosedFields.piiContactAccess && currentUserId) {
      const check = getPiiIfPermitted(currentUserId);
      if (check.permitted && check.data) {
        setRevealedPii(check.data);
      }
    }
  }, [isUserMode, disclosure.stage, disclosure.disclosedFields.piiContactAccess, currentUserId]);

  const dispatchMessageOrRequest = (
    textToSend: string,
    options?: {
      messageKind?: ChatMessageKind;
      proposedSlots?: ScheduleCandidateSlot[];
    }
  ): boolean => {
    if (!currentUserId || !currentProviderId || !textToSend.trim()) return false;
    if (!isUserMode && currentChatReq?.status !== 'approved') {
      const res = sendChatRequest(
        currentUserId,
        currentProviderId,
        'provider',
        textToSend.trim()
      );
      if (!res.ok) {
        setStageError(res.message || '無料プランの月間申請上限に達しています。');
        return false;
      }
      setStageNotice('チャット開始申請を送信しました。利用者の承認後に返信が届きます。');
      return true;
    }
    sendMessage(
      currentUserId,
      currentProviderId,
      isUserMode ? 'user' : 'provider',
      textToSend.trim(),
      options
    );
    return true;
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    if (dispatchMessageOrRequest(inputText)) {
      setInputText('');
    }
  };

  const handleSendStructuredSchedule = () => {
    if (selectedScheduleDays.length === 0) {
      setStageError('希望の曜日を1つ以上選択してください。');
      return;
    }
    setStageError('');
    const slots: ScheduleCandidateSlot[] = selectedScheduleDays.map((day) => ({
      day,
      timeSlot: selectedScheduleTimeSlot,
    }));
    const kindLabel =
      scheduleComposerKind === 'visit_request'
        ? '事業所見学を申し込みます'
        : scheduleComposerKind === 'interview_request'
        ? '事前面談を申し込みます'
        : '面談・見学の日程候補をお送りします';
    const slotsText = slots.map((s) => `${s.day}曜（${s.timeSlot}）`).join('・');
    const body = `${kindLabel}。希望候補：${slotsText}${
      scheduleNote.trim() ? ` ／ メモ：${scheduleNote.trim()}` : ''
    }`;

    const sent = dispatchMessageOrRequest(body, {
      messageKind: scheduleComposerKind || 'schedule_proposal',
      proposedSlots: slots,
    });
    if (sent) {
      setScheduleComposerKind(null);
      setScheduleNote('');
    }
  };

  const handleGrantStage2 = () => {
    if (!currentUserId || !currentProviderId) return;
    grantStage2Disclosure(currentUserId, currentProviderId);
    setDisclosurePanelMode('none');
    setStageError('');
    setStageNotice(
      '第2段階「条件の開示」に同意しました。障害種別・介助内容・希望曜日・特性プロフィールが事業所に開示されました。'
    );
    sendMessage(
      currentUserId,
      currentProviderId,
      'user',
      '【開示ステップ通知】第2段階「条件の開示」として、障害種別・介助内容・希望曜日・配慮事項を開示しました。'
    );
  };

  const handleGrantStage3 = () => {
    if (!currentUserId || !currentProviderId) return;
    const res = grantStage3Disclosure(currentUserId, currentProviderId, true);
    if (!res.ok) {
      setStageError(res.message || '日程確定後に開示できます。');
      return;
    }
    setDisclosurePanelMode('none');
    setStageError('');
    setStageNotice(
      '第3段階「連絡先の開示」に同意しました。氏名・電話番号・メールアドレスが事業所に開示されました。'
    );
    sendMessage(
      currentUserId,
      currentProviderId,
      'user',
      '【開示ステップ通知】面談・見学の日程決定に伴い、第3段階「連絡先（氏名・電話番号・メールアドレス）」を開示しました。'
    );
  };

  const templates = isUserMode ? CHAT_TEMPLATES_USER : CHAT_TEMPLATES_PROVIDER;

  if (partnerList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-28">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            まだチャット可能な相手がいません
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isUserMode
              ? '事業所一覧から受入条件カードを見て、まずは匿名のまま相談メッセージを送信できます。'
              : '利用者からのチャット受信・返信は無料です。今月の新規申請枠を使い切った場合は有料プランもご検討いただけます。'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigateTo(isUserMode ? 'user-search' : 'provider-search')
              }
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm cursor-pointer"
            >
              {isUserMode ? '受入条件カードから探す' : '利用希望者を見る'}
            </button>
            {!isUserMode && (
              <button
                type="button"
                onClick={() => navigateTo('provider-billing')}
                className="min-h-[46px] px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-sm cursor-pointer"
              >
                プランを確認する
              </button>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
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
              ? `利用者（${currentUserBundle.profile.anonymousCode}）として相談中`
              : `事業所（${currentProviderPlanDef.name}）として相談中`}
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

      {/* 3段階情報開示ステップインジケータ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {[
          {
            step: 1 as const,
            title: '第1段階「匿名相談」',
            desc: 'ニックネームと希望条件の概要のみで相談',
          },
          {
            step: 2 as const,
            title: '第2段階「条件の開示」',
            desc: '利用者同意で障害種別・介助内容・特性を開示',
          },
          {
            step: 3 as const,
            title: '第3段階「連絡先の開示」',
            desc: '面談/見学の日程確定後、同意により連絡先開示',
          },
        ].map((item) => {
          const reached = disclosure.stage >= item.step;
          const isCurrent = disclosure.stage === item.step;
          return (
            <div
              key={item.step}
              className={`p-3 rounded-xl border ${
                isCurrent
                  ? 'bg-teal-50 border-teal-700 text-teal-950'
                  : reached
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-2 font-bold">
                <span>{item.title}</span>
                {reached ? (
                  <span className="px-1.5 py-0.5 rounded bg-teal-800 text-white text-[10px]">
                    到達済
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">未開示</span>
                )}
              </div>
              <p className="text-[11px] mt-1 leading-snug">{item.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左カラム：やり取り一覧 */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3 h-fit">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2 px-1">
            <MessageSquare className="w-5 h-5 text-teal-800" aria-hidden="true" />
            やり取りの一覧
          </h1>

          {!isUserMode && !isCurrentProviderPaid && (
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-[11px] text-indigo-950 font-semibold tabular-nums">
              無料プラン：受信チャット返信は無制限 ／ 事業所からの新規申請は月1件まで（今月残り{' '}
              {providerOverallChatAccess.remainingFreeRequests ?? 0} 件）
            </div>
          )}

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

        {/* 右カラム：チャットルーム＆段階的開示 */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    {partnerObj?.title}
                  </h2>
                  {isUserMode && targetProviderFreshness && (
                    <ProviderFreshnessBadge info={targetProviderFreshness} />
                  )}
                  {isUserMode && targetProviderDiscrepancy && (
                    <ProviderReportWarningBadge summary={targetProviderDiscrepancy} />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  {partnerObj?.subtitle} · 現在：
                  <strong className="text-teal-900">
                    {disclosure.stage === 1
                      ? '第1段階「匿名相談」'
                      : disclosure.stage === 2
                      ? '第2段階「条件の開示済み」'
                      : '第3段階「連絡先の開示済み」'}
                  </strong>
                </p>
                {disclosure.scheduleSummary && (
                  <p className="text-xs font-bold text-emerald-900 mt-1 flex items-center gap-1">
                    <CalendarCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>確定日程：{disclosure.scheduleSummary}</span>
                  </p>
                )}
              </div>

              {isUserMode && (
                <div className="flex flex-wrap items-center gap-2">
                  {disclosure.stage === 1 && (
                    <button
                      type="button"
                      data-testid="chat-stage2-btn"
                      onClick={() =>
                        setDisclosurePanelMode(
                          disclosurePanelMode === 'stage2' ? 'none' : 'stage2'
                        )
                      }
                      className="min-h-[42px] px-3.5 py-2 rounded-xl border border-teal-700 bg-white hover:bg-teal-50 text-teal-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      <span>第2段階「条件の開示」へ進む</span>
                    </button>
                  )}

                  {disclosure.stage < 3 ? (
                    <button
                      type="button"
                      data-testid="chat-stage3-btn"
                      onClick={() =>
                        setDisclosurePanelMode(
                          disclosurePanelMode === 'stage3' ? 'none' : 'stage3'
                        )
                      }
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>第3段階「連絡先の開示」確認</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revokeDisclosureToStage(currentUserId, currentProviderId, 2)}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      連絡先の開示を取り消す
                    </button>
                  )}

                  {disclosure.stage >= 2 && (
                    <button
                      type="button"
                      onClick={() => revokeDisclosureToStage(currentUserId, currentProviderId, 1)}
                      className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      匿名相談に戻す
                    </button>
                  )}

                  <button
                    type="button"
                    data-testid="report-discrepancy-btn"
                    onClick={() => setShowReportPanel((prev) => !prev)}
                    className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      showReportPanel
                        ? 'bg-amber-700 border-amber-700 text-white'
                        : 'bg-white border-amber-300 text-amber-950 hover:bg-amber-50'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>情報と違った</span>
                  </button>
                </div>
              )}
            </div>

            {isUserMode && showReportPanel && (
              <div
                data-testid="report-discrepancy-modal"
                className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-500 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-extrabold text-amber-950">
                      掲載情報との相違を報告（{partnerObj?.title}）
                    </p>
                    <p className="text-xs text-amber-900">
                      当てはまる理由をお選びください。3件以上の報告が集まると、利用者画面に「情報の確認中です」と表示されます。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReportPanel(false)}
                    aria-label="報告パネルを閉じる"
                    className="p-1 rounded hover:bg-amber-200/70 text-amber-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DISCREPANCY_REPORT_REASONS.map((reason) => {
                    const selected = reportReason === reason;
                    return (
                      <label
                        key={reason}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                          selected
                            ? 'bg-white border-amber-700 text-amber-950 shadow-2xs'
                            : 'bg-white/70 border-amber-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="discrepancy-reason"
                          value={reason}
                          checked={selected}
                          onChange={() => setReportReason(reason)}
                          className="accent-amber-700"
                        />
                        <span>{reason}</span>
                      </label>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="詳しい状況メモ（任意：例『土曜の午後も空きなしと言われた』）"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs text-slate-900"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="submit-discrepancy-report-btn"
                    onClick={handleSubmitDiscrepancyReport}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold cursor-pointer"
                  >
                    この内容で報告する
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportPanel(false)}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-amber-950 text-xs font-bold cursor-pointer"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {stageNotice && (
              <div
                role="status"
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold"
              >
                {stageNotice}
              </div>
            )}

            {stageError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-950 text-xs font-bold flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span>{stageError}</span>
              </div>
            )}

            {/* チャット開始申請ステータスバナー */}
            {currentChatReq && currentChatReq.status === 'pending' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-2.5">
                {isUserMode ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-bold text-amber-950">
                        「{partnerObj?.title}」から相談の申し込みが届いています
                      </p>
                      <p className="text-xs text-slate-700">
                        承認しても第1段階（匿名相談）からスタートするため、連絡先はすぐには公開されません。
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
                  <p className="text-xs font-bold text-amber-950">
                    現在チャット開始申請中です（利用者の承認待ち · 申請：{currentChatReq.requestedAt}）
                  </p>
                )}
              </div>
            )}

            {/* 利用者側：第2段階条件開示の確認パネル */}
            {isUserMode && disclosurePanelMode === 'stage2' && targetUserBundle && (
              <div className="p-4 rounded-xl bg-white border-2 border-teal-700 space-y-3 text-sm">
                <p className="font-bold text-slate-900">
                  【第2段階：条件の開示】「{partnerObj?.title}」に以下の条件を開示しますか？
                </p>
                <p className="text-xs text-slate-600">
                  氏名・電話番号・メールアドレスはまだ非公開のまま、障害種別や介助内容などを伝えることができます。
                </p>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <p>・障害種別：{targetUserBundle.needs.disabilityTypes.join('・') || '未設定'}</p>
                  <p>・介助内容：{targetUserBundle.needs.careNeeds.join('・') || '未設定'}</p>
                  <p>
                    ・希望曜日・時間帯：{targetUserBundle.preferences.preferredDays.join('・')}曜 /{' '}
                    {targetUserBundle.preferences.preferredTimeSlots.join('・')}
                  </p>
                  <p>
                    ・苦手なこと・配慮事項：
                    {targetUserBundle.needs.dislikesAndAccommodations || '特記事項なし'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="confirm-stage2-btn"
                    onClick={handleGrantStage2}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>第2段階「条件の開示」に同意する</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisclosurePanelMode('none')}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* 利用者側：第3段階連絡先開示の確認パネル */}
            {isUserMode && disclosurePanelMode === 'stage3' && (
              <div className="p-4 rounded-xl bg-white border-2 border-teal-700 space-y-3 text-sm">
                <p className="font-bold text-slate-900">
                  【第3段階：連絡先の開示】「{partnerObj?.title}」へ氏名・電話番号・メールアドレスを開示
                </p>
                {!disclosure.scheduleDecidedAt ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1.5">
                    <p className="font-bold">
                      まだ「面談」または「見学」の日程が確定していません。
                    </p>
                    <p>
                      連絡先（氏名・電話番号・メールアドレス）の保護のため、下の「面談を申し込む」「見学を申し込む」「日程の候補を送る」から日程を確定したあとに開示できます。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                      確定済み日程：<strong>{disclosure.scheduleSummary}</strong>（確定日時：{disclosure.scheduleDecidedAt}）
                    </div>
                    <p className="text-xs text-slate-600">
                      面談・見学の連絡用として、氏名・電話番号・メールアドレスをこの事業所に開示します。後からいつでも「開示管理」画面で取り消せます。
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        data-testid="confirm-stage3-btn"
                        onClick={handleGrantStage3}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>連絡先（氏名・電話・メール）を開示する</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisclosurePanelMode('none')}
                        className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 事業所側：開示段階ごとの確認表示 */}
            {!isUserMode && targetUserBundle && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
                {disclosure.stage === 1 ? (
                  <p className="text-slate-600">
                    現在<strong>第1段階（匿名相談）</strong>です。希望サービス・エリアの概要のみでやり取りでき、障害種別や連絡先は利用者の同意後に開示されます。
                  </p>
                ) : (
                  <>
                    <p className="font-bold text-teal-950">
                      第{disclosure.stage}段階の開示情報（{targetUserBundle.profile.nickname}）
                    </p>
                    <p className="text-slate-700">
                      障害種別：{targetUserBundle.needs.disabilityTypes.join('・')} ／ 介助：
                      {targetUserBundle.needs.careNeeds.join('・')}
                    </p>
                    {targetUserBundle.needs.dislikesAndAccommodations && (
                      <p className="text-slate-700">
                        配慮事項：{targetUserBundle.needs.dislikesAndAccommodations}
                      </p>
                    )}
                    {revealedPii && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold">
                        連絡先（第3段階同意済み）：{revealedPii.fullName} ／ TEL：{revealedPii.phoneNumber} ／ Email：{revealedPii.email}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* メッセージ履歴 */}
          <div
            ref={messageListRef}
            role="log"
            aria-live="polite"
            aria-label="チャットメッセージ履歴"
            className="p-4 sm:p-6 space-y-4 min-h-[300px] max-h-[440px] overflow-y-auto bg-slate-100/70"
          >
            {threadMessages.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-base font-bold text-slate-700">
                  まだメッセージのやり取りはありません
                </p>
                <p className="text-xs sm:text-sm text-slate-600">
                  下の定型文ボタンや「面談を申し込む」「日程の候補を送る」ボタンから、すぐやり取りを始められます。
                </p>
              </div>
            ) : (
              threadMessages.map((msg) => {
                const isMine =
                  (isUserMode && msg.senderType === 'user') ||
                  (!isUserMode && msg.senderType === 'provider');
                const kindTag =
                  msg.messageKind === 'interview_request'
                    ? '面談申し込み'
                    : msg.messageKind === 'visit_request'
                    ? '見学申し込み'
                    : msg.messageKind === 'schedule_proposal'
                    ? '日程候補の提案'
                    : msg.messageKind === 'schedule_confirmed'
                    ? '面談・見学 日程確定'
                    : null;

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
                      className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed space-y-2 ${
                        isMine
                          ? 'bg-teal-800 text-white rounded-br-sm'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                      }`}
                    >
                      {kindTag && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isMine
                              ? 'bg-teal-900/60 text-teal-50'
                              : 'bg-teal-50 border border-teal-200 text-teal-950'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {kindTag}
                        </span>
                      )}
                      <p>{msg.text}</p>

                      {msg.proposedSlots && msg.proposedSlots.length > 0 && (
                        <div className="pt-1 space-y-1.5">
                          <span
                            className={`text-[11px] font-bold block ${
                              isMine ? 'text-teal-100' : 'text-slate-500'
                            }`}
                          >
                            提案された日程候補（クリックして確定）：
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.proposedSlots.map((slot, idx) => (
                              <button
                                key={`${slot.day}-${idx}`}
                                type="button"
                                disabled={Boolean(disclosure.scheduleDecidedAt)}
                                onClick={() =>
                                  confirmInterviewOrVisitSchedule({
                                    userId: currentUserId,
                                    providerId: currentProviderId,
                                    confirmedBy: isUserMode ? 'user' : 'provider',
                                    kind:
                                      msg.messageKind === 'visit_request'
                                        ? 'visit'
                                        : 'interview',
                                    slot,
                                  })
                                }
                                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border cursor-pointer disabled:opacity-60 disabled:cursor-default ${
                                  isMine
                                    ? 'bg-white text-teal-950 border-white hover:bg-teal-50'
                                    : 'bg-teal-50 border-teal-700 text-teal-950 hover:bg-teal-100'
                                }`}
                              >
                                <CalendarCheck className="w-3.5 h-3.5" />
                                <span>
                                  {slot.day}曜 {slot.timeSlot} で
                                  {msg.messageKind === 'visit_request' ? '見学' : '面談'}確定
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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

          {/* 構造化アクションボタン（「面談を申し込む」「日程の候補を送る」「見学を申し込む」）＋ 定型文＆入力フォーム */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-4">
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-700">
                型のある相談アクション（曜日と時間帯を選択して送信）：
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="action-interview-btn"
                  onClick={() =>
                    setScheduleComposerKind(
                      scheduleComposerKind === 'interview_request'
                        ? null
                        : 'interview_request'
                    )
                  }
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                    scheduleComposerKind === 'interview_request'
                      ? 'bg-teal-800 border-teal-800 text-white'
                      : 'bg-teal-50 border-teal-200 text-teal-950 hover:bg-teal-100'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" aria-hidden="true" />
                  <span>面談を申し込む</span>
                </button>
                <button
                  type="button"
                  data-testid="action-schedule-btn"
                  onClick={() =>
                    setScheduleComposerKind(
                      scheduleComposerKind === 'schedule_proposal'
                        ? null
                        : 'schedule_proposal'
                    )
                  }
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                    scheduleComposerKind === 'schedule_proposal'
                      ? 'bg-teal-800 border-teal-800 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span>日程の候補を送る</span>
                </button>
                <button
                  type="button"
                  data-testid="action-visit-btn"
                  onClick={() =>
                    setScheduleComposerKind(
                      scheduleComposerKind === 'visit_request'
                        ? null
                        : 'visit_request'
                    )
                  }
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                    scheduleComposerKind === 'visit_request'
                      ? 'bg-teal-800 border-teal-800 text-white'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-950 hover:bg-indigo-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" aria-hidden="true" />
                  <span>見学を申し込む</span>
                </button>
              </div>
            </div>

            {scheduleComposerKind && (
              <div className="p-4 rounded-xl bg-slate-50 border border-teal-700 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    {scheduleComposerKind === 'visit_request'
                      ? '事業所見学の日程候補を選んで送信'
                      : scheduleComposerKind === 'interview_request'
                      ? '事前面談の日程候補を選んで送信'
                      : '面談・見学の日程候補を選択して送信'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setScheduleComposerKind(null)}
                    aria-label="日程選択を閉じる"
                    className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-600 block">
                    曜日（複数選択可）：
                  </span>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const active = selectedScheduleDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setSelectedScheduleDays((prev) =>
                              prev.includes(day)
                                ? prev.filter((d) => d !== day)
                                : [...prev, day]
                            )
                          }
                          className={`min-h-[38px] rounded-lg border text-xs font-bold cursor-pointer ${
                            active
                              ? 'bg-teal-800 border-teal-800 text-white'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="schedule-slot-select"
                    className="text-xs font-bold text-slate-600 block"
                  >
                    時間帯：
                  </label>
                  <select
                    id="schedule-slot-select"
                    value={selectedScheduleTimeSlot}
                    onChange={(e) =>
                      setSelectedScheduleTimeSlot(e.target.value as TimeSlot)
                    }
                    className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  value={scheduleNote}
                  onChange={(e) => setScheduleNote(e.target.value)}
                  placeholder="補足メモ（例：家族も同席予定です）"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900"
                />

                <button
                  type="button"
                  data-testid="submit-schedule-proposal-btn"
                  onClick={handleSendStructuredSchedule}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>選択した候補日程で送信する</span>
                </button>
              </div>
            )}

            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-600">
                定型文をタップして入力欄に挿入できます：
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => setInputText(tpl)}
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-teal-50 hover:border-teal-700 text-left text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                  >
                    「{tpl}」
                  </button>
                ))}
              </div>
            </div>

            {threadAccessCheck &&
              !threadAccessCheck.canSendMessage &&
              !threadAccessCheck.canRequestChat && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 font-semibold flex flex-wrap items-center justify-between gap-2">
                  <span>{threadAccessCheck.reason}</span>
                  <button
                    type="button"
                    onClick={() => navigateTo('provider-billing')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-800 text-white font-bold cursor-pointer"
                  >
                    プランを確認する
                  </button>
                </div>
              )}

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
                  placeholder="メッセージを入力してください（または上のボタン・定型文を選んでください）"
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

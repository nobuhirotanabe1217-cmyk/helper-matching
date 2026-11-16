import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  CreditCard,
  Landmark,
  AlertCircle,
  Calendar,
  Sparkles,
  Lock,
  Scale,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { PaymentMethodType, ProviderPaymentSummary } from '../types/domain';
import {
  BankTransferFormValues,
  buildMaskedBankSummary,
  buildMaskedCardSummary,
  CreditCardFormValues,
  validateBankTransferForm,
  validateCreditCardForm,
} from '../utils/payment';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { SubscriptionPlanIllustration } from './VisualHelpers';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import { buildProviderBillingSpeechText } from '../utils/speech';

export const ProviderBillingView: React.FC = () => {
  const {
    activeProviderId,
    currentProviderBundle,
    subscriptionPlans,
    currentProviderSubscription,
    currentProviderPlanDef,
    isCurrentProviderPaid,
    subscribeProviderToPlan,
    updateProviderPaymentMethod,
    cancelProviderSubscription,
    navigateTo,
  } = useAppState();

  const [showConfirmContract, setShowConfirmContract] =
    useState<boolean>(false);
  const [showPaymentEditor, setShowPaymentEditor] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string>('');
  const [paymentErrorBanner, setPaymentErrorBanner] = useState<string>('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    currentProviderSubscription.paymentSummary?.method || 'credit_card'
  );
  const [cardValues, setCardValues] = useState<CreditCardFormValues>({
    cardNumber: '',
    expiry: '',
    cvc: '',
    cardHolder: '',
  });
  const [cardErrors, setCardErrors] = useState<
    Partial<Record<keyof CreditCardFormValues, string>>
  >({});
  const [bankValues, setBankValues] = useState<BankTransferFormValues>({
    bankName: '',
    branchCode: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountHolderKana: '',
    verificationMode: 'online',
  });
  const [bankErrors, setBankErrors] = useState<
    Partial<Record<keyof BankTransferFormValues, string>>
  >({});

  const standardPlan =
    subscriptionPlans.find((p) => p.id === 'standard') || subscriptionPlans[1];

  const validateAndBuildPaymentSummary = (): ProviderPaymentSummary | null => {
    if (paymentMethod === 'credit_card') {
      const check = validateCreditCardForm(cardValues);
      if (!check.valid) {
        setCardErrors(check.errors);
        setPaymentErrorBanner(
          'クレジットカード情報を正しく入力してください（「テスト用決済情報を入力」ボタンも使えます）。'
        );
        return null;
      }
      setCardErrors({});
      setPaymentErrorBanner('');
      return buildMaskedCardSummary(cardValues);
    }

    const check = validateBankTransferForm(bankValues);
    if (!check.valid) {
      setBankErrors(check.errors);
      setPaymentErrorBanner(
        '銀行口座振替情報を正しく入力してください（「テスト用決済情報を入力」ボタンも使えます）。'
      );
      return null;
    }
    setBankErrors({});
    setPaymentErrorBanner('');
    return buildMaskedBankSummary(bankValues);
  };

  const handleConfirmSubscribe = () => {
    const summary = validateAndBuildPaymentSummary();
    if (!summary) return;
    subscribeProviderToPlan(activeProviderId, 'standard', summary);
    setShowConfirmContract(false);
    setFeedbackBanner(
      `【デモ契約完了】「${currentProviderBundle.profile.name}」を有料プラン（月額 ${standardPlan.monthlyPriceYen.toLocaleString()}円／${summary.method === 'credit_card' ? 'クレジットカード' : '銀行口座振替'}：${summary.displayLabel}）に切り替えました。`
    );
  };

  const handleUpdatePaymentMethod = () => {
    const summary = validateAndBuildPaymentSummary();
    if (!summary) return;
    updateProviderPaymentMethod(activeProviderId, summary);
    setShowPaymentEditor(false);
    setFeedbackBanner(
      `【お支払い方法更新】「${summary.displayLabel}（${summary.billingDayLabel}）」へ変更しました。`
    );
  };

  const handleConfirmCancel = () => {
    cancelProviderSubscription(activeProviderId);
    setShowCancelModal(false);
    setFeedbackBanner(
      '【デモ解約完了】有料プランの解約手続きを完了し、無料プラン（0円）へ変更しました。事業所掲載・適合度確認・利用者からの受信チャット返信は引き続き無料でご利用いただけます。'
    );
  };

  const savedPayment = currentProviderSubscription.paymentSummary;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* 上部戻るボタン */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigateTo('provider-dashboard')}
          className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200/70 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          事業所ホームへ戻る
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            試作品デモ・実際の請求は発生しません
          </span>
          <SpeechButton
            speechId="screen-provider-billing"
            isPrimaryScreenReader
            tone="indigo"
            getText={() =>
              buildProviderBillingSpeechText({
                providerName: currentProviderBundle.profile.name,
                planName: currentProviderPlanDef.name,
                monthlyPriceYen: currentProviderPlanDef.monthlyPriceYen,
                paymentSummaryLabel: savedPayment?.displayLabel,
              })
            }
          />
          <HelpTooltip guideKey="provider-billing" tone="indigo" />
        </div>
      </div>

      {/* 法令遵守（非・斡旋）＆ サブスク課金ポイント */}
      <section className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <Scale className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              事業モデル設計：契約成立の「斡旋手数料（成果報酬）」ゼロ・純粋DXサブスク型
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              障害福祉分野で法的な懸念となる「利用者の紹介・契約成立に対する成果報酬（斡旋）」を完全に排し、
              <strong>事業所登録・検索掲載・利用者から届いた相談への返信は無料（0円）</strong>
              としています。月額3,980円の有料プランは、
              <strong>
                事業所側からの積極的なチャット開始申請・新着通知・案件管理DXツール
              </strong>
              に対する定額ソフトウェア利用料（クレジットカード・口座振替対応）として設計されています。
            </p>
          </div>
        </div>
      </section>

      {feedbackBanner && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-teal-50 border-2 border-teal-700 text-teal-950 font-bold text-sm sm:text-base"
        >
          {feedbackBanner}
        </div>
      )}

      {/* 現在の契約状況ヘッダーカード */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <SubscriptionPlanIllustration className="w-20 h-16 shrink-0" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-teal-800 block">
                対象事業所：{currentProviderBundle.profile.name}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                プラン契約・決済管理
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                クレジットカード・銀行口座振替に対応。登録・掲載・利用者からの受信チャット返信は無料です。
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shrink-0 space-y-1.5 min-w-[260px]">
            <span className="text-xs font-bold text-slate-500 block">
              現在の契約・お支払い状況
            </span>
            <p className="text-lg font-bold text-teal-900">
              {currentProviderPlanDef.name}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                月額 {currentProviderPlanDef.monthlyPriceYen.toLocaleString()}円
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                次回更新：{currentProviderSubscription.nextRenewalDate}
              </span>
            </div>

            {isCurrentProviderPaid && (
              <div className="pt-1.5 border-t border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  {savedPayment?.method === 'bank_transfer' ? (
                    <Landmark className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  )}
                  <span>
                    {savedPayment
                      ? savedPayment.displayLabel
                      : '決済方法未設定（デモ切替）'}
                  </span>
                </div>
                {savedPayment && (
                  <p className="text-[11px] text-slate-500">
                    {savedPayment.billingDayLabel}
                  </p>
                )}
                <button
                  type="button"
                  data-testid="billing-edit-payment-btn"
                  onClick={() => {
                    setShowPaymentEditor(!showPaymentEditor);
                    setPaymentErrorBanner('');
                  }}
                  className="text-xs font-extrabold text-indigo-800 underline cursor-pointer pt-0.5"
                >
                  {showPaymentEditor
                    ? '支払方法の編集を閉じる'
                    : '支払方法を変更する（カード ⇔ 口座振替）'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 有料契約中：お支払い方法の編集パネル */}
        {isCurrentProviderPaid && showPaymentEditor && (
          <div className="space-y-4">
            {paymentErrorBanner && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-red-50 border border-red-400 text-red-950 text-xs sm:text-sm font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{paymentErrorBanner}</span>
              </div>
            )}

            <PaymentMethodSelector
              method={paymentMethod}
              onMethodChange={(m) => {
                setPaymentMethod(m);
                setCardErrors({});
                setBankErrors({});
                setPaymentErrorBanner('');
              }}
              cardValues={cardValues}
              onCardValuesChange={setCardValues}
              cardErrors={cardErrors}
              bankValues={bankValues}
              onBankValuesChange={setBankValues}
              bankErrors={bankErrors}
              monthlyPriceYen={currentProviderPlanDef.monthlyPriceYen}
              accent="indigo"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="billing-save-payment-btn"
                onClick={handleUpdatePaymentMethod}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                このお支払い方法で更新する
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentEditor(false)}
                className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 料金プラン比較カード（3段階：無料 / 有料スタンダード / 将来拡張上位プラン） */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {subscriptionPlans.map((plan) => {
            const isCurrent = currentProviderSubscription.planId === plan.id;
            const isStandard = plan.id === 'standard';

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-5 flex flex-col justify-between gap-5 border-2 ${
                  isStandard
                    ? 'border-teal-700 bg-teal-50/30 shadow-xs'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${
                        isStandard
                          ? 'bg-teal-800 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {plan.badgeText}
                    </span>
                    {isCurrent && (
                      <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
                        現在契約中
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {plan.name}
                    </h2>
                    <p className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
                        {plan.monthlyPriceYen.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        円 / 月（税込・仮設定）
                      </span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {plan.description}
                  </p>

                  <ul className="space-y-2 pt-2 border-t border-slate-200/80 text-xs sm:text-sm text-slate-800">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  {plan.id === 'free' ? (
                    isCurrent ? (
                      <div className="w-full min-h-[46px] px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs sm:text-sm flex items-center justify-center">
                        現在のプラン（無料）
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="w-full min-h-[46px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
                      >
                        解約して無料プランへ戻す
                      </button>
                    )
                  ) : plan.id === 'standard' ? (
                    isCurrent ? (
                      <div className="w-full min-h-[48px] px-4 py-2 rounded-xl bg-teal-100 text-teal-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4 text-teal-800" />
                        ご契約中（すべてのDX機能を利用可能）
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid="billing-open-subscribe-btn"
                        onClick={() => {
                          setShowConfirmContract(true);
                          setPaymentErrorBanner('');
                        }}
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <CreditCard className="w-4 h-4" aria-hidden="true" />
                        有料プランを申し込む（カード／口座振替）
                      </button>
                    )
                  ) : (
                    <div className="w-full min-h-[46px] px-4 py-2 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      将来の拡張プラン（準備中）
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 契約内容の確認＆お支払い手続きパネル（申込ボタン押下時） */}
        {showConfirmContract && !isCurrentProviderPaid && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-teal-700 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-800" />
                有料プラン申込・お支払い手続き
              </h3>
              <span className="text-xs font-mono font-bold text-teal-900 tabular-nums">
                月額 {standardPlan.monthlyPriceYen.toLocaleString()}円（税込）
              </span>
            </div>

            {paymentErrorBanner && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-red-50 border border-red-400 text-red-950 text-xs sm:text-sm font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{paymentErrorBanner}</span>
              </div>
            )}

            <PaymentMethodSelector
              method={paymentMethod}
              onMethodChange={(m) => {
                setPaymentMethod(m);
                setCardErrors({});
                setBankErrors({});
                setPaymentErrorBanner('');
              }}
              cardValues={cardValues}
              onCardValuesChange={setCardValues}
              cardErrors={cardErrors}
              bankValues={bankValues}
              onBankValuesChange={setBankValues}
              bankErrors={bankErrors}
              monthlyPriceYen={standardPlan.monthlyPriceYen}
              accent="teal"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="billing-confirm-subscribe-btn"
                onClick={handleConfirmSubscribe}
                className="min-h-[48px] px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                この内容で契約を確定する（デモ）
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmContract(false)}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 解約手続き画面（有料プラン契約中のみ表示） */}
        {isCurrentProviderPaid && (
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-800">
                解約手続き（無料プランへの変更）
              </p>
              <p className="text-xs text-slate-600">
                解約すると無料プラン（0円）に戻り、事業所からの積極チャット申請や案件管理DXが停止します（事業所掲載や利用者からの受信チャット返信は継続できます）。
              </p>
            </div>
            {!showCancelModal ? (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shrink-0 cursor-pointer"
              >
                解約手続き画面を開く
              </button>
            ) : null}
          </div>
        )}

        {showCancelModal && (
          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700" />
              有料プランの解約確認（デモ画面）
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              「{currentProviderBundle.profile.name}
              」の有料プランを解約し、無料プラン（0円）へ変更しますか？いつでも再度有料プランへ切り替えることができます。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm cursor-pointer"
              >
                解約して無料プランに変更する
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
              >
                有料プランを継続する
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

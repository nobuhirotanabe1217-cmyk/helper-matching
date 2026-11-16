import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  CreditCard,
  Landmark,
  FileText,
  AlertCircle,
  Calendar,
  Lock,
  Printer,
  X,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  BillingCycle,
  PaymentMethodType,
  ProviderPaymentSummary,
  SubscriptionPlanId,
} from '../types/domain';
import {
  BankTransferFormValues,
  buildInvoicePaymentSummary,
  buildMaskedBankSummary,
  buildMaskedCardSummary,
  CreditCardFormValues,
  InvoiceFormValues,
  isInvoicePaymentAllowed,
  MockInvoiceDocument,
  validateBankTransferForm,
  validateCreditCardForm,
  validateInvoiceForm,
} from '../utils/payment';
import { CORE_SUBSCRIPTION_MESSAGE } from '../utils/subscription';
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

  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>(
    currentProviderSubscription.planId === 'free'
      ? 'standard'
      : currentProviderSubscription.planId
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    currentProviderSubscription.billingCycle || 'monthly'
  );
  const [showConfirmContract, setShowConfirmContract] = useState<boolean>(false);
  const [showPaymentEditor, setShowPaymentEditor] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [issuedInvoiceDoc, setIssuedInvoiceDoc] =
    useState<MockInvoiceDocument | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string>('');
  const [paymentErrorBanner, setPaymentErrorBanner] = useState<string>('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    currentProviderSubscription.paymentSummary?.method || 'bank_transfer'
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
  const [invoiceValues, setInvoiceValues] = useState<InvoiceFormValues>({
    organizationName: currentProviderBundle.profile.name,
    billingEmail: '',
    billingAddress: '',
    contactDepartment: '法人本部 経理ご担当者様',
  });
  const [invoiceErrors, setInvoiceErrors] = useState<
    Partial<Record<keyof InvoiceFormValues, string>> & { eligibility?: string }
  >({});

  const targetPlan =
    subscriptionPlans.find((p) => p.id === selectedPlanId) ||
    subscriptionPlans[1];
  const displayAmountYen =
    billingCycle === 'annual'
      ? targetPlan.annualPriceYen
      : targetPlan.monthlyPriceYen;

  const validateAndBuildPayment = (
    targetPlanId: SubscriptionPlanId,
    cycle: BillingCycle
  ): {
    summary: ProviderPaymentSummary;
    invoiceDoc?: MockInvoiceDocument;
  } | null => {
    if (paymentMethod === 'credit_card') {
      const check = validateCreditCardForm(cardValues);
      if (!check.valid) {
        setCardErrors(check.errors);
        setPaymentErrorBanner(
          'クレジットカード情報を正しく入力してください（「テスト用支払情報を入力」も利用できます）。'
        );
        return null;
      }
      setCardErrors({});
      setPaymentErrorBanner('');
      return { summary: buildMaskedCardSummary(cardValues) };
    }

    if (paymentMethod === 'bank_transfer') {
      const check = validateBankTransferForm(bankValues);
      if (!check.valid) {
        setBankErrors(check.errors);
        setPaymentErrorBanner(
          '口座振替の金融機関・口座番号・名義を正しく入力してください。'
        );
        return null;
      }
      setBankErrors({});
      setPaymentErrorBanner('');
      return { summary: buildMaskedBankSummary(bankValues) };
    }

    const check = validateInvoiceForm(invoiceValues, targetPlanId, cycle);
    if (!check.valid) {
      setInvoiceErrors(check.errors);
      setPaymentErrorBanner(
        check.errors.eligibility ||
          '請求書払いの宛名・送付先メールアドレスを正しく入力してください。'
      );
      return null;
    }
    setInvoiceErrors({});
    setPaymentErrorBanner('');
    const { summary, invoice } = buildInvoicePaymentSummary(invoiceValues);
    return { summary, invoiceDoc: invoice };
  };

  const handleConfirmSubscribe = () => {
    const built = validateAndBuildPayment(selectedPlanId, billingCycle);
    if (!built) return;
    subscribeProviderToPlan(
      activeProviderId,
      selectedPlanId,
      built.summary,
      billingCycle
    );
    setShowConfirmContract(false);
    if (built.invoiceDoc) {
      setIssuedInvoiceDoc(built.invoiceDoc);
    }
    setFeedbackBanner(
      `「${currentProviderBundle.profile.name}」を${targetPlan.name}（${billingCycle === 'annual' ? '年払い' : '月額払い'}：${displayAmountYen.toLocaleString()}円／${built.summary.displayLabel}）に設定しました。`
    );
  };

  const handleIssueInvoiceClick = () => {
    const built = validateAndBuildPayment('pro', 'annual');
    if (!built || !built.invoiceDoc) return;
    subscribeProviderToPlan(activeProviderId, 'pro', built.summary, 'annual');
    setIssuedInvoiceDoc(built.invoiceDoc);
    setShowConfirmContract(false);
    setFeedbackBanner(
      `請求書 ${built.invoiceDoc.invoiceNumber} を発行し、上位プラン（年払い）の契約手続きを記録しました。`
    );
  };

  const handleUpdatePaymentMethod = () => {
    const activeCycle = currentProviderSubscription.billingCycle || 'monthly';
    const built = validateAndBuildPayment(
      currentProviderSubscription.planId,
      activeCycle
    );
    if (!built) return;
    updateProviderPaymentMethod(activeProviderId, built.summary);
    setShowPaymentEditor(false);
    if (built.invoiceDoc) {
      setIssuedInvoiceDoc(built.invoiceDoc);
    }
    setFeedbackBanner(
      `お支払い方法を「${built.summary.displayLabel}」に更新しました。`
    );
  };

  const handleConfirmCancel = () => {
    cancelProviderSubscription(activeProviderId);
    setShowCancelModal(false);
    setFeedbackBanner(
      '有料プランの解約を完了し、無料プラン（0円）に戻りました。引き続き掲載・受信チャットへの返信・月1件の申請をご利用いただけます。'
    );
  };

  const savedPayment = currentProviderSubscription.paymentSummary;
  const currentCycleLabel =
    currentProviderSubscription.billingCycle === 'annual' ? '年払い' : '月額払い';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
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

      {/* コアメッセージバナー */}
      <section className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-2">
        <h2 className="text-base sm:text-lg font-bold text-white">
          ケアピタ 料金プランの考え方
        </h2>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {CORE_SUBSCRIPTION_MESSAGE}
          有料プランに加入しても<strong>相性％（適合度）が上がることはありません</strong>（適合度は利用者の希望と受入条件カードの一致度のみで算出します）。
        </p>
      </section>

      {feedbackBanner && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-teal-50 border border-teal-700 text-teal-950 font-bold text-sm"
        >
          {feedbackBanner}
        </div>
      )}

      {/* 現在の契約・支払方法・次回請求日 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <SubscriptionPlanIllustration className="w-20 h-16 shrink-0" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-800 block">
                対象事業所：{currentProviderBundle.profile.name}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                料金プラン・お支払い管理
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                口座振替・クレジットカード・請求書払い（年払い×上位プラン）に対応しています。
              </p>
            </div>
          </div>

          <div
            data-testid="billing-current-summary"
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 shrink-0 space-y-2 min-w-[270px]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500">
                現在の契約状況
              </span>
              <span className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                {currentCycleLabel}
              </span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {currentProviderPlanDef.name}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 tabular-nums">
              <span className="font-mono font-bold text-slate-900">
                {currentProviderSubscription.billingCycle === 'annual'
                  ? `年額 ${currentProviderPlanDef.annualPriceYen.toLocaleString()}円`
                  : `月額 ${currentProviderPlanDef.monthlyPriceYen.toLocaleString()}円`}
                （税込）
              </span>
              <span>／</span>
              <span className="inline-flex items-center gap-1 font-bold">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                次回請求日：{currentProviderSubscription.nextRenewalDate}
              </span>
            </div>

            {isCurrentProviderPaid && (
              <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  {savedPayment?.method === 'bank_transfer' ? (
                    <Landmark className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  ) : savedPayment?.method === 'invoice' ? (
                    <FileText className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  )}
                  <span>
                    お支払い方法：
                    {savedPayment ? savedPayment.displayLabel : '未設定'}
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
                  className="text-xs font-bold text-indigo-800 underline cursor-pointer pt-0.5"
                >
                  {showPaymentEditor
                    ? '支払方法の編集を閉じる'
                    : 'お支払い方法を変更する'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 支払方法編集パネル */}
        {isCurrentProviderPaid && showPaymentEditor && (
          <div className="space-y-4">
            {paymentErrorBanner && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-950 text-xs font-bold flex items-center gap-2"
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
                setInvoiceErrors({});
                setPaymentErrorBanner('');
              }}
              planId={currentProviderSubscription.planId}
              billingCycle={
                currentProviderSubscription.billingCycle || 'monthly'
              }
              cardValues={cardValues}
              onCardValuesChange={setCardValues}
              cardErrors={cardErrors}
              bankValues={bankValues}
              onBankValuesChange={setBankValues}
              bankErrors={bankErrors}
              invoiceValues={invoiceValues}
              onInvoiceValuesChange={setInvoiceValues}
              invoiceErrors={invoiceErrors}
              displayAmountYen={
                currentProviderSubscription.billingCycle === 'annual'
                  ? currentProviderPlanDef.annualPriceYen
                  : currentProviderPlanDef.monthlyPriceYen
              }
              accent="indigo"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="billing-save-payment-btn"
                onClick={handleUpdatePaymentMethod}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                このお支払い方法で更新する
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentEditor(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 月額払い ⇔ 年払い 切替トグル */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div>
            <p className="text-xs font-bold text-slate-900">
              お支払いサイクルを選択（月額払い ／ 年払い）
            </p>
            <p className="text-[11px] text-slate-600">
              年払いを選ぶと年間コストが割安になり、「上位プラン」では請求書払い（銀行振込）が選択できます。
            </p>
          </div>
          <div
            role="group"
            aria-label="支払いサイクル"
            className="inline-flex p-1 rounded-xl bg-white border border-slate-300 shrink-0"
          >
            <button
              type="button"
              data-testid="billing-cycle-monthly"
              onClick={() => {
                setBillingCycle('monthly');
                if (paymentMethod === 'invoice') {
                  setPaymentMethod('bank_transfer');
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-800 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              月額払い
            </button>
            <button
              type="button"
              data-testid="billing-cycle-annual"
              onClick={() => setBillingCycle('annual')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                billingCycle === 'annual'
                  ? 'bg-indigo-800 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              年払い（請求書対応可）
            </button>
          </div>
        </div>

        {/* 3プラン比較カード */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {subscriptionPlans.map((plan) => {
            const isCurrent = currentProviderSubscription.planId === plan.id;
            const isStandard = plan.id === 'standard';
            const isPro = plan.id === 'pro';
            const shownPrice =
              billingCycle === 'annual'
                ? plan.annualPriceYen
                : plan.monthlyPriceYen;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-5 flex flex-col justify-between gap-5 border ${
                  isStandard
                    ? 'border-indigo-700 bg-indigo-50/25'
                    : isPro
                      ? 'border-slate-800 bg-slate-50/50'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md whitespace-nowrap ${
                        isStandard
                          ? 'bg-indigo-800 text-white'
                          : isPro
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {plan.badgeText}
                    </span>
                    {isCurrent && (
                      <span className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md whitespace-nowrap">
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
                        {shownPrice.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        円 / {billingCycle === 'annual' ? '年（税込）' : '月（税込）'}
                      </span>
                    </p>
                    {plan.id !== 'free' && billingCycle === 'annual' && (
                      <p className="text-[11px] font-bold text-emerald-800 tabular-nums mt-0.5">
                        月換算 約{Math.round(plan.annualPriceYen / 12).toLocaleString()}円／月
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {plan.description}
                  </p>

                  <ul className="space-y-2 pt-2 border-t border-slate-200/80 text-xs text-slate-800">
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
                      <div className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                        現在のプラン（無料）
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        解約して無料プランへ戻す
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      data-testid={`billing-select-plan-${plan.id}`}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setShowConfirmContract(true);
                        setPaymentErrorBanner('');
                        if (
                          !isInvoicePaymentAllowed(plan.id, billingCycle) &&
                          paymentMethod === 'invoice'
                        ) {
                          setPaymentMethod('bank_transfer');
                        }
                      }}
                      className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer ${
                        isPro
                          ? 'bg-slate-900 hover:bg-slate-800'
                          : 'bg-indigo-800 hover:bg-indigo-900'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 shrink-0" />
                      <span>
                        {isCurrent
                          ? `${plan.name}を再設定・サイクル変更`
                          : `${plan.name}に申し込む`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 申込・お支払い手続きフォーム */}
        {showConfirmContract && selectedPlanId !== 'free' && (
          <div
            data-testid="billing-checkout-panel"
            className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-indigo-700 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-800" />
                {targetPlan.name} 申込・お支払い手続き
              </h3>
              <span className="text-xs font-mono font-bold text-indigo-900 tabular-nums">
                {billingCycle === 'annual' ? '年払い一括' : '月額払い'}：
                {displayAmountYen.toLocaleString()}円（税込）
              </span>
            </div>

            {paymentErrorBanner && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-950 text-xs font-bold flex items-center gap-2"
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
                setInvoiceErrors({});
                setPaymentErrorBanner('');
              }}
              planId={selectedPlanId}
              billingCycle={billingCycle}
              cardValues={cardValues}
              onCardValuesChange={setCardValues}
              cardErrors={cardErrors}
              bankValues={bankValues}
              onBankValuesChange={setBankValues}
              bankErrors={bankErrors}
              invoiceValues={invoiceValues}
              onInvoiceValuesChange={setInvoiceValues}
              invoiceErrors={invoiceErrors}
              displayAmountYen={displayAmountYen}
              accent="indigo"
            />

            <div className="flex flex-wrap items-center gap-3">
              {paymentMethod === 'invoice' &&
              isInvoicePaymentAllowed(selectedPlanId, billingCycle) ? (
                <button
                  type="button"
                  data-testid="billing-issue-invoice-btn"
                  onClick={handleIssueInvoiceClick}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  請求書を発行する（上位プラン年払い）
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="billing-confirm-subscribe-btn"
                  onClick={handleConfirmSubscribe}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  この内容で申し込む
                </button>
              )}
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

        {/* 解約導線 */}
        {isCurrentProviderPaid && (
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-800">
                解約手続き（無料プランへの変更）
              </p>
              <p className="text-xs text-slate-600">
                無料プラン（0円）へ変更しても、事業所掲載・利用者からの相談返信・月1件の申請機能はそのまま残ります。
              </p>
            </div>
            {!showCancelModal && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shrink-0 cursor-pointer"
              >
                無料プランへ戻す
              </button>
            )}
          </div>
        )}

        {showCancelModal && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-300 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700" />
              無料プラン（0円）への変更確認
            </h3>
            <p className="text-xs sm:text-sm text-slate-700">
              「{currentProviderBundle.profile.name}
              」を無料プランに戻しますか？いつでも再契約できます。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                解約して無料プランに戻す
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs cursor-pointer"
              >
                現在のプランを継続する
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 請求書プレビューモーダル */}
      {issuedInvoiceDoc && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="invoice-preview-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-800" />
                請求書（銀行振込・控え）
              </h2>
              <button
                type="button"
                onClick={() => setIssuedInvoiceDoc(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">請求書番号</span>
                <span className="font-mono font-bold text-slate-900">
                  {issuedInvoiceDoc.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">宛名</span>
                <span className="font-bold text-slate-900">
                  {issuedInvoiceDoc.recipientOrganization} 御中
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">ご請求金額（税込）</span>
                <span className="font-mono font-bold text-lg text-slate-900 tabular-nums">
                  {issuedInvoiceDoc.amountYen.toLocaleString()}円
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">お振込期限</span>
                <span className="font-mono font-bold text-slate-900">
                  {issuedInvoiceDoc.dueDate}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-600 block">
                  お振込先口座（サンプル）
                </span>
                <p className="font-bold text-slate-900 text-xs">
                  {issuedInvoiceDoc.bankDestination.bankName}{' '}
                  {issuedInvoiceDoc.bankDestination.branchName}（
                  {issuedInvoiceDoc.bankDestination.accountType}）
                  {issuedInvoiceDoc.bankDestination.accountNumber}／
                  {issuedInvoiceDoc.bankDestination.accountHolder}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                印刷・PDF保存
              </button>
              <button
                type="button"
                onClick={() => setIssuedInvoiceDoc(null)}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

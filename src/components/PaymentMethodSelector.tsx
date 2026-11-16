import React from 'react';
import {
  CreditCard,
  Landmark,
  FileText,
  Wand2,
  ShieldCheck,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  BillingCycle,
  PaymentMethodType,
  SubscriptionPlanId,
} from '../types/domain';
import {
  BankTransferFormValues,
  CreditCardFormValues,
  InvoiceFormValues,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  isInvoicePaymentAllowed,
} from '../utils/payment';

interface PaymentMethodSelectorProps {
  method: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  planId?: SubscriptionPlanId;
  billingCycle?: BillingCycle;
  cardValues: CreditCardFormValues;
  onCardValuesChange: (next: CreditCardFormValues) => void;
  cardErrors?: Partial<Record<keyof CreditCardFormValues, string>>;
  bankValues: BankTransferFormValues;
  onBankValuesChange: (next: BankTransferFormValues) => void;
  bankErrors?: Partial<Record<keyof BankTransferFormValues, string>>;
  invoiceValues?: InvoiceFormValues;
  onInvoiceValuesChange?: (next: InvoiceFormValues) => void;
  invoiceErrors?: Partial<Record<keyof InvoiceFormValues, string>> & {
    eligibility?: string;
  };
  displayAmountYen: number;
  accent?: 'indigo' | 'teal';
}

const PRESET_BANKS = [
  'みずほ銀行',
  '三菱UFJ銀行',
  '三井住友銀行',
  'ゆうちょ銀行',
  '西武信用金庫',
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  method,
  onMethodChange,
  planId = 'standard',
  billingCycle = 'monthly',
  cardValues,
  onCardValuesChange,
  cardErrors = {},
  bankValues,
  onBankValuesChange,
  bankErrors = {},
  invoiceValues = {
    organizationName: '',
    billingEmail: '',
    billingAddress: '',
    contactDepartment: '',
  },
  onInvoiceValuesChange,
  invoiceErrors = {},
  displayAmountYen,
  accent = 'indigo',
}) => {
  const brand = detectCardBrand(cardValues.cardNumber);
  const invoiceAllowed = isInvoicePaymentAllowed(planId, billingCycle);

  const borderAccent =
    accent === 'indigo'
      ? 'border-indigo-300 bg-indigo-50/35'
      : 'border-teal-300 bg-teal-50/35';
  const activeTabClass =
    accent === 'indigo'
      ? 'bg-indigo-800 border-indigo-800 text-white'
      : 'bg-teal-800 border-teal-800 text-white';

  const handleAutoFillDemoPayment = () => {
    if (method === 'credit_card') {
      onCardValuesChange({
        cardNumber: '4242 4242 4242 4242',
        expiry: '12/28',
        cvc: '123',
        cardHolder: 'AOZORA CARE',
      });
    } else if (method === 'bank_transfer') {
      onBankValuesChange({
        bankName: 'みずほ銀行',
        branchCode: '123',
        branchName: '杉並支店',
        accountType: '普通',
        accountNumber: '1234567',
        accountHolderKana: 'カ）アオゾラケア',
        verificationMode: 'online',
      });
    } else if (onInvoiceValuesChange) {
      onInvoiceValuesChange({
        organizationName: '特定非営利活動法人 あおぞら福祉会',
        billingEmail: 'keiri@aozora-care.jp',
        billingAddress: '東京都杉並区阿佐谷南1-12-3',
        contactDepartment: '法人本部 経理ご担当者様',
      });
    }
  };

  return (
    <div
      data-testid="payment-method-selector"
      className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${borderAccent}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            お支払い方法の選択（
            {billingCycle === 'annual' ? '年払い一括 ' : '月額 '}
            <span className="font-mono tabular-nums">
              {displayAmountYen.toLocaleString()}
            </span>
            円・税込）
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            口座振替（おすすめ）・クレジットカード・請求書払い（年払い×上位プランのみ）に対応しています。
          </p>
        </div>

        <button
          type="button"
          data-testid="payment-autofill-btn"
          onClick={handleAutoFillDemoPayment}
          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
          <span>テスト用支払情報を入力</span>
        </button>
      </div>

      {/* 3決済手段切替タブ */}
      <div
        role="tablist"
        aria-label="お支払い方法"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={method === 'bank_transfer'}
          data-testid="payment-tab-bank"
          onClick={() => onMethodChange('bank_transfer')}
          className={`min-h-[48px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            method === 'bank_transfer'
              ? activeTabClass
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Landmark className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>口座振替（おすすめ）</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={method === 'credit_card'}
          data-testid="payment-tab-card"
          onClick={() => onMethodChange('credit_card')}
          className={`min-h-[48px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            method === 'credit_card'
              ? activeTabClass
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>クレジットカード</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={method === 'invoice'}
          data-testid="payment-tab-invoice"
          onClick={() => onMethodChange('invoice')}
          className={`min-h-[48px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
            method === 'invoice'
              ? activeTabClass
              : invoiceAllowed
                ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}
        >
          {invoiceAllowed ? (
            <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">
            請求書払い{!invoiceAllowed ? '（※年払い・上位）' : '（銀行振込）'}
          </span>
        </button>
      </div>

      {/* A. 口座振替（おすすめ） */}
      {method === 'bank_transfer' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5">
          <div className="space-y-1.5">
            <span className="block text-xs font-bold text-slate-900">
              金融機関名（法人・個人事業主の口座をご指定ください）
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_BANKS.map((bank) => (
                <button
                  key={bank}
                  type="button"
                  onClick={() =>
                    onBankValuesChange({ ...bankValues, bankName: bank })
                  }
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer whitespace-nowrap ${
                    bankValues.bankName === bank
                      ? 'bg-indigo-800 border-indigo-800 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {bank}
                </button>
              ))}
            </div>
            <input
              id="payment-bank-name"
              type="text"
              aria-label="金融機関名"
              value={bankValues.bankName}
              onChange={(e) =>
                onBankValuesChange({ ...bankValues, bankName: e.target.value })
              }
              placeholder="例：みずほ銀行"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
            />
            {bankErrors.bankName && (
              <p className="text-xs font-bold text-red-700 flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {bankErrors.bankName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="payment-branch-name"
                className="block text-xs font-bold text-slate-900"
              >
                支店名
              </label>
              <input
                id="payment-branch-name"
                type="text"
                value={bankValues.branchName}
                onChange={(e) =>
                  onBankValuesChange({
                    ...bankValues,
                    branchName: e.target.value,
                  })
                }
                placeholder="例：杉並支店"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="payment-branch-code"
                className="block text-xs font-bold text-slate-900"
              >
                店番（3桁）
              </label>
              <input
                id="payment-branch-code"
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={bankValues.branchCode}
                onChange={(e) =>
                  onBankValuesChange({
                    ...bankValues,
                    branchCode: e.target.value.replace(/\D/g, '').slice(0, 3),
                  })
                }
                placeholder="123"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900"
              />
              {bankErrors.branchCode && (
                <p className="text-xs font-bold text-red-700 flex items-center gap-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {bankErrors.branchCode}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-1">
              <label
                htmlFor="payment-account-type"
                className="block text-xs font-bold text-slate-900"
              >
                預金種目
              </label>
              <select
                id="payment-account-type"
                value={bankValues.accountType}
                onChange={(e) =>
                  onBankValuesChange({
                    ...bankValues,
                    accountType: e.target.value as '普通' | '当座',
                  })
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
              >
                <option value="普通">普通</option>
                <option value="当座">当座</option>
              </select>
            </div>

            <div className="col-span-2 space-y-1">
              <label
                htmlFor="payment-account-number"
                className="block text-xs font-bold text-slate-900"
              >
                口座番号（7桁）
              </label>
              <input
                id="payment-account-number"
                type="text"
                inputMode="numeric"
                maxLength={7}
                value={bankValues.accountNumber}
                onChange={(e) =>
                  onBankValuesChange({
                    ...bankValues,
                    accountNumber: e.target.value.replace(/\D/g, '').slice(0, 7),
                  })
                }
                placeholder="1234567"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900"
              />
              {bankErrors.accountNumber && (
                <p className="text-xs font-bold text-red-700 flex items-center gap-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {bankErrors.accountNumber}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="payment-account-holder"
              className="block text-xs font-bold text-slate-900"
            >
              口座名義（全角カタカナ）
            </label>
            <input
              id="payment-account-holder"
              type="text"
              value={bankValues.accountHolderKana}
              onChange={(e) =>
                onBankValuesChange({
                  ...bankValues,
                  accountHolderKana: e.target.value,
                })
              }
              placeholder="例：カ）アオゾラケア"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
            />
            {bankErrors.accountHolderKana && (
              <p className="text-xs font-bold text-red-700 flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {bankErrors.accountHolderKana}
              </p>
            )}
          </div>
        </div>
      )}

      {/* B. クレジットカード */}
      {method === 'credit_card' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-700">
              対応ブランド：Visa / Mastercard / JCB / AMEX
            </span>
            {cardValues.cardNumber.trim().length > 0 && (
              <span className="font-mono font-bold text-indigo-800">
                判定ブランド：{brand}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="payment-card-number"
              className="block text-xs font-bold text-slate-900"
            >
              カード番号（半角数字）
            </label>
            <input
              id="payment-card-number"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardValues.cardNumber}
              onChange={(e) =>
                onCardValuesChange({
                  ...cardValues,
                  cardNumber: formatCardNumber(e.target.value),
                })
              }
              placeholder="4242 4242 4242 4242"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900"
            />
            {cardErrors.cardNumber && (
              <p className="text-xs font-bold text-red-700 flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {cardErrors.cardNumber}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="payment-card-expiry"
                className="block text-xs font-bold text-slate-900"
              >
                有効期限（月/年）
              </label>
              <input
                id="payment-card-expiry"
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                value={cardValues.expiry}
                onChange={(e) =>
                  onCardValuesChange({
                    ...cardValues,
                    expiry: formatExpiry(e.target.value),
                  })
                }
                placeholder="12/28"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900"
              />
              {cardErrors.expiry && (
                <p className="text-xs font-bold text-red-700 flex items-center gap-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {cardErrors.expiry}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="payment-card-cvc"
                className="block text-xs font-bold text-slate-900"
              >
                セキュリティコード
              </label>
              <input
                id="payment-card-cvc"
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoComplete="cc-csc"
                value={cardValues.cvc}
                onChange={(e) =>
                  onCardValuesChange({
                    ...cardValues,
                    cvc: e.target.value.replace(/\D/g, '').slice(0, 4),
                  })
                }
                placeholder="123"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900"
              />
              {cardErrors.cvc && (
                <p className="text-xs font-bold text-red-700 flex items-center gap-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {cardErrors.cvc}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="payment-card-holder"
              className="block text-xs font-bold text-slate-900"
            >
              カード名義人（半角ローマ字）
            </label>
            <input
              id="payment-card-holder"
              type="text"
              autoComplete="cc-name"
              value={cardValues.cardHolder}
              onChange={(e) =>
                onCardValuesChange({
                  ...cardValues,
                  cardHolder: e.target.value.toUpperCase(),
                })
              }
              placeholder="AOZORA CARE"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900"
            />
            {cardErrors.cardHolder && (
              <p className="text-xs font-bold text-red-700 flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {cardErrors.cardHolder}
              </p>
            )}
          </div>
        </div>
      )}

      {/* C. 請求書払い（銀行振込）※年払い・上位プランのみ */}
      {method === 'invoice' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5">
          {!invoiceAllowed ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold space-y-1">
              <p className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                請求書払い（銀行振込）は「上位プラン（年額108,000円）」かつ「年払い」選択時のみご利用いただけます。
              </p>
              <p className="font-normal">
                上のプラン・支払サイクルで「上位プラン」＋「年払い」を選ぶと請求書発行が可能になります。
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-700 font-medium">
                法人の経理処理向けにPDF請求書を発行します（お支払い期限：発行日より30日以内・年払い一括 108,000円税込）。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="payment-invoice-org"
                    className="block text-xs font-bold text-slate-900"
                  >
                    請求書の宛名（法人名・事業所名）【必須】
                  </label>
                  <input
                    id="payment-invoice-org"
                    type="text"
                    value={invoiceValues.organizationName}
                    onChange={(e) =>
                      onInvoiceValuesChange?.({
                        ...invoiceValues,
                        organizationName: e.target.value,
                      })
                    }
                    placeholder="例：NPO法人 あおぞら福祉会"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                  />
                  {invoiceErrors.organizationName && (
                    <p className="text-xs font-bold text-red-700">
                      {invoiceErrors.organizationName}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="payment-invoice-email"
                    className="block text-xs font-bold text-slate-900"
                  >
                    請求書送付先メールアドレス【必須】
                  </label>
                  <input
                    id="payment-invoice-email"
                    type="email"
                    value={invoiceValues.billingEmail}
                    onChange={(e) =>
                      onInvoiceValuesChange?.({
                        ...invoiceValues,
                        billingEmail: e.target.value,
                      })
                    }
                    placeholder="例：keiri@aozora-care.jp"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                  />
                  {invoiceErrors.billingEmail && (
                    <p className="text-xs font-bold text-red-700">
                      {invoiceErrors.billingEmail}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="payment-invoice-dept"
                    className="block text-xs font-bold text-slate-900"
                  >
                    担当部署・ご担当者名
                  </label>
                  <input
                    id="payment-invoice-dept"
                    type="text"
                    value={invoiceValues.contactDepartment}
                    onChange={(e) =>
                      onInvoiceValuesChange?.({
                        ...invoiceValues,
                        contactDepartment: e.target.value,
                      })
                    }
                    placeholder="例：法人本部 経理ご担当者様"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="payment-invoice-addr"
                    className="block text-xs font-bold text-slate-900"
                  >
                    法人所在地（請求書記載用）
                  </label>
                  <input
                    id="payment-invoice-addr"
                    type="text"
                    value={invoiceValues.billingAddress}
                    onChange={(e) =>
                      onInvoiceValuesChange?.({
                        ...invoiceValues,
                        billingAddress: e.target.value,
                      })
                    }
                    placeholder="例：東京都杉並区..."
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
        <ShieldCheck
          className="w-4 h-4 text-teal-700 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <span>
          試作環境のため実際の引き落とし・振込決済は発生しません。入力された口座番号・カード番号の全桁は保存せず末尾マスクで管理します。
        </span>
      </div>
    </div>
  );
};

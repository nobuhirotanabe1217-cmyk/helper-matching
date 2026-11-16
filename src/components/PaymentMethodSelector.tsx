import React from 'react';
import { CreditCard, Landmark, Wand2, ShieldCheck, AlertCircle } from 'lucide-react';
import { PaymentMethodType } from '../types/domain';
import {
  BankTransferFormValues,
  CreditCardFormValues,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
} from '../utils/payment';

interface PaymentMethodSelectorProps {
  method: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  cardValues: CreditCardFormValues;
  onCardValuesChange: (next: CreditCardFormValues) => void;
  cardErrors?: Partial<Record<keyof CreditCardFormValues, string>>;
  bankValues: BankTransferFormValues;
  onBankValuesChange: (next: BankTransferFormValues) => void;
  bankErrors?: Partial<Record<keyof BankTransferFormValues, string>>;
  monthlyPriceYen: number;
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
  cardValues,
  onCardValuesChange,
  cardErrors = {},
  bankValues,
  onBankValuesChange,
  bankErrors = {},
  monthlyPriceYen,
  accent = 'indigo',
}) => {
  const brand = detectCardBrand(cardValues.cardNumber);
  const borderAccent =
    accent === 'indigo'
      ? 'border-indigo-300 bg-indigo-50/40'
      : 'border-teal-300 bg-teal-50/40';
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
    } else {
      onBankValuesChange({
        bankName: 'みずほ銀行',
        branchCode: '123',
        branchName: '杉並支店',
        accountType: '普通',
        accountNumber: '1234567',
        accountHolderKana: 'カ）アオゾラケア',
        verificationMode: 'online',
      });
    }
  };

  return (
    <div
      data-testid="payment-method-selector"
      className={`rounded-2xl border-2 p-4 sm:p-5 space-y-4 ${borderAccent}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            お支払い方法の選択・手続き（月額{' '}
            <span className="font-mono tabular-nums">
              {monthlyPriceYen.toLocaleString()}
            </span>
            円・税込）
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            クレジットカード決済、または法人・個人事業主向けの銀行口座振替をお選びいただけます。
          </p>
        </div>

        <button
          type="button"
          data-testid="payment-autofill-btn"
          onClick={handleAutoFillDemoPayment}
          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
          <span>テスト用決済情報を入力</span>
        </button>
      </div>

      {/* 決済手段切替タブ */}
      <div
        role="tablist"
        aria-label="お支払い方法"
        className="grid grid-cols-2 gap-2.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={method === 'credit_card'}
          data-testid="payment-tab-card"
          onClick={() => onMethodChange('credit_card')}
          className={`min-h-[48px] px-3 py-2 rounded-xl border-2 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            method === 'credit_card'
              ? activeTabClass
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>クレジットカード決済</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={method === 'bank_transfer'}
          data-testid="payment-tab-bank"
          onClick={() => onMethodChange('bank_transfer')}
          className={`min-h-[48px] px-3 py-2 rounded-xl border-2 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            method === 'bank_transfer'
              ? activeTabClass
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Landmark className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>銀行口座振替（引落）</span>
        </button>
      </div>

      {/* A. クレジットカード入力フォーム */}
      {method === 'credit_card' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-700">
              対応ブランド：Visa / Mastercard / JCB / AMEX
            </span>
            {cardValues.cardNumber.trim().length > 0 && (
              <span className="font-mono font-extrabold text-indigo-800">
                判定ブランド：{brand}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="payment-card-number"
              className="block text-xs font-extrabold text-slate-900"
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
                className="block text-xs font-extrabold text-slate-900"
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
                className="block text-xs font-extrabold text-slate-900"
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
              className="block text-xs font-extrabold text-slate-900"
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

      {/* B. 銀行口座振替手続きフォーム */}
      {method === 'bank_transfer' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5">
          <div className="space-y-1.5">
            <span className="block text-xs font-extrabold text-slate-900">
              金融機関名（よく使われる銀行をワンタップ選択、または直接入力）
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
                className="block text-xs font-extrabold text-slate-900"
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
                className="block text-xs font-extrabold text-slate-900"
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
                className="block text-xs font-extrabold text-slate-900"
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
                className="block text-xs font-extrabold text-slate-900"
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
              className="block text-xs font-extrabold text-slate-900"
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

          <div className="space-y-1.5 pt-1">
            <span className="block text-xs font-extrabold text-slate-900">
              口座振替の本人確認方法（毎月27日引落）
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onBankValuesChange({
                    ...bankValues,
                    verificationMode: 'online',
                  })
                }
                className={`p-2.5 rounded-xl border text-left text-xs cursor-pointer ${
                  bankValues.verificationMode === 'online'
                    ? 'bg-indigo-50 border-indigo-700 text-indigo-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span className="block font-extrabold">
                  オンライン口座振替（即日利用可）
                </span>
                <span className="text-[11px] opacity-80">
                  金融機関連携で即時登録完了
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onBankValuesChange({
                    ...bankValues,
                    verificationMode: 'paper',
                  })
                }
                className={`p-2.5 rounded-xl border text-left text-xs cursor-pointer ${
                  bankValues.verificationMode === 'paper'
                    ? 'bg-indigo-50 border-indigo-700 text-indigo-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span className="block font-extrabold">
                  口座振替依頼書の送付手続き
                </span>
                <span className="text-[11px] opacity-80">
                  書類返送で正式登録（試作では先行利用可）
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
        <ShieldCheck
          className="w-4 h-4 text-teal-700 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <span>
          試作環境のため実際の引き落とし・決済は行われません。入力されたカード番号や口座番号の全桁は保存せず、末尾のみマスク表示で管理します。
        </span>
      </div>
    </div>
  );
};

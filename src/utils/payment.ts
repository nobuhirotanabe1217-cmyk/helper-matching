import { ProviderPaymentSummary } from '../types/domain';

export interface CreditCardFormValues {
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardHolder: string;
}

export interface BankTransferFormValues {
  bankName: string;
  branchCode: string;
  branchName: string;
  accountType: '普通' | '当座';
  accountNumber: string;
  accountHolderKana: string;
  verificationMode: 'online' | 'paper';
}

export function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatCardNumber(raw: string): string {
  const digits = onlyDigits(raw).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(raw: string): string {
  const digits = onlyDigits(raw).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function detectCardBrand(
  cardNumber: string
): 'Visa' | 'Mastercard' | 'JCB' | 'AMEX' | 'Card' {
  const digits = onlyDigits(cardNumber);
  if (digits.startsWith('4')) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^35/.test(digits)) return 'JCB';
  if (/^3[47]/.test(digits)) return 'AMEX';
  return 'Card';
}

export function validateCreditCardForm(values: CreditCardFormValues): {
  valid: boolean;
  errors: Partial<Record<keyof CreditCardFormValues, string>>;
} {
  const errors: Partial<Record<keyof CreditCardFormValues, string>> = {};
  const digits = onlyDigits(values.cardNumber);
  const brand = detectCardBrand(digits);
  const expectedMinLen = brand === 'AMEX' ? 15 : 14;

  if (digits.length < expectedMinLen || digits.length > 16) {
    errors.cardNumber = 'カード番号は14〜16桁の数字で入力してください。';
  }

  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(values.expiry.trim());
  if (!expiryMatch) {
    errors.expiry = '有効期限は MM/YY 形式で入力してください（例：12/28）。';
  } else {
    const month = Number(expiryMatch[1]);
    const year = Number(expiryMatch[2]);
    if (month < 1 || month > 12) {
      errors.expiry = '月は 01〜12 の間で入力してください。';
    } else if (year < 26) {
      errors.expiry = '有効期限が切れている可能性があります。';
    }
  }

  const cvcDigits = onlyDigits(values.cvc);
  if (cvcDigits.length < 3 || cvcDigits.length > 4) {
    errors.cvc = 'セキュリティコード（3〜4桁）を入力してください。';
  }

  if (values.cardHolder.trim().length < 2) {
    errors.cardHolder = 'カード名義（ローマ字）を入力してください。';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBankTransferForm(values: BankTransferFormValues): {
  valid: boolean;
  errors: Partial<Record<keyof BankTransferFormValues, string>>;
} {
  const errors: Partial<Record<keyof BankTransferFormValues, string>> = {};

  if (!values.bankName.trim()) {
    errors.bankName = '金融機関名を入力または選択してください。';
  }

  const branchDigits = onlyDigits(values.branchCode);
  if (branchDigits.length !== 3 && !values.branchName.trim()) {
    errors.branchCode = '支店コード（3桁）または支店名を入力してください。';
  }

  const accDigits = onlyDigits(values.accountNumber);
  if (accDigits.length < 6 || accDigits.length > 7) {
    errors.accountNumber = '口座番号は6〜7桁の数字で入力してください。';
  }

  if (values.accountHolderKana.trim().length < 2) {
    errors.accountHolderKana = '口座名義（カタカナ）を入力してください。';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildMaskedCardSummary(
  values: CreditCardFormValues,
  updatedAt: string = '2026-11-14'
): ProviderPaymentSummary {
  const digits = onlyDigits(values.cardNumber);
  const brand = detectCardBrand(digits);
  const last4 = digits.slice(-4).padStart(4, '*');
  return {
    method: 'credit_card',
    displayLabel: `${brand} •••• ${last4}（有効期限 ${values.expiry.trim()}）`,
    billingDayLabel: '毎月同日 自動決済',
    status: 'card_verified',
    updatedAt,
  };
}

export function buildMaskedBankSummary(
  values: BankTransferFormValues,
  updatedAt: string = '2026-11-14'
): ProviderPaymentSummary {
  const accDigits = onlyDigits(values.accountNumber);
  const last3 = accDigits.slice(-3).padStart(3, '*');
  const branchText = values.branchName.trim()
    ? values.branchName.trim()
    : `支店${onlyDigits(values.branchCode)}`;
  return {
    method: 'bank_transfer',
    displayLabel: `${values.bankName.trim()} ${branchText} ${values.accountType} ••••${last3}`,
    billingDayLabel:
      values.verificationMode === 'online'
        ? '毎月27日 口座振替（即時口座確認済）'
        : '毎月27日 口座振替（口座振替依頼書 手続き中）',
    status:
      values.verificationMode === 'online'
        ? 'bank_active'
        : 'bank_pending_verification',
    updatedAt,
  };
}

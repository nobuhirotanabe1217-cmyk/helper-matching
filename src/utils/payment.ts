import {
  BillingCycle,
  ProviderPaymentSummary,
  SubscriptionPlanId,
} from '../types/domain';
import { addDaysToIso, getTodayIso } from './date';

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

export interface InvoiceFormValues {
  organizationName: string;
  billingEmail: string;
  billingAddress: string;
  contactDepartment: string;
}

export interface MockInvoiceDocument {
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  recipientOrganization: string;
  contactDepartment: string;
  billingEmail: string;
  planName: string;
  billingCycleLabel: string;
  amountYen: number;
  bankDestination: {
    bankName: string;
    branchName: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
  };
}

export function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * 指定事業所番号（10桁の半角数字）のバリデーション
 * 未入力・桁数不足時は「何を・どう直せばいいか」を具体的に返す
 */
export function validateDesignatedOfficeNumber(raw: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      normalized: '',
      error:
        '指定事業所番号が未入力です。行政の指定通知書に記載された10桁の数字（例：1311501234）を入力してください。',
    };
  }
  const normalized = trimmed.replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
  const digitsOnly = normalized.replace(/[-\s]/g, '');
  if (!/^\d{10}$/.test(digitsOnly)) {
    return {
      valid: false,
      normalized: digitsOnly,
      error: `指定事業所番号は10桁の半角数字で入力してください（現在 ${digitsOnly.length} 桁です。例：1311501234）。`,
    };
  }
  return {
    valid: true,
    normalized: digitsOnly,
  };
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
    errors.cardNumber =
      'カード番号は14〜16桁の数字で入力してください（テスト番号：4242 4242 4242 4242）。';
  }

  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(values.expiry.trim());
  if (!expiryMatch) {
    errors.expiry = '有効期限は MM/YY 形式で入力してください（例：12/28）。';
  } else {
    const month = Number(expiryMatch[1]);
    const year = Number(expiryMatch[2]);
    if (month < 1 || month > 12) {
      errors.expiry = '有効期限の月は 01〜12 の間で入力してください。';
    } else if (year < 26) {
      errors.expiry = '有効期限が切れているため、26年以降の期限を入力してください。';
    }
  }

  const cvcDigits = onlyDigits(values.cvc);
  if (cvcDigits.length < 3 || cvcDigits.length > 4) {
    errors.cvc = 'カード裏面のセキュリティコード（3〜4桁）を入力してください。';
  }

  if (values.cardHolder.trim().length < 2) {
    errors.cardHolder = 'カード名義を半角ローマ字で入力してください（例：AOZORA CARE）。';
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
    errors.bankName = '引き落とし先の金融機関名を入力または選択してください。';
  }

  const branchDigits = onlyDigits(values.branchCode);
  if (branchDigits.length !== 3 && !values.branchName.trim()) {
    errors.branchCode = '支店コード（3桁の数字）または支店名を入力してください。';
  }

  const accDigits = onlyDigits(values.accountNumber);
  if (accDigits.length < 6 || accDigits.length > 7) {
    errors.accountNumber = '口座番号は6〜7桁の半角数字で入力してください。';
  }

  if (values.accountHolderKana.trim().length < 2) {
    errors.accountHolderKana = '口座名義（全角カタカナ）を入力してください。';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function isInvoicePaymentAllowed(
  planId: SubscriptionPlanId,
  billingCycle: BillingCycle
): boolean {
  return planId === 'pro' && billingCycle === 'annual';
}

export function validateInvoiceForm(
  values: InvoiceFormValues,
  planId: SubscriptionPlanId,
  billingCycle: BillingCycle
): {
  valid: boolean;
  errors: Partial<Record<keyof InvoiceFormValues, string>> & { eligibility?: string };
} {
  const errors: Partial<Record<keyof InvoiceFormValues, string>> & {
    eligibility?: string;
  } = {};

  if (!isInvoicePaymentAllowed(planId, billingCycle)) {
    errors.eligibility =
      '請求書払い（銀行振込）は「上位プラン」かつ「年払い」を選択した場合のみご利用いただけます。';
  }
  if (!values.organizationName.trim()) {
    errors.organizationName = '請求書の宛名（法人名または事業所名）を入力してください。';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.billingEmail.trim())) {
    errors.billingEmail = '請求書PDFの送付先メールアドレスを正しい形式で入力してください。';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildMaskedCardSummary(
  values: CreditCardFormValues,
  updatedAt: string = getTodayIso()
): ProviderPaymentSummary {
  const digits = onlyDigits(values.cardNumber);
  const brand = detectCardBrand(digits);
  const last4 = digits.slice(-4).padStart(4, '*');
  return {
    method: 'credit_card',
    displayLabel: `${brand} •••• ${last4}（有効期限 ${values.expiry.trim()}）`,
    billingDayLabel: '毎月同日 自動決済（クレジットカード）',
    status: 'card_verified',
    updatedAt,
  };
}

export function buildMaskedBankSummary(
  values: BankTransferFormValues,
  updatedAt: string = getTodayIso()
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
        ? '毎月27日 口座振替（オンライン手続き確認済）'
        : '毎月27日 口座振替（口座振替依頼書 手続き中）',
    status:
      values.verificationMode === 'online'
        ? 'bank_active'
        : 'bank_pending_verification',
    updatedAt,
  };
}

export function buildInvoicePaymentSummary(
  values: InvoiceFormValues,
  updatedAt: string = getTodayIso()
): { summary: ProviderPaymentSummary; invoice: MockInvoiceDocument } {
  const invoiceNumber = `INV-${updatedAt.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
  const dueDate = addDaysToIso(updatedAt, 30);

  const summary: ProviderPaymentSummary = {
    method: 'invoice',
    displayLabel: `請求書払い（${values.organizationName.trim()} 宛 / ${invoiceNumber}）`,
    billingDayLabel: `年払い一括・振込期限 ${dueDate}`,
    status: 'invoice_issued',
    updatedAt,
    invoiceNumber,
    invoiceDueDate: dueDate,
  };

  const invoice: MockInvoiceDocument = {
    invoiceNumber,
    issuedDate: updatedAt,
    dueDate,
    recipientOrganization: values.organizationName.trim(),
    contactDepartment: values.contactDepartment.trim() || '経理・運営ご担当者様',
    billingEmail: values.billingEmail.trim(),
    planName: 'ケアピタ 上位プラン（年間契約）',
    billingCycleLabel: '年払い（12か月分・税込）',
    amountYen: 108000,
    bankDestination: {
      bankName: 'みずほ銀行',
      branchName: '新宿支店（店番 210）',
      accountType: '普通',
      accountNumber: '0098765',
      accountHolder: 'カ）ケアピタテクノロジーズ',
    },
  };

  return { summary, invoice };
}

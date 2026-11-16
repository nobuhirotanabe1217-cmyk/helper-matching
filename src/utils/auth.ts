import {
  AccountCredential,
  PendingMfaChallenge,
  TwoFactorMethod,
} from '../types/domain';

export interface AuthCredentialValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PasswordLoginVerificationResult {
  ok: boolean;
  account?: AccountCredential;
  errorMessage?: string;
}

export interface OtpVerificationResult {
  ok: boolean;
  locked: boolean;
  expired: boolean;
  remainingAttempts: number;
  errorMessage?: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function isValidEmailFormat(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function isValidJapaneseMobileOrPhone(phone: string): boolean {
  const digits = normalizePhoneNumber(phone);
  return digits.length >= 10 && digits.length <= 11 && digits.startsWith('0');
}

export function validateAuthCredentials(params: {
  email: string;
  password: string;
  mfaMethod: TwoFactorMethod;
  phoneNumber?: string;
}): AuthCredentialValidationResult {
  const errors: string[] = [];

  if (!isValidEmailFormat(params.email)) {
    errors.push(
      'ログイン用のメールアドレスを正しい形式で入力してください（例：name@example.jp）。'
    );
  }

  if (!params.password || params.password.trim().length < 8) {
    errors.push('パスワードは8文字以上で入力してください。');
  }

  if (
    params.mfaMethod === 'sms' &&
    !isValidJapaneseMobileOrPhone(params.phoneNumber || '')
  ) {
    errors.push(
      'SMS（ショートメッセージ）での2段階認証を選んだ場合は、受信可能な携帯電話番号（例：090-1234-5678）を入力してください。'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) return '***';
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
}

export function maskPhoneNumber(phone: string): string {
  const digits = normalizePhoneNumber(phone);
  if (digits.length < 7) return '***-****-****';
  const prefix = digits.slice(0, 3);
  const suffix = digits.slice(-4);
  return `${prefix}-****-${suffix}`;
}

export function generateOtpCode(randomFn: () => number = Math.random): string {
  const value = Math.floor(100000 + randomFn() * 900000);
  return String(Math.min(999999, Math.max(100000, value)));
}

export function createMfaChallenge(
  account: AccountCredential,
  options?: {
    overrideMethod?: 'email' | 'sms';
    nowMs?: number;
    randomFn?: () => number;
  }
): PendingMfaChallenge {
  const now = options?.nowMs ?? Date.now();
  const requestedMethod = options?.overrideMethod ?? account.mfaMethod;
  const method: 'email' | 'sms' =
    requestedMethod === 'sms' &&
    isValidJapaneseMobileOrPhone(account.phoneNumber || '')
      ? 'sms'
      : 'email';

  const maskedDestination =
    method === 'sms'
      ? maskPhoneNumber(account.phoneNumber || '')
      : maskEmail(account.email);

  return {
    challengeId: `mfa_${now}_${Math.random().toString(36).slice(2, 7)}`,
    accountId: account.id,
    role: account.role,
    displayName: account.displayName,
    email: account.email,
    method,
    maskedDestination,
    code: generateOtpCode(options?.randomFn),
    expiresAt: now + 5 * 60 * 1000, // 5分間有効
    attemptsRemaining: 3,
  };
}

export function createRegistrationOtpChallenge(params: {
  role: 'user' | 'provider';
  displayName: string;
  email: string;
  phoneNumber?: string;
  method: 'email' | 'sms';
  nowMs?: number;
  randomFn?: () => number;
}): PendingMfaChallenge {
  const now = params.nowMs ?? Date.now();
  const method: 'email' | 'sms' =
    params.method === 'sms' &&
    isValidJapaneseMobileOrPhone(params.phoneNumber || '')
      ? 'sms'
      : 'email';

  const maskedDestination =
    method === 'sms'
      ? maskPhoneNumber(params.phoneNumber || '')
      : maskEmail(params.email);

  return {
    challengeId: `reg_mfa_${now}_${Math.random().toString(36).slice(2, 7)}`,
    accountId: 'pending-registration',
    role: params.role,
    displayName: params.displayName,
    email: params.email,
    method,
    maskedDestination,
    code: generateOtpCode(params.randomFn),
    expiresAt: now + 5 * 60 * 1000,
    attemptsRemaining: 3,
  };
}

export function verifyOtpCode(
  challenge: PendingMfaChallenge,
  inputCode: string,
  nowMs: number = Date.now()
): OtpVerificationResult {
  const cleaned = inputCode.replace(/\s+/g, '');

  if (nowMs > challenge.expiresAt) {
    return {
      ok: false,
      locked: false,
      expired: true,
      remainingAttempts: challenge.attemptsRemaining,
      errorMessage:
        '確認コードの有効期限（5分）が切れました。「コードを再送信」から新しいコードを発行してください。',
    };
  }

  if (challenge.attemptsRemaining <= 0) {
    return {
      ok: false,
      locked: true,
      expired: false,
      remainingAttempts: 0,
      errorMessage:
        '確認コードの入力失敗が規定回数に達したため、この認証を一時停止しました。最初からログインし直してください。',
    };
  }

  if (!/^\d{6}$/.test(cleaned)) {
    return {
      ok: false,
      locked: false,
      expired: false,
      remainingAttempts: challenge.attemptsRemaining,
      errorMessage: '6桁の数字コードを入力してください。',
    };
  }

  if (cleaned === challenge.code) {
    return {
      ok: true,
      locked: false,
      expired: false,
      remainingAttempts: challenge.attemptsRemaining,
    };
  }

  const nextRemaining = Math.max(0, challenge.attemptsRemaining - 1);
  return {
    ok: false,
    locked: nextRemaining === 0,
    expired: false,
    remainingAttempts: nextRemaining,
    errorMessage:
      nextRemaining === 0
        ? '確認コードが3回連続で一致しませんでした。安全のため認証をやり直してください。'
        : `確認コードが正しくありません（残り ${nextRemaining} 回）。`,
  };
}

export function verifyPasswordLogin(params: {
  role: 'user' | 'provider';
  email: string;
  password: string;
  credentials: AccountCredential[];
}): PasswordLoginVerificationResult {
  const emailNorm = normalizeEmail(params.email);
  if (!emailNorm || !params.password) {
    return {
      ok: false,
      errorMessage: 'メールアドレスとパスワードの両方を入力してください。',
    };
  }

  const matched = params.credentials.find(
    (c) => c.role === params.role && normalizeEmail(c.email) === emailNorm
  );

  if (!matched || matched.password !== params.password) {
    return {
      ok: false,
      errorMessage:
        'メールアドレスまたはパスワードが正しくありません。（※利用者・事業所のタブ切り替えもご確認ください）',
    };
  }

  return {
    ok: true,
    account: matched,
  };
}

export function formatMfaMethodLabel(
  mfaEnabled: boolean,
  mfaMethod: 'email' | 'sms'
): string {
  if (!mfaEnabled) return '2段階認証なし';
  return mfaMethod === 'sms'
    ? '2段階認証（SMSショートメッセージ）'
    : '2段階認証（メール確認コード）';
}

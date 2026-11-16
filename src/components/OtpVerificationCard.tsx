import React from 'react';
import {
  KeyRound,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { PendingMfaChallenge } from '../types/domain';

interface OtpVerificationCardProps {
  challenge: PendingMfaChallenge;
  otpInput: string;
  onOtpInputChange: (nextCode: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: (method: 'email' | 'sms') => void;
  onCancel: () => void;
  canSwitchToSms: boolean;
  accent: 'teal' | 'indigo';
  submitLabel: string;
  cancelLabel?: string;
  contextLabel?: 'login' | 'registration';
}

export const OtpVerificationCard: React.FC<OtpVerificationCardProps> = ({
  challenge,
  otpInput,
  onOtpInputChange,
  onSubmit,
  onResend,
  onCancel,
  canSwitchToSms,
  accent,
  submitLabel,
  cancelLabel = '入力やり直し',
  contextLabel = 'login',
}) => {
  const isIndigo = accent === 'indigo';

  return (
    <form
      onSubmit={onSubmit}
      data-testid="otp-verification-form"
      className="space-y-4"
    >
      <div
        className={`rounded-2xl border p-4 space-y-2 ${
          isIndigo
            ? 'bg-indigo-50/70 border-indigo-200'
            : 'bg-teal-50/70 border-teal-200'
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          {challenge.method === 'sms' ? (
            <Smartphone
              className={`w-4 h-4 shrink-0 ${
                isIndigo ? 'text-indigo-700' : 'text-teal-700'
              }`}
            />
          ) : (
            <Mail
              className={`w-4 h-4 shrink-0 ${
                isIndigo ? 'text-indigo-700' : 'text-teal-700'
              }`}
            />
          )}
          <span>
            {challenge.method === 'sms'
              ? 'SMS（ショートメッセージ）で送信しました'
              : '登録メールアドレスへ送信しました'}
          </span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          {contextLabel === 'registration'
            ? '本人確認のため、'
            : '安全確認のため、'}
          送信先（
          <strong className="font-mono text-slate-900 mx-0.5">
            {challenge.maskedDestination}
          </strong>
          ）へ送られた6桁の確認コードを入力してください（残り入力可能回数：
          <strong className="tabular-nums">
            {challenge.attemptsRemaining}回
          </strong>
          ）。
        </p>

        {/* プロトタイプ検証用の模擬送信コード案内 */}
        <div className="mt-2 p-3 rounded-xl bg-white border border-amber-300 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-700">
            <span className="font-extrabold text-amber-900">
              【テスト用確認コード】
            </span>
            <span
              data-testid="mfa-demo-code"
              className="ml-1.5 font-mono text-base font-extrabold tracking-widest text-slate-950 tabular-nums"
            >
              {challenge.code}
            </span>
          </div>
          <button
            type="button"
            data-testid="mfa-autofill-btn"
            onClick={() => onOtpInputChange(challenge.code)}
            className="min-h-[34px] px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0"
          >
            コードを自動入力
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="mfa-code-input"
          className="block text-xs sm:text-sm font-extrabold text-slate-900"
        >
          6桁の確認コード
        </label>
        <div className="relative">
          <KeyRound
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="mfa-code-input"
            data-testid="mfa-code-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otpInput}
            onChange={(e) =>
              onOtpInputChange(e.target.value.replace(/[^\d]/g, '').slice(0, 6))
            }
            placeholder="例：123456"
            className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white font-mono text-lg tracking-[0.25em] font-extrabold text-slate-900 tabular-nums"
          />
        </div>
      </div>

      <button
        type="submit"
        data-testid="mfa-verify-btn"
        className={`w-full min-h-[52px] px-6 py-3 rounded-2xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors ${
          isIndigo
            ? 'bg-indigo-800 hover:bg-indigo-900'
            : 'bg-teal-800 hover:bg-teal-900'
        }`}
      >
        <ShieldCheck className="w-5 h-5 shrink-0" />
        <span>{submitLabel}</span>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="mfa-resend-email-btn"
            onClick={() => onResend('email')}
            className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>メールで再送信</span>
          </button>

          {canSwitchToSms && (
            <button
              type="button"
              data-testid="mfa-resend-sms-btn"
              onClick={() => onResend('sms')}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>SMSで受け取る</span>
            </button>
          )}
        </div>

        <button
          type="button"
          data-testid="mfa-cancel-btn"
          onClick={onCancel}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer whitespace-nowrap shrink-0"
        >
          {cancelLabel}
        </button>
      </div>
    </form>
  );
};

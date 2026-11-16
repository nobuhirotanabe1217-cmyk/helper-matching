import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { TwoFactorMethod } from '../types/domain';

interface AuthCredentialsSectionProps {
  idPrefix: string;
  accent: 'teal' | 'indigo';
  email: string;
  onEmailChange: (val: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  mfaMethod: TwoFactorMethod;
  onMfaMethodChange: (method: TwoFactorMethod) => void;
}

export const AuthCredentialsSection: React.FC<AuthCredentialsSectionProps> = ({
  idPrefix,
  accent,
  email,
  onEmailChange,
  phoneNumber,
  onPhoneNumberChange,
  password,
  onPasswordChange,
  mfaMethod,
  onMfaMethodChange,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isIndigo = accent === 'indigo';
  const badgeBg = isIndigo ? 'bg-indigo-800' : 'bg-teal-800';
  const activeCard = isIndigo
    ? 'bg-indigo-50 border-indigo-700 text-indigo-950'
    : 'bg-teal-50 border-teal-700 text-teal-950';
  const iconColor = isIndigo ? 'text-indigo-700' : 'text-teal-700';

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-lg ${badgeBg} text-white flex items-center justify-center shrink-0`}
            aria-hidden="true"
          >
            <ShieldCheck className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900">
              ログイン情報と2段階認証の設定（セキュリティ保護）
            </h2>
            <p className="text-[11px] text-slate-600">
              次回ログイン時に使うメールアドレス・パスワードと、確認コード（メールまたはSMS）の設定です。
            </p>
          </div>
        </div>
      </div>

      {/* メールアドレス ＆ パスワード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label
            htmlFor={`${idPrefix}-email`}
            className="block text-xs font-extrabold text-slate-900"
          >
            ログイン用メールアドレス（必須）
          </label>
          <div className="relative">
            <Mail
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={`${idPrefix}-email`}
              data-testid={`${idPrefix}-email`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="例：name@example.jp"
              className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor={`${idPrefix}-password`}
            className="block text-xs font-extrabold text-slate-900"
          >
            パスワード（8文字以上・必須）
          </label>
          <div className="relative">
            <Lock
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={`${idPrefix}-password`}
              data-testid={`${idPrefix}-password`}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="8文字以上の半角英数"
              className="w-full min-h-[44px] pl-9 pr-11 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? 'パスワードを隠す' : 'パスワードを表示する'
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[34px] min-h-[34px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2段階認証の方式選択 */}
      <div className="space-y-2">
        <span className="block text-xs font-extrabold text-slate-900">
          2段階認証の受け取り方法（なりすまし防止・個人情報保護）
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            data-testid={`${idPrefix}-mfa-email`}
            aria-pressed={mfaMethod === 'email'}
            onClick={() => onMfaMethodChange('email')}
            className={`min-h-[56px] p-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${
              mfaMethod === 'email'
                ? activeCard
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold">
              <Mail className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
              <span>メール認証（推奨）</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              登録メールへ6桁コードを送信
            </p>
          </button>

          <button
            type="button"
            data-testid={`${idPrefix}-mfa-sms`}
            aria-pressed={mfaMethod === 'sms'}
            onClick={() => onMfaMethodChange('sms')}
            className={`min-h-[56px] p-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${
              mfaMethod === 'sms'
                ? activeCard
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold">
              <Smartphone className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
              <span>SMS認証（携帯）</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              ショートメッセージで6桁受信
            </p>
          </button>

          <button
            type="button"
            data-testid={`${idPrefix}-mfa-none`}
            aria-pressed={mfaMethod === 'none'}
            onClick={() => onMfaMethodChange('none')}
            className={`min-h-[56px] p-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${
              mfaMethod === 'none'
                ? 'bg-slate-200 border-slate-600 text-slate-950'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold">
              <Lock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span>後で設定する</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              メール・パスワードのみで運用
            </p>
          </button>
        </div>
      </div>

      {/* 携帯電話番号（SMS認証選択時は必須・メール認証時は任意） */}
      <div className="space-y-1">
        <label
          htmlFor={`${idPrefix}-phone`}
          className="block text-xs font-extrabold text-slate-900"
        >
          携帯電話番号（SMS認証用・
          {mfaMethod === 'sms' ? '必須' : '任意／推奨'}）
        </label>
        <div className="relative max-w-sm">
          <Smartphone
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id={`${idPrefix}-phone`}
            data-testid={`${idPrefix}-phone`}
            type="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder="例：090-1234-5678"
            className="w-full min-h-[42px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 tabular-nums"
          />
        </div>
        <p className="text-[11px] text-slate-500">
          {mfaMethod === 'sms'
            ? 'ログイン時にこの携帯番号へ6桁の確認SMSが届きます（マッチング相手の事業所には非公開です）。'
            : '登録しておくと、マイページやログイン時にメール・SMSどちらでも2段階認証を行えます。'}
        </p>
      </div>
    </div>
  );
};

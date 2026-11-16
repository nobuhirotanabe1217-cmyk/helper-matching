import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { AccountCredential } from '../types/domain';
import {
  formatMfaMethodLabel,
  isValidJapaneseMobileOrPhone,
  maskEmail,
} from '../utils/auth';
import { buildLoginScreenSpeechText } from '../utils/speech';
import { HelpTooltip } from './HelpTooltip';
import { OtpVerificationCard } from './OtpVerificationCard';
import { SpeechButton } from './SpeechButton';

export const LoginView: React.FC = () => {
  const {
    loginTab,
    setLoginTab,
    accountCredentials,
    pendingMfaChallenge,
    initiateCredentialLogin,
    verifyLoginMfaCode,
    resendMfaCode,
    cancelMfaChallenge,
    openRegistrationScreen,
    navigateTo,
  } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const isProviderTab = loginTab === 'provider';
  const credentialsForTab = accountCredentials.filter(
    (c) => c.role === loginTab
  );

  const handleTabSwitch = (nextTab: 'user' | 'provider') => {
    setLoginTab(nextTab);
    cancelMfaChallenge();
    setEmail('');
    setPassword('');
    setOtpInput('');
    setErrorMsg('');
    setInfoMsg('');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const res = initiateCredentialLogin({
      role: loginTab,
      email,
      password,
    });

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    if (res.requiresMfa) {
      setOtpInput('');
      setInfoMsg(res.message);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = verifyLoginMfaCode(otpInput);
    if (!res.success) {
      setErrorMsg(res.message);
      if (res.locked) {
        setOtpInput('');
        setInfoMsg('');
      }
    }
  };

  const handlePrefillAccount = (cred: AccountCredential) => {
    cancelMfaChallenge();
    setEmail(cred.email);
    setPassword(cred.password);
    setErrorMsg('');
    setInfoMsg(
      `「${cred.displayName}」さんのログイン情報を入力欄にセットしました。「ログインして次へ」を押してください。`
    );
  };

  const currentAccountForMfa = pendingMfaChallenge
    ? accountCredentials.find(
        (c) =>
          c.id === pendingMfaChallenge.accountId &&
          c.role === pendingMfaChallenge.role
      )
    : undefined;
  const canSwitchToSms = Boolean(
    currentAccountForMfa &&
      isValidJapaneseMobileOrPhone(currentAccountForMfa.phoneNumber || '')
  );

  return (
    <div
      data-testid="login-view"
      className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5"
    >
      {/* 上部ナビ＆役割タブ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigateTo('top')}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            トップへ戻る
          </button>

          <div className="flex items-center gap-2">
            <SpeechButton
              speechId="screen-login"
              isPrimaryScreenReader
              getText={() =>
                buildLoginScreenSpeechText({
                  loginTab,
                  isMfaStep: Boolean(pendingMfaChallenge),
                  maskedDestination: pendingMfaChallenge?.maskedDestination,
                  mfaMethod: pendingMfaChallenge?.method,
                  accountCount: credentialsForTab.length,
                })
              }
            />
            <HelpTooltip
              guideKey="login"
              tone={isProviderTab ? 'indigo' : 'teal'}
            />
          </div>
        </div>

        {/* 利用者ログイン / 事業所ログイン 切替 */}
        <div
          role="tablist"
          aria-label="ログイン種別の切り替え"
          className="grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            role="tab"
            aria-selected={loginTab === 'user'}
            data-testid="login-tab-user"
            onClick={() => handleTabSwitch('user')}
            className={`min-h-[52px] p-3 rounded-2xl border font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all ${
              loginTab === 'user'
                ? 'bg-teal-800 border-teal-800 text-white shadow-xs'
                : 'bg-teal-50/50 border-teal-200 text-teal-950 hover:bg-teal-100/60'
            }`}
          >
            <User className="w-5 h-5 shrink-0" />
            <span>利用者ログイン</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={loginTab === 'provider'}
            data-testid="login-tab-provider"
            onClick={() => handleTabSwitch('provider')}
            className={`min-h-[52px] p-3 rounded-2xl border font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all ${
              loginTab === 'provider'
                ? 'bg-indigo-800 border-indigo-800 text-white shadow-xs'
                : 'bg-indigo-50/50 border-indigo-200 text-indigo-950 hover:bg-indigo-100/60'
            }`}
          >
            <Building2 className="w-5 h-5 shrink-0" />
            <span>事業所ログイン</span>
          </button>
        </div>
      </div>

      {/* メインログインカード */}
      <section
        aria-labelledby="login-card-heading"
        className={`bg-white rounded-3xl border-2 p-5 sm:p-7 space-y-5 shadow-xs ${
          isProviderTab ? 'border-indigo-700' : 'border-teal-600'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-white text-xs font-bold ${
                isProviderTab ? 'bg-indigo-800' : 'bg-teal-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {isProviderTab
                  ? 'サービス事業所アカウント'
                  : '利用者・ご家族アカウント'}
              </span>
            </span>
            <h1
              id="login-card-heading"
              className="text-xl sm:text-2xl font-extrabold text-slate-900"
            >
              {pendingMfaChallenge
                ? '2段階認証（確認コード入力）'
                : isProviderTab
                ? '事業所画面へログイン'
                : '利用者マイページへログイン'}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0">
            <span
              className={
                !pendingMfaChallenge
                  ? isProviderTab
                    ? 'text-indigo-800'
                    : 'text-teal-800'
                  : 'text-emerald-700'
              }
            >
              ① ID確認
            </span>
            <span aria-hidden="true">→</span>
            <span
              className={
                pendingMfaChallenge
                  ? isProviderTab
                    ? 'text-indigo-800'
                    : 'text-teal-800'
                  : 'text-slate-400'
              }
            >
              ② 2段階認証
            </span>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            data-testid="login-error-alert"
            className="p-3.5 rounded-2xl bg-red-50 border border-red-400 text-red-950 text-xs sm:text-sm font-bold flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div
            role="status"
            aria-live="polite"
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-bold flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* STEP 1: メール + パスワード入力 */}
        {!pendingMfaChallenge ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email-input"
                className="block text-xs sm:text-sm font-extrabold text-slate-900"
              >
                登録メールアドレス
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-email-input"
                  data-testid="login-email-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    isProviderTab
                      ? '例：provider1@example.jp'
                      : '例：user1@example.jp'
                  }
                  className="w-full min-h-[46px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password-input"
                className="block text-xs sm:text-sm font-extrabold text-slate-900"
              >
                パスワード
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-password-input"
                  data-testid="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="登録時に設定したパスワード"
                  className="w-full min-h-[46px] pl-10 pr-12 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? 'パスワードを隠す' : 'パスワードを表示する'
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              data-testid="login-submit-btn"
              className={`w-full min-h-[52px] px-6 py-3 rounded-2xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors ${
                isProviderTab
                  ? 'bg-indigo-800 hover:bg-indigo-900'
                  : 'bg-teal-800 hover:bg-teal-900'
              }`}
            >
              <span>次へ（2段階認証・ログイン）</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        ) : (
          /* STEP 2: メール / SMS 2段階認証（共通確認コード入力コンポーネント） */
          <OtpVerificationCard
            challenge={pendingMfaChallenge}
            otpInput={otpInput}
            onOtpInputChange={(val) => {
              setOtpInput(val);
              setErrorMsg('');
            }}
            onSubmit={handleOtpSubmit}
            onResend={(method) => {
              resendMfaCode(method);
              setErrorMsg('');
              setOtpInput('');
              setInfoMsg(
                method === 'sms'
                  ? '携帯電話番号（SMS）宛てに6桁コードを再送信しました。'
                  : 'メールアドレス宛てに新しい6桁コードを再送信しました。'
              );
            }}
            onCancel={() => {
              cancelMfaChallenge();
              setOtpInput('');
              setErrorMsg('');
              setInfoMsg('');
            }}
            canSwitchToSms={canSwitchToSms}
            accent={isProviderTab ? 'indigo' : 'teal'}
            submitLabel="認証してログインを完了する"
            contextLabel="login"
          />
        )}

        {/* 登録済みアカウントのテストクイック入力 ＆ 新規登録リンク */}
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">
              登録済み{isProviderTab ? '事業所' : '利用者'}（
              <span className="tabular-nums">{credentialsForTab.length}</span>件）
            </h2>
            <button
              type="button"
              data-testid="login-go-register-btn"
              onClick={() => openRegistrationScreen(loginTab)}
              className={`text-xs font-extrabold flex items-center gap-1 underline cursor-pointer whitespace-nowrap shrink-0 ${
                isProviderTab ? 'text-indigo-800' : 'text-teal-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>新規登録はこちら</span>
            </button>
          </div>

          {credentialsForTab.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2.5">
              <p className="text-xs text-slate-600">
                まだ{isProviderTab ? '事業所' : '利用者'}アカウントが登録されていません。
                先に新規登録でメールアドレス・パスワード・2段階認証を設定してください。
              </p>
              <button
                type="button"
                onClick={() => openRegistrationScreen(loginTab)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${
                  isProviderTab
                    ? 'bg-indigo-800 hover:bg-indigo-900'
                    : 'bg-teal-800 hover:bg-teal-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {isProviderTab ? '事業所を新規登録する' : '利用者を新規登録する'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {credentialsForTab.map((cred) => (
                <div
                  key={`${cred.role}-${cred.id}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {cred.displayName}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate">
                      {maskEmail(cred.email)} ・{' '}
                      {formatMfaMethodLabel(cred.mfaEnabled, cred.mfaMethod)}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid={`login-prefill-${cred.id}`}
                    onClick={() => handlePrefillAccount(cred)}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold cursor-pointer shrink-0"
                  >
                    このアカウントを自動入力
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* セキュリティ設計の解説カード（利用者・事業所ともに2FAを推奨する理由） */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2">
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>メールアドレスと2段階認証（メール・SMS）を導入している理由</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-slate-900 block mb-0.5">
              利用者・ご家族側を守るため
            </strong>
            障害特性やご自宅エリア、第3段階で同意した連絡先情報への不正ログインを防ぎます。文字入力やスマホ操作に配慮し、メール認証とSMS認証を選べます。
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-slate-900 block mb-0.5">
              事業所側を守るため
            </strong>
            法人の決済設定や、利用希望者との重要な相談履歴を複数スタッフで安全に管理するため、ID・パスワード＋2段階認証でなりすましを遮断します。
          </div>
        </div>
      </section>
    </div>
  );
};

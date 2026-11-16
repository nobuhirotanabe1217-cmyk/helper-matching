import React, { useEffect, useState } from 'react';
import {
  User,
  Building2,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Wand2,
  LogIn,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  NewProviderRegistrationInput,
  NewUserRegistrationInput,
  useAppState,
} from '../context/AppStateContext';
import {
  AREA_OPTIONS,
  CARE_NEED_ITEMS,
  CareNeedItem,
  DayOfWeek,
  DAYS_OF_WEEK,
  HELPER_GENDER_PREFERENCES,
  HelperGenderPreference,
  PaymentMethodType,
  PendingMfaChallenge,
  ProviderPaymentSummary,
  SERVICE_TYPES,
  ServiceType,
  SubscriptionPlanId,
  TwoFactorMethod,
} from '../types/domain';
import { getCareNeedVisual } from './VisualHelpers';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { AuthCredentialsSection } from './AuthCredentialsSection';
import { OtpVerificationCard } from './OtpVerificationCard';
import { HelpTooltip } from './HelpTooltip';
import {
  BankTransferFormValues,
  buildMaskedBankSummary,
  buildMaskedCardSummary,
  CreditCardFormValues,
  validateBankTransferForm,
  validateCreditCardForm,
} from '../utils/payment';
import {
  createRegistrationOtpChallenge,
  isValidJapaneseMobileOrPhone,
  validateAuthCredentials,
  verifyOtpCode,
} from '../utils/auth';

const QUICK_CARE_ITEMS: CareNeedItem[] = [
  '入浴の介助',
  '排泄の介助',
  '食事の介助',
  '移乗の介助',
  '車いすの操作・介助',
  '外出時の付き添い',
  '通院時の付き添い',
  '買い物の付き添い',
  '家事援助',
];

export const RegistrationView: React.FC = () => {
  const {
    registerTab,
    setRegisterTab,
    completeUserRegistration,
    completeProviderRegistration,
    openLoginScreen,
    navigateTo,
    userProfiles,
    providerProfiles,
    subscriptionPlans,
  } = useAppState();

  const standardPlan =
    subscriptionPlans.find((p) => p.id === 'standard') || subscriptionPlans[1];

  // ==================== 利用者新規登録フォーム状態（1画面完結） ====================
  const [uNickname, setUNickname] = useState('');
  const [uCity, setUCity] = useState('杉並区');
  const [uServices, setUServices] = useState<ServiceType[]>([
    '居宅介護',
    '移動支援',
  ]);
  const [uCareNeeds, setUCareNeeds] = useState<CareNeedItem[]>([
    '入浴の介助',
    '車いすの操作・介助',
    '外出時の付き添い',
  ]);
  const [uHelperGender, setUHelperGender] = useState<HelperGenderPreference>(
    '女性ヘルパーを希望'
  );
  const [uDays, setUDays] = useState<DayOfWeek[]>(['火', '木', '土']);
  const [uEmail, setUEmail] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uMfaMethod, setUMfaMethod] = useState<TwoFactorMethod>('email');
  const [userError, setUserError] = useState('');

  // ==================== 事業所新規登録フォーム状態（1画面完結） ====================
  const [pName, setPName] = useState('');
  const [pCity, setPCity] = useState('杉並区');
  const [pCoverageAreas, setPCoverageAreas] = useState<string[]>([
    '杉並区',
    '中野区',
    '練馬区',
  ]);
  const [pPlanId, setPPlanId] = useState<SubscriptionPlanId>('standard');
  const [pServices, setPServices] = useState<ServiceType[]>([
    '居宅介護',
    '重度訪問介護',
    '移動支援',
  ]);
  const [pCareItems, setPCareItems] = useState<CareNeedItem[]>([
    '入浴の介助',
    '排泄の介助',
    '食事の介助',
    '移乗の介助',
    '車いすの操作・介助',
    '外出時の付き添い',
    '買い物の付き添い',
    '家事援助',
  ]);
  const [pAvailableDays, setPAvailableDays] = useState<DayOfWeek[]>([
    '月',
    '火',
    '木',
    '金',
    '土',
  ]);
  const [pPaymentMethod, setPPaymentMethod] =
    useState<PaymentMethodType>('credit_card');
  const [pCardValues, setPCardValues] = useState<CreditCardFormValues>({
    cardNumber: '',
    expiry: '',
    cvc: '',
    cardHolder: '',
  });
  const [pCardErrors, setPCardErrors] = useState<
    Partial<Record<keyof CreditCardFormValues, string>>
  >({});
  const [pBankValues, setPBankValues] = useState<BankTransferFormValues>({
    bankName: '',
    branchCode: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountHolderKana: '',
    verificationMode: 'online',
  });
  const [pBankErrors, setPBankErrors] = useState<
    Partial<Record<keyof BankTransferFormValues, string>>
  >({});
  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pPassword, setPPassword] = useState('');
  const [pMfaMethod, setPMfaMethod] = useState<TwoFactorMethod>('email');
  const [provError, setProvError] = useState('');

  // ==================== 登録時の2段階認証（6桁コード確認） ====================
  type PendingRegPayload =
    | { role: 'user'; data: NewUserRegistrationInput }
    | { role: 'provider'; data: NewProviderRegistrationInput };
  const [pendingRegPayload, setPendingRegPayload] =
    useState<PendingRegPayload | null>(null);
  const [regChallenge, setRegChallenge] =
    useState<PendingMfaChallenge | null>(null);
  const [regOtpInput, setRegOtpInput] = useState('');
  const [regOtpError, setRegOtpError] = useState('');
  const [regOtpInfo, setRegOtpInfo] = useState('');

  useEffect(() => {
    setUserError('');
    setProvError('');
    setPCardErrors({});
    setPBankErrors({});
    setPendingRegPayload(null);
    setRegChallenge(null);
    setRegOtpInput('');
    setRegOtpError('');
    setRegOtpInfo('');
  }, [registerTab]);

  const toggleItem = <T extends string>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

  const fillSampleUser = () => {
    const nextNum = userProfiles.length + 1;
    setUNickname(`ゆうき（利用者${nextNum}）`);
    setUCity('杉並区');
    setUServices(['居宅介護', '移動支援']);
    setUCareNeeds(['入浴の介助', '車いすの操作・介助', '外出時の付き添い']);
    setUHelperGender('女性ヘルパーを希望');
    setUDays(['火', '木', '土']);
    setUEmail(`user${nextNum}@example.jp`);
    setUPhone('090-1234-5678');
    setUPassword('CarePita2026!');
    setUMfaMethod('email');
    setUserError('');
  };

  const fillSampleProvider = () => {
    const nextNum = providerProfiles.length + 1;
    setPName(`あおぞらケア杉並（事業所${nextNum}）`);
    setPCity('杉並区');
    setPCoverageAreas(['杉並区', '中野区', '練馬区']);
    setPPlanId('standard');
    setPServices(['居宅介護', '重度訪問介護', '移動支援']);
    setPCareItems([
      '入浴の介助',
      '排泄の介助',
      '食事の介助',
      '移乗の介助',
      '車いすの操作・介助',
      '外出時の付き添い',
      '買い物の付き添い',
    ]);
    setPAvailableDays(['月', '火', '木', '金', '土']);
    setPEmail(`provider${nextNum}@example.jp`);
    setPPhone('080-2345-6789');
    setPPassword('CarePita2026!');
    setPMfaMethod('email');
    if (pPaymentMethod === 'credit_card') {
      setPCardValues({
        cardNumber: '4242 4242 4242 4242',
        expiry: '12/28',
        cvc: '123',
        cardHolder: 'AOZORA CARE',
      });
    } else {
      setPBankValues({
        bankName: 'みずほ銀行',
        branchCode: '123',
        branchName: '杉並支店',
        accountType: '普通',
        accountNumber: '1234567',
        accountHolderKana: 'カ）アオゾラケア',
        verificationMode: 'online',
      });
    }
    setPCardErrors({});
    setPBankErrors({});
    setProvError('');
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uNickname.trim()) {
      setUserError('ニックネームを入力してください（右上の「自動入力」も使えます）。');
      return;
    }
    const authCheck = validateAuthCredentials({
      email: uEmail,
      password: uPassword,
      mfaMethod: uMfaMethod,
      phoneNumber: uPhone,
    });
    if (!authCheck.valid) {
      setUserError(authCheck.errors[0]);
      return;
    }
    if (uServices.length === 0) {
      setUserError('希望するサービスを1つ以上選んでください。');
      return;
    }
    if (uCareNeeds.length === 0) {
      setUserError('お願いしたい介助を1つ以上選んでください。');
      return;
    }
    if (uDays.length === 0) {
      setUserError('希望する曜日を1つ以上選んでください。');
      return;
    }

    const userPayload: NewUserRegistrationInput = {
      nickname: uNickname.trim(),
      email: uEmail.trim(),
      password: uPassword,
      mfaEnabled: uMfaMethod !== 'none',
      mfaMethod: uMfaMethod === 'none' ? 'email' : uMfaMethod,
      registrantRole: '本人',
      ageGroup: '30代',
      gender: '女性',
      city: uCity,
      certificateStatus: '受給者証を持っている',
      fullName: `${uNickname.trim()}（本人特定情報）`,
      phoneNumber: uPhone.trim() || '090-0000-0000',
      detailedAddress: `東京都${uCity}（同意後のみ開示）`,
      nearestStationArea: `${uCity}内 最寄り駅周辺`,
      desiredServices: uServices,
      disabilityTypes: ['身体障害'],
      supportCategory: '区分4',
      careNeeds: uCareNeeds,
      physicalConditions: ['車いすを使用'],
      helperGenderPreference: uHelperGender,
      isGenderPreferenceStrict: true,
      preferredDays: uDays,
      preferredTimeSlots: ['午前（9時〜12時）', '午後（12時〜17時）'],
      freeMessageToProvider: '希望条件に合う事業所を探しています。',
    };

    if (uMfaMethod === 'none') {
      completeUserRegistration(userPayload, 'registration-complete');
      return;
    }

    const challenge = createRegistrationOtpChallenge({
      role: 'user',
      displayName: userPayload.nickname,
      email: userPayload.email,
      phoneNumber: userPayload.phoneNumber,
      method: uMfaMethod,
    });
    setPendingRegPayload({ role: 'user', data: userPayload });
    setRegChallenge(challenge);
    setRegOtpInput('');
    setRegOtpError('');
    setRegOtpInfo(
      `${challenge.maskedDestination} 宛てに本人確認用の6桁コードを送信しました。`
    );
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleProviderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) {
      setProvError('事業所名を入力してください（右上の「自動入力」も使えます）。');
      return;
    }
    const authCheck = validateAuthCredentials({
      email: pEmail,
      password: pPassword,
      mfaMethod: pMfaMethod,
      phoneNumber: pPhone,
    });
    if (!authCheck.valid) {
      setProvError(authCheck.errors[0]);
      return;
    }
    if (pServices.length === 0) {
      setProvError('提供するサービスを1つ以上選んでください。');
      return;
    }
    if (pCareItems.length === 0) {
      setProvError('対応できる介助を1つ以上選んでください。');
      return;
    }

    let paymentSummary: ProviderPaymentSummary | undefined;
    if (pPlanId !== 'free') {
      if (pPaymentMethod === 'credit_card') {
        const check = validateCreditCardForm(pCardValues);
        if (!check.valid) {
          setPCardErrors(check.errors);
          setProvError(
            '有料プランのお支払い情報（クレジットカード）を正しく入力してください。'
          );
          return;
        }
        setPCardErrors({});
        paymentSummary = buildMaskedCardSummary(pCardValues);
      } else {
        const check = validateBankTransferForm(pBankValues);
        if (!check.valid) {
          setPBankErrors(check.errors);
          setProvError(
            '有料プランのお支払い情報（銀行口座振替）を正しく入力してください。'
          );
          return;
        }
        setPBankErrors({});
        paymentSummary = buildMaskedBankSummary(pBankValues);
      }
    }

    const providerPayload: NewProviderRegistrationInput = {
      name: pName.trim(),
      email: pEmail.trim(),
      phoneNumber: pPhone.trim(),
      password: pPassword,
      mfaEnabled: pMfaMethod !== 'none',
      mfaMethod: pMfaMethod === 'none' ? 'email' : pMfaMethod,
      contactPersonName: 'サービス提供責任者',
      locationCity: pCity,
      coverageAreas: pCoverageAreas.length > 0 ? pCoverageAreas : [pCity],
      serviceTypes: pServices,
      planId: pPlanId,
      businessDaysHours: '月〜土 9:00〜18:00',
      introduction: `${pCity}を中心に${pServices.join('・')}を提供しています。`,
      supportedCareItems: pCareItems,
      supportedDisabilities: ['身体障害', '知的障害', '重度障害'],
      supportsWheelchairTransfer: true,
      supportsTwoPersonCare: false,
      helperGenderPolicy: '同性介助の希望に可能な範囲で対応',
      availableHelperGenders: ['女性', '男性'],
      acceptanceStatus: '新規利用者を積極的に募集中',
      availableDays: pAvailableDays,
      availableTimeSlots: ['午前（9時〜12時）', '午後（12時〜17時）'],
      acceptableConditionsNote: 'ご希望の曜日・介助内容にて相談可能です。',
      paymentSummary,
    };

    if (pMfaMethod === 'none') {
      completeProviderRegistration(providerPayload);
      return;
    }

    const challenge = createRegistrationOtpChallenge({
      role: 'provider',
      displayName: providerPayload.name,
      email: providerPayload.email,
      phoneNumber: providerPayload.phoneNumber,
      method: pMfaMethod,
    });
    setPendingRegPayload({ role: 'provider', data: providerPayload });
    setRegChallenge(challenge);
    setRegOtpInput('');
    setRegOtpError('');
    setRegOtpInfo(
      `${challenge.maskedDestination} 宛てに本人確認用の6桁コードを送信しました。`
    );
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleRegOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regChallenge || !pendingRegPayload) return;
    setRegOtpError('');

    const check = verifyOtpCode(regChallenge, regOtpInput);
    if (check.ok) {
      if (pendingRegPayload.role === 'user') {
        completeUserRegistration(
          {
            ...pendingRegPayload.data,
            mfaMethod: regChallenge.method,
          },
          'registration-complete'
        );
      } else {
        completeProviderRegistration({
          ...pendingRegPayload.data,
          mfaMethod: regChallenge.method,
        });
      }
      setPendingRegPayload(null);
      setRegChallenge(null);
      return;
    }

    if (check.locked) {
      setRegOtpError(
        check.errorMessage ||
          '確認コードが3回連続で一致しませんでした。入力内容を編集してやり直してください。'
      );
      setRegOtpInput('');
      setRegChallenge((prev) =>
        prev ? { ...prev, attemptsRemaining: 0 } : null
      );
      return;
    }

    setRegOtpError(check.errorMessage || '確認コードが正しくありません。');
    setRegChallenge((prev) =>
      prev ? { ...prev, attemptsRemaining: check.remainingAttempts } : null
    );
  };

  const handleRegOtpResend = (method: 'email' | 'sms') => {
    if (!pendingRegPayload) return;
    const email = pendingRegPayload.data.email;
    const phone = pendingRegPayload.data.phoneNumber;
    const displayName =
      pendingRegPayload.role === 'user'
        ? pendingRegPayload.data.nickname
        : pendingRegPayload.data.name;
    const nextChallenge = createRegistrationOtpChallenge({
      role: pendingRegPayload.role,
      displayName,
      email,
      phoneNumber: phone,
      method,
    });
    setRegChallenge(nextChallenge);
    setRegOtpInput('');
    setRegOtpError('');
    setRegOtpInfo(
      nextChallenge.method === 'sms'
        ? '携帯電話番号（SMS）宛てに新しい6桁コードを再送信しました。'
        : 'メールアドレス宛てに新しい6桁コードを再送信しました。'
    );
  };

  const canSwitchRegSms = Boolean(
    pendingRegPayload &&
      isValidJapaneseMobileOrPhone(pendingRegPayload.data.phoneNumber || '')
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
      {/* 上部切替ヘッダー */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('top')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              トップへ戻る
            </button>
            <button
              type="button"
              data-testid="reg-go-login-btn"
              onClick={() => openLoginScreen(registerTab)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              登録済みの方（ログイン）
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline tabular-nums">
              登録数：利用者 {userProfiles.length}名 ／ 事業所{' '}
              {providerProfiles.length}社
            </span>
            <HelpTooltip
              guideKey="register"
              tone={registerTab === 'provider' ? 'indigo' : 'teal'}
            />
          </div>
        </div>

        {/* 利用者 or 事業所 タブ */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRegisterTab('user')}
            className={`min-h-[54px] p-3 rounded-2xl border font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all ${
              registerTab === 'user'
                ? 'bg-teal-800 border-teal-800 text-white shadow-xs'
                : 'bg-teal-50/50 border-teal-200 text-teal-950 hover:bg-teal-100/60'
            }`}
          >
            <User className="w-5 h-5 shrink-0" />
            <span>利用者を新規登録</span>
          </button>

          <button
            type="button"
            onClick={() => setRegisterTab('provider')}
            className={`min-h-[54px] p-3 rounded-2xl border font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all ${
              registerTab === 'provider'
                ? 'bg-indigo-800 border-indigo-800 text-white shadow-xs'
                : 'bg-indigo-50/50 border-indigo-200 text-indigo-950 hover:bg-indigo-100/60'
            }`}
          >
            <Building2 className="w-5 h-5 shrink-0" />
            <span>事業所を新規登録</span>
          </button>
        </div>
      </div>

      {/* ==================== 登録時の2段階認証ステップ（メール／SMS 6桁コード確認） ==================== */}
      {regChallenge && pendingRegPayload ? (
        <section
          data-testid="reg-otp-step"
          aria-labelledby="reg-otp-heading"
          className={`bg-white rounded-3xl border-2 p-5 sm:p-7 space-y-5 shadow-xs ${
            pendingRegPayload.role === 'provider'
              ? 'border-indigo-700'
              : 'border-teal-600'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-white text-xs font-bold ${
                  pendingRegPayload.role === 'provider'
                    ? 'bg-indigo-800'
                    : 'bg-teal-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {pendingRegPayload.role === 'provider'
                    ? '事業所登録の本登録確認（2段階認証）'
                    : '利用者登録の本登録確認（2段階認証）'}
                </span>
              </span>
              <h1
                id="reg-otp-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900"
              >
                確認コードを入力して登録を完了
              </h1>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0">
              <span className="text-emerald-700">① 条件・ID入力</span>
              <span aria-hidden="true">→</span>
              <span
                className={
                  pendingRegPayload.role === 'provider'
                    ? 'text-indigo-800'
                    : 'text-teal-800'
                }
              >
                ② 確認コード認証
              </span>
            </div>
          </div>

          {regOtpError && (
            <div
              role="alert"
              data-testid="reg-otp-error-alert"
              className="p-3.5 rounded-2xl bg-red-50 border border-red-400 text-red-950 text-xs sm:text-sm font-bold flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{regOtpError}</span>
            </div>
          )}

          {regOtpInfo && (
            <div
              role="status"
              aria-live="polite"
              className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-bold flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{regOtpInfo}</span>
            </div>
          )}

          <OtpVerificationCard
            challenge={regChallenge}
            otpInput={regOtpInput}
            onOtpInputChange={(val) => {
              setRegOtpInput(val);
              setRegOtpError('');
            }}
            onSubmit={handleRegOtpSubmit}
            onResend={handleRegOtpResend}
            onCancel={() => {
              setPendingRegPayload(null);
              setRegChallenge(null);
              setRegOtpInput('');
              setRegOtpError('');
              setRegOtpInfo('');
            }}
            canSwitchToSms={canSwitchRegSms}
            accent={pendingRegPayload.role === 'provider' ? 'indigo' : 'teal'}
            submitLabel={
              pendingRegPayload.role === 'provider'
                ? '確認して事業所登録を完了する'
                : '確認して利用者登録を完了する'
            }
            cancelLabel="登録入力画面へ戻って修正する"
            contextLabel="registration"
          />
        </section>
      ) : null}

      {/* ==================== A. 利用者新規登録（1ページ完結・シンプル） ==================== */}
      {!regChallenge && registerTab === 'user' && (
        <form
          onSubmit={handleUserSubmit}
          className="bg-white border-2 border-teal-600 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-800 text-white text-xs font-bold">
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                <span>利用者・家族の登録（無料）</span>
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                希望条件を選んで登録
              </h1>
            </div>

            <button
              type="button"
              onClick={fillSampleUser}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Wand2 className="w-4 h-4 text-amber-700" />
              <span>ワンタップでテスト内容を自動入力</span>
            </button>
          </div>

          {userError && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-red-50 border border-red-400 text-red-950 text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{userError}</span>
            </div>
          )}

          {/* 1. ニックネーム ＆ 地域 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="reg-user-nickname"
                className="block text-xs sm:text-sm font-extrabold text-slate-900"
              >
                1. ニックネーム（必須）
              </label>
              <input
                id="reg-user-nickname"
                type="text"
                value={uNickname}
                onChange={(e) => setUNickname(e.target.value)}
                placeholder="例：ゆうき"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-user-city"
                className="block text-xs sm:text-sm font-extrabold text-slate-900"
              >
                2. お住まいの地域
              </label>
              <select
                id="reg-user-city"
                value={uCity}
                onChange={(e) => setUCity(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
              >
                {AREA_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. 希望サービス */}
          <div className="space-y-2">
            <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
              3. 利用したいサービス（複数選択可）
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SERVICE_TYPES.map((s) => {
                const selected = uServices.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setUServices(toggleItem(uServices, s.value))}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border-2 text-xs font-extrabold flex items-center justify-between gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-teal-800 border-teal-800 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{s.label}</span>
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. お願いしたい介助内容（アイコン選択） */}
          <div className="space-y-2">
            <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
              4. お願いしたい介助内容（複数選択可）
            </span>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_CARE_ITEMS.map((item) => {
                const selected = uCareNeeds.includes(item);
                const { icon: Icon, shortLabel } = getCareNeedVisual(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setUCareNeeds(toggleItem(uCareNeeds, item))}
                    className={`min-h-[46px] p-2 rounded-xl border-2 text-left flex items-center justify-between gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Icon className="w-4 h-4 text-teal-700 shrink-0" />
                      <span className="text-xs font-extrabold truncate">
                        {shortLabel}
                      </span>
                    </span>
                    {selected && (
                      <Check className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 希望曜日 ＆ ヘルパー性別 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
                5. 希望する曜日
              </span>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const selected = uDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setUDays(toggleItem(uDays, d))}
                      className={`min-h-[40px] rounded-xl border-2 text-xs font-extrabold cursor-pointer ${
                        selected
                          ? 'bg-teal-800 border-teal-800 text-white'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-user-helper-gender"
                className="block text-xs sm:text-sm font-extrabold text-slate-900"
              >
                6. ヘルパーの性別希望
              </label>
              <select
                id="reg-user-helper-gender"
                value={uHelperGender}
                onChange={(e) =>
                  setUHelperGender(e.target.value as HelperGenderPreference)
                }
                className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900"
              >
                {HELPER_GENDER_PREFERENCES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <AuthCredentialsSection
            idPrefix="reg-user"
            accent="teal"
            email={uEmail}
            onEmailChange={setUEmail}
            phoneNumber={uPhone}
            onPhoneNumberChange={setUPhone}
            password={uPassword}
            onPasswordChange={setUPassword}
            mfaMethod={uMfaMethod}
            onMfaMethodChange={setUMfaMethod}
          />

          <button
            type="submit"
            className="w-full min-h-[54px] px-6 py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>この内容で利用者を登録する</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      )}

      {/* ==================== B. 事業所新規登録（1ページ完結・シンプル） ==================== */}
      {!regChallenge && registerTab === 'provider' && (
        <form
          onSubmit={handleProviderSubmit}
          className="bg-white border-2 border-indigo-700 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-800 text-white text-xs font-bold">
                <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>事業所の登録</span>
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                対応条件を選んで事業所登録
              </h1>
            </div>

            <button
              type="button"
              onClick={fillSampleProvider}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Wand2 className="w-4 h-4 text-amber-700" />
              <span>ワンタップでテスト内容を自動入力</span>
            </button>
          </div>

          {provError && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-red-50 border border-red-400 text-red-950 text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{provError}</span>
            </div>
          )}

          {/* 1. 事業所名 ＆ 拠点地域 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="reg-prov-name"
                className="block text-xs sm:text-sm font-extrabold text-slate-900"
              >
                1. 事業所名（必須）
              </label>
              <input
                id="reg-prov-name"
                type="text"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="例：あおぞらケア杉並"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-prov-city"
                className="block text-xs sm:text-sm font-extrabold text-slate-900"
              >
                2. 主な対応エリア
              </label>
              <select
                id="reg-prov-city"
                value={pCity}
                onChange={(e) => {
                  setPCity(e.target.value);
                  if (!pCoverageAreas.includes(e.target.value)) {
                    setPCoverageAreas([...pCoverageAreas, e.target.value]);
                  }
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
              >
                {AREA_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. 料金プラン選択（無料 or 有料サブスク）＆ 決済方法設定 */}
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
                3. 契約プランの選択（契約成立ごとの斡旋手数料は0円・定額サブスク制）
              </span>
              <p className="text-[11px] sm:text-xs text-slate-600">
                登録・掲載と「利用者から届いた相談への返信」は無料です。事業所からの積極的なチャット申請や案件管理DXを使う場合は有料プランをお選びください。
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                data-testid="reg-plan-free"
                onClick={() => {
                  setPPlanId('free');
                  setPCardErrors({});
                  setPBankErrors({});
                  setProvError('');
                }}
                className={`p-3 rounded-xl border-2 text-left cursor-pointer ${
                  pPlanId === 'free'
                    ? 'bg-indigo-50 border-indigo-700 text-indigo-950'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-extrabold">
                    無料プラン（月額 0円）
                  </span>
                  {pPlanId === 'free' && (
                    <Check className="w-4 h-4 text-indigo-800" />
                  )}
                </div>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  検索掲載・適合度確認・利用者からの受信チャット返信まで無料
                </span>
              </button>

              <button
                type="button"
                data-testid="reg-plan-standard"
                onClick={() => setPPlanId('standard')}
                className={`p-3 rounded-xl border-2 text-left cursor-pointer ${
                  pPlanId === 'standard'
                    ? 'bg-indigo-50 border-indigo-700 text-indigo-950'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-extrabold">
                    有料プラン（月額{' '}
                    <span className="font-mono tabular-nums">
                      {(standardPlan?.monthlyPriceYen ?? 3980).toLocaleString()}
                    </span>
                    円）
                  </span>
                  {pPlanId === 'standard' && (
                    <Check className="w-4 h-4 text-indigo-800" />
                  )}
                </div>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  事業所からのチャット申請・新着通知・案件管理DX（カード/口座振替対応）
                </span>
              </button>
            </div>

            {pPlanId !== 'free' && (
              <PaymentMethodSelector
                method={pPaymentMethod}
                onMethodChange={(m) => {
                  setPPaymentMethod(m);
                  setPCardErrors({});
                  setPBankErrors({});
                  setProvError('');
                }}
                cardValues={pCardValues}
                onCardValuesChange={setPCardValues}
                cardErrors={pCardErrors}
                bankValues={pBankValues}
                onBankValuesChange={setPBankValues}
                bankErrors={pBankErrors}
                monthlyPriceYen={standardPlan?.monthlyPriceYen ?? 3980}
                accent="indigo"
              />
            )}
          </div>

          {/* 3. 提供サービス */}
          <div className="space-y-2">
            <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
              4. 提供するサービス（複数選択可）
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SERVICE_TYPES.map((s) => {
                const selected = pServices.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setPServices(toggleItem(pServices, s.value))}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border-2 text-xs font-extrabold flex items-center justify-between gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-indigo-800 border-indigo-800 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{s.label}</span>
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 対応できる介助内容 */}
          <div className="space-y-2">
            <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
              5. 対応可能な介助内容（複数選択可）
            </span>
            <div className="grid grid-cols-3 gap-2">
              {CARE_NEED_ITEMS.slice(0, 9).map((item) => {
                const selected = pCareItems.includes(item);
                const { icon: Icon, shortLabel } = getCareNeedVisual(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setPCareItems(toggleItem(pCareItems, item))
                    }
                    className={`min-h-[44px] p-2 rounded-xl border-2 text-left flex items-center justify-between gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-indigo-50 border-indigo-700 text-indigo-950'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Icon className="w-4 h-4 text-indigo-700 shrink-0" />
                      <span className="text-xs font-extrabold truncate">
                        {shortLabel}
                      </span>
                    </span>
                    {selected && (
                      <Check className="w-3.5 h-3.5 text-indigo-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. 空き曜日 */}
          <div className="space-y-1.5">
            <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
              6. 現在空き枠がある曜日
            </span>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const selected = pAvailableDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setPAvailableDays(toggleItem(pAvailableDays, d))
                    }
                    className={`min-h-[40px] rounded-xl border-2 text-xs font-extrabold cursor-pointer ${
                      selected
                        ? 'bg-indigo-800 border-indigo-800 text-white'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <AuthCredentialsSection
            idPrefix="reg-prov"
            accent="indigo"
            email={pEmail}
            onEmailChange={setPEmail}
            phoneNumber={pPhone}
            onPhoneNumberChange={setPPhone}
            password={pPassword}
            onPasswordChange={setPPassword}
            mfaMethod={pMfaMethod}
            onMfaMethodChange={setPMfaMethod}
          />

          <button
            type="submit"
            className="w-full min-h-[54px] px-6 py-3 rounded-2xl bg-indigo-800 hover:bg-indigo-900 text-white font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>この内容で事業所を登録する</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      )}
    </div>
  );
};

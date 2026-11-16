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
  BillingCycle,
  CARE_NEED_ITEMS,
  CareNeedItem,
  COMMUNICATION_ITEMS,
  CommunicationConsiderationItem,
  DayOfWeek,
  DAYS_OF_WEEK,
  DISABILITY_TYPE_OPTIONS,
  DisabilityType,
  HELPER_GENDER_PREFERENCES,
  HelperGenderPreference,
  PaymentMethodType,
  PendingMfaChallenge,
  PROVIDER_DISABILITY_OPTIONS,
  ProviderCapabilityDisability,
  ProviderGenderPolicy,
  ProviderPaymentSummary,
  SERVICE_TYPES,
  ServiceType,
  SubscriptionPlanId,
  SUPPORT_CATEGORY_OPTIONS,
  SupportCategoryLevel,
  SUPPORTED_COMMUNICATION_METHODS,
  SupportDetailPolicy,
  TIME_SLOTS,
  TimeSlot,
  TwoFactorMethod,
} from '../types/domain';
import { getCareNeedVisual } from './VisualHelpers';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { AuthCredentialsSection } from './AuthCredentialsSection';
import { OtpVerificationCard } from './OtpVerificationCard';
import { HelpTooltip } from './HelpTooltip';
import {
  BankTransferFormValues,
  buildInvoicePaymentSummary,
  buildMaskedBankSummary,
  buildMaskedCardSummary,
  CreditCardFormValues,
  InvoiceFormValues,
  isInvoicePaymentAllowed,
  validateBankTransferForm,
  validateCreditCardForm,
  validateDesignatedOfficeNumber,
  validateInvoiceForm,
} from '../utils/payment';
import {
  createRegistrationOtpChallenge,
  isValidJapaneseMobileOrPhone,
  validateAuthCredentials,
  verifyOtpCode,
} from '../utils/auth';
import { CORE_SUBSCRIPTION_MESSAGE } from '../utils/subscription';

const QUICK_CARE_ITEMS: CareNeedItem[] = CARE_NEED_ITEMS.slice(0, 11);

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
  const proPlan =
    subscriptionPlans.find((p) => p.id === 'pro') || subscriptionPlans[2];

  // ステップ管理（最初はすべて未選択）
  const [uStep, setUStep] = useState<1 | 2 | 3>(1);
  const [pStep, setPStep] = useState<1 | 2 | 3>(1);

  // ==================== 利用者新規登録（全項目初期値未選択） ====================
  const [uNickname, setUNickname] = useState('');
  const [uCity, setUCity] = useState('');
  const [uDisabilities, setUDisabilities] = useState<DisabilityType[]>([]);
  const [uSupportCategory, setUSupportCategory] = useState<SupportCategoryLevel | ''>('');
  const [uCommConsiderations, setUCommConsiderations] = useState<
    CommunicationConsiderationItem[]
  >([]);
  const [uDislikes, setUDislikes] = useState('');
  const [uServices, setUServices] = useState<ServiceType[]>([]);
  const [uCareNeeds, setUCareNeeds] = useState<CareNeedItem[]>([]);
  const [uDays, setUDays] = useState<DayOfWeek[]>([]);
  const [uTimeSlots, setUTimeSlots] = useState<TimeSlot[]>([]);
  const [uHelperGender, setUHelperGender] = useState<HelperGenderPreference | ''>('');
  const [uFreeMessage, setUFreeMessage] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uMfaMethod, setUMfaMethod] = useState<TwoFactorMethod>('email');
  const [userError, setUserError] = useState('');

  // ==================== 事業所新規登録（全項目初期値未選択） ====================
  const [pName, setPName] = useState('');
  const [pDesignatedNumber, setPDesignatedNumber] = useState('');
  const [pContactPersonName, setPContactPersonName] = useState('');
  const [pCity, setPCity] = useState('');
  const [pCoverageAreas, setPCoverageAreas] = useState<string[]>([]);
  const [pServices, setPServices] = useState<ServiceType[]>([]);
  const [pCareItems, setPCareItems] = useState<CareNeedItem[]>([]);
  const [pDisabilities, setPDisabilities] = useState<
    ProviderCapabilityDisability[]
  >([]);
  const [pBehavioralPolicy, setPBehavioralPolicy] =
    useState<SupportDetailPolicy | ''>('');
  const [pMedicalPolicy, setPMedicalPolicy] =
    useState<SupportDetailPolicy | ''>('');
  const [pMedicalRange, setPMedicalRange] = useState('');
  const [pEpilepsyPolicy, setPEpilepsyPolicy] =
    useState<SupportDetailPolicy | ''>('');
  const [pCommMethods, setPCommMethods] = useState<string[]>([]);
  const [pSupportsTransport, setPSupportsTransport] = useState<
    'yes' | 'no' | ''
  >('');
  const [pTransportRange, setPTransportRange] = useState('');
  const [pAvailableDays, setPAvailableDays] = useState<DayOfWeek[]>([]);
  const [pAvailableTimeSlots, setPAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [pGenderPolicy, setPGenderPolicy] = useState<ProviderGenderPolicy | ''>('');
  const [pHelperGenders, setPHelperGenders] = useState<('男性' | '女性')[]>([]);
  const [pAppealMessage, setPAppealMessage] = useState('');

  const [pPlanId, setPPlanId] = useState<SubscriptionPlanId | ''>('');
  const [pBillingCycle, setPBillingCycle] = useState<BillingCycle>('monthly');
  const [pPaymentMethod, setPPaymentMethod] =
    useState<PaymentMethodType>('bank_transfer');
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
  const [pInvoiceValues, setPInvoiceValues] = useState<InvoiceFormValues>({
    organizationName: '',
    billingEmail: '',
    billingAddress: '',
    contactDepartment: '',
  });
  const [pInvoiceErrors, setPInvoiceErrors] = useState<
    Partial<Record<keyof InvoiceFormValues, string>> & { eligibility?: string }
  >({});

  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pPassword, setPPassword] = useState('');
  const [pMfaMethod, setPMfaMethod] = useState<TwoFactorMethod>('email');
  const [provError, setProvError] = useState('');

  // ==================== 2段階認証 OTP 状態 ====================
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
    setPInvoiceErrors({});
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
    setUDisabilities(['身体障害', '発達障害']);
    setUSupportCategory('区分4');
    setUCommConsiderations(['ゆっくり話す必要あり' as CommunicationConsiderationItem].filter((x) =>
      COMMUNICATION_ITEMS.includes(x)
    ).length > 0
      ? ['言葉でのコミュニケーションが可能', '意思表示に時間が必要']
      : ['言葉でのコミュニケーションが可能', '意思表示に時間が必要']);
    setUDislikes('急かされたり大きな声をかけられると不安になります。ゆっくり説明してください。');
    setUServices(['居宅介護', '移動支援']);
    setUCareNeeds(['入浴の介助', '車いすの操作・介助', '外出時の付き添い']);
    setUDays(['火', '木', '土']);
    setUTimeSlots(['午前（9時〜12時）', '午後（12時〜17時）']);
    setUHelperGender('女性ヘルパーを希望');
    setUFreeMessage('土曜日の午前・午後に車いすで外出支援を希望しています。');
    setUEmail(`user${nextNum}@example.jp`);
    setUPhone('090-1234-5678');
    setUPassword('CarePita2026!');
    setUMfaMethod('email');
    setUserError('');
  };

  const fillSampleProvider = () => {
    const nextNum = providerProfiles.length + 1;
    setPName(`あおぞらケア杉並（事業所${nextNum}）`);
    setPDesignatedNumber(`131150${String(1000 + nextNum).slice(-4)}`);
    setPContactPersonName('佐藤 さおり');
    setPCity('杉並区');
    setPCoverageAreas(['杉並区', '中野区']);
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
    setPDisabilities(['身体障害', '知的障害', '発達障害', '重度障害']);
    setPBehavioralPolicy('条件付きで相談可');
    setPMedicalPolicy('条件付きで相談可');
    setPMedicalRange('服薬確認・見守り（喀痰吸引は要個別調整）');
    setPEpilepsyPolicy('対応可能');
    setPCommMethods(['言葉・音声での対話', 'ゆっくり・短い言葉での説明', '筆談・文字盤']);
    setPSupportsTransport('yes');
    setPTransportRange('杉並区・中野区周辺');
    setPAvailableDays(['月', '火', '木', '金', '土']);
    setPAvailableTimeSlots(['午前（9時〜12時）', '午後（12時〜17時）']);
    setPGenderPolicy('男女どちらも対応可能');
    setPHelperGenders(['女性', '男性']);
    setPAppealMessage('土曜の午前なら、車いすの方を受けられます');
    setPPlanId('free');
    setPEmail(`provider${nextNum}@example.jp`);
    setPPhone('080-2345-6789');
    setPPassword('CarePita2026!');
    setPMfaMethod('email');
    setProvError('');
  };

  // ==================== 利用者ステップ遷移・確定 ====================
  const handleUserNext = () => {
    setUserError('');
    if (uStep === 1) {
      if (!uNickname.trim()) {
        setUserError('ニックネームが未入力です。');
        return;
      }
      if (!uCity) {
        setUserError('お住まいの地域を選択してください。');
        return;
      }
      if (uDisabilities.length === 0) {
        setUserError('特性プロフィールの「障害種別」を1つ以上選んでください。');
        return;
      }
      setUStep(2);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }

    if (uStep === 2) {
      if (uServices.length === 0) {
        setUserError('利用したいサービスを1つ以上選んでください。');
        return;
      }
      if (uCareNeeds.length === 0) {
        setUserError('必要な介助内容を1つ以上選んでください。');
        return;
      }
      if (uDays.length === 0) {
        setUserError('希望する曜日を1つ以上選んでください。');
        return;
      }
      if (uTimeSlots.length === 0) {
        setUserError('希望する時間帯を1つ以上選んでください。');
        return;
      }
      if (!uHelperGender) {
        setUserError('ヘルパー性別の希望を選択してください。');
        return;
      }
      setUStep(3);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
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
      detailedAddress: `東京都${uCity}（連絡先開示同意後のみ表示）`,
      nearestStationArea: `${uCity}内 最寄り駅周辺`,
      desiredServices: uServices,
      disabilityTypes: uDisabilities,
      supportCategory: (uSupportCategory || 'わからない') as SupportCategoryLevel,
      careNeeds: uCareNeeds,
      physicalConditions: uCareNeeds.includes('車いすの操作・介助')
        ? ['車いすを使用']
        : ['見守りが中心'],
      communicationConsiderations:
        uCommConsiderations.length > 0
          ? uCommConsiderations
          : ['言葉でのコミュニケーションが可能'],
      dislikesAndAccommodations: uDislikes.trim(),
      helperGenderPreference: uHelperGender as HelperGenderPreference,
      isGenderPreferenceStrict: uHelperGender !== '性別は問わない',
      preferredDays: uDays,
      preferredTimeSlots: uTimeSlots,
      freeMessageToProvider: uFreeMessage.trim() || '条件に合う事業所を探しています。',
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

  // ==================== 事業所ステップ遷移・確定 ====================
  const handleProviderNext = () => {
    setProvError('');
    if (pStep === 1) {
      if (!pName.trim()) {
        setProvError('事業所名が未入力です。正式名称または公開名を入力してください。');
        return;
      }
      const officeCheck = validateDesignatedOfficeNumber(pDesignatedNumber);
      if (!officeCheck.valid) {
        setProvError(
          officeCheck.error ||
            '指定事業所番号は10桁の半角数字で入力してください。'
        );
        return;
      }
      if (!pCity) {
        setProvError('主な所在地域を選択してください。');
        return;
      }
      if (pCoverageAreas.length === 0) {
        setProvError('対応エリアを1つ以上選択してください。');
        return;
      }
      setPStep(2);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }

    if (pStep === 2) {
      if (pServices.length === 0) {
        setProvError('受入条件カード：対応サービスを1つ以上選択してください。');
        return;
      }
      if (pCareItems.length === 0) {
        setProvError('受入条件カード：対応できる介助内容を1つ以上選択してください。');
        return;
      }
      if (pDisabilities.length === 0) {
        setProvError('受入条件カード：対応できる障害特性を1つ以上選択してください。');
        return;
      }
      if (!pBehavioralPolicy || !pMedicalPolicy || !pEpilepsyPolicy) {
        setProvError(
          '受入条件カード：支援の細目（行動障害・医療的ケア・てんかん発作対応）をすべて選択してください。'
        );
        return;
      }
      if (!pSupportsTransport) {
        setProvError('受入条件カード：送迎の可否を選択してください。');
        return;
      }
      if (pAvailableDays.length === 0 || pAvailableTimeSlots.length === 0) {
        setProvError('受入条件カード：対応できる曜日・時間帯をそれぞれ1つ以上選択してください。');
        return;
      }
      if (!pGenderPolicy || pHelperGenders.length === 0) {
        setProvError('受入条件カード：ヘルパーの性別対応方針と在籍性別を選択してください。');
        return;
      }
      if (!pAppealMessage.trim()) {
        setProvError(
          'ひとことアピール（例：「土曜の午前なら、車いすの方を受けられます」）を入力してください。'
        );
        return;
      }
      setPStep(3);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleProviderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProvError('');
    if (!pPlanId) {
      setProvError('ご契約プラン（無料プラン・有料プラン・上位プラン）を選択してください。');
      return;
    }
    const officeCheck = validateDesignatedOfficeNumber(pDesignatedNumber);
    if (!officeCheck.valid) {
      setProvError(officeCheck.error || '指定事業所番号を確認してください。');
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

    let paymentSummary: ProviderPaymentSummary | undefined;
    if (pPlanId !== 'free') {
      if (pPaymentMethod === 'credit_card') {
        const check = validateCreditCardForm(pCardValues);
        if (!check.valid) {
          setPCardErrors(check.errors);
          setProvError('クレジットカード情報を正しく入力してください。');
          return;
        }
        setPCardErrors({});
        paymentSummary = buildMaskedCardSummary(pCardValues);
      } else if (pPaymentMethod === 'bank_transfer') {
        const check = validateBankTransferForm(pBankValues);
        if (!check.valid) {
          setPBankErrors(check.errors);
          setProvError('銀行口座振替の入力内容を確認してください。');
          return;
        }
        setPBankErrors({});
        paymentSummary = buildMaskedBankSummary(pBankValues);
      } else {
        const check = validateInvoiceForm(pInvoiceValues, pPlanId, pBillingCycle);
        if (!check.valid) {
          setPInvoiceErrors(check.errors);
          setProvError(
            check.errors.eligibility ||
              '請求書払いの宛名・送付先メールを正しく入力してください。'
          );
          return;
        }
        setPInvoiceErrors({});
        paymentSummary = buildInvoicePaymentSummary(pInvoiceValues).summary;
      }
    }

    const providerPayload: NewProviderRegistrationInput = {
      name: pName.trim(),
      designatedNumber: officeCheck.normalized,
      email: pEmail.trim(),
      phoneNumber: pPhone.trim(),
      password: pPassword,
      mfaEnabled: pMfaMethod !== 'none',
      mfaMethod: pMfaMethod === 'none' ? 'email' : pMfaMethod,
      contactPersonName: pContactPersonName.trim() || 'サービス提供責任者',
      locationCity: pCity,
      coverageAreas: pCoverageAreas,
      serviceTypes: pServices,
      planId: pPlanId,
      billingCycle: pBillingCycle,
      businessDaysHours: `${pAvailableDays.join('・')} ${pAvailableTimeSlots.join('／')}`,
      introduction: `${pCity}を中心に${pServices.join('・')}を提供しています。`,
      appealMessage: pAppealMessage.trim(),
      supportedCareItems: pCareItems,
      supportedDisabilities: pDisabilities,
      supportsBehavioralDisorder: pBehavioralPolicy as SupportDetailPolicy,
      supportsMedicalCare: pMedicalPolicy as SupportDetailPolicy,
      medicalCareRangeText: pMedicalRange.trim() || '事前相談により確認',
      supportsEpilepsyResponse: pEpilepsyPolicy as SupportDetailPolicy,
      supportedCommunicationMethods:
        pCommMethods.length > 0 ? pCommMethods : ['言葉・音声での対話'],
      supportsTransport: pSupportsTransport === 'yes',
      transportRangeText:
        pSupportsTransport === 'yes'
          ? pTransportRange.trim() || `${pCity}周辺`
          : '',
      supportsWheelchairTransfer: pCareItems.includes('移乗の介助') || pCareItems.includes('車いすの操作・介助'),
      supportsTwoPersonCare: false,
      helperGenderPolicy: pGenderPolicy as ProviderGenderPolicy,
      availableHelperGenders: pHelperGenders,
      acceptanceStatus: '新規利用者を積極的に募集中',
      availableDays: pAvailableDays,
      availableTimeSlots: pAvailableTimeSlots,
      acceptableConditionsNote: pAppealMessage.trim(),
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
          { ...pendingRegPayload.data, mfaMethod: regChallenge.method },
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
        check.errorMessage || '確認コードが3回連続で一致しませんでした。'
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
    const displayName =
      pendingRegPayload.role === 'user'
        ? pendingRegPayload.data.nickname
        : pendingRegPayload.data.name;
    const nextChallenge = createRegistrationOtpChallenge({
      role: pendingRegPayload.role,
      displayName,
      email: pendingRegPayload.data.email,
      phoneNumber: pendingRegPayload.data.phoneNumber,
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

  const selectedPlanDef =
    subscriptionPlans.find((p) => p.id === pPlanId) || standardPlan;
  const activePlanAmountYen =
    pBillingCycle === 'annual'
      ? selectedPlanDef.annualPriceYen
      : selectedPlanDef.monthlyPriceYen;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
      {/* 上部切替 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
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
          <HelpTooltip
            guideKey="register"
            tone={registerTab === 'provider' ? 'indigo' : 'teal'}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRegisterTab('user')}
            className={`min-h-[50px] p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 cursor-pointer ${
              registerTab === 'user'
                ? 'bg-teal-800 border-teal-800 text-white'
                : 'bg-teal-50/40 border-teal-200 text-teal-950'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>利用者を新規登録</span>
          </button>

          <button
            type="button"
            onClick={() => setRegisterTab('provider')}
            className={`min-h-[50px] p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 cursor-pointer ${
              registerTab === 'provider'
                ? 'bg-indigo-800 border-indigo-800 text-white'
                : 'bg-indigo-50/40 border-indigo-200 text-indigo-950'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>事業所を新規登録</span>
          </button>
        </div>
      </div>

      {/* 2FA OTP ステップ */}
      {regChallenge && pendingRegPayload && (
        <section
          data-testid="reg-otp-step"
          className={`bg-white rounded-2xl border-2 p-5 sm:p-7 space-y-5 ${
            pendingRegPayload.role === 'provider'
              ? 'border-indigo-700'
              : 'border-teal-600'
          }`}
        >
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-white text-xs font-bold ${
                pendingRegPayload.role === 'provider'
                  ? 'bg-indigo-800'
                  : 'bg-teal-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              2段階認証（本登録の最終確認）
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              確認コードを入力して登録を完了してください
            </h1>
          </div>

          {regOtpError && (
            <div
              role="alert"
              data-testid="reg-otp-error-alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-950 text-xs font-bold flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{regOtpError}</span>
            </div>
          )}

          {regOtpInfo && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-start gap-2"
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
            }}
            canSwitchToSms={canSwitchRegSms}
            accent={pendingRegPayload.role === 'provider' ? 'indigo' : 'teal'}
            submitLabel={
              pendingRegPayload.role === 'provider'
                ? '確認して事業所登録を完了する'
                : '確認して利用者登録を完了する'
            }
            cancelLabel="登録入力画面へ戻る"
            contextLabel="registration"
          />
        </section>
      )}

      {/* ==================== A. 利用者新規登録（3ステップ・初期値未選択） ==================== */}
      {!regChallenge && registerTab === 'user' && (
        <form
          onSubmit={handleUserSubmit}
          className="bg-white border border-teal-600 rounded-2xl p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-800 text-white text-xs font-bold tabular-nums">
                今は {uStep} 番目／全部で 3 ステップ
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
                {uStep === 1 && 'ステップ1：ニックネームと特性プロフィール'}
                {uStep === 2 && 'ステップ2：希望サービス・介助内容・曜日'}
                {uStep === 3 && 'ステップ3：ログインID・2段階認証の設定'}
              </h1>
            </div>

            <button
              type="button"
              data-testid="reg-user-autofill-btn"
              onClick={fillSampleUser}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-700" />
              <span>ワンタップでテスト内容を自動入力</span>
            </button>
          </div>

          {userError && (
            <div
              role="alert"
              data-testid="reg-user-error"
              className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-950 text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{userError}</span>
            </div>
          )}

          {uStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-user-nickname"
                    className="block text-xs sm:text-sm font-bold text-slate-900"
                  >
                    ニックネーム（必須・匿名表示に使われます）
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
                    className="block text-xs sm:text-sm font-bold text-slate-900"
                  >
                    お住まいの地域（必須）
                  </label>
                  <select
                    id="reg-user-city"
                    value={uCity}
                    onChange={(e) => setUCity(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
                  >
                    <option value="">-- 選択してください --</option>
                    {AREA_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  自分の特性プロフィール：障害種別（複数選択可・必須）
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DISABILITY_TYPE_OPTIONS.map((d) => {
                    const selected = uDisabilities.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setUDisabilities(toggleItem(uDisabilities, d))
                        }
                        className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
                          selected
                            ? 'bg-teal-800 border-teal-800 text-white'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{d}</span>
                        {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-user-category"
                  className="block text-xs sm:text-sm font-bold text-slate-900"
                >
                  障害支援区分（任意）
                </label>
                <select
                  id="reg-user-category"
                  value={uSupportCategory}
                  onChange={(e) =>
                    setUSupportCategory(e.target.value as SupportCategoryLevel)
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
                >
                  <option value="">-- 選択してください --</option>
                  {SUPPORT_CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  コミュニケーションの方法（複数選択可）
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COMMUNICATION_ITEMS.slice(0, 8).map((c) => {
                    const selected = uCommConsiderations.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setUCommConsiderations(
                            toggleItem(uCommConsiderations, c)
                          )
                        }
                        className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between gap-2 cursor-pointer ${
                          selected
                            ? 'bg-teal-50 border-teal-700 text-teal-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{c}</span>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-user-dislikes"
                  className="block text-xs sm:text-sm font-bold text-slate-900"
                >
                  苦手なこと・配慮してほしいこと（特性プロフィール）
                </label>
                <textarea
                  id="reg-user-dislikes"
                  rows={2}
                  value={uDislikes}
                  onChange={(e) => setUDislikes(e.target.value)}
                  placeholder="例：大きな声や急な予定変更が苦手です。事前に流れを教えてほしいです。"
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm text-slate-900"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  data-testid="reg-user-next-btn"
                  onClick={handleUserNext}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>次へ進む（ステップ 2 へ）</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {uStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  利用したいサービス（必須・複数選択可）
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SERVICE_TYPES.map((s) => {
                    const selected = uServices.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() =>
                          setUServices(toggleItem(uServices, s.value))
                        }
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer ${
                          selected
                            ? 'bg-teal-800 border-teal-800 text-white'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{s.label}</span>
                        {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  介助で必要なこと（必須・複数選択可）
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_CARE_ITEMS.map((item) => {
                    const selected = uCareNeeds.includes(item);
                    const { icon: Icon, shortLabel } = getCareNeedVisual(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setUCareNeeds(toggleItem(uCareNeeds, item))
                        }
                        className={`min-h-[44px] p-2 rounded-xl border text-left flex items-center justify-between gap-1.5 cursor-pointer ${
                          selected
                            ? 'bg-teal-50 border-teal-700 text-teal-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Icon className="w-4 h-4 text-teal-700 shrink-0" />
                          <span className="text-xs font-bold truncate">
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

              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  希望する曜日（必須）
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const selected = uDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setUDays(toggleItem(uDays, d))}
                        className={`min-h-[40px] rounded-xl border text-xs font-bold cursor-pointer ${
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

              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  希望する時間帯（必須・複数選択可）
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const selected = uTimeSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() =>
                          setUTimeSlots(toggleItem(uTimeSlots, slot))
                        }
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                          selected
                            ? 'bg-teal-50 border-teal-700 text-teal-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{slot}</span>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-user-helper-gender"
                    className="block text-xs sm:text-sm font-bold text-slate-900"
                  >
                    ヘルパーの性別希望（必須）
                  </label>
                  <select
                    id="reg-user-helper-gender"
                    value={uHelperGender}
                    onChange={(e) =>
                      setUHelperGender(e.target.value as HelperGenderPreference)
                    }
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900"
                  >
                    <option value="">-- 選択してください --</option>
                    {HELPER_GENDER_PREFERENCES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-user-free"
                    className="block text-xs sm:text-sm font-bold text-slate-900"
                  >
                    希望概要ひとこと（任意）
                  </label>
                  <input
                    id="reg-user-free"
                    type="text"
                    value={uFreeMessage}
                    onChange={(e) => setUFreeMessage(e.target.value)}
                    placeholder="例：土曜午前に外出同行をお願いしたいです"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserError('');
                    setUStep(1);
                  }}
                  className="min-h-[46px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 cursor-pointer"
                >
                  ← ステップ 1 へ戻る
                </button>
                <button
                  type="button"
                  data-testid="reg-user-next-btn"
                  onClick={handleUserNext}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>次へ進む（ステップ 3 へ）</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {uStep === 3 && (
            <div className="space-y-5">
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

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUserError('');
                    setUStep(2);
                  }}
                  className="min-h-[48px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 cursor-pointer"
                >
                  ← ステップ 2 へ戻る
                </button>
                <button
                  type="submit"
                  data-testid="reg-user-submit-btn"
                  className="flex-1 min-h-[52px] px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>この内容で利用者を登録する</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ==================== B. 事業所新規登録（3ステップ・初期値未選択・指定番号必須） ==================== */}
      {!regChallenge && registerTab === 'provider' && (
        <form
          onSubmit={handleProviderSubmit}
          className="bg-white border border-indigo-700 rounded-2xl p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-800 text-white text-xs font-bold tabular-nums">
                今は {pStep} 番目／全部で 3 ステップ
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
                {pStep === 1 && 'ステップ1：事業所名と指定事業所番号（10桁必須）'}
                {pStep === 2 && 'ステップ2：受入可能条件カード（7項目）'}
                {pStep === 3 && 'ステップ3：料金プラン・お支払い・2段階認証'}
              </h1>
            </div>

            <button
              type="button"
              data-testid="reg-provider-autofill-btn"
              onClick={fillSampleProvider}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-700" />
              <span>ワンタップでテスト内容を自動入力</span>
            </button>
          </div>

          {provError && (
            <div
              role="alert"
              data-testid="reg-provider-error"
              className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-950 text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{provError}</span>
            </div>
          )}

          {pStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-prov-name"
                    className="block text-xs sm:text-sm font-bold text-slate-900"
                  >
                    事業所名（必須）
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
                    htmlFor="reg-prov-designated-number"
                    className="block text-xs sm:text-sm font-bold text-slate-900"
                  >
                    指定事業所番号（10桁の半角数字・必須）
                  </label>
                  <input
                    id="reg-prov-designated-number"
                    data-testid="reg-prov-designated-number"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={pDesignatedNumber}
                    onChange={(e) => setPDesignatedNumber(e.target.value)}
                    placeholder="例：1311501234"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500">
                    ※登録後に「指定事業所番号登録済み」マークが表示されます
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-prov-city"
                    className="block text-xs sm:text-sm font-bold text-slate-900"
                  >
                    所在地域（必須）
                  </label>
                  <select
                    id="reg-prov-city"
                    value={pCity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPCity(val);
                      if (val && !pCoverageAreas.includes(val)) {
                        setPCoverageAreas([...pCoverageAreas, val]);
                      }
                    }}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
                  >
                    <option value="">-- 選択してください --</option>
                    {AREA_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-prov-contact"
                    className="block text-xs sm:text-sm font-bold text-slate-900"
                  >
                    担当者名（サービス提供責任者など）
                  </label>
                  <input
                    id="reg-prov-contact"
                    type="text"
                    value={pContactPersonName}
                    onChange={(e) => setPContactPersonName(e.target.value)}
                    placeholder="例：佐藤 さおり"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  訪問・支援が可能なエリア（必須・複数選択可）
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AREA_OPTIONS.map((area) => {
                    const selected = pCoverageAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() =>
                          setPCoverageAreas(toggleItem(pCoverageAreas, area))
                        }
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
                          selected
                            ? 'bg-indigo-800 border-indigo-800 text-white'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{area}</span>
                        {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  data-testid="reg-prov-next-btn"
                  onClick={handleProviderNext}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>次へ進む（ステップ 2：受入条件カードへ）</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {pStep === 2 && (
            <div className="space-y-5">
              {/* 1. 対応サービス */}
              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  1. 対応サービス（必須・複数選択可）
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SERVICE_TYPES.map((s) => {
                    const selected = pServices.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() =>
                          setPServices(toggleItem(pServices, s.value))
                        }
                        className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
                          selected
                            ? 'bg-indigo-800 border-indigo-800 text-white'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{s.label}</span>
                        {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 対応できる介助内容 */}
              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  2. 対応できる介助内容（必須・複数選択可）
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CARE_NEED_ITEMS.slice(0, 12).map((item) => {
                    const selected = pCareItems.includes(item);
                    const { icon: Icon, shortLabel } = getCareNeedVisual(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setPCareItems(toggleItem(pCareItems, item))
                        }
                        className={`min-h-[42px] p-2 rounded-xl border text-left flex items-center justify-between gap-1.5 cursor-pointer ${
                          selected
                            ? 'bg-indigo-50 border-indigo-700 text-indigo-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Icon className="w-4 h-4 text-indigo-700 shrink-0" />
                          <span className="text-xs font-bold truncate">
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

              {/* 3. 対応できる障害特性 */}
              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  3. 対応できる障害特性（必須・複数選択可）
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PROVIDER_DISABILITY_OPTIONS.map((d) => {
                    const selected = pDisabilities.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setPDisabilities(toggleItem(pDisabilities, d))
                        }
                        className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-1 cursor-pointer ${
                          selected
                            ? 'bg-indigo-800 border-indigo-800 text-white'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{d}</span>
                        {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. 支援の細目 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  4. 支援の細目（専門対応・医療的ケア・送迎・コミュニケーション）
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-prov-behavior"
                      className="block font-bold text-slate-700"
                    >
                      行動障害への対応可否【必須】
                    </label>
                    <select
                      id="reg-prov-behavior"
                      value={pBehavioralPolicy}
                      onChange={(e) =>
                        setPBehavioralPolicy(e.target.value as SupportDetailPolicy)
                      }
                      className="w-full min-h-[40px] px-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                    >
                      <option value="">-- 選択 --</option>
                      <option value="対応可能">対応可能</option>
                      <option value="条件付きで相談可">条件付きで相談可</option>
                      <option value="対応不可">対応不可</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="reg-prov-medical"
                      className="block font-bold text-slate-700"
                    >
                      医療的ケアへの対応可否【必須】
                    </label>
                    <select
                      id="reg-prov-medical"
                      value={pMedicalPolicy}
                      onChange={(e) =>
                        setPMedicalPolicy(e.target.value as SupportDetailPolicy)
                      }
                      className="w-full min-h-[40px] px-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                    >
                      <option value="">-- 選択 --</option>
                      <option value="対応可能">対応可能</option>
                      <option value="条件付きで相談可">条件付きで相談可</option>
                      <option value="対応不可">対応不可</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="reg-prov-epilepsy"
                      className="block font-bold text-slate-700"
                    >
                      てんかん発作時の対応可否【必須】
                    </label>
                    <select
                      id="reg-prov-epilepsy"
                      value={pEpilepsyPolicy}
                      onChange={(e) =>
                        setPEpilepsyPolicy(e.target.value as SupportDetailPolicy)
                      }
                      className="w-full min-h-[40px] px-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                    >
                      <option value="">-- 選択 --</option>
                      <option value="対応可能">対応可能</option>
                      <option value="条件付きで相談可">条件付きで相談可</option>
                      <option value="対応不可">対応不可</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-prov-transport"
                      className="block font-bold text-slate-700"
                    >
                      送迎の可否【必須】
                    </label>
                    <select
                      id="reg-prov-transport"
                      value={pSupportsTransport}
                      onChange={(e) =>
                        setPSupportsTransport(e.target.value as 'yes' | 'no' | '')
                      }
                      className="w-full min-h-[40px] px-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                    >
                      <option value="">-- 選択してください --</option>
                      <option value="yes">送迎対応可能</option>
                      <option value="no">送迎なし</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-prov-transport-range"
                      className="block font-bold text-slate-700"
                    >
                      送迎・医療ケアの対応範囲メモ
                    </label>
                    <input
                      id="reg-prov-transport-range"
                      type="text"
                      value={
                        pSupportsTransport === 'yes'
                          ? pTransportRange
                          : pMedicalRange
                      }
                      onChange={(e) =>
                        pSupportsTransport === 'yes'
                          ? setPTransportRange(e.target.value)
                          : setPMedicalRange(e.target.value)
                      }
                      placeholder="例：杉並区・中野区周辺／服薬見守りなど"
                      className="w-full min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700">
                    対応可能なコミュニケーション手段
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUPPORTED_COMMUNICATION_METHODS.map((m) => {
                      const selected = pCommMethods.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() =>
                            setPCommMethods(toggleItem(pCommMethods, m))
                          }
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
                            selected
                              ? 'bg-indigo-800 border-indigo-800 text-white'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 5. 曜日・時間帯・性別・アピール */}
              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-slate-900">
                  5. 対応できる曜日・時間帯（必須）
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
                        className={`min-h-[40px] rounded-xl border text-xs font-bold cursor-pointer ${
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {TIME_SLOTS.map((slot) => {
                    const selected = pAvailableTimeSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() =>
                          setPAvailableTimeSlots(
                            toggleItem(pAvailableTimeSlots, slot)
                          )
                        }
                        className={`min-h-[38px] px-3 py-1 rounded-xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                          selected
                            ? 'bg-indigo-50 border-indigo-700 text-indigo-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{slot}</span>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-indigo-800 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-prov-gender-policy"
                    className="block text-xs sm:text-sm font-bold text-slate-900"
                  >
                    6. ヘルパーの性別方針（必須）
                  </label>
                  <select
                    id="reg-prov-gender-policy"
                    value={pGenderPolicy}
                    onChange={(e) =>
                      setPGenderPolicy(e.target.value as ProviderGenderPolicy)
                    }
                    className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold"
                  >
                    <option value="">-- 選択してください --</option>
                    <option value="男性ヘルパーの対応が可能">
                      男性ヘルパーのみ対応可能
                    </option>
                    <option value="女性ヘルパーの対応が可能">
                      女性ヘルパーのみ対応可能
                    </option>
                    <option value="男女どちらも対応可能">
                      男女どちらも対応可能
                    </option>
                    <option value="同性介助の希望に可能な範囲で対応">
                      同性介助に可能な範囲で対応
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs sm:text-sm font-bold text-slate-900">
                    在籍ヘルパーの性別（必須）
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['女性', '男性'] as const).map((g) => {
                      const selected = pHelperGenders.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() =>
                            setPHelperGenders(toggleItem(pHelperGenders, g))
                          }
                          className={`min-h-[42px] rounded-xl border text-xs font-bold cursor-pointer ${
                            selected
                              ? 'bg-indigo-800 border-indigo-800 text-white'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          {g}ヘルパー在籍
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-prov-appeal"
                  className="block text-xs sm:text-sm font-bold text-slate-900"
                >
                  7. ひとことアピール（必須）
                </label>
                <input
                  id="reg-prov-appeal"
                  type="text"
                  value={pAppealMessage}
                  onChange={(e) => setPAppealMessage(e.target.value)}
                  placeholder="例：土曜の午前なら、車いすの方を受けられます"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setProvError('');
                    setPStep(1);
                  }}
                  className="min-h-[46px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 cursor-pointer"
                >
                  ← ステップ 1 へ戻る
                </button>
                <button
                  type="button"
                  data-testid="reg-prov-next-btn"
                  onClick={handleProviderNext}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>次へ進む（ステップ 3：プラン・認証へ）</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {pStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="block text-xs sm:text-sm font-bold text-slate-900">
                    契約プランの選択（必須）
                  </span>
                  <p className="text-xs text-slate-600">
                    {CORE_SUBSCRIPTION_MESSAGE}
                  </p>
                </div>

                {pPlanId && pPlanId !== 'free' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPBillingCycle('monthly');
                        if (pPaymentMethod === 'invoice') {
                          setPPaymentMethod('bank_transfer');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                        pBillingCycle === 'monthly'
                          ? 'bg-indigo-800 border-indigo-800 text-white'
                          : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      月額払い
                    </button>
                    <button
                      type="button"
                      onClick={() => setPBillingCycle('annual')}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                        pBillingCycle === 'annual'
                          ? 'bg-indigo-800 border-indigo-800 text-white'
                          : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      年払い（上位プランは請求書払い対応）
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'free' as const,
                      title: '無料プラン（0円）',
                      sub: '掲載・受入条件カード・受信チャット返信無制限・月1件申請可',
                    },
                    {
                      id: 'standard' as const,
                      title: `有料プラン（月${(standardPlan?.monthlyPriceYen ?? 3980).toLocaleString()}円）`,
                      sub: '申請無制限・適合希望フィルタ・進捗/スタッフ管理',
                    },
                    {
                      id: 'pro' as const,
                      title: `上位プラン（月${(proPlan?.monthlyPriceYen ?? 9800).toLocaleString()}円）`,
                      sub: '複数拠点管理・地域希望条件分析・年払い請求書対応',
                    },
                  ].map((item) => {
                    const selected = pPlanId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`reg-plan-${item.id}`}
                        onClick={() => {
                          setPPlanId(item.id);
                          setProvError('');
                          if (
                            item.id !== 'free' &&
                            !isInvoicePaymentAllowed(item.id, pBillingCycle) &&
                            pPaymentMethod === 'invoice'
                          ) {
                            setPPaymentMethod('bank_transfer');
                          }
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer ${
                          selected
                            ? 'bg-indigo-50 border-indigo-700 text-indigo-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold">{item.title}</span>
                          {selected && <Check className="w-4 h-4 text-indigo-800 shrink-0" />}
                        </div>
                        <span className="text-[11px] text-slate-600 block mt-1 leading-snug">
                          {item.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {pPlanId && pPlanId !== 'free' && (
                  <PaymentMethodSelector
                    method={pPaymentMethod}
                    onMethodChange={(m) => {
                      setPPaymentMethod(m);
                      setPCardErrors({});
                      setPBankErrors({});
                      setPInvoiceErrors({});
                    }}
                    planId={pPlanId}
                    billingCycle={pBillingCycle}
                    cardValues={pCardValues}
                    onCardValuesChange={setPCardValues}
                    cardErrors={pCardErrors}
                    bankValues={pBankValues}
                    onBankValuesChange={setPBankValues}
                    bankErrors={pBankErrors}
                    invoiceValues={pInvoiceValues}
                    onInvoiceValuesChange={setPInvoiceValues}
                    invoiceErrors={pInvoiceErrors}
                    displayAmountYen={activePlanAmountYen}
                    accent="indigo"
                  />
                )}
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

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProvError('');
                    setPStep(2);
                  }}
                  className="min-h-[48px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 cursor-pointer"
                >
                  ← ステップ 2 へ戻る
                </button>
                <button
                  type="submit"
                  data-testid="reg-provider-submit-btn"
                  className="flex-1 min-h-[52px] px-6 py-3 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>この内容で事業所を登録する</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

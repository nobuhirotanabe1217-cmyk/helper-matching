import React, { useEffect, useState } from 'react';
import {
  Check,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { HelpTooltip } from './HelpTooltip';
import {
  AREA_OPTIONS,
  CARE_NEED_ITEMS,
  CareNeedItem,
  DayOfWeek,
  PROVIDER_CARE_LABELS,
  PROVIDER_DISABILITY_OPTIONS,
  ProviderAcceptanceStatus,
  ProviderAvailability,
  ProviderCapabilities,
  ProviderCapabilityDisability,
  ProviderGenderPolicy,
  ProviderProfile,
  SERVICE_TYPES,
  ServiceType,
  SUPPORTED_COMMUNICATION_METHODS,
  SupportDetailPolicy,
  TIME_SLOTS,
  TimeSlot,
} from '../types/domain';
import { validateDesignatedOfficeNumber } from '../utils/payment';

const PROVIDER_GENDER_POLICIES: ProviderGenderPolicy[] = [
  '男女どちらも対応可能',
  '女性ヘルパーの対応が可能',
  '男性ヘルパーの対応が可能',
  '同性介助の希望に可能な範囲で対応',
  '条件によって相談可能',
];

const ACCEPTANCE_STATUSES: ProviderAcceptanceStatus[] = [
  '新規利用者を積極的に募集中',
  '条件によって受け入れ相談可能',
  '一部の曜日・時間帯のみ受け入れ可能',
  '問い合わせのみ受け付ける',
  '現在は受け入れ困難',
];

const SUPPORT_POLICIES: SupportDetailPolicy[] = [
  '対応可能',
  '条件付きで相談可',
  '対応不可',
];

export const ProviderWizard: React.FC = () => {
  const {
    currentProviderBundle,
    saveProviderBundle,
    providerWizardStep,
    setProviderWizardStep,
    navigateTo,
  } = useAppState();

  const [profile, setProfile] = useState<ProviderProfile>(
    currentProviderBundle.profile
  );
  const [capabilities, setCapabilities] = useState<ProviderCapabilities>(
    currentProviderBundle.capabilities
  );
  const [availability, setAvailability] = useState<ProviderAvailability>(
    currentProviderBundle.availability
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedBanner, setSavedBanner] = useState<string>('');

  useEffect(() => {
    setProfile(currentProviderBundle.profile);
    setCapabilities(currentProviderBundle.capabilities);
    setAvailability(currentProviderBundle.availability);
    setErrorMessage('');
  }, [currentProviderBundle.profile.id]);

  const persistDraft = () => {
    const numCheck = validateDesignatedOfficeNumber(profile.designatedNumber);
    const nextProfile = numCheck.valid
      ? { ...profile, designatedNumber: numCheck.normalized }
      : profile;
    saveProviderBundle({ profile: nextProfile, capabilities, availability });
  };

  const toggleItem = <T extends string>(list: T[], item: T): T[] => {
    return list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!profile.name.trim()) {
        setErrorMessage('事業所名を入力してください。');
        return false;
      }
      const numCheck = validateDesignatedOfficeNumber(profile.designatedNumber);
      if (!numCheck.valid) {
        setErrorMessage(
          numCheck.error || '指定事業所番号（10桁の半角数字）を入力してください。'
        );
        return false;
      }
      if (profile.serviceTypes.length === 0) {
        setErrorMessage(
          '提供している障害福祉サービスを1つ以上選んでください（複数選択可）。'
        );
        return false;
      }
      if (profile.coverageAreas.length === 0) {
        setErrorMessage('対応可能な地域（市区町村）を1つ以上選んでください。');
        return false;
      }
    }
    if (step === 2) {
      if (capabilities.supportedCareItems.length === 0) {
        setErrorMessage('対応可能な介助内容を1つ以上選んでください。');
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep(providerWizardStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    persistDraft();
    setProviderWizardStep(Math.min(3, providerWizardStep + 1));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handlePrev = () => {
    setErrorMessage('');
    persistDraft();
    if (providerWizardStep > 1) {
      setProviderWizardStep(providerWizardStep - 1);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    } else {
      navigateTo('provider-dashboard');
    }
  };

  const handleFinish = () => {
    if (!validateStep(1) || !validateStep(2)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    persistDraft();
    navigateTo('provider-dashboard');
  };

  const updateDaySchedule = (
    day: DayOfWeek,
    updater: (
      current: ProviderAvailability['weeklySchedule'][number]
    ) => ProviderAvailability['weeklySchedule'][number]
  ) => {
    setAvailability((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map((d) =>
        d.day === day ? updater(d) : d
      ),
    }));
  };

  const steps = [
    { num: 1, title: '指定番号・アピール' },
    { num: 2, title: '介助・障害・支援細目' },
    { num: 3, title: '性別対応・曜日時間帯' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              persistDraft();
              navigateTo('provider-dashboard');
            }}
            className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            事業所マイページへ戻る
          </button>

          <div className="flex items-center gap-2">
            <HelpTooltip guideKey="provider-wizard" tone="indigo" />
            <button
              type="button"
              onClick={() => {
                if (!validateStep(1)) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                persistDraft();
                setSavedBanner('受入条件カードの内容と最終更新日を保存しました。');
                setTimeout(() => setSavedBanner(''), 3500);
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-teal-700 text-teal-900 bg-teal-50 hover:bg-teal-100 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              保存する
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            受入条件カード・事業所情報の編集（今は {providerWizardStep} 番目／全部で 3 ステップ）
          </h1>
          <p className="text-sm text-slate-600">
            「受入可能条件カード」を登録しておくと、希望条件が合う利用者から相談が届きやすくなります。
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {steps.map((s) => {
            const active = providerWizardStep === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  persistDraft();
                  setErrorMessage('');
                  setProviderWizardStep(s.num);
                }}
                className={`min-h-[48px] px-3 py-2 rounded-xl text-left border transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 border-slate-900 text-white font-bold'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <span className="block text-xs opacity-85">
                  {s.num} 番目
                </span>
                <span className="block text-sm truncate">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 border-2 border-red-600 text-red-950 flex items-start gap-3"
        >
          <AlertCircle className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-base">入力内容をご確認ください</p>
            <p className="text-base">{errorMessage}</p>
          </div>
        </div>
      )}

      {savedBanner && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-teal-50 border border-teal-600 text-teal-950 font-bold text-base"
        >
          {savedBanner}
        </div>
      )}

      {/* ==================== STEP 1: 基本情報・指定事業所番号・ひとことアピール ==================== */}
      {providerWizardStep === 1 && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">
              1. 事業所の基本情報・指定事業所番号
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="prov-name"
                  className="block text-base font-bold text-slate-900"
                >
                  事業所名
                  <span className="ml-2 text-xs font-bold text-red-700">
                    【必須】
                  </span>
                </label>
                <input
                  id="prov-name"
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="例：あおぞらケアセンター杉並"
                  className="w-full min-h-[50px] px-4 py-2.5 rounded-xl border border-slate-300 text-base text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="prov-designated-num"
                  className="block text-base font-bold text-slate-900"
                >
                  指定事業所番号（10桁）
                  <span className="ml-2 text-xs font-bold text-red-700">
                    【必須】
                  </span>
                </label>
                <input
                  id="prov-designated-num"
                  type="text"
                  inputMode="numeric"
                  value={profile.designatedNumber}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      designatedNumber: e.target.value,
                    })
                  }
                  placeholder="例：1311501234"
                  className="w-full min-h-[50px] px-4 py-2.5 rounded-xl border border-slate-300 text-base font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="prov-city"
                  className="block text-base font-bold text-slate-900"
                >
                  所在地域（市区町村）
                </label>
                <input
                  id="prov-city"
                  type="text"
                  value={profile.locationCity}
                  onChange={(e) =>
                    setProfile({ ...profile, locationCity: e.target.value })
                  }
                  placeholder="例：杉並区"
                  className="w-full min-h-[50px] px-4 py-2.5 rounded-xl border border-slate-300 text-base text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="prov-contact"
                  className="block text-base font-bold text-slate-900"
                >
                  連絡担当者
                </label>
                <input
                  id="prov-contact"
                  type="text"
                  value={profile.contactPersonName}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      contactPersonName: e.target.value,
                    })
                  }
                  placeholder="例：山本 恵美（サービス提供責任者）"
                  className="w-full min-h-[50px] px-4 py-2.5 rounded-xl border border-slate-300 text-base text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="prov-appeal"
                className="block text-base font-bold text-slate-900"
              >
                ひとことアピール（受入条件カードの上部に表示）
              </label>
              <input
                id="prov-appeal"
                type="text"
                value={profile.appealMessage}
                onChange={(e) =>
                  setProfile({ ...profile, appealMessage: e.target.value })
                }
                placeholder="例：土曜の午前なら、車いすの方を受けられます"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 text-base text-slate-900"
              />
            </div>

            {/* 対応サービス */}
            <div className="space-y-2 pt-2">
              <span className="block text-base font-bold text-slate-900">
                対応サービス（複数選択可）
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICE_TYPES.map((s) => {
                  const selected = profile.serviceTypes.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          serviceTypes: toggleItem<ServiceType>(
                            profile.serviceTypes,
                            s.value
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className={`min-h-[54px] px-4 py-3 rounded-xl border-2 text-left text-base font-bold flex items-center justify-between gap-2 cursor-pointer ${
                        selected
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span>{s.label}</span>
                      {selected && (
                        <Check className="w-5 h-5 text-teal-800 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 対応地域 */}
            <div className="space-y-2 pt-2">
              <span className="block text-base font-bold text-slate-900">
                対応できる地域（複数選択可）
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {AREA_OPTIONS.map((area) => {
                  const selected = profile.coverageAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          coverageAreas: toggleItem<string>(
                            profile.coverageAreas,
                            area
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className={`min-h-[48px] px-3 py-2 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        selected
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      {selected && (
                        <Check className="w-4 h-4 text-teal-800 shrink-0" />
                      )}
                      <span>{area}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label
                htmlFor="prov-hours"
                className="block text-base font-bold text-slate-900"
              >
                営業日・営業時間
              </label>
              <input
                id="prov-hours"
                type="text"
                value={profile.businessDaysHours}
                onChange={(e) =>
                  setProfile({ ...profile, businessDaysHours: e.target.value })
                }
                placeholder="例：月曜〜土曜 8:30〜18:30"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 text-base text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="prov-intro"
                className="block text-base font-bold text-slate-900"
              >
                事業所の紹介文・特徴
              </label>
              <textarea
                id="prov-intro"
                rows={3}
                value={profile.introduction}
                onChange={(e) =>
                  setProfile({ ...profile, introduction: e.target.value })
                }
                placeholder="事業所の特色や得意としている支援についてご記入ください。"
                className="w-full p-3.5 rounded-xl border border-slate-300 text-base text-slate-900"
              />
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              2. 現在の受入検討方針
            </h2>
            <div className="space-y-2.5">
              {ACCEPTANCE_STATUSES.map((st) => {
                const selected = availability.acceptanceStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() =>
                      setAvailability({
                        ...availability,
                        acceptanceStatus: st,
                      })
                    }
                    aria-pressed={selected}
                    className={`w-full min-h-[52px] px-4 py-3 rounded-xl border-2 text-left text-base font-bold flex items-center justify-between gap-2 cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{st}</span>
                    {selected && (
                      <Check className="w-5 h-5 text-teal-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ==================== STEP 2: 介助内容・障害特性・支援の細目 ==================== */}
      {providerWizardStep === 2 && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                1. 対応できる介助内容（複数選択可）
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </h2>
              <p className="text-sm text-slate-600">
                利用者の希望する介助内容と照合されます。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CARE_NEED_ITEMS.map((item) => {
                const selected =
                  capabilities.supportedCareItems.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setCapabilities({
                        ...capabilities,
                        supportedCareItems: toggleItem<CareNeedItem>(
                          capabilities.supportedCareItems,
                          item
                        ),
                      })
                    }
                    aria-pressed={selected}
                    className={`min-h-[52px] px-4 py-3 rounded-xl border-2 text-left text-base font-bold flex items-center justify-between gap-2 cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      {PROVIDER_CARE_LABELS[item]}（{item}）
                    </span>
                    {selected && (
                      <Check className="w-5 h-5 text-teal-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() =>
                  setCapabilities({
                    ...capabilities,
                    supportsWheelchairTransfer:
                      !capabilities.supportsWheelchairTransfer,
                  })
                }
                aria-pressed={capabilities.supportsWheelchairTransfer}
                className={`min-h-[52px] px-4 py-3 rounded-xl border-2 text-left text-sm font-bold flex items-center justify-between gap-2 cursor-pointer ${
                  capabilities.supportsWheelchairTransfer
                    ? 'bg-teal-50 border-teal-700 text-teal-950'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                <span>ベッドから車いすへの移乗介助に対応可能</span>
                {capabilities.supportsWheelchairTransfer && (
                  <Check className="w-5 h-5 text-teal-800 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setCapabilities({
                    ...capabilities,
                    supportsTwoPersonCare: !capabilities.supportsTwoPersonCare,
                  })
                }
                aria-pressed={capabilities.supportsTwoPersonCare}
                className={`min-h-[52px] px-4 py-3 rounded-xl border-2 text-left text-sm font-bold flex items-center justify-between gap-2 cursor-pointer ${
                  capabilities.supportsTwoPersonCare
                    ? 'bg-teal-50 border-teal-700 text-teal-950'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                <span>2人介助（2名体制での訪問・介助）に対応可能</span>
                {capabilities.supportsTwoPersonCare && (
                  <Check className="w-5 h-5 text-teal-800 shrink-0" />
                )}
              </button>
            </div>
          </section>

          {/* 対応できる障害特性 */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <h2 className="text-xl font-bold text-slate-900">
              2. 対応できる障害特性（複数選択可）
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROVIDER_DISABILITY_OPTIONS.map((d) => {
                const selected = capabilities.supportedDisabilities.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setCapabilities({
                        ...capabilities,
                        supportedDisabilities:
                          toggleItem<ProviderCapabilityDisability>(
                            capabilities.supportedDisabilities,
                            d
                          ),
                      })
                    }
                    aria-pressed={selected}
                    className={`min-h-[50px] px-4 py-2.5 rounded-xl border-2 text-left text-sm sm:text-base font-bold flex items-center justify-between gap-2 cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{d}</span>
                    {selected && (
                      <Check className="w-5 h-5 text-teal-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 支援の細目（行動障害・医療的ケア・てんかん発作・コミュニケーション・送迎） */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <h2 className="text-xl font-bold text-slate-900">
              3. 支援の細目（受入条件カード詳細）
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="prov-behavior-policy"
                  className="block text-sm font-bold text-slate-900"
                >
                  行動障害への対応
                </label>
                <select
                  id="prov-behavior-policy"
                  value={capabilities.supportsBehavioralDisorder}
                  onChange={(e) =>
                    setCapabilities({
                      ...capabilities,
                      supportsBehavioralDisorder: e.target
                        .value as SupportDetailPolicy,
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  {SUPPORT_POLICIES.map((pol) => (
                    <option key={pol} value={pol}>
                      {pol}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="prov-medical-policy"
                  className="block text-sm font-bold text-slate-900"
                >
                  医療的ケアへの対応
                </label>
                <select
                  id="prov-medical-policy"
                  value={capabilities.supportsMedicalCare}
                  onChange={(e) =>
                    setCapabilities({
                      ...capabilities,
                      supportsMedicalCare: e.target.value as SupportDetailPolicy,
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  {SUPPORT_POLICIES.map((pol) => (
                    <option key={pol} value={pol}>
                      {pol}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="prov-epilepsy-policy"
                  className="block text-sm font-bold text-slate-900"
                >
                  てんかん発作時の対応
                </label>
                <select
                  id="prov-epilepsy-policy"
                  value={capabilities.supportsEpilepsyResponse}
                  onChange={(e) =>
                    setCapabilities({
                      ...capabilities,
                      supportsEpilepsyResponse: e.target
                        .value as SupportDetailPolicy,
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  {SUPPORT_POLICIES.map((pol) => (
                    <option key={pol} value={pol}>
                      {pol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-bold text-slate-900">
                対応できるコミュニケーション手段（複数選択可）
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUPPORTED_COMMUNICATION_METHODS.map((method) => {
                  const selected =
                    capabilities.supportedCommunicationMethods.includes(method);
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() =>
                        setCapabilities({
                          ...capabilities,
                          supportedCommunicationMethods: toggleItem<string>(
                            capabilities.supportedCommunicationMethods,
                            method
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className={`min-h-[46px] px-3.5 py-2 rounded-xl border-2 text-left text-xs sm:text-sm font-bold flex items-center justify-between gap-2 cursor-pointer ${
                        selected
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      <span>{method}</span>
                      {selected && <Check className="w-4 h-4 text-teal-800 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <span className="block text-sm font-bold text-slate-900">
                  送迎の可否
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCapabilities({
                      ...capabilities,
                      supportsTransport: !capabilities.supportsTransport,
                    })
                  }
                  aria-pressed={capabilities.supportsTransport}
                  className={`w-full min-h-[46px] px-4 py-2 rounded-xl border-2 text-sm font-bold flex items-center justify-between gap-2 cursor-pointer ${
                    capabilities.supportsTransport
                      ? 'bg-teal-50 border-teal-700 text-teal-950'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <span>
                    {capabilities.supportsTransport
                      ? '送迎あり（可）'
                      : '送迎なし（訪問のみ）'}
                  </span>
                  {capabilities.supportsTransport && (
                    <Check className="w-4 h-4 text-teal-800" />
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="prov-transport-range"
                  className="block text-sm font-bold text-slate-900"
                >
                  送迎範囲（送迎ありの場合）
                </label>
                <input
                  id="prov-transport-range"
                  type="text"
                  value={capabilities.transportRangeText}
                  onChange={(e) =>
                    setCapabilities({
                      ...capabilities,
                      transportRangeText: e.target.value,
                    })
                  }
                  placeholder="例：杉並区・中野区周辺（片道20分圏内）"
                  className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label
                htmlFor="prov-medical-range"
                className="block text-sm font-bold text-slate-900"
              >
                医療的ケアの具体的な対応範囲
              </label>
              <textarea
                id="prov-medical-range"
                rows={2}
                value={capabilities.medicalCareRangeText}
                onChange={(e) =>
                  setCapabilities({
                    ...capabilities,
                    medicalCareRangeText: e.target.value,
                  })
                }
                placeholder="例：喀痰吸引・経管栄養の登録特定行為事業者です。服薬確認・見守りに対応可能です。"
                className="w-full p-3 rounded-xl border border-slate-300 text-sm text-slate-900"
              />
            </div>
          </section>
        </div>
      )}

      {/* ==================== STEP 3: ヘルパー性別対応・曜日ごとの対応可能時間帯 ==================== */}
      {providerWizardStep === 3 && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <h2 className="text-xl font-bold text-slate-900">
              1. ヘルパーの性別に関する対応方針
            </h2>

            <div className="space-y-2.5">
              {PROVIDER_GENDER_POLICIES.map((pol) => {
                const selected = capabilities.helperGenderPolicy === pol;
                return (
                  <button
                    key={pol}
                    type="button"
                    onClick={() =>
                      setCapabilities({
                        ...capabilities,
                        helperGenderPolicy: pol,
                      })
                    }
                    aria-pressed={selected}
                    className={`w-full min-h-[52px] px-4 py-3 rounded-xl border-2 text-left text-base font-bold flex items-center justify-between gap-2 cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{pol}</span>
                    {selected && (
                      <Check className="w-5 h-5 text-teal-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-2">
              <span className="block text-base font-bold text-slate-900">
                在籍・配置可能なヘルパーの性別（両方選択可）
              </span>
              <div className="grid grid-cols-2 gap-3">
                {(['女性', '男性'] as const).map((g) => {
                  const selected =
                    capabilities.availableHelperGenders.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() =>
                        setCapabilities({
                          ...capabilities,
                          availableHelperGenders: toggleItem<'男性' | '女性'>(
                            capabilities.availableHelperGenders,
                            g
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className={`min-h-[50px] px-4 py-2.5 rounded-xl border-2 text-base font-bold flex items-center justify-center gap-2 cursor-pointer ${
                        selected
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      {selected && <Check className="w-4 h-4 text-teal-800" />}
                      <span>{g}ヘルパー在籍</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                2. 対応できる曜日・時間帯
              </h2>
              <p className="text-sm text-slate-600">
                「空きあり」ではなく「対応できる曜日・時間帯」として利用希望者に提示されます。
              </p>
            </div>

            <div className="space-y-4">
              {availability.weeklySchedule.map((dayRow) => (
                <div
                  key={dayRow.day}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-slate-900">
                      {dayRow.day}曜日
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateDaySchedule(dayRow.day, (cur) => ({
                          ...cur,
                          available: !cur.available,
                          note: !cur.available ? '9時〜17時' : '対応不可',
                        }))
                      }
                      aria-pressed={dayRow.available}
                      className={`min-h-[44px] px-4 py-2 rounded-xl border-2 text-sm font-bold cursor-pointer ${
                        dayRow.available
                          ? 'bg-teal-800 border-teal-800 text-white'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      {dayRow.available ? '対応可能（ON）' : '対応不可（OFF）'}
                    </button>
                  </div>

                  {dayRow.available && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {TIME_SLOTS.map((slot) => {
                          const hasSlot = dayRow.timeSlots.includes(slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() =>
                                updateDaySchedule(dayRow.day, (cur) => ({
                                  ...cur,
                                  timeSlots: toggleItem<TimeSlot>(
                                    cur.timeSlots,
                                    slot
                                  ),
                                }))
                              }
                              aria-pressed={hasSlot}
                              className={`min-h-[44px] px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer ${
                                hasSlot
                                  ? 'bg-teal-50 border-teal-700 text-teal-950'
                                  : 'bg-white border-slate-300 text-slate-600'
                              }`}
                            >
                              {hasSlot && (
                                <Check className="w-3.5 h-3.5 text-teal-800" />
                              )}
                              <span>{slot}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div>
                        <label
                          htmlFor={`day-note-${dayRow.day}`}
                          className="block text-xs font-bold text-slate-600 mb-1"
                        >
                          具体的な対応時間帯メモ（例：9時〜12時、13時〜17時）
                        </label>
                        <input
                          id={`day-note-${dayRow.day}`}
                          type="text"
                          value={dayRow.note}
                          onChange={(e) =>
                            updateDaySchedule(dayRow.day, (cur) => ({
                              ...cur,
                              note: e.target.value,
                            }))
                          }
                          className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 下部固定ナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:px-6 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            className="min-h-[50px] px-5 py-3 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-base flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            {providerWizardStep === 1 ? 'マイページへ戻る' : '前へ戻る'}
          </button>

          {providerWizardStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 min-h-[50px] px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>次へ進む（{providerWizardStep + 1} 番目へ）</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex-1 min-h-[50px] px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Check className="w-5 h-5" aria-hidden="true" />
              <span>受入条件カードを保存してマイページへ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

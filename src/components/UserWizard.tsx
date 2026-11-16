import React, { useEffect, useState } from 'react';
import {
  Check,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { HelpTooltip } from './HelpTooltip';
import {
  AgeGroup,
  AREA_OPTIONS,
  CARE_NEED_ITEMS,
  CareNeedItem,
  CERTIFICATE_STATUS_OPTIONS,
  COMMUNICATION_ITEMS,
  CommunicationConsiderationItem,
  DayOfWeek,
  DAYS_OF_WEEK,
  DISABILITY_TYPE_OPTIONS,
  DisabilityType,
  HELPER_GENDER_PREFERENCES,
  PHYSICAL_CONDITION_ITEMS,
  PhysicalConditionItem,
  RegistrantRole,
  SERVICE_TYPES,
  ServiceType,
  StartTiming,
  SUPPORT_CATEGORY_OPTIONS,
  TIME_SLOTS,
  TimeSlot,
  UsageFrequency,
  UserGender,
  UserPreferences,
  UserProfile,
  UserSupportNeeds,
} from '../types/domain';
import {
  getCareNeedVisual,
  getTimeSlotVisual,
  ServiceIllustration,
} from './VisualHelpers';

const AGE_GROUPS: AgeGroup[] = [
  '10代以下',
  '20代',
  '30代',
  '40代',
  '50代',
  '60代',
  '70代以上',
];
const USER_GENDERS: UserGender[] = ['女性', '男性', 'その他・回答しない'];
const REGISTRANT_ROLES: RegistrantRole[] = ['本人', '家族', '支援者'];
const USAGE_FREQUENCIES: UsageFrequency[] = [
  '毎日',
  '週3〜5回',
  '週1〜2回',
  '月数回・不定期',
  '相談して決めたい',
];
const START_TIMINGS: StartTiming[] = [
  'できるだけ早く（1か月以内）',
  '1〜2か月以内',
  '3か月以内',
  '良い事業所があれば時期は相談',
];

export const UserWizard: React.FC = () => {
  const {
    currentUserBundle,
    saveUserBundle,
    userWizardStep,
    setUserWizardStep,
    navigateTo,
  } = useAppState();

  const [profile, setProfile] = useState<UserProfile>(
    currentUserBundle.profile
  );
  const [needs, setNeeds] = useState<UserSupportNeeds>(currentUserBundle.needs);
  const [preferences, setPreferences] = useState<UserPreferences>(
    currentUserBundle.preferences
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedBanner, setSavedBanner] = useState<string>('');

  // Sync when switching active user
  useEffect(() => {
    setProfile(currentUserBundle.profile);
    setNeeds(currentUserBundle.needs);
    setPreferences(currentUserBundle.preferences);
    setErrorMessage('');
  }, [currentUserBundle.profile.id]);

  // Keep draft saved in state when stepping back or forward
  const persistCurrentDraft = () => {
    saveUserBundle({ profile, needs, preferences });
  };

  const toggleItem = <T extends string>(list: T[], item: T): T[] => {
    return list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!profile.nickname.trim()) {
        setErrorMessage(
          'ニックネーム（呼ばれたいお名前・仮名で構いません）を入力してください。'
        );
        return false;
      }
      if (!profile.city.trim()) {
        setErrorMessage('お住まいの市区町村を選択または入力してください。');
        return false;
      }
      if (needs.desiredServices.length === 0) {
        setErrorMessage(
          '利用を希望するサービスを1つ以上選んでください（複数選択できます）。'
        );
        return false;
      }
    }
    if (step === 2) {
      if (needs.careNeeds.length === 0) {
        setErrorMessage(
          '日常生活上の支援ニーズ（お願いしたい介助内容）を1つ以上選んでください。'
        );
        return false;
      }
    }
    if (step === 4) {
      if (preferences.preferredDays.length === 0) {
        setErrorMessage('利用を希望する曜日を1つ以上選んでください。');
        return false;
      }
      if (preferences.preferredTimeSlots.length === 0) {
        setErrorMessage('利用を希望する時間帯を1つ以上選んでください。');
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(userWizardStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    persistCurrentDraft();
    setUserWizardStep(Math.min(4, userWizardStep + 1));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    persistCurrentDraft();
    if (userWizardStep > 1) {
      setUserWizardStep(userWizardStep - 1);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    } else {
      navigateTo('user-dashboard');
    }
  };

  const handleFinishAndSearch = () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    persistCurrentDraft();
    setSavedBanner('ご希望条件を保存しました。マッチング結果画面へ移動します。');
    navigateTo('user-search');
  };

  const handleQuickSave = () => {
    persistCurrentDraft();
    setSavedBanner('入力内容を保存しました。途中で画面を戻っても内容は保持されます。');
    setTimeout(() => setSavedBanner(''), 3500);
  };

  const steps = [
    { num: 1, title: '基本情報・サービス' },
    { num: 2, title: '障害・必要な介助' },
    { num: 3, title: '配慮事項・性別希望' },
    { num: 4, title: '曜日・時間・自由記述' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* 上部ナビ＆ステップインジケーター */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              persistCurrentDraft();
              navigateTo('user-dashboard');
            }}
            className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            利用者ホームへ戻る
          </button>

          <div className="flex items-center gap-2">
            <HelpTooltip guideKey="user-wizard" />
            <button
              type="button"
              onClick={handleQuickSave}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-teal-700 text-teal-900 bg-teal-50 hover:bg-teal-100 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              一時保存する
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            利用希望条件の登録・変更（ステップ {userWizardStep} / 4）
          </h1>
          <p className="text-sm text-slate-600">
            氏名・詳細住所・電話番号の入力は不要です。あてはまるカードをタップして選んでください。
          </p>
        </div>

        {/* ステップ切り替えボタン（どのステップにも直接移動可能） */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {steps.map((s) => {
            const active = userWizardStep === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  persistCurrentDraft();
                  setErrorMessage('');
                  setUserWizardStep(s.num);
                }}
                className={`min-h-[48px] px-3 py-2 rounded-xl text-left border transition-colors cursor-pointer ${
                  active
                    ? 'bg-teal-800 border-teal-800 text-white font-bold'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <span className="block text-xs opacity-85">
                  ステップ {s.num}
                </span>
                <span className="block text-sm truncate">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* エラーメッセージ・保存完了メッセージ */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 border-2 border-red-600 text-red-950 flex items-start gap-3"
        >
          <AlertCircle
            className="w-6 h-6 text-red-700 shrink-0 mt-0.5"
            aria-hidden="true"
          />
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

      {/* ==================== STEP 1: 基本情報・希望サービス・受給者証 ==================== */}
      {userWizardStep === 1 && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">
              1. 基本情報（個人を特定する情報は入力しません）
            </h2>

            {/* ニックネーム */}
            <div className="space-y-2">
              <label
                htmlFor="user-nickname"
                className="block text-base font-bold text-slate-900"
              >
                ニックネーム（本名でなくて構いません）
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </label>
              <p className="text-sm text-slate-600">
                例：「さくら」「けんじ」「たろう（母代筆）」など。検索一覧では「
                {profile.anonymousCode}」と匿名表示されます。
              </p>
              <input
                id="user-nickname"
                type="text"
                value={profile.nickname}
                onChange={(e) =>
                  setProfile({ ...profile, nickname: e.target.value })
                }
                placeholder="例：さくら（母代筆）"
                className="w-full min-h-[52px] px-4 py-3 rounded-xl border border-slate-300 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            {/* 登録者の立場 */}
            <div className="space-y-2">
              <span className="block text-base font-bold text-slate-900">
                登録している方の立場を選んでください
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </span>
              <div className="grid grid-cols-3 gap-3">
                {REGISTRANT_ROLES.map((r) => {
                  const selected = profile.registrantRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setProfile({ ...profile, registrantRole: r })
                      }
                      aria-pressed={selected}
                      className={`min-h-[52px] px-4 py-3 rounded-xl border-2 text-base font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {selected && (
                        <Check className="w-5 h-5 text-teal-800 shrink-0" />
                      )}
                      <span>{r}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 年代 */}
            <div className="space-y-2">
              <span className="block text-base font-bold text-slate-900">
                ご利用者本人の年代を選んでください
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AGE_GROUPS.map((age) => {
                  const selected = profile.ageGroup === age;
                  return (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setProfile({ ...profile, ageGroup: age })}
                      aria-pressed={selected}
                      className={`min-h-[52px] px-3 py-2.5 rounded-xl border-2 text-base font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {selected && (
                        <Check className="w-5 h-5 text-teal-800 shrink-0" />
                      )}
                      <span>{age}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 性別 */}
            <div className="space-y-2">
              <span className="block text-base font-bold text-slate-900">
                ご利用者本人の性別を選んでください
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {USER_GENDERS.map((g) => {
                  const selected = profile.gender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setProfile({ ...profile, gender: g })}
                      aria-pressed={selected}
                      className={`min-h-[52px] px-4 py-3 rounded-xl border-2 text-base font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {selected && (
                        <Check className="w-5 h-5 text-teal-800 shrink-0" />
                      )}
                      <span>{g}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 居住地域（市区町村） */}
            <div className="space-y-2">
              <label
                htmlFor="user-city"
                className="block text-base font-bold text-slate-900"
              >
                お住まいの地域（市区町村まで）を選んでください
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </label>
              <p className="text-sm text-slate-600">
                町名や番地などの詳しい住所は入力しないでください。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-2">
                {AREA_OPTIONS.map((area) => {
                  const selected = profile.city === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setProfile({ ...profile, city: area });
                        if (!preferences.preferredAreas.includes(area)) {
                          setPreferences({
                            ...preferences,
                            preferredAreas: [area, ...preferences.preferredAreas],
                          });
                        }
                      }}
                      aria-pressed={selected}
                      className={`min-h-[48px] px-3 py-2 rounded-xl border-2 text-base font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
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
              <input
                id="user-city"
                type="text"
                value={profile.city}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
                placeholder="その他の市区町村の場合はこちらに入力（例：板橋区）"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
          </section>

          {/* 希望するサービス */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                2. 希望するサービスを選んでください（複数選択できます）
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </h2>
              <p className="text-sm text-slate-600">
                どのサービスかわからない場合は、候補となるものを複数選んで構いません。
              </p>
            </div>

            <div className="space-y-3">
              {SERVICE_TYPES.map((s) => {
                const selected = needs.desiredServices.includes(s.value);
                return (
                  <div
                    key={s.value}
                    className={`rounded-2xl border-2 transition-colors p-4 space-y-3 ${
                      selected
                        ? 'bg-teal-50/70 border-teal-700'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setNeeds({
                          ...needs,
                          desiredServices: toggleItem<ServiceType>(
                            needs.desiredServices,
                            s.value
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className="w-full text-left flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <ServiceIllustration
                          service={s.value}
                          className="w-12 h-12 shrink-0"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            {s.label}
                            {selected && (
                              <span className="text-xs font-bold text-teal-900">
                                （選択中）
                              </span>
                            )}
                          </span>
                          <span className="block text-sm text-slate-700">
                            {s.shortDesc}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1 border ${
                          selected
                            ? 'bg-teal-800 border-teal-800 text-white'
                            : 'bg-white border-slate-400'
                        }`}
                      >
                        {selected && <Check className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* サービス選択時に補足入力欄を表示 */}
                    {selected && (
                      <div className="pt-2 border-t border-teal-200 space-y-1.5">
                        <label
                          htmlFor={`service-note-${s.value}`}
                          className="block text-sm font-bold text-teal-950"
                        >
                          「{s.label}」で特に希望すること（任意）
                        </label>
                        <input
                          id={`service-note-${s.value}`}
                          type="text"
                          value={needs.serviceNotes?.[s.value] || ''}
                          onChange={(e) =>
                            setNeeds({
                              ...needs,
                              serviceNotes: {
                                ...(needs.serviceNotes || {}),
                                [s.value]: e.target.value,
                              },
                            })
                          }
                          placeholder={`例：${
                            s.value === '移動支援'
                              ? '週末の買い物や公園への外出付き添い'
                              : s.value === '居宅介護'
                              ? '週2回の入浴介助と調理・掃除'
                              : s.value === '重度訪問介護'
                              ? '日中の長時間見守りと移乗・排泄介助'
                              : '通院時の同行と書類の代読・代筆'
                          }`}
                          className="w-full min-h-[48px] px-3.5 py-2 rounded-xl border border-teal-600 bg-white text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 受給者証の状況 */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                3. 受給者証（じゅきゅうしゃしょう）の状況を選んでください
                <span className="ml-2 text-xs font-bold text-slate-600">
                  【任意・未取得でも検索できます】
                </span>
              </h2>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-start gap-2.5">
                <HelpCircle
                  className="w-5 h-5 text-teal-800 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p>
                  <strong>受給者証とは：</strong>
                  市区町村の窓口で発行される、障害福祉サービスを利用するための証明書です。現在申請中の方や、これから申請を検討している段階でも事業所に事前相談できます。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CERTIFICATE_STATUS_OPTIONS.map((status) => {
                const selected = profile.certificateStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setProfile({ ...profile, certificateStatus: status })
                    }
                    aria-pressed={selected}
                    className={`min-h-[52px] px-4 py-3 rounded-xl border-2 text-left text-base font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{status}</span>
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

      {/* ==================== STEP 2: 障害種別・支援区分・必要な介助内容 ==================== */}
      {userWizardStep === 2 && (
        <div className="space-y-6">
          {/* 障害・支援に関する情報 */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                1. 障害の種類を選んでください（複数選択できます）
                <span className="ml-2 text-xs font-bold text-slate-600">
                  【任意】
                </span>
              </h2>
              <p className="text-sm text-slate-600">
                事業所がこれまで支援経験のある障害特性と照合するために使用します。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DISABILITY_TYPE_OPTIONS.map((dt) => {
                const selected = needs.disabilityTypes.includes(dt);
                return (
                  <button
                    key={dt}
                    type="button"
                    onClick={() =>
                      setNeeds({
                        ...needs,
                        disabilityTypes: toggleItem<DisabilityType>(
                          needs.disabilityTypes,
                          dt
                        ),
                      })
                    }
                    aria-pressed={selected}
                    className={`min-h-[52px] px-4 py-3 rounded-xl border-2 text-left text-base font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{dt}</span>
                    {selected && (
                      <Check className="w-5 h-5 text-teal-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 障害支援区分 */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="space-y-1">
                <span className="block text-base font-bold text-slate-900">
                  障害支援区分（しょうがいしえんくぶん）を選んでください
                  <span className="ml-2 text-xs font-bold text-slate-600">
                    【任意・わからない場合も選択可】
                  </span>
                </span>
                <p className="text-sm text-slate-600">
                  ※区分1〜6は必要とされる支援の度合いを示します（重度訪問介護は原則区分4以上が対象、移動支援などは区分がなくても利用できる自治体が多くあります）。
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
                {SUPPORT_CATEGORY_OPTIONS.map((cat) => {
                  const selected = needs.supportCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setNeeds({ ...needs, supportCategory: cat })
                      }
                      aria-pressed={selected}
                      className={`min-h-[48px] px-3 py-2.5 rounded-xl border-2 text-sm sm:text-base font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {selected && (
                        <Check className="w-4 h-4 text-teal-800 shrink-0" />
                      )}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 日常生活上の支援ニーズ */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                2. お願いしたい介助・支援内容を選んでください（複数選択可）
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </h2>
              <p className="text-sm text-slate-600">
                事業所の「対応可能な介助項目」と直接照合し、マッチングスコア（25点満点）を算出します。
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CARE_NEED_ITEMS.map((item) => {
                const selected = needs.careNeeds.includes(item);
                const { icon: Icon, shortLabel } = getCareNeedVisual(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      const updatedCare = toggleItem<CareNeedItem>(
                        needs.careNeeds,
                        item
                      );
                      setNeeds({
                        ...needs,
                        careNeeds: updatedCare,
                        essentialCareNeeds: updatedCare,
                      });
                    }}
                    aria-pressed={selected}
                    className={`min-h-[68px] p-3 rounded-2xl border-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          selected
                            ? 'bg-teal-800 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm sm:text-base font-bold leading-snug">
                          {shortLabel}
                        </span>
                      </div>
                    </div>
                    {selected && (
                      <Check className="w-5 h-5 text-teal-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 身体状況・介助方法 */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                3. 身体状況・移動や介助の方法を選んでください（複数選択可）
                <span className="ml-2 text-xs font-bold text-slate-600">
                  【任意】
                </span>
              </h2>
              <p className="text-sm text-slate-600">
                車いすや移乗介助、2人介助の必要性を事業所に伝えるために選びます。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PHYSICAL_CONDITION_ITEMS.map((item) => {
                const selected = needs.physicalConditions.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setNeeds({
                        ...needs,
                        physicalConditions: toggleItem<PhysicalConditionItem>(
                          needs.physicalConditions,
                          item
                        ),
                      })
                    }
                    aria-pressed={selected}
                    className={`min-h-[52px] px-4 py-3 rounded-xl border-2 text-left text-base font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item}</span>
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

      {/* ==================== STEP 3: コミュニケーション配慮・ヘルパー性別の希望 ==================== */}
      {userWizardStep === 3 && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                1. コミュニケーション・行動面の配慮を選んでください（複数選択可）
                <span className="ml-2 text-xs font-bold text-slate-600">
                  【任意】
                </span>
              </h2>
              <p className="text-sm text-slate-600">
                ヘルパーに事前に知っておいてほしい意思疎通の方法や配慮事項を選んでください。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMMUNICATION_ITEMS.map((item) => {
                const selected =
                  needs.communicationConsiderations.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setNeeds({
                        ...needs,
                        communicationConsiderations:
                          toggleItem<CommunicationConsiderationItem>(
                            needs.communicationConsiderations,
                            item
                          ),
                      })
                    }
                    aria-pressed={selected}
                    className={`min-h-[52px] px-4 py-3 rounded-xl border-2 text-left text-base font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item}</span>
                    {selected && (
                      <Check className="w-5 h-5 text-teal-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-2">
              <label
                htmlFor="comm-free-text"
                className="block text-base font-bold text-slate-900"
              >
                コミュニケーションや配慮事項の補足メモ（任意）
              </label>
              <textarea
                id="comm-free-text"
                rows={3}
                value={needs.communicationFreeText}
                onChange={(e) =>
                  setNeeds({
                    ...needs,
                    communicationFreeText: e.target.value,
                  })
                }
                placeholder="例：急な予定変更が苦手なため、事前に行く場所を写真やメモで伝えていただくと安心できます。"
                className="w-full p-3.5 rounded-xl border border-slate-300 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
          </section>

          {/* 性別に関する希望 */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                2. 担当するヘルパーの性別に関する希望を選んでください
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須・重要マッチング条件】
                </span>
              </h2>
              <p className="text-sm text-slate-600">
                入浴や排泄介助、外出時のトイレ介助などで同性ヘルパーを希望される場合は必ず選択してください。
              </p>
            </div>

            <div className="space-y-3">
              {HELPER_GENDER_PREFERENCES.map((pref) => {
                const selected = preferences.helperGenderPreference === pref;
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        helperGenderPreference: pref,
                      })
                    }
                    aria-pressed={selected}
                    className={`w-full min-h-[54px] px-4 py-3 rounded-xl border-2 text-left text-base font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{pref}</span>
                    {selected && (
                      <Check className="w-5 h-5 text-teal-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {preferences.helperGenderPreference !== '性別は問わない' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="block text-sm font-bold text-slate-900">
                  この性別の希望は「必須条件」ですか？
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        isGenderPreferenceStrict: true,
                      })
                    }
                    aria-pressed={preferences.isGenderPreferenceStrict}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold flex items-center justify-between cursor-pointer ${
                      preferences.isGenderPreferenceStrict
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>はい（必須条件として照合する）</span>
                    {preferences.isGenderPreferenceStrict && (
                      <Check className="w-4 h-4 text-teal-800" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        isGenderPreferenceStrict: false,
                      })
                    }
                    aria-pressed={!preferences.isGenderPreferenceStrict}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold flex items-center justify-between cursor-pointer ${
                      !preferences.isGenderPreferenceStrict
                        ? 'bg-teal-50 border-teal-700 text-teal-950'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>いいえ（できれば希望・相談可能）</span>
                    {!preferences.isGenderPreferenceStrict && (
                      <Check className="w-4 h-4 text-teal-800" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ==================== STEP 4: 希望する曜日・時間帯・自由記述 ==================== */}
      {userWizardStep === 4 && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6">
            {/* 希望する曜日 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                1. 希望する曜日を選んでください（複数選択できます）
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                {DAYS_OF_WEEK.map((day) => {
                  const selected = preferences.preferredDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          preferredDays: toggleItem<DayOfWeek>(
                            preferences.preferredDays,
                            day
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className={`min-h-[54px] rounded-xl border-2 text-base font-bold flex flex-col items-center justify-center transition-colors cursor-pointer ${
                        selected
                          ? 'bg-teal-800 border-teal-800 text-white'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span>{day}曜</span>
                      {selected && (
                        <span className="text-[11px] font-medium">選択中</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 希望する時間帯 */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                2. 希望する時間帯を選んでください（複数選択できます）
                <span className="ml-2 text-xs font-bold text-red-700">
                  【必須】
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIME_SLOTS.map((slot) => {
                  const selected =
                    preferences.preferredTimeSlots.includes(slot);
                  const { icon: SlotIcon, shortLabel, subLabel } =
                    getTimeSlotVisual(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          preferredTimeSlots: toggleItem<TimeSlot>(
                            preferences.preferredTimeSlots,
                            slot
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className={`min-h-[60px] px-4 py-3 rounded-2xl border-2 text-left font-bold flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            selected
                              ? 'bg-teal-800 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <SlotIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block text-base font-bold">
                            {shortLabel}
                          </span>
                          <span className="block text-xs text-slate-500 font-normal">
                            {subLabel}
                          </span>
                        </div>
                      </div>
                      {selected && (
                        <Check className="w-5 h-5 text-teal-800 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 利用頻度・利用開始時期 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <div className="space-y-2">
                <label
                  htmlFor="user-frequency"
                  className="block text-base font-bold text-slate-900"
                >
                  3. ご希望の利用頻度
                </label>
                <select
                  id="user-frequency"
                  value={preferences.frequency}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      frequency: e.target.value as UsageFrequency,
                    })
                  }
                  className="w-full min-h-[50px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-slate-900 font-medium"
                >
                  {USAGE_FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="user-start-timing"
                  className="block text-base font-bold text-slate-900"
                >
                  4. 利用開始の希望時期
                </label>
                <select
                  id="user-start-timing"
                  value={preferences.startTiming}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      startTiming: e.target.value as StartTiming,
                    })
                  }
                  className="w-full min-h-[50px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-slate-900 font-medium"
                >
                  {START_TIMINGS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 希望する地域（複数選択） */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <span className="block text-base font-bold text-slate-900">
                5. サービス利用を希望する地域（複数選択可）
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {AREA_OPTIONS.map((area) => {
                  const selected = preferences.preferredAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          preferredAreas: toggleItem<string>(
                            preferences.preferredAreas,
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

            {/* 自由記述：事業所に知っておいてほしいこと */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <label
                htmlFor="free-message-provider"
                className="block text-lg font-bold text-slate-900"
              >
                6. 事業所に知っておいてほしいこと（自由記述・任意）
              </label>
              <p className="text-sm text-slate-600">
                外出時の様子やご希望など、自由にご記入ください。個人の本名や番地、電話番号は書かないでください。
              </p>
              <textarea
                id="free-message-provider"
                rows={4}
                value={preferences.freeMessageToProvider}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    freeMessageToProvider: e.target.value,
                  })
                }
                placeholder="外出時は車いすを使用します。女性ヘルパーを希望しています。土曜日の午後に利用したいです。"
                className="w-full p-4 rounded-xl border border-slate-300 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
          </section>
        </div>
      )}

      {/* 画面下部の固定アクションバー（スマートフォンで押しやすい大きなボタン） */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:px-6 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevStep}
            className="min-h-[50px] px-5 py-3 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-base flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            {userWizardStep === 1 ? 'ホームへ戻る' : '前へ戻る'}
          </button>

          {userWizardStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 min-h-[50px] px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>次へ進む（ステップ {userWizardStep + 1} へ）</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishAndSearch}
              className="flex-1 min-h-[50px] px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Check className="w-5 h-5" aria-hidden="true" />
              <span>登録してマッチする事業所を見る</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

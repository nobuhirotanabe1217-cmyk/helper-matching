import React from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Building2,
  User,
  MapPin,
  ShieldCheck,
  Search,
  Home,
  LogIn,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { CareNeedsIconGrid, WeeklyDayStrip } from './VisualHelpers';
import { DayOfWeek } from '../types/domain';
import { HelpTooltip } from './HelpTooltip';
import { formatMfaMethodLabel } from '../utils/auth';

export const RegistrationCompleteView: React.FC = () => {
  const {
    role,
    lastRegisteredRole,
    currentUserBundle,
    currentProviderBundle,
    currentProviderSubscription,
    isCurrentProviderPaid,
    currentProviderPlanDef,
    userProfiles,
    providerProfiles,
    session,
    navigateTo,
    openRegistrationScreen,
    openLoginScreen,
  } = useAppState();

  const resolvedRole: 'user' | 'provider' =
    lastRegisteredRole || (role === 'provider' ? 'provider' : 'user');
  const isProvider = resolvedRole === 'provider';

  const providerActiveDays: DayOfWeek[] = isProvider
    ? currentProviderBundle.availability.weeklySchedule
        .filter((d) => d.available)
        .map((d) => d.day)
    : [];

  return (
    <div
      data-testid="registration-complete-view"
      className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20 space-y-5"
    >
      <section
        aria-labelledby="registration-complete-heading"
        className={`bg-white rounded-3xl border p-5 sm:p-8 space-y-6 shadow-xs ${
          isProvider ? 'border-indigo-300' : 'border-teal-300'
        }`}
      >
        <div className="flex justify-end">
          <HelpTooltip
            guideKey="registration-complete"
            tone={isProvider ? 'indigo' : 'teal'}
          />
        </div>
        {/* 完了ヘッダー */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative flex items-center justify-center">
            <div
              className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center border ${
                isProvider
                  ? 'bg-indigo-50 border-indigo-200'
                  : 'bg-teal-50 border-teal-200'
              }`}
            >
              <CheckCircle2
                className="w-10 h-10 sm:w-11 sm:h-11 text-emerald-600"
                aria-hidden="true"
              />
            </div>
            <span
              className={`absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs ${
                isProvider ? 'bg-indigo-800' : 'bg-teal-800'
              }`}
              aria-hidden="true"
            >
              {isProvider ? (
                <Building2 className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </span>
          </div>

          <div className="space-y-1.5">
            <p
              className={`text-xs font-extrabold tracking-wide ${
                isProvider ? 'text-indigo-800' : 'text-teal-800'
              }`}
            >
              {isProvider
                ? '事業所アカウントの登録完了'
                : '利用者・家族アカウントの登録完了'}
            </p>

            <h1
              id="registration-complete-heading"
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance"
            >
              しっかり登録できました！
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
              {isProvider
                ? `事業所「${currentProviderBundle.profile.name}」の登録が完了しました。すぐに管理画面や利用希望者の確認ができます。`
                : `「${currentUserBundle.profile.nickname}」さんの希望条件が保存されました。すぐにマイページや事業所探しを始められます。`}
            </p>
          </div>
        </div>

        {/* 登録内容サマリー（フラットな1階層リスト構造） */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 divide-y divide-slate-200">
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900">
              登録された内容の確認
            </h2>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              保存済み
            </span>
          </div>

          {!isProvider ? (
            <>
              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">
                    ニックネーム・匿名ID
                  </span>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    {currentUserBundle.profile.nickname}
                  </p>
                  <p className="text-xs font-mono font-bold text-teal-800">
                    公開ID：{currentUserBundle.profile.anonymousCode}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">
                    地域・希望サービス
                  </span>
                  <p className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                    <MapPin
                      className="w-3.5 h-3.5 text-teal-700 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{currentUserBundle.profile.city}</span>
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {currentUserBundle.needs.desiredServices.join('・')}
                  </p>
                </div>
              </div>

              <div className="px-4 py-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">
                  お願いしたい介助内容
                </span>
                <CareNeedsIconGrid
                  items={currentUserBundle.needs.careNeeds}
                  maxShow={6}
                />
              </div>

              <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500">
                  希望する曜日
                </span>
                <WeeklyDayStrip
                  activeDays={currentUserBundle.preferences.preferredDays}
                />
              </div>

              <div className="px-4 py-3 flex items-center gap-2 text-xs text-teal-900 bg-teal-50/60 rounded-b-2xl font-bold">
                <ShieldCheck
                  className="w-4 h-4 text-teal-700 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  本名・住所・連絡先は事業所へ公開されません（匿名IDでマッチングします）
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">
                    事業所名・契約プラン
                  </span>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    {currentProviderBundle.profile.name}
                  </p>
                  <p className="text-xs font-bold text-indigo-800 tabular-nums">
                    {isCurrentProviderPaid
                      ? `有料プラン（月額 ${currentProviderPlanDef.monthlyPriceYen.toLocaleString()}円）`
                      : '無料プラン（月額 0円）'}
                  </p>
                  {isCurrentProviderPaid &&
                    currentProviderSubscription.paymentSummary && (
                      <p className="text-[11px] font-bold text-slate-600 mt-1">
                        支払方法：
                        {currentProviderSubscription.paymentSummary.method ===
                        'credit_card'
                          ? 'クレジットカード'
                          : '銀行口座振替'}
                        （
                        {currentProviderSubscription.paymentSummary.displayLabel}
                        ）
                      </p>
                    )}
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">
                    対応エリア・提供サービス
                  </span>
                  <p className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                    <MapPin
                      className="w-3.5 h-3.5 text-indigo-700 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      {currentProviderBundle.profile.coverageAreas.join('・')}
                    </span>
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {currentProviderBundle.profile.serviceTypes.join('・')}
                  </p>
                </div>
              </div>

              <div className="px-4 py-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">
                  対応可能な介助内容
                </span>
                <CareNeedsIconGrid
                  items={currentProviderBundle.capabilities.supportedCareItems}
                  maxShow={6}
                />
              </div>

              <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-b-2xl">
                <span className="text-[11px] font-bold text-slate-500">
                  空き枠のある曜日
                </span>
                <WeeklyDayStrip activeDays={providerActiveDays} />
              </div>
            </>
          )}

          {session.email && (
            <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs bg-white/80 rounded-b-2xl">
              <span className="font-bold text-slate-700">
                ログインID：
                <span className="font-mono text-slate-900 ml-1">
                  {session.email}
                </span>
              </span>
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                {formatMfaMethodLabel(
                  session.mfaEnabled,
                  session.mfaMethod || 'email'
                )}
              </span>
            </div>
          )}
        </div>

        {/* 次のアクションボタン */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            data-testid="complete-go-dashboard"
            onClick={() =>
              navigateTo(isProvider ? 'provider-dashboard' : 'user-dashboard')
            }
            className={`w-full min-h-[54px] px-6 py-3 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap ${
              isProvider
                ? 'bg-indigo-800 hover:bg-indigo-900'
                : 'bg-teal-800 hover:bg-teal-900'
            }`}
          >
            <span>
              {isProvider ? '事業所管理画面へ進む' : 'マイページへ進む'}
            </span>
            <ArrowRight className="w-5 h-5 shrink-0" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {!isProvider ? (
              providerProfiles.length === 0 ? (
                <button
                  type="button"
                  data-testid="complete-register-other"
                  onClick={() => openRegistrationScreen('provider')}
                  className="min-h-[46px] px-4 py-2.5 rounded-2xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>続けて事業所も新規登録する</span>
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="complete-go-search"
                  onClick={() => navigateTo('user-search')}
                  className="min-h-[46px] px-4 py-2.5 rounded-2xl border-2 border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span>事業所一覧を見る ({providerProfiles.length})</span>
                </button>
              )
            ) : userProfiles.length === 0 ? (
              <button
                type="button"
                data-testid="complete-register-other"
                onClick={() => openRegistrationScreen('user')}
                className="min-h-[46px] px-4 py-2.5 rounded-2xl border-2 border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <User className="w-4 h-4 shrink-0" />
                <span>続けて利用者も新規登録する</span>
              </button>
            ) : (
              <button
                type="button"
                data-testid="complete-go-search"
                onClick={() => navigateTo('provider-search')}
                className="min-h-[46px] px-4 py-2.5 rounded-2xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>利用希望者一覧を見る ({userProfiles.length})</span>
              </button>
            )}

            <button
              type="button"
              data-testid="complete-go-top"
              onClick={() => navigateTo('top')}
              className="min-h-[46px] px-4 py-2.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>トップ画面へ戻る</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openLoginScreen(isProvider ? 'provider' : 'user')}
            className="w-full min-h-[40px] px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>ログアウトしてログイン・2段階認証画面を試す</span>
          </button>
        </div>
      </section>
    </div>
  );
};

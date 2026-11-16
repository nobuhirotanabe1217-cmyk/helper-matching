import React, { useState } from 'react';
import {
  User,
  Building2,
  ArrowRight,
  RotateCcw,
  UserPlus,
  CheckCircle2,
  SlidersHorizontal,
  LogIn,
  Plus,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { HeroWelfareIllustration } from './VisualHelpers';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import { buildTopScreenSpeechText } from '../utils/speech';

export const TopScreen: React.FC = () => {
  const {
    userProfiles,
    userNeeds,
    providerProfiles,
    providerSubscriptions,
    startAsUserDemo,
    startAsProviderDemo,
    startAsAdminDemo,
    startNewUserRegistration,
    startNewProviderRegistration,
    openLoginScreen,
    resetDemoData,
  } = useAppState();

  const [resetMessage, setResetMessage] = useState<string>('');

  const handleReset = () => {
    resetDemoData();
    setResetMessage('すべての登録データをリセット（0件）しました。');
    setTimeout(() => setResetMessage(''), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. タイトル＆2択スタート画面 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold">
                障害福祉ヘルパー・事業所マッチング（杉並・中野・練馬エリア）
              </span>
              <SpeechButton
                speechId="screen-top"
                isPrimaryScreenReader
                getText={() =>
                  buildTopScreenSpeechText({
                    userCount: userProfiles.length,
                    providerCount: providerProfiles.length,
                  })
                }
              />
              <HelpTooltip guideKey="top" align="left" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              ケアピタ（CarePita）
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              最初はデータが0件（まっさら）の状態です。<strong>利用者</strong>と<strong>事業所</strong>をそれぞれ新規登録してマッチングをお試しください。
            </p>
          </div>
          <HeroWelfareIllustration className="w-40 h-24 shrink-0 hidden sm:block" />
        </div>

        {resetMessage && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-teal-50 border border-teal-300 text-teal-950 text-xs sm:text-sm font-bold"
          >
            {resetMessage}
          </div>
        )}

        {/* 2大カード：左＝利用者 / 右＝事業所 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 左カード：利用者・家族 */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-800 text-white text-xs font-bold">
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>利用者・家族側</span>
                </span>
                <span className="text-xs font-bold text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-200 tabular-nums">
                  完全無料（0円）
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-teal-950">
                  1. 利用者として新規登録
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  希望するサービス・介助内容・曜日を登録して事業所を探し、お気に入り保存・比較ができます。
                </p>
              </div>

              <button
                type="button"
                data-testid="top-user-register-btn"
                onClick={startNewUserRegistration}
                className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm sm:text-base flex items-center justify-between gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>利用者を新規登録する</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                data-testid="top-user-login-btn"
                onClick={() => openLoginScreen('user')}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-white hover:bg-teal-50 border border-teal-300 text-teal-950 font-bold text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-teal-800 shrink-0" />
                  <span>登録済みの方：利用者ログイン画面へ</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              </button>
            </div>

            {/* 登録済みの利用者一覧 */}
            <div className="bg-white rounded-xl p-3.5 border border-teal-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>登録済みの利用者アカウント</span>
                <span className="text-teal-800 tabular-nums">
                  {userProfiles.length} 名
                </span>
              </div>

              {userProfiles.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">
                  まだ登録されていません（0名）
                </p>
              ) : (
                <div className="space-y-1.5">
                  {userProfiles.map((u) => {
                    const n = userNeeds.find((item) => item.userId === u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => startAsUserDemo(u.id, 'user-dashboard')}
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200 text-teal-950 text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                          <span className="truncate">
                            {u.nickname}（{u.city}・
                            {n?.desiredServices.join('/')}）
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 shrink-0 text-teal-800 whitespace-nowrap">
                          <LogIn className="w-3.5 h-3.5" />
                          <span>開く</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 右カード：サービス事業所 */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-800 text-white text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>事業所側</span>
                </span>
                <span className="text-xs font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 tabular-nums">
                  登録0円 / 有料3,980円
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-indigo-950">
                  2. 事業所として新規登録
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  対応可能な介助や空き曜日を登録し、利用希望者との相性や案件進捗を確認します。
                </p>
              </div>

              <button
                type="button"
                data-testid="top-provider-register-btn"
                onClick={startNewProviderRegistration}
                className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-sm sm:text-base flex items-center justify-between gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>事業所を新規登録する</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                data-testid="top-provider-login-btn"
                onClick={() => openLoginScreen('provider')}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-950 font-bold text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-indigo-800 shrink-0" />
                  <span>登録済みの方：事業所ログイン画面へ</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              </button>
            </div>

            {/* 登録済みの事業所一覧 */}
            <div className="bg-white rounded-xl p-3.5 border border-indigo-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>登録済みの事業所アカウント</span>
                <span className="text-indigo-800 tabular-nums">
                  {providerProfiles.length} 社
                </span>
              </div>

              {providerProfiles.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">
                  まだ登録されていません（0社）
                </p>
              ) : (
                <div className="space-y-1.5">
                  {providerProfiles.map((p) => {
                    const sub = providerSubscriptions.find(
                      (s) => s.providerId === p.id
                    );
                    const isPaid =
                      sub && sub.planId !== 'free' && sub.status === 'active';
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          startAsProviderDemo(p.id, 'provider-dashboard')
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-950 text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                          <span className="truncate">
                            [{isPaid ? '有料' : '無料'}] {p.name}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 shrink-0 text-indigo-800 whitespace-nowrap">
                          <LogIn className="w-3.5 h-3.5" />
                          <span>開く</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* テスト手順の3ステップ案内 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-teal-800 block">
              STEP 1：新規登録
            </span>
            <span className="text-slate-600">
              利用者と事業所を1件ずつ新規登録します
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-indigo-800 block">
              STEP 2：相性・お気に入り比較
            </span>
            <span className="text-slate-600">
              相性％や進捗グラフ、お気に入り保存・メモを確認
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-amber-800 block">
              STEP 3：チャット申請・承認
            </span>
            <span className="text-slate-600">
              チャット申請を送って承認・相談を試せます
            </span>
          </div>
        </div>
      </section>

      {/* 下部ユーティリティ（リセット＆管理者画面） */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <button
          type="button"
          onClick={startAsAdminDemo}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline flex items-center gap-1.5 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>運営管理者画面（料金プラン設定・監査ログ）</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>データを0件（まっさら）にリセット</span>
        </button>
      </div>
    </div>
  );
};

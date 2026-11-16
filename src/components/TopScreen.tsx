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
  UserCheck,
  Database,
  BadgeCheck,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { HeroWelfareIllustration } from './VisualHelpers';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import { buildTopScreenSpeechText } from '../utils/speech';
import { formatJapaneseDate } from '../utils/date';
import { CORE_SUBSCRIPTION_MESSAGE } from '../utils/subscription';

export const TopScreen: React.FC = () => {
  const {
    userProfiles,
    userNeeds,
    providerProfiles,
    providerSubscriptions,
    coordinators,
    startAsUserDemo,
    startAsProviderDemo,
    startAsCoordinatorDemo,
    registerCoordinator,
    startAsAdminDemo,
    startNewUserRegistration,
    startNewProviderRegistration,
    openLoginScreen,
    resetDemoData,
    loadDemoData,
  } = useAppState();

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [coordName, setCoordName] = useState('');
  const [coordOffice, setCoordOffice] = useState('');
  const [coordArea, setCoordArea] = useState('');
  const [coordError, setCoordError] = useState('');

  const handleReset = () => {
    resetDemoData();
    setStatusMessage('すべての登録データをリセット（0件）しました。新規登録からお試しいただけます。');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleLoadDemo = () => {
    loadDemoData();
    setStatusMessage('テスト用のサンプルデータ（利用者・事業所・相談支援専門員）を読み込みました。');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleQuickCoordinatorStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordName.trim() || !coordOffice.trim() || !coordArea.trim()) {
      setCoordError('お名前・所属相談支援事業所名・担当エリアを入力してください。');
      return;
    }
    setCoordError('');
    registerCoordinator(
      {
        name: coordName.trim(),
        officeName: coordOffice.trim(),
        area: coordArea.trim(),
      },
      true
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. メインヒーロー＆3役割スタート画面 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold">
                受入可能条件マッチング × 段階的個人情報開示（杉並・中野・練馬ほか）
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
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              事業所が出す<strong>「受入可能条件カード」</strong>と利用者の希望・特性を照合し、条件に合う相手とだけ安心して相談できる福祉マッチング基盤です。連絡先は面談・見学が決まるまで開示されません。
            </p>
          </div>
          <HeroWelfareIllustration className="w-40 h-24 shrink-0 hidden sm:block" />
        </div>

        {statusMessage && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-teal-50 border border-teal-300 text-teal-950 text-xs sm:text-sm font-bold"
          >
            {statusMessage}
          </div>
        )}

        {/* 3大カード：利用者 / 事業所 / 相談支援専門員 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 1. 利用者・家族 */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/35 p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-800 text-white text-xs font-bold">
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>利用者・ご家族</span>
                </span>
                <span className="text-xs font-bold text-teal-900 bg-white px-2.5 py-1 rounded-md border border-teal-200 tabular-nums">
                  完全無料（0円）
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-teal-950">
                  1. 利用者として始める
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  希望条件と「自分の特性プロフィール」を登録し、受入条件が合う事業所を比較・匿名相談できます。
                </p>
              </div>

              <button
                type="button"
                data-testid="top-user-register-btn"
                onClick={startNewUserRegistration}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors"
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
                className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-white hover:bg-teal-50 border border-teal-300 text-teal-950 font-bold text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LogIn className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                  <span>ログイン画面へ（2段階認証）</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              </button>
            </div>

            <div className="bg-white rounded-xl p-3 border border-teal-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>登録済みの利用者</span>
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
                        className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200 text-teal-950 text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span className="truncate">
                            {u.nickname}（{u.city}・{n?.desiredServices.join('/')}）
                          </span>
                        </span>
                        <span className="text-teal-800 shrink-0 whitespace-nowrap">
                          開く →
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 2. サービス事業所 */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/35 p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-800 text-white text-xs font-bold whitespace-nowrap shrink-0">
                  <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>障害福祉事業所</span>
                </span>
                <span className="text-[11px] font-bold text-indigo-900 bg-white px-2 py-1 rounded-md border border-indigo-200 tabular-nums whitespace-nowrap shrink-0">
                  掲載0円 / 3,980円〜
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-indigo-950">
                  2. 事業所として始める
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {CORE_SUBSCRIPTION_MESSAGE}
                </p>
              </div>

              <button
                type="button"
                data-testid="top-provider-register-btn"
                onClick={startNewProviderRegistration}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors"
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
                className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-950 font-bold text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LogIn className="w-3.5 h-3.5 text-indigo-800 shrink-0" />
                  <span>ログイン画面へ（2段階認証）</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              </button>
            </div>

            <div className="bg-white rounded-xl p-3 border border-indigo-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>登録済みの事業所</span>
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
                    const planTag =
                      sub?.planId === 'pro'
                        ? '上位'
                        : sub?.planId === 'standard'
                          ? '有料'
                          : '無料';
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          startAsProviderDemo(p.id, 'provider-dashboard')
                        }
                        className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-950 text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                          <span className="truncate">
                            [{planTag}] {p.name}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0 tabular-nums whitespace-nowrap">
                          更新 {formatJapaneseDate(p.updatedAt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. 相談支援専門員（無料ロール） */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/35 p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-800 text-white text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>相談支援専門員</span>
                </span>
                <span className="text-xs font-bold text-sky-900 bg-white px-2.5 py-1 rounded-md border border-sky-200 tabular-nums">
                  完全無料（0円）
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-sky-950">
                  3. 専門員として簡易登録・利用
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  利用者やご家族から共有された特性プロフィール・希望条件を見て、条件の合う事業所候補を探せます。
                </p>
              </div>

              <form
                onSubmit={handleQuickCoordinatorStart}
                className="bg-white rounded-xl p-3 border border-sky-200 space-y-2"
              >
                {coordError && (
                  <p className="text-[11px] font-bold text-red-700">
                    {coordError}
                  </p>
                )}
                <input
                  type="text"
                  aria-label="相談支援専門員のお名前"
                  value={coordName}
                  onChange={(e) => setCoordName(e.target.value)}
                  placeholder="お名前（例：高橋 健一）"
                  className="w-full min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium"
                />
                <input
                  type="text"
                  aria-label="所属相談支援事業所名"
                  value={coordOffice}
                  onChange={(e) => setCoordOffice(e.target.value)}
                  placeholder="所属事業所（例：すぎなみ相談支援）"
                  className="w-full min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium"
                />
                <input
                  type="text"
                  aria-label="担当エリア"
                  value={coordArea}
                  onChange={(e) => setCoordArea(e.target.value)}
                  placeholder="担当エリア（例：杉並区・中野区）"
                  className="w-full min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium"
                />
                <button
                  type="submit"
                  data-testid="top-coordinator-register-btn"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>簡易登録して専用画面へ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-3 border border-sky-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>登録済みの相談支援専門員</span>
                <span className="text-sky-800 tabular-nums">
                  {coordinators.length} 名
                </span>
              </div>
              {coordinators.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">
                  まだ登録されていません（0名）
                </p>
              ) : (
                <div className="space-y-1.5">
                  {coordinators.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      data-testid={`top-coordinator-open-${c.id}`}
                      onClick={() => startAsCoordinatorDemo(c.id)}
                      className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200 text-sky-950 text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <span className="truncate">
                        {c.name}（{c.officeName}）
                      </span>
                      <span className="text-sky-800 shrink-0 whitespace-nowrap">
                        開く →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 下部ユーティリティ（デモデータ読込・0件リセット・管理者画面） */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <button
          type="button"
          onClick={startAsAdminDemo}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline flex items-center gap-1.5 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>運営管理者画面（事業数値・監査ログ）</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="top-load-demo-btn"
            onClick={handleLoadDemo}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>ダミーデータを読み込む</span>
          </button>

          <button
            type="button"
            data-testid="top-reset-demo-btn"
            onClick={handleReset}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>データを0件（まっさら）にリセット</span>
          </button>
        </div>
      </div>
    </div>
  );
};

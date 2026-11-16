import React from 'react';
import {
  User,
  Building2,
  Home,
  Search,
  SlidersHorizontal,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  FolderOpen,
  UserPlus,
  RotateCcw,
  Bookmark,
  LogIn,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { countUserFavorites } from '../utils/favorites';
import { BrandLogoMark } from './VisualHelpers';
import { AccessibilityControls } from './AccessibilityControls';

export const Header: React.FC = () => {
  const {
    role,
    currentView,
    navigateTo,
    openLoginScreen,
    openRegistrationScreen,
    logout,
    startAsUserDemo,
    startAsProviderDemo,
    resetDemoData,
    messages,
    interactions,
    activeUserId,
    activeProviderId,
    userProfiles,
    providerProfiles,
    currentUserBundle,
    currentProviderBundle,
    currentCoordinator,
    isCurrentProviderPaid,
    chatRequests,
    session,
  } = useAppState();

  const unreadCount = messages.filter((m) => {
    if (role === 'user') {
      return (
        m.userId === activeUserId &&
        m.senderType === 'provider' &&
        !m.readByRecipient
      );
    }
    if (role === 'provider') {
      return (
        m.providerId === activeProviderId &&
        m.senderType === 'user' &&
        !m.readByRecipient
      );
    }
    return false;
  }).length;

  const pendingUserReqCount =
    role === 'user'
      ? chatRequests.filter(
          (r) =>
            r.userId === activeUserId &&
            r.initiatedBy === 'provider' &&
            r.status === 'pending'
        ).length
      : 0;

  const userFavoriteCount = countUserFavorites(interactions, activeUserId);

  const isOnTopOrRegister =
    currentView === 'top' ||
    currentView === 'login' ||
    currentView === 'register' ||
    currentView === 'registration-complete';
  const isUserMode = !isOnTopOrRegister && role === 'user';
  const isProviderMode = !isOnTopOrRegister && role === 'provider';
  const isCoordinatorMode = !isOnTopOrRegister && role === 'coordinator';
  const isAdminMode = !isOnTopOrRegister && role === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* 上段：ロゴ ＆ 利用者/事業所切替 ＆ 新規登録 ＆ リセット */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* 左：ロゴ */}
        <button
          type="button"
          onClick={() => navigateTo('top')}
          className="min-h-[42px] flex items-center gap-1.5 sm:gap-2 text-left cursor-pointer shrink-0"
        >
          <BrandLogoMark />
          <div className="flex flex-col leading-tight">
            <span className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              ケアピタ
            </span>
            <span className="hidden sm:block text-[10px] font-medium text-slate-500 whitespace-nowrap">
              CarePita Matching
            </span>
          </div>
        </button>

        {/* 右：操作バー */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <div
            role="group"
            aria-label="画面切替"
            className="flex items-center p-0.5 sm:p-1 rounded-xl bg-slate-100 border border-slate-200"
          >
            <button
              type="button"
              data-testid="role-switch-user"
              aria-pressed={isUserMode}
              onClick={() => startAsUserDemo(activeUserId, 'user-dashboard')}
              className={`min-h-[34px] px-1.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                isUserMode
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0 hidden sm:inline" aria-hidden="true" />
              <span className="tabular-nums">
                <span className="sm:hidden">利用者({userProfiles.length})</span>
                <span className="hidden sm:inline">
                  利用者画面 ({userProfiles.length})
                </span>
              </span>
            </button>

            <button
              type="button"
              data-testid="role-switch-provider"
              aria-pressed={isProviderMode}
              onClick={() =>
                startAsProviderDemo(activeProviderId, 'provider-dashboard')
              }
              className={`min-h-[34px] px-1.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                isProviderMode
                  ? 'bg-indigo-800 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span className="tabular-nums">
                <span className="sm:hidden">
                  事業所({providerProfiles.length})
                </span>
                <span className="hidden sm:inline">
                  事業所画面 ({providerProfiles.length})
                </span>
              </span>
            </button>
          </div>

          <button
            type="button"
            data-testid="header-login-btn"
            onClick={() =>
              openLoginScreen(role === 'provider' ? 'provider' : 'user')
            }
            className={`hidden md:flex min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-bold items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap transition-colors ${
              currentView === 'login'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>ログイン</span>
          </button>

          <button
            type="button"
            data-testid="header-register-btn"
            onClick={() =>
              openRegistrationScreen(
                role === 'provider' ? 'provider' : 'user'
              )
            }
            className={`min-h-[36px] px-2 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 whitespace-nowrap transition-colors ${
              currentView === 'register'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-teal-800 hover:bg-teal-900 text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="sm:hidden">登録</span>
              <span className="hidden sm:inline">新規登録</span>
            </span>
          </button>

          <AccessibilityControls />

          {(userProfiles.length > 0 || providerProfiles.length > 0) && (
            <button
              type="button"
              onClick={resetDemoData}
              title="登録データをすべて消去して0件に戻す"
              aria-label="登録データを0件に戻す"
              className="hidden sm:flex min-h-[36px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden md:inline">0件に戻す</span>
            </button>
          )}
        </div>
      </div>

      {/* 下段：利用者モード時のシンプルタブバー */}
      {isUserMode && userProfiles.length > 0 && (
        <div className="bg-teal-900 text-white border-t border-teal-800">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center justify-between md:justify-start gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-400 text-teal-950 text-xs font-bold whitespace-nowrap shrink-0">
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>利用者モード</span>
                </span>
                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                  {currentUserBundle.profile.nickname}
                </span>
                {session.mfaVerified && (
                  <span
                    title="2段階認証済みセッション"
                    className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-200 whitespace-nowrap shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    2FA済
                  </span>
                )}
              </div>
              <button
                type="button"
                data-testid="header-logout-btn"
                onClick={logout}
                className="min-h-[28px] px-2 py-1 rounded-lg bg-teal-800 hover:bg-teal-700 text-teal-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3 h-3 shrink-0" />
                <span>ログアウト</span>
              </button>
            </div>

            <nav
              aria-label="利用者メニュー"
              className="flex items-center gap-1 bg-teal-950/60 p-1 rounded-xl overflow-x-auto max-w-full"
            >
              {[
                {
                  id: 'user-dashboard',
                  label: 'マイページ',
                  icon: Home,
                  testId: 'nav-user-dashboard',
                  badge:
                    pendingUserReqCount > 0
                      ? `申請${pendingUserReqCount}`
                      : undefined,
                },
                {
                  id: 'user-search',
                  label: `事業所一覧 (${providerProfiles.length})`,
                  icon: Search,
                  testId: 'nav-user-search',
                  activeMatch:
                    currentView === 'user-search' ||
                    currentView === 'user-provider-detail',
                },
                {
                  id: 'user-favorites',
                  label: 'お気に入り',
                  icon: Bookmark,
                  testId: 'nav-user-favorites',
                  badge:
                    userFavoriteCount > 0 ? `${userFavoriteCount}` : undefined,
                },
                {
                  id: 'chat',
                  label: 'チャット',
                  icon: MessageSquare,
                  testId: 'nav-user-chat',
                  badge: unreadCount > 0 ? `${unreadCount}` : undefined,
                },
                {
                  id: 'user-wizard',
                  label: '条件変更',
                  icon: SlidersHorizontal,
                  testId: 'nav-user-wizard',
                },
                {
                  id: 'google-drive',
                  label: 'ドライブ',
                  icon: FolderOpen,
                  testId: 'nav-user-drive',
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const active =
                  tab.activeMatch !== undefined
                    ? tab.activeMatch
                    : currentView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={tab.testId}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => navigateTo(tab.id as any)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-white text-teal-950 shadow-xs'
                        : 'text-teal-100 hover:bg-teal-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="tabular-nums">{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold tabular-nums ${
                          active
                            ? 'bg-teal-100 text-teal-950'
                            : 'bg-amber-400 text-slate-950'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* 下段：事業所モード時のシンプルタブバー */}
      {isProviderMode && providerProfiles.length > 0 && (
        <div className="bg-indigo-950 text-white border-t border-indigo-900">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center justify-between md:justify-start gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400 text-indigo-950 text-xs font-bold whitespace-nowrap shrink-0">
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>事業所モード</span>
                </span>
                <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[135px] lg:max-w-[175px]">
                  {currentProviderBundle.profile.name}
                </span>
                {session.mfaVerified && (
                  <span
                    title="2段階認証済みセッション"
                    className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-200 whitespace-nowrap shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    2FA済
                  </span>
                )}
              </div>
              <button
                type="button"
                data-testid="header-logout-btn"
                onClick={logout}
                className="min-h-[28px] px-2 py-1 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-indigo-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3 h-3 shrink-0" />
                <span>ログアウト</span>
              </button>
            </div>

            <nav
              aria-label="事業所メニュー"
              className="flex items-center gap-1 bg-indigo-900/70 p-1 rounded-xl overflow-x-auto max-w-full"
            >
              {[
                {
                  id: 'provider-dashboard',
                  label: '事業所ホーム',
                  icon: Home,
                },
                {
                  id: 'provider-search',
                  label: `希望者一覧 (${userProfiles.length})`,
                  icon: Search,
                  activeMatch:
                    currentView === 'provider-search' ||
                    currentView === 'provider-user-detail',
                },
                {
                  id: 'chat',
                  label: 'チャット',
                  icon: MessageSquare,
                  badge: unreadCount > 0 ? `${unreadCount}` : undefined,
                },
                {
                  id: 'provider-wizard',
                  label: '受入条件',
                  icon: SlidersHorizontal,
                },
                {
                  id: 'provider-billing',
                  label: 'プラン',
                  icon: CreditCard,
                  badge: isCurrentProviderPaid ? '有料' : '無料',
                },
                {
                  id: 'google-drive',
                  label: 'ドライブ',
                  icon: FolderOpen,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const active =
                  tab.activeMatch !== undefined
                    ? tab.activeMatch
                    : currentView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => navigateTo(tab.id as any)}
                    className={`min-h-[32px] px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-white text-indigo-950 shadow-xs'
                        : 'text-indigo-100 hover:bg-indigo-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="tabular-nums">{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          active
                            ? 'bg-indigo-100 text-indigo-950'
                            : 'bg-indigo-700 text-white'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {isCoordinatorMode && (
        <div className="bg-sky-900 text-white border-t border-sky-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-300 text-sky-950 text-xs font-bold whitespace-nowrap shrink-0">
                <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>相談支援専門員モード（無料）</span>
              </span>
              {currentCoordinator && (
                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                  {currentCoordinator.officeName} ／ {currentCoordinator.name}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigateTo('top')}
              className="text-xs font-semibold text-sky-100 hover:text-white underline cursor-pointer whitespace-nowrap shrink-0"
            >
              トップへ戻る
            </button>
          </div>
        </div>
      )}

      {isAdminMode && (
        <div className="bg-slate-900 text-white border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-400 text-slate-950 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              運営管理者モード
            </span>
            <button
              type="button"
              onClick={() => navigateTo('top')}
              className="text-xs font-semibold text-slate-300 hover:text-white underline cursor-pointer"
            >
              トップへ戻る
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

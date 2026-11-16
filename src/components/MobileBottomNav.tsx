import React from 'react';
import { Home, Search, FileEdit, MessageSquare, Bookmark } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { countUserFavorites } from '../utils/favorites';

export const MobileBottomNav: React.FC = () => {
  const {
    role,
    currentView,
    navigateTo,
    messages,
    interactions,
    activeUserId,
    activeProviderId,
  } = useAppState();

  // Hide on top screen, admin console, or inside step-by-step wizard
  if (
    role === 'guest' ||
    role === 'admin' ||
    currentView === 'top' ||
    currentView === 'login' ||
    currentView === 'register' ||
    currentView === 'registration-complete' ||
    currentView === 'admin-security' ||
    currentView === 'user-wizard' ||
    currentView === 'provider-wizard'
  ) {
    return null;
  }

  const unreadCount = messages.filter((m) => {
    if (role === 'user') {
      return (
        m.userId === activeUserId &&
        m.senderType === 'provider' &&
        !m.readByRecipient
      );
    }
    return (
      m.providerId === activeProviderId &&
      m.senderType === 'user' &&
      !m.readByRecipient
    );
  }).length;

  const userFavoriteCount = countUserFavorites(interactions, activeUserId);

  if (role === 'user') {
    const tabs = [
      {
        id: 'user-dashboard' as const,
        label: 'ホーム',
        icon: Home,
        active:
          currentView === 'user-dashboard' || currentView === 'user-privacy',
      },
      {
        id: 'user-search' as const,
        label: '探す',
        icon: Search,
        active:
          currentView === 'user-search' ||
          currentView === 'user-provider-detail',
      },
      {
        id: 'user-favorites' as const,
        label: userFavoriteCount > 0 ? `お気に入り(${userFavoriteCount})` : 'お気に入り',
        icon: Bookmark,
        active: currentView === 'user-favorites',
      },
      {
        id: 'chat' as const,
        label: unreadCount > 0 ? `相談(${unreadCount})` : '相談',
        icon: MessageSquare,
        active: currentView === 'chat',
      },
    ];

    return (
      <nav
        aria-label="スマートフォン下部メニュー"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center h-15 px-1.5 gap-1 shadow-xs"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={tab.active ? 'page' : undefined}
              onClick={() => navigateTo(tab.id)}
              className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                tab.active
                  ? 'bg-teal-800 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  const providerTabs = [
    {
      id: 'provider-dashboard' as const,
      label: 'ホーム',
      icon: Home,
      active: currentView === 'provider-dashboard',
    },
    {
      id: 'provider-search' as const,
      label: '利用希望者',
      icon: Search,
      active:
        currentView === 'provider-search' ||
        currentView === 'provider-user-detail',
    },
    {
      id: 'provider-wizard' as const,
      label: '条件・空き枠',
      icon: FileEdit,
      active: false,
    },
    {
      id: 'chat' as const,
      label: unreadCount > 0 ? `相談(${unreadCount})` : '相談',
      icon: MessageSquare,
      active: currentView === 'chat',
    },
  ];

  return (
    <nav
      aria-label="事業所スマートフォン下部メニュー"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center h-15 px-1.5 gap-1 shadow-xs"
    >
      {providerTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={tab.active ? 'page' : undefined}
            onClick={() => navigateTo(tab.id)}
            className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
              tab.active
                ? 'bg-indigo-800 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

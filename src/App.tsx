import React from 'react';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import { SpeechProvider, useSpeech } from './context/SpeechContext';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { TopScreen } from './components/TopScreen';
import { UserDashboard } from './components/UserDashboard';
import { UserWizard } from './components/UserWizard';
import { UserSearchProviders } from './components/UserSearchProviders';
import { ProviderDetailView } from './components/ProviderDetailView';
import { UserPrivacySettings } from './components/UserPrivacySettings';
import { ProviderDashboard } from './components/ProviderDashboard';
import { ProviderWizard } from './components/ProviderWizard';
import { ProviderSearchUsers } from './components/ProviderSearchUsers';
import { UserDetailForProvider } from './components/UserDetailForProvider';
import { ProviderBillingView } from './components/ProviderBillingView';
import { ChatView } from './components/ChatView';
import { AdminSecurityConsole } from './components/AdminSecurityConsole';
import { GoogleDriveView } from './components/GoogleDriveView';
import { RegistrationView } from './components/RegistrationView';
import { RegistrationCompleteView } from './components/RegistrationCompleteView';
import { LoginView } from './components/LoginView';
import { FreePlanChatUpgradeModal } from './components/VisualHelpers';
import { CheckCircle2, X } from 'lucide-react';

const MainRouter: React.FC = () => {
  const {
    currentView,
    navigateTo,
    showChatUpgradeModal,
    setShowChatUpgradeModal,
    subscriptionPlans,
    registrationBanner,
    setRegistrationBanner,
  } = useAppState();

  const { liveAnnouncement } = useSpeech();

  const standardPlan =
    subscriptionPlans.find((p) => p.id === 'standard') || subscriptionPlans[1];

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-slate-900 focus:text-white focus:font-bold focus:text-sm focus:shadow-lg"
      >
        メインコンテンツへスキップ
      </a>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      <Header />

      {registrationBanner && (
        <div
          role="status"
          className="bg-emerald-900 text-white border-b border-emerald-700 px-4 py-2.5"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-extrabold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{registrationBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setRegistrationBanner(null)}
              className="px-2 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              閉じる
            </button>
          </div>
        </div>
      )}

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {currentView === 'top' && <TopScreen />}
        {currentView === 'login' && <LoginView />}
        {currentView === 'register' && <RegistrationView />}
        {currentView === 'registration-complete' && (
          <RegistrationCompleteView />
        )}
        {currentView === 'user-dashboard' && <UserDashboard />}
        {currentView === 'user-wizard' && <UserWizard />}
        {currentView === 'user-search' && (
          <UserSearchProviders favoritesOnly={false} />
        )}
        {currentView === 'user-favorites' && (
          <UserSearchProviders favoritesOnly={true} />
        )}
        {currentView === 'user-provider-detail' && <ProviderDetailView />}
        {currentView === 'user-privacy' && <UserPrivacySettings />}
        {currentView === 'provider-dashboard' && <ProviderDashboard />}
        {currentView === 'provider-wizard' && <ProviderWizard />}
        {currentView === 'provider-search' && <ProviderSearchUsers />}
        {currentView === 'provider-user-detail' && <UserDetailForProvider />}
        {currentView === 'provider-billing' && <ProviderBillingView />}
        {currentView === 'admin-security' && <AdminSecurityConsole />}
        {currentView === 'chat' && <ChatView />}
        {currentView === 'google-drive' && <GoogleDriveView />}
      </main>

      {/* 無料プラン事業者がチャットボタンを押した際の案内モーダル */}
      <FreePlanChatUpgradeModal
        isOpen={showChatUpgradeModal}
        monthlyPriceYen={standardPlan?.monthlyPriceYen ?? 3980}
        onClose={() => setShowChatUpgradeModal(false)}
        onViewPlanDetails={() => {
          setShowChatUpgradeModal(false);
          navigateTo('provider-billing');
        }}
      />

      <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-6 text-xs text-slate-600 pb-20 md:pb-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p>
            <strong>ケアピタ（CarePita）</strong>｜わたしの希望に、ピタッと寄り添うヘルパー探し。
            — 対象：居宅介護・重度訪問介護・移動支援・同行援護（杉並区・中野区・練馬区周辺）
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigateTo('top')}
              className="hover:text-teal-800 underline cursor-pointer"
            >
              トップ・料金プラン・個人情報保護について
            </button>
          </div>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppStateProvider>
      <SpeechProvider>
        <MainRouter />
      </SpeechProvider>
    </AppStateProvider>
  );
}

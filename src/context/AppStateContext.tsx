import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AccountCredential,
  AuditActionType,
  AuditLogEntry,
  AuthSession,
  AuthUserRole,
  CaseManagementStatus,
  ChatMessage,
  ChatRequest,
  DisclosureConsent,
  MatchingInteraction,
  PendingMfaChallenge,
  ProviderAcceptanceStatus,
  ProviderAccountApprovalStatus,
  ProviderAvailability,
  ProviderCapabilities,
  ProviderPaymentSummary,
  ProviderProfile,
  ProviderReactionStatus,
  ProviderSubscription,
  SubscriptionPlanDefinition,
  SubscriptionPlanId,
  UserPII,
  UserPreferences,
  UserProfile,
  UserSupportNeeds,
} from '../types/domain';
import {
  createMfaChallenge,
  normalizeEmail,
  verifyOtpCode,
  verifyPasswordLogin,
} from '../utils/auth';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CHAT_REQUESTS,
  INITIAL_DISCLOSURES,
  INITIAL_INTERACTIONS,
  INITIAL_MESSAGES,
  INITIAL_PROVIDER_AVAILABILITY,
  INITIAL_PROVIDER_CAPABILITIES,
  INITIAL_PROVIDER_PROFILES,
  INITIAL_PROVIDER_SUBSCRIPTIONS,
  INITIAL_USER_NEEDS,
  INITIAL_USER_PII,
  INITIAL_USER_PREFERENCES,
  INITIAL_USER_PROFILES,
} from '../data/mockData';
import { FullProviderBundle, FullUserBundle } from '../utils/matching';
import {
  applyToggleFavoriteInteraction,
  applyUpdateFavoriteNoteInteraction,
} from '../utils/favorites';
import { RateLimitState, SecurityController } from '../utils/security';
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  getProviderPlanDefinition,
  isPaidPlanActive,
} from '../utils/subscription';

export type AppRole = 'guest' | 'user' | 'provider' | 'admin';

export type AppView =
  | 'top'
  | 'login'
  | 'register'
  | 'registration-complete'
  | 'user-dashboard'
  | 'user-wizard'
  | 'user-search'
  | 'user-provider-detail'
  | 'user-favorites'
  | 'user-privacy'
  | 'provider-dashboard'
  | 'provider-wizard'
  | 'provider-search'
  | 'provider-user-detail'
  | 'provider-billing'
  | 'admin-security'
  | 'chat'
  | 'google-drive';

export interface NewUserRegistrationInput {
  nickname: string;
  email: string;
  registrantRole: UserProfile['registrantRole'];
  ageGroup: UserProfile['ageGroup'];
  gender: UserProfile['gender'];
  city: string;
  certificateStatus: UserProfile['certificateStatus'];
  fullName: string;
  phoneNumber: string;
  detailedAddress: string;
  nearestStationArea: string;
  desiredServices: UserSupportNeeds['desiredServices'];
  disabilityTypes: UserSupportNeeds['disabilityTypes'];
  supportCategory: UserSupportNeeds['supportCategory'];
  careNeeds: UserSupportNeeds['careNeeds'];
  physicalConditions: UserSupportNeeds['physicalConditions'];
  helperGenderPreference: UserPreferences['helperGenderPreference'];
  isGenderPreferenceStrict: boolean;
  preferredDays: UserPreferences['preferredDays'];
  preferredTimeSlots: UserPreferences['preferredTimeSlots'];
  freeMessageToProvider: string;
  password?: string;
  mfaEnabled?: boolean;
  mfaMethod?: 'email' | 'sms';
}

export interface NewProviderRegistrationInput {
  name: string;
  email: string;
  phoneNumber?: string;
  contactPersonName: string;
  locationCity: string;
  coverageAreas: string[];
  serviceTypes: ProviderProfile['serviceTypes'];
  planId: SubscriptionPlanId;
  businessDaysHours: string;
  introduction: string;
  supportedCareItems: ProviderCapabilities['supportedCareItems'];
  supportedDisabilities: ProviderCapabilities['supportedDisabilities'];
  supportsWheelchairTransfer: boolean;
  supportsTwoPersonCare: boolean;
  helperGenderPolicy: ProviderCapabilities['helperGenderPolicy'];
  availableHelperGenders: ('男性' | '女性')[];
  acceptanceStatus: ProviderAcceptanceStatus;
  availableDays: ProviderAvailability['weeklySchedule'][number]['day'][];
  availableTimeSlots: ProviderAvailability['weeklySchedule'][number]['timeSlots'];
  acceptableConditionsNote: string;
  paymentSummary?: ProviderPaymentSummary;
  password?: string;
  mfaEnabled?: boolean;
  mfaMethod?: 'email' | 'sms';
}

interface AppStateContextValue {
  role: AppRole;
  currentView: AppView;
  activeUserId: string;
  activeProviderId: string;
  selectedProviderIdForDetail: string | null;
  selectedUserIdForDetail: string | null;
  activeChatPartnerId: string | null;
  userWizardStep: number;
  providerWizardStep: number;

  // 分離管理データ (A: PII, B: 公開照合用プロファイル・支援ニーズ)
  userPIIList: UserPII[];
  userProfiles: UserProfile[];
  userNeeds: UserSupportNeeds[];
  userPreferences: UserPreferences[];
  providerProfiles: ProviderProfile[];
  providerCapabilities: ProviderCapabilities[];
  providerAvailabilities: ProviderAvailability[];
  interactions: MatchingInteraction[];
  messages: ChatMessage[];
  disclosures: DisclosureConsent[];

  // サブスクリプション＆チャット開始申請
  subscriptionPlans: SubscriptionPlanDefinition[];
  providerSubscriptions: ProviderSubscription[];
  chatRequests: ChatRequest[];
  currentProviderSubscription: ProviderSubscription;
  currentProviderPlanDef: SubscriptionPlanDefinition;
  isCurrentProviderPaid: boolean;
  showChatUpgradeModal: boolean;
  setShowChatUpgradeModal: (show: boolean) => void;

  // セキュリティ・監査ログ・セッション (指示書 3, 7, 8)
  session: AuthSession;
  auditLogs: AuditLogEntry[];
  rateLimitMap: Record<string, RateLimitState>;
  securityAlertMessage: string | null;
  setSecurityAlertMessage: (msg: string | null) => void;

  // Helpers
  currentUserBundle: FullUserBundle;
  currentProviderBundle: FullProviderBundle;
  getUserBundleById: (userId: string) => FullUserBundle | undefined;
  getProviderBundleById: (providerId: string) => FullProviderBundle | undefined;
  getProviderSubscription: (providerId: string) => ProviderSubscription;
  getChatRequestBetween: (
    userId: string,
    providerId: string
  ) => ChatRequest | undefined;

  // セキュアデータ取得 (サーバー権限検証を模倣)
  getPiiIfPermitted: (targetUserId: string) => {
    permitted: boolean;
    data?: UserPII;
    reason: string;
  };

  // 認証・登録・2段階認証 (2FA)
  accountCredentials: AccountCredential[];
  pendingMfaChallenge: PendingMfaChallenge | null;
  loginTab: 'user' | 'provider';
  setLoginTab: (tab: 'user' | 'provider') => void;
  openLoginScreen: (tab?: 'user' | 'provider') => void;
  initiateCredentialLogin: (params: {
    role: 'user' | 'provider';
    email: string;
    password: string;
  }) => { success: boolean; requiresMfa: boolean; message: string };
  verifyLoginMfaCode: (code: string) => {
    success: boolean;
    locked: boolean;
    message: string;
  };
  resendMfaCode: (overrideMethod?: 'email' | 'sms') => void;
  cancelMfaChallenge: () => void;
  logout: () => void;

  // Navigation & Mode actions
  registerTab: 'user' | 'provider';
  setRegisterTab: (tab: 'user' | 'provider') => void;
  lastRegisteredRole: 'user' | 'provider' | null;
  registrationBanner: string | null;
  setRegistrationBanner: (msg: string | null) => void;
  openRegistrationScreen: (tab?: 'user' | 'provider') => void;
  completeUserRegistration: (
    input: NewUserRegistrationInput,
    targetView?: AppView
  ) => void;
  completeProviderRegistration: (
    input: NewProviderRegistrationInput,
    targetView?: AppView
  ) => void;
  loginByEmail: (email: string) => { success: boolean; message: string };
  navigateTo: (view: AppView) => void;
  startAsUserDemo: (userId?: string, targetView?: AppView) => void;
  startAsProviderDemo: (providerId?: string, targetView?: AppView) => void;
  startAsAdminDemo: () => void;
  startNewUserRegistration: () => void;
  startNewProviderRegistration: () => void;
  setActiveUserId: (userId: string) => void;
  setActiveProviderId: (providerId: string) => void;
  openProviderDetail: (providerId: string) => void;
  openUserDetailForProvider: (userId: string) => void;
  openChatWith: (partnerId: string) => void;
  setUserWizardStep: (step: number) => void;
  setProviderWizardStep: (step: number) => void;

  // Subscription & Chat Request actions
  subscribeProviderToPlan: (
    providerId: string,
    planId: SubscriptionPlanId,
    paymentSummary?: ProviderPaymentSummary
  ) => void;
  updateProviderPaymentMethod: (
    providerId: string,
    paymentSummary: ProviderPaymentSummary
  ) => void;
  cancelProviderSubscription: (providerId: string) => void;
  updatePlanMonthlyPrice: (
    planId: SubscriptionPlanId,
    newPriceYen: number
  ) => void;
  updateProviderApprovalStatus: (
    providerId: string,
    status: ProviderAccountApprovalStatus
  ) => void;
  sendChatRequest: (
    userId: string,
    providerId: string,
    initiatedBy: 'provider' | 'user',
    initialMessage: string
  ) => void;
  respondToChatRequest: (
    requestId: string,
    decision: 'approved' | 'declined'
  ) => void;
  updateCaseManagementStatus: (
    userId: string,
    providerId: string,
    caseStatus: CaseManagementStatus
  ) => void;

  // Security & Data mutations
  saveUserBundle: (bundle: FullUserBundle, pii?: Partial<UserPII>) => void;
  saveProviderBundle: (bundle: FullProviderBundle) => void;
  updateProviderAcceptanceStatus: (
    providerId: string,
    status: ProviderAcceptanceStatus,
    note?: string
  ) => void;
  toggleUserFavoriteProvider: (userId: string, providerId: string) => void;
  updateUserFavoriteNote: (
    userId: string,
    providerId: string,
    note: string
  ) => void;
  setProviderReactionToUser: (
    userId: string,
    providerId: string,
    reaction: ProviderReactionStatus
  ) => void;
  sendMessage: (
    userId: string,
    providerId: string,
    senderType: 'user' | 'provider',
    text: string
  ) => void;
  markMessagesRead: (
    userId: string,
    providerId: string,
    viewerType: 'user' | 'provider'
  ) => void;
  grantStage3Disclosure: (
    userId: string,
    providerId: string,
    allowPiiContactAccess?: boolean
  ) => void;
  revokeStage3Disclosure: (userId: string, providerId: string) => void;
  getDisclosureStage: (userId: string, providerId: string) => DisclosureConsent;
  resetDemoData: () => void;
  toggleMfaSetting: () => void;
  simulateRateLimitTrigger: () => void;
}

const STORAGE_KEY = 'carepita_clean_blank_v1';

const AppStateContext = createContext<AppStateContextValue | null>(null);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const loadSaved = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  };

  const saved = loadSaved();

  const [role, setRole] = useState<AppRole>('guest');
  const [currentView, setCurrentView] = useState<AppView>('top');
  const [activeUserId, setActiveUserId] = useState<string>(
    saved?.userProfiles?.[0]?.id || ''
  );
  const [activeProviderId, setActiveProviderId] = useState<string>(
    saved?.providerProfiles?.[0]?.id || ''
  );
  const [selectedProviderIdForDetail, setSelectedProviderIdForDetail] =
    useState<string | null>(null);
  const [selectedUserIdForDetail, setSelectedUserIdForDetail] = useState<
    string | null
  >(null);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(
    null
  );
  const [userWizardStep, setUserWizardStep] = useState<number>(1);
  const [providerWizardStep, setProviderWizardStep] = useState<number>(1);
  const [securityAlertMessage, setSecurityAlertMessage] = useState<string | null>(
    null
  );
  const [rateLimitMap, setRateLimitMap] = useState<Record<string, RateLimitState>>(
    {}
  );
  const [showChatUpgradeModal, setShowChatUpgradeModal] =
    useState<boolean>(false);
  const [registerTab, setRegisterTab] = useState<'user' | 'provider'>('user');
  const [loginTab, setLoginTab] = useState<'user' | 'provider'>('user');
  const [pendingMfaChallenge, setPendingMfaChallenge] =
    useState<PendingMfaChallenge | null>(null);
  const [lastRegisteredRole, setLastRegisteredRole] = useState<
    'user' | 'provider' | null
  >(null);
  const [registrationBanner, setRegistrationBanner] = useState<string | null>(
    null
  );

  // 初期状態はすべて「0件（まっさらな状態）」からスタート
  const [userPIIList, setUserPIIList] = useState<UserPII[]>(
    saved?.userPIIList || []
  );
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(
    saved?.userProfiles || []
  );
  const [userNeeds, setUserNeeds] = useState<UserSupportNeeds[]>(
    saved?.userNeeds || []
  );
  const [userPreferences, setUserPreferences] = useState<UserPreferences[]>(
    saved?.userPreferences || []
  );
  const [providerProfiles, setProviderProfiles] = useState<ProviderProfile[]>(
    saved?.providerProfiles || []
  );
  const [providerCapabilities, setProviderCapabilities] = useState<
    ProviderCapabilities[]
  >(saved?.providerCapabilities || []);
  const [providerAvailabilities, setProviderAvailabilities] = useState<
    ProviderAvailability[]
  >(saved?.providerAvailabilities || []);
  const [interactions, setInteractions] = useState<MatchingInteraction[]>(
    saved?.interactions || []
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    saved?.messages || []
  );
  const [disclosures, setDisclosures] = useState<DisclosureConsent[]>(
    saved?.disclosures || []
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(
    saved?.auditLogs || []
  );
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlanDefinition[]
  >(saved?.subscriptionPlans || DEFAULT_SUBSCRIPTION_PLANS);
  const [providerSubscriptions, setProviderSubscriptions] = useState<
    ProviderSubscription[]
  >(saved?.providerSubscriptions || []);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>(
    saved?.chatRequests || []
  );
  const [accountCredentials, setAccountCredentials] = useState<
    AccountCredential[]
  >(saved?.accountCredentials || []);

  // 認証セッション (RBAC)
  const [session, setSession] = useState<AuthSession>(() => {
    return {
      userId: 'guest',
      role: 'user',
      email: '',
      mfaEnabled: true,
      mfaVerified: false,
      ipAddress: '192.168.1.10',
      lastActive: '2026-11-12 12:00',
      accountStatus: 'active',
    };
  });

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          userPIIList,
          userProfiles,
          userNeeds,
          userPreferences,
          providerProfiles,
          providerCapabilities,
          providerAvailabilities,
          interactions,
          messages,
          disclosures,
          auditLogs,
          subscriptionPlans,
          providerSubscriptions,
          chatRequests,
          accountCredentials,
        })
      );
    } catch {
      // storage quota handled
    }
  }, [
    userPIIList,
    userProfiles,
    userNeeds,
    userPreferences,
    providerProfiles,
    providerCapabilities,
    providerAvailabilities,
    interactions,
    messages,
    disclosures,
    auditLogs,
    subscriptionPlans,
    providerSubscriptions,
    chatRequests,
    accountCredentials,
  ]);

  const addAuditLog = (
    action: AuditActionType,
    detail: string,
    targetId?: string,
    isSecurityAlert?: boolean
  ) => {
    const entry = SecurityController.createAuditLog({
      actorId:
        role === 'provider'
          ? activeProviderId || 'provider'
          : role === 'admin'
          ? 'admin-001'
          : activeUserId || 'user',
      actorRole: role === 'guest' ? 'user' : (role as AuthUserRole),
      action,
      detail,
      targetId,
      isSecurityAlert,
    });
    setAuditLogs((prev) => [entry, ...prev]);
  };

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const getUserBundleById = (userId: string): FullUserBundle | undefined => {
    const profile = userProfiles.find((u) => u.id === userId);
    const needs = userNeeds.find((u) => u.userId === userId);
    const preferences = userPreferences.find((u) => u.userId === userId);
    if (!profile || !needs || !preferences) return undefined;
    return { profile, needs, preferences };
  };

  const getProviderBundleById = (
    providerId: string
  ): FullProviderBundle | undefined => {
    const profile = providerProfiles.find((p) => p.id === providerId);
    const capabilities = providerCapabilities.find(
      (p) => p.providerId === providerId
    );
    const availability = providerAvailabilities.find(
      (p) => p.providerId === providerId
    );
    if (!profile || !capabilities || !availability) return undefined;
    return { profile, capabilities, availability };
  };

  const currentUserBundle: FullUserBundle =
    getUserBundleById(activeUserId) ||
    (userProfiles[0] && getUserBundleById(userProfiles[0].id)) || {
      profile: INITIAL_USER_PROFILES[0],
      needs: INITIAL_USER_NEEDS[0],
      preferences: INITIAL_USER_PREFERENCES[0],
    };

  const currentProviderBundle: FullProviderBundle =
    getProviderBundleById(activeProviderId) ||
    (providerProfiles[0] && getProviderBundleById(providerProfiles[0].id)) || {
      profile: INITIAL_PROVIDER_PROFILES[0],
      capabilities: INITIAL_PROVIDER_CAPABILITIES[0],
      availability: INITIAL_PROVIDER_AVAILABILITY[0],
    };

  const getProviderSubscription = (
    providerId: string
  ): ProviderSubscription => {
    const found = providerSubscriptions.find(
      (s) => s.providerId === providerId
    );
    if (found) return found;
    return {
      providerId,
      planId: 'free',
      status: 'active',
      startedAt: '2026-11-12',
      nextRenewalDate: '-',
      accountApprovalStatus: 'approved',
    };
  };

  const currentProviderSubscription = getProviderSubscription(activeProviderId);
  const currentProviderPlanDef = getProviderPlanDefinition(
    currentProviderSubscription,
    subscriptionPlans
  );
  const isCurrentProviderPaid = isPaidPlanActive(
    currentProviderSubscription,
    subscriptionPlans
  );

  const getChatRequestBetween = (
    userId: string,
    providerId: string
  ): ChatRequest | undefined => {
    return chatRequests.find(
      (r) => r.userId === userId && r.providerId === providerId
    );
  };

  /**
   * PIIへのアクセス検証 (サーバー権限ガードの模倣)
   */
  const getPiiIfPermitted = (
    targetUserId: string
  ): { permitted: boolean; data?: UserPII; reason: string } => {
    const actorId =
      role === 'provider'
        ? activeProviderId
        : role === 'admin'
        ? 'admin-001'
        : activeUserId;
    const actorRole = (role === 'guest' ? 'user' : role) as AuthUserRole;
    const disclosure = disclosures.find(
      (d) => d.userId === targetUserId && d.providerId === activeProviderId
    );

    const check = SecurityController.verifyPiiAccess({
      actorId,
      actorRole,
      targetUserId,
      disclosure,
    });

    if (!check.allowed) {
      addAuditLog(
        'DATA_VIEW_PII',
        `【アクセス拒否】${check.reason} (Target: ${targetUserId})`,
        targetUserId,
        true
      );
      return { permitted: false, reason: check.reason };
    }

    const pii = userPIIList.find((p) => p.userId === targetUserId);
    addAuditLog(
      'DATA_VIEW_PII',
      `本人特定情報（PII）へのアクセス認可成功 (Target: ${targetUserId})`,
      targetUserId,
      false
    );
    return { permitted: true, data: pii, reason: check.reason };
  };

  const startAsUserDemo = (userId?: string, targetView?: AppView) => {
    if (userProfiles.length === 0) {
      setRegisterTab('user');
      navigateTo('register');
      return;
    }
    const targetId = userId || activeUserId || userProfiles[0].id;
    setActiveUserId(targetId);
    setRole('user');
    setSession({
      userId: targetId,
      role: 'user',
      email: `${targetId}@demo.local`,
      mfaEnabled: true,
      mfaVerified: true,
      lastActive: '2026-11-12 12:00',
      accountStatus: 'active',
    });
    addAuditLog('AUTH_LOGIN', `利用者セッション開始 (${targetId})`);
    setUserWizardStep(1);
    navigateTo(targetView || 'user-dashboard');
  };

  const startAsProviderDemo = (providerId?: string, targetView?: AppView) => {
    if (providerProfiles.length === 0) {
      setRegisterTab('provider');
      navigateTo('register');
      return;
    }
    const targetId = providerId || activeProviderId || providerProfiles[0].id;
    setActiveProviderId(targetId);
    setRole('provider');
    setSession({
      userId: targetId,
      role: 'provider',
      email: `${targetId}@provider.local`,
      mfaEnabled: true,
      mfaVerified: true,
      lastActive: '2026-11-12 12:00',
      accountStatus: 'active',
    });
    addAuditLog('AUTH_LOGIN', `事業所セッション開始 (${targetId})`);
    setProviderWizardStep(1);
    navigateTo(targetView || 'provider-dashboard');
  };

  const startAsAdminDemo = () => {
    setRole('admin');
    setSession({
      userId: 'admin-001',
      role: 'admin',
      email: 'security.admin@matching.system.local',
      mfaEnabled: true,
      mfaVerified: true,
      lastActive: '2026-11-09 09:10',
      accountStatus: 'active',
    });
    addAuditLog(
      'AUTH_LOGIN',
      '運営管理者セッション開始（事業運営＆セキュリティ監査）'
    );
    navigateTo('admin-security');
  };

  const openLoginScreen = (tab: 'user' | 'provider' = 'user') => {
    setLoginTab(tab);
    setPendingMfaChallenge(null);
    navigateTo('login');
  };

  const openRegistrationScreen = (tab: 'user' | 'provider' = 'user') => {
    setRegisterTab(tab);
    navigateTo('register');
  };

  const startNewUserRegistration = () => {
    setRegisterTab('user');
    navigateTo('register');
  };

  const startNewProviderRegistration = () => {
    setRegisterTab('provider');
    navigateTo('register');
  };

  const completeUserRegistration = (
    input: NewUserRegistrationInput,
    targetView: AppView = 'registration-complete'
  ) => {
    const newNum = userProfiles.length + 1;
    const padded = String(newNum).padStart(3, '0');
    const newId = `user-${padded}`;
    const newCode = `利用希望者${padded}`;

    const newProfile: UserProfile = {
      id: newId,
      anonymousCode: newCode,
      nickname: input.nickname,
      ageGroup: input.ageGroup,
      gender: input.gender,
      city: input.city,
      registrantRole: input.registrantRole,
      certificateStatus: input.certificateStatus,
      registeredAt: '2026年11月（新規登録）',
      isNewArrival: true,
      briefSummaryForFreePlan: `${input.city}にて${input.desiredServices.join('・')}（${input.preferredDays.join('・')}曜）を希望`,
      disclosableInfo: {
        contactPersonRole: `${input.registrantRole}（${input.nickname}）`,
        nearestStationArea: input.nearestStationArea,
        preferredContactMethod: 'サイト内メッセージ',
        consultationSupportOffice: '担当相談支援事業所（同意後に詳細開示）',
        detailedScheduleNote: `${input.preferredDays.join('・')}曜 / ${input.preferredTimeSlots.join('・')}`,
      },
    };

    const newNeeds: UserSupportNeeds = {
      userId: newId,
      desiredServices: input.desiredServices,
      serviceNotes: {},
      disabilityTypes: input.disabilityTypes,
      supportCategory: input.supportCategory,
      careNeeds: input.careNeeds,
      essentialCareNeeds: input.careNeeds.slice(0, 3),
      physicalConditions: input.physicalConditions,
      communicationConsiderations: ['言葉でのコミュニケーションが可能'],
      communicationFreeText: input.freeMessageToProvider,
    };

    const newPrefs: UserPreferences = {
      userId: newId,
      helperGenderPreference: input.helperGenderPreference,
      isGenderPreferenceStrict: input.isGenderPreferenceStrict,
      preferredDays: input.preferredDays,
      preferredTimeSlots: input.preferredTimeSlots,
      frequency: '週1〜2回',
      startTiming: 'できるだけ早く（1か月以内）',
      preferredAreas: [input.city],
      otherRequests: input.freeMessageToProvider,
      freeMessageToProvider: input.freeMessageToProvider,
    };

    const newPII: UserPII = {
      userId: newId,
      fullName: input.fullName,
      fullNameKana: 'シンキトウロク',
      phoneNumber: input.phoneNumber,
      email: input.email,
      postalCode: '166-0000',
      detailedAddress: input.detailedAddress,
      updatedAt: '2026-11-12 12:00',
    };

    const mfaEnabled = input.mfaEnabled ?? true;
    const mfaMethod: 'email' | 'sms' = input.mfaMethod || 'email';
    const newCredential: AccountCredential = {
      id: newId,
      role: 'user',
      displayName: input.nickname,
      email: input.email,
      phoneNumber: input.phoneNumber,
      password: input.password || 'CarePita2026!',
      mfaEnabled,
      mfaMethod,
      createdAt: '2026-11-14 12:00',
    };

    setUserProfiles((prev) => [newProfile, ...prev]);
    setUserNeeds((prev) => [newNeeds, ...prev]);
    setUserPreferences((prev) => [newPrefs, ...prev]);
    setUserPIIList((prev) => [newPII, ...prev]);
    setAccountCredentials((prev) => [newCredential, ...prev]);
    setActiveUserId(newId);
    setRole('user');
    setSession({
      userId: newId,
      role: 'user',
      email: input.email,
      mfaEnabled,
      mfaVerified: mfaEnabled,
      mfaMethod,
      lastActive: '2026-11-14 12:00',
      accountStatus: 'active',
    });
    setUserWizardStep(1);
    setLastRegisteredRole('user');
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `新規利用者アカウント登録完了 (${newCode} / 2段階認証: ${mfaEnabled ? mfaMethod : 'off'})`
    );
    if (targetView === 'registration-complete') {
      setRegistrationBanner(null);
    } else {
      setRegistrationBanner(
        `新規利用者登録が完了しました！「${input.nickname}（匿名ID：${newCode}）」としてログイン中です。`
      );
    }
    navigateTo(targetView);
  };

  const completeProviderRegistration = (
    input: NewProviderRegistrationInput,
    targetView: AppView = 'registration-complete'
  ) => {
    const newNum = providerProfiles.length + 1;
    const padded = String(newNum).padStart(3, '0');
    const newId = `prov-${padded}`;

    const newProfile: ProviderProfile = {
      id: newId,
      name: input.name,
      locationCity: input.locationCity,
      serviceTypes: input.serviceTypes,
      introduction: input.introduction,
      features: [
        '新規登録事業所',
        '丁寧な事前面談',
        `${input.locationCity}拠点`,
      ],
      contactPersonName: input.contactPersonName,
      coverageAreas: input.coverageAreas,
      businessDaysHours: input.businessDaysHours,
      messageFromProvider: input.acceptableConditionsNote,
    };

    const newCaps: ProviderCapabilities = {
      providerId: newId,
      supportedCareItems: input.supportedCareItems,
      supportedDisabilities: input.supportedDisabilities,
      medicalCareRangeText: '服薬確認・見守り・医療的配慮の相談可',
      supportsTwoPersonCare: input.supportsTwoPersonCare,
      supportsWheelchairTransfer: input.supportsWheelchairTransfer,
      helperGenderPolicy: input.helperGenderPolicy,
      availableHelperGenders: input.availableHelperGenders,
    };

    const allDays: ProviderAvailability['weeklySchedule'][number]['day'][] = [
      '月',
      '火',
      '水',
      '木',
      '金',
      '土',
      '日',
    ];

    const newAvail: ProviderAvailability = {
      providerId: newId,
      acceptanceStatus: input.acceptanceStatus,
      acceptableConditionsNote: input.acceptableConditionsNote,
      updatedAt: '2026-11-12',
      weeklySchedule: allDays.map((d) => {
        const isAvail = input.availableDays.includes(d);
        return {
          day: d,
          available: isAvail,
          timeSlots: isAvail ? input.availableTimeSlots : [],
          note: isAvail ? '9時〜17時（相談可）' : '対応不可',
        };
      }),
    };

    const newSub: ProviderSubscription = {
      providerId: newId,
      planId: input.planId,
      status: 'active',
      startedAt: '2026-11-14',
      nextRenewalDate: input.planId === 'free' ? '-' : '2026-12-14',
      accountApprovalStatus: 'approved',
      paymentSummary: input.planId === 'free' ? undefined : input.paymentSummary,
    };

    const mfaEnabled = input.mfaEnabled ?? true;
    const mfaMethod: 'email' | 'sms' = input.mfaMethod || 'email';
    const newCredential: AccountCredential = {
      id: newId,
      role: 'provider',
      displayName: input.name,
      email: input.email,
      phoneNumber: input.phoneNumber,
      password: input.password || 'CarePita2026!',
      mfaEnabled,
      mfaMethod,
      createdAt: '2026-11-14 12:00',
    };

    setProviderProfiles((prev) => [newProfile, ...prev]);
    setProviderCapabilities((prev) => [newCaps, ...prev]);
    setProviderAvailabilities((prev) => [newAvail, ...prev]);
    setProviderSubscriptions((prev) => [newSub, ...prev]);
    setAccountCredentials((prev) => [newCredential, ...prev]);
    setActiveProviderId(newId);
    setRole('provider');
    setSession({
      userId: newId,
      role: 'provider',
      email: input.email,
      mfaEnabled,
      mfaVerified: mfaEnabled,
      mfaMethod,
      lastActive: '2026-11-14 12:00',
      accountStatus: 'active',
    });
    setProviderWizardStep(1);
    setLastRegisteredRole('provider');
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `新規事業所アカウント登録完了 (${newId} / プラン: ${input.planId} / 2段階認証: ${mfaEnabled ? mfaMethod : 'off'})`
    );
    if (targetView === 'registration-complete') {
      setRegistrationBanner(null);
    } else {
      setRegistrationBanner(
        `事業所「${input.name}」の新規登録が完了しました！`
      );
    }
    navigateTo(targetView);
  };

  const finalizeAuthenticatedSession = (
    account: AccountCredential,
    verifiedMfa: boolean,
    usedMethod?: 'email' | 'sms'
  ) => {
    if (account.role === 'user') {
      setActiveUserId(account.id);
      setRole('user');
      setUserWizardStep(1);
    } else {
      setActiveProviderId(account.id);
      setRole('provider');
      setProviderWizardStep(1);
    }
    setSession({
      userId: account.id,
      role: account.role,
      email: account.email,
      mfaEnabled: account.mfaEnabled,
      mfaVerified: verifiedMfa,
      mfaMethod: usedMethod || account.mfaMethod,
      lastActive: '2026-11-14 12:00',
      accountStatus: 'active',
    });
    setPendingMfaChallenge(null);
    addAuditLog(
      'AUTH_LOGIN',
      `${account.role === 'provider' ? '事業所' : '利用者'}ログイン成功 (${account.id}${verifiedMfa ? ` / 2FA:${usedMethod || account.mfaMethod}` : ''})`
    );
    setRegistrationBanner(
      `${account.role === 'provider' ? '事業所「' + account.displayName + '」' : '「' + account.displayName + '」さん'}としてログインしました。`
    );
    navigateTo(
      account.role === 'provider' ? 'provider-dashboard' : 'user-dashboard'
    );
  };

  const initiateCredentialLogin = (params: {
    role: 'user' | 'provider';
    email: string;
    password: string;
  }): { success: boolean; requiresMfa: boolean; message: string } => {
    const emailNorm = normalizeEmail(params.email);
    const rateCheck = SecurityController.checkLoginRateLimit(
      emailNorm || 'unknown',
      rateLimitMap
    );
    if (!rateCheck.allowed) {
      return {
        success: false,
        requiresMfa: false,
        message: `ログイン試行回数が上限に達したため一時ロック中です（あと約 ${rateCheck.remainingSeconds} 秒後にお試しください）。`,
      };
    }

    const result = verifyPasswordLogin({
      role: params.role,
      email: params.email,
      password: params.password,
      credentials: accountCredentials,
    });

    if (!result.ok || !result.account) {
      const { newState, isNowBlocked } = SecurityController.recordFailedAttempt(
        emailNorm || 'unknown',
        rateLimitMap
      );
      setRateLimitMap(newState);
      addAuditLog(
        isNowBlocked ? 'ACCOUNT_LOCKED' : 'AUTH_FAILED',
        `${params.role === 'provider' ? '事業所' : '利用者'}ログイン失敗 (${emailNorm || '未入力'})`,
        undefined,
        isNowBlocked
      );
      return {
        success: false,
        requiresMfa: false,
        message:
          result.errorMessage ||
          'メールアドレスまたはパスワードが正しくありません。',
      };
    }

    setRateLimitMap((prev) =>
      SecurityController.resetRateLimit(emailNorm, prev)
    );

    if (result.account.mfaEnabled) {
      const challenge = createMfaChallenge(result.account);
      setPendingMfaChallenge(challenge);
      addAuditLog(
        'AUTH_LOGIN',
        `2段階認証コード送信 (${challenge.method.toUpperCase()} -> ${challenge.maskedDestination})`
      );
      return {
        success: true,
        requiresMfa: true,
        message: `${challenge.maskedDestination} 宛てに6桁の確認コードを送信しました。`,
      };
    }

    finalizeAuthenticatedSession(result.account, false);
    return {
      success: true,
      requiresMfa: false,
      message: 'ログインしました。',
    };
  };

  const verifyLoginMfaCode = (
    code: string
  ): { success: boolean; locked: boolean; message: string } => {
    if (!pendingMfaChallenge) {
      return {
        success: false,
        locked: false,
        message: '有効な認証セッションがありません。もう一度ログインしてください。',
      };
    }

    const check = verifyOtpCode(pendingMfaChallenge, code);
    if (check.ok) {
      const account = accountCredentials.find(
        (c) =>
          c.id === pendingMfaChallenge.accountId &&
          c.role === pendingMfaChallenge.role
      );
      if (!account) {
        setPendingMfaChallenge(null);
        return {
          success: false,
          locked: false,
          message: 'アカウント情報が見つかりませんでした。',
        };
      }
      finalizeAuthenticatedSession(account, true, pendingMfaChallenge.method);
      return {
        success: true,
        locked: false,
        message: '2段階認証が完了しました。',
      };
    }

    if (check.locked) {
      addAuditLog(
        'ACCOUNT_LOCKED',
        `2段階認証コード3回連続失敗 (${pendingMfaChallenge.accountId})`,
        pendingMfaChallenge.accountId,
        true
      );
      setPendingMfaChallenge(null);
      return {
        success: false,
        locked: true,
        message:
          check.errorMessage ||
          '確認コードが3回連続で一致しなかったため、最初からやり直してください。',
      };
    }

    addAuditLog(
      'AUTH_FAILED',
      `2段階認証コード不一致 (${pendingMfaChallenge.accountId})`,
      pendingMfaChallenge.accountId,
      false
    );
    setPendingMfaChallenge((prev) =>
      prev ? { ...prev, attemptsRemaining: check.remainingAttempts } : null
    );
    return {
      success: false,
      locked: false,
      message: check.errorMessage || '確認コードが一致しません。',
    };
  };

  const resendMfaCode = (overrideMethod?: 'email' | 'sms') => {
    if (!pendingMfaChallenge) return;
    const account = accountCredentials.find(
      (c) =>
        c.id === pendingMfaChallenge.accountId &&
        c.role === pendingMfaChallenge.role
    );
    if (!account) return;
    const nextChallenge = createMfaChallenge(account, {
      overrideMethod: overrideMethod || pendingMfaChallenge.method,
    });
    setPendingMfaChallenge(nextChallenge);
    addAuditLog(
      'AUTH_LOGIN',
      `2段階認証コード再送信 (${nextChallenge.method.toUpperCase()} -> ${nextChallenge.maskedDestination})`
    );
  };

  const cancelMfaChallenge = () => {
    setPendingMfaChallenge(null);
  };

  const logout = () => {
    const prevRole = role;
    addAuditLog(
      'AUTH_LOGOUT',
      `ログアウト (${prevRole === 'provider' ? activeProviderId : activeUserId || 'guest'})`
    );
    setPendingMfaChallenge(null);
    setRole('guest');
    setSession({
      userId: 'guest',
      role: 'user',
      email: '',
      mfaEnabled: true,
      mfaVerified: false,
      lastActive: '2026-11-14 12:00',
      accountStatus: 'active',
    });
    setRegistrationBanner(null);
    setLoginTab(prevRole === 'provider' ? 'provider' : 'user');
    navigateTo('login');
  };

  const loginByEmail = (
    emailInput: string
  ): { success: boolean; message: string } => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) {
      return {
        success: false,
        message: 'メールアドレスまたはアカウント名を入力してください。',
      };
    }

    // 1. 利用者PIIまたはニックネームから検索
    const matchedPii = userPIIList.find(
      (p) => p.email.toLowerCase() === trimmed
    );
    if (matchedPii) {
      const u = userProfiles.find((item) => item.id === matchedPii.userId);
      startAsUserDemo(matchedPii.userId, 'user-dashboard');
      setRegistrationBanner(
        `✅ 「${u?.nickname || matchedPii.fullName}」としてログインしました。`
      );
      return { success: true, message: 'ログインしました。' };
    }

    const matchedUserByName = userProfiles.find(
      (u) =>
        u.nickname.toLowerCase().includes(trimmed) ||
        u.id.toLowerCase() === trimmed
    );
    if (matchedUserByName) {
      startAsUserDemo(matchedUserByName.id, 'user-dashboard');
      setRegistrationBanner(
        `✅ 「${matchedUserByName.nickname}」としてログインしました。`
      );
      return { success: true, message: 'ログインしました。' };
    }

    // 2. 事業所名またはIDから検索
    const matchedProv = providerProfiles.find(
      (p) =>
        p.name.toLowerCase().includes(trimmed) || p.id.toLowerCase() === trimmed
    );
    if (matchedProv) {
      startAsProviderDemo(matchedProv.id, 'provider-dashboard');
      setRegistrationBanner(
        `✅ 事業所「${matchedProv.name}」としてログインしました。`
      );
      return { success: true, message: 'ログインしました。' };
    }

    return {
      success: false,
      message:
        '該当するアカウントが見つかりませんでした。下のアカウント一覧から選ぶか、「新規登録」から作成してください。',
    };
  };

  const openProviderDetail = (providerId: string) => {
    setSelectedProviderIdForDetail(providerId);
    addAuditLog('DATA_VIEW_MATCHING', `事業所詳細の閲覧 (${providerId})`, providerId);
    navigateTo('user-provider-detail');
  };

  const openUserDetailForProvider = (userId: string) => {
    setSelectedUserIdForDetail(userId);
    addAuditLog('DATA_VIEW_MATCHING', `事業所による匿名利用希望者詳細の閲覧 (${userId})`, userId);
    navigateTo('provider-user-detail');
  };

  const openChatWith = (partnerId: string) => {
    if (role === 'provider' && !isCurrentProviderPaid) {
      const existingReq = getChatRequestBetween(partnerId, activeProviderId);
      const hasUserInquiry =
        existingReq?.initiatedBy === 'user' ||
        existingReq?.status === 'approved' ||
        messages.some(
          (m) =>
            m.userId === partnerId &&
            m.providerId === activeProviderId &&
            m.senderType === 'user'
        );
      if (!hasUserInquiry) {
        setShowChatUpgradeModal(true);
        addAuditLog(
          'DATA_VIEW_MATCHING',
          `無料プラン事業所による新規アプローチ制限表示 (${activeProviderId})`,
          partnerId
        );
        return;
      }
    }

    setActiveChatPartnerId(partnerId);
    if (role === 'user') {
      markMessagesRead(activeUserId, partnerId, 'user');
    } else if (role === 'provider') {
      markMessagesRead(partnerId, activeProviderId, 'provider');
    }
    navigateTo('chat');
  };

  const subscribeProviderToPlan = (
    providerId: string,
    planId: SubscriptionPlanId,
    paymentSummary?: ProviderPaymentSummary
  ) => {
    setProviderSubscriptions((prev) => {
      const existing = prev.find((s) => s.providerId === providerId);
      const updated: ProviderSubscription = {
        providerId,
        planId,
        status: 'active',
        startedAt: '2026-11-14',
        nextRenewalDate: planId === 'free' ? '-' : '2026-12-14',
        accountApprovalStatus: 'approved',
        paymentSummary:
          planId === 'free'
            ? existing?.paymentSummary
            : paymentSummary || existing?.paymentSummary,
      };
      if (existing) {
        return prev.map((s) => (s.providerId === providerId ? updated : s));
      }
      return [...prev, updated];
    });
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `事業所プラン変更（デモ契約）: ${planId} (${providerId})`,
      providerId
    );
  };

  const updateProviderPaymentMethod = (
    providerId: string,
    paymentSummary: ProviderPaymentSummary
  ) => {
    setProviderSubscriptions((prev) =>
      prev.map((s) =>
        s.providerId === providerId ? { ...s, paymentSummary } : s
      )
    );
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `事業所お支払い方法更新: ${paymentSummary.method} (${providerId})`,
      providerId
    );
  };

  const cancelProviderSubscription = (providerId: string) => {
    setProviderSubscriptions((prev) =>
      prev.map((s) =>
        s.providerId === providerId
          ? {
              ...s,
              planId: 'free',
              status: 'active',
              nextRenewalDate: '-',
              canceledAt: '2026-11-09',
            }
          : s
      )
    );
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `事業所による有料プラン解約手続き完了 -> 無料プランへ移行 (${providerId})`,
      providerId
    );
  };

  const updatePlanMonthlyPrice = (
    planId: SubscriptionPlanId,
    newPriceYen: number
  ) => {
    if (Number.isNaN(newPriceYen) || newPriceYen < 0) return;
    setSubscriptionPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, monthlyPriceYen: newPriceYen } : p
      )
    );
    addAuditLog(
      'ADMIN_ACCESS_CHECK',
      `運営管理者による料金プラン（${planId}）の月額料金変更: ${newPriceYen.toLocaleString()}円`
    );
  };

  const updateProviderApprovalStatus = (
    providerId: string,
    status: ProviderAccountApprovalStatus
  ) => {
    setProviderSubscriptions((prev) =>
      prev.map((s) =>
        s.providerId === providerId
          ? { ...s, accountApprovalStatus: status }
          : s
      )
    );
    addAuditLog(
      'ADMIN_SECURITY_EVENT',
      `運営管理者による事業所アカウント状態変更: ${status} (${providerId})`,
      providerId
    );
  };

  const sendChatRequest = (
    userId: string,
    providerId: string,
    initiatedBy: 'provider' | 'user',
    initialMessage: string
  ) => {
    const providerSub = getProviderSubscription(providerId);
    if (
      initiatedBy === 'provider' &&
      !isPaidPlanActive(providerSub, subscriptionPlans)
    ) {
      setShowChatUpgradeModal(true);
      return;
    }

    const nowStr = '2026-11-09 10:30';
    const existing = chatRequests.find(
      (r) => r.userId === userId && r.providerId === providerId
    );

    // 利用者側から開始する場合は即approvedにしてチャット開始可能にする
    const nextStatus = initiatedBy === 'user' ? 'approved' : 'pending';

    if (existing) {
      setChatRequests((prev) =>
        prev.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                initiatedBy,
                status: nextStatus,
                initialMessage: initialMessage.trim() || r.initialMessage,
                requestedAt: nowStr,
              }
            : r
        )
      );
    } else {
      const newReq: ChatRequest = {
        id: `creq-${Date.now()}`,
        userId,
        providerId,
        initiatedBy,
        status: nextStatus,
        initialMessage:
          initialMessage.trim() ||
          'ご登録の希望条件を拝見しました。一度詳しくお話を伺いたいです。',
        requestedAt: nowStr,
        respondedAt: initiatedBy === 'user' ? nowStr : undefined,
      };
      setChatRequests((prev) => [newReq, ...prev]);
    }

    if (initiatedBy === 'user' && initialMessage.trim()) {
      sendMessage(userId, providerId, 'user', initialMessage.trim());
    }

    addAuditLog(
      'CHAT_MESSAGE_SENT',
      `チャット開始申請の送信 (送信元: ${initiatedBy}, 状態: ${nextStatus})`,
      initiatedBy === 'provider' ? userId : providerId
    );
  };

  const respondToChatRequest = (
    requestId: string,
    decision: 'approved' | 'declined'
  ) => {
    const targetReq = chatRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const nowStr = '2026-11-09 10:35';
    setChatRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: decision, respondedAt: nowStr }
          : r
      )
    );

    if (decision === 'approved') {
      // 申請時の初回メッセージをチャットスレッドに追加（未追加の場合）
      const alreadyExists = messages.some(
        (m) =>
          m.userId === targetReq.userId &&
          m.providerId === targetReq.providerId &&
          m.text === targetReq.initialMessage
      );
      if (!alreadyExists && targetReq.initialMessage) {
        const msg: ChatMessage = {
          id: `msg-${Date.now()}`,
          userId: targetReq.userId,
          providerId: targetReq.providerId,
          senderType: targetReq.initiatedBy,
          text: targetReq.initialMessage,
          createdAt: targetReq.requestedAt,
          readByRecipient: false,
        };
        setMessages((prev) => [...prev, msg]);
      }

      updateCaseManagementStatus(
        targetReq.userId,
        targetReq.providerId,
        '対応中'
      );
    }

    addAuditLog(
      decision === 'approved' ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      `利用者が事業所（${targetReq.providerId}）からのチャット開始申請を「${
        decision === 'approved' ? '承認' : '辞退'
      }」しました`,
      targetReq.providerId
    );
  };

  const updateCaseManagementStatus = (
    userId: string,
    providerId: string,
    caseStatus: CaseManagementStatus
  ) => {
    setInteractions((prev) => {
      const existing = prev.find(
        (i) => i.userId === userId && i.providerId === providerId
      );
      if (existing) {
        return prev.map((i) =>
          i.userId === userId && i.providerId === providerId
            ? { ...i, caseStatus, updatedAt: '2026-11-09 10:30' }
            : i
        );
      }
      return [
        ...prev,
        {
          userId,
          providerId,
          isUserFavorite: false,
          providerReaction:
            caseStatus === '対応中'
              ? '対応を検討したい'
              : caseStatus === '対応不可'
              ? '今回は対応が難しい'
              : '詳しい条件を確認したい',
          caseStatus,
          updatedAt: '2026-11-09 10:30',
        },
      ];
    });
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `マッチング案件ステータス変更: ${caseStatus} (User: ${userId})`,
      userId
    );
  };

  const saveUserBundle = (bundle: FullUserBundle, pii?: Partial<UserPII>) => {
    setUserProfiles((prev) =>
      prev.map((u) => (u.id === bundle.profile.id ? bundle.profile : u))
    );
    setUserNeeds((prev) =>
      prev.map((n) => (n.userId === bundle.needs.userId ? bundle.needs : n))
    );
    setUserPreferences((prev) =>
      prev.map((p) =>
        p.userId === bundle.preferences.userId ? bundle.preferences : p
      )
    );
    if (pii) {
      setUserPIIList((prev) =>
        prev.map((item) =>
          item.userId === bundle.profile.id ? { ...item, ...pii, updatedAt: '2026-11-09 09:20' } : item
        )
      );
    }
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `利用者プロファイル・支援ニーズ情報の自己保存 (${bundle.profile.id})`
    );
  };

  const saveProviderBundle = (bundle: FullProviderBundle) => {
    setProviderProfiles((prev) =>
      prev.map((p) => (p.id === bundle.profile.id ? bundle.profile : p))
    );
    setProviderCapabilities((prev) =>
      prev.map((c) =>
        c.providerId === bundle.capabilities.providerId
          ? bundle.capabilities
          : c
      )
    );
    setProviderAvailabilities((prev) =>
      prev.map((a) =>
        a.providerId === bundle.availability.providerId
          ? bundle.availability
          : a
      )
    );
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `事業所プロファイル・対応能力の自己更新 (${bundle.profile.id})`
    );
  };

  const updateProviderAcceptanceStatus = (
    providerId: string,
    status: ProviderAcceptanceStatus,
    note?: string
  ) => {
    setProviderAvailabilities((prev) =>
      prev.map((a) =>
        a.providerId === providerId
          ? {
              ...a,
              acceptanceStatus: status,
              acceptableConditionsNote:
                note !== undefined ? note : a.acceptableConditionsNote,
              updatedAt: '2026-11-09',
            }
          : a
      )
    );
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `事業所受け入れ状況の変更: ${status} (${providerId})`
    );
  };

  const toggleUserFavoriteProvider = (userId: string, providerId: string) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setInteractions((prev) =>
      applyToggleFavoriteInteraction(prev, userId, providerId, now)
    );
  };

  const updateUserFavoriteNote = (
    userId: string,
    providerId: string,
    note: string
  ) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setInteractions((prev) =>
      applyUpdateFavoriteNoteInteraction(prev, userId, providerId, note, now)
    );
  };

  const setProviderReactionToUser = (
    userId: string,
    providerId: string,
    reaction: ProviderReactionStatus
  ) => {
    const mappedCase: CaseManagementStatus =
      reaction === '対応を検討したい'
        ? '対応中'
        : reaction === '詳しい条件を確認したい'
        ? '検討中'
        : reaction === '今回は対応が難しい'
        ? '対応不可'
        : '未対応';

    setInteractions((prev) => {
      const existing = prev.find(
        (i) => i.userId === userId && i.providerId === providerId
      );
      if (existing) {
        return prev.map((i) =>
          i.userId === userId && i.providerId === providerId
            ? {
                ...i,
                providerReaction: reaction,
                caseStatus: mappedCase,
                updatedAt: '2026-11-09 09:20',
              }
            : i
        );
      }
      return [
        ...prev,
        {
          userId,
          providerId,
          isUserFavorite: false,
          providerReaction: reaction,
          caseStatus: mappedCase,
          updatedAt: '2026-11-09 09:20',
        },
      ];
    });
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `事業所リアクション設定: ${reaction} (User: ${userId})`,
      userId
    );
  };

  const sendMessage = (
    userId: string,
    providerId: string,
    senderType: 'user' | 'provider',
    text: string
  ) => {
    if (!text.trim()) return;
    if (senderType === 'provider' && !isCurrentProviderPaid) {
      const existingReq = chatRequests.find(
        (r) => r.userId === userId && r.providerId === providerId
      );
      const hasUserInquiry =
        existingReq?.initiatedBy === 'user' ||
        existingReq?.status === 'approved' ||
        messages.some(
          (m) =>
            m.userId === userId &&
            m.providerId === providerId &&
            m.senderType === 'user'
        );
      if (!hasUserInquiry) {
        setShowChatUpgradeModal(true);
        return;
      }
    }

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId,
      providerId,
      senderType,
      text: text.trim(),
      createdAt: `2026-11-09 ${hh}:${mm}`,
      readByRecipient: false,
    };
    setMessages((prev) => [...prev, newMsg]);

    // Ensure chat request is approved if user initiates message
    if (senderType === 'user') {
      setChatRequests((prev) => {
        const ex = prev.find(
          (r) => r.userId === userId && r.providerId === providerId
        );
        if (ex) {
          return prev.map((r) =>
            r.id === ex.id
              ? { ...r, status: 'approved', respondedAt: `2026-11-09 ${hh}:${mm}` }
              : r
          );
        }
        return [
          ...prev,
          {
            id: `creq-${Date.now()}`,
            userId,
            providerId,
            initiatedBy: 'user',
            status: 'approved',
            initialMessage: text.trim(),
            requestedAt: `2026-11-09 ${hh}:${mm}`,
            respondedAt: `2026-11-09 ${hh}:${mm}`,
          },
        ];
      });
    }

    // Ensure Stage 2 record
    setDisclosures((prev) => {
      const existing = prev.find(
        (d) => d.userId === userId && d.providerId === providerId
      );
      if (existing) return prev;
      return [
        ...prev,
        {
          userId,
          providerId,
          stage: 2,
          disclosedFields: {
            nicknameAndRole: true,
            nearestStationArea: true,
            preferredContactMethod: true,
            consultationSupportOffice: true,
            detailedScheduleNote: true,
            piiContactAccess: false,
          },
        },
      ];
    });

    addAuditLog(
      'CHAT_MESSAGE_SENT',
      `チャットメッセージ送受信 (送信元: ${senderType}, 文字数: ${text.length})`,
      senderType === 'user' ? providerId : userId
    );
  };

  const markMessagesRead = (
    userId: string,
    providerId: string,
    viewerType: 'user' | 'provider'
  ) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (
          m.userId === userId &&
          m.providerId === providerId &&
          m.senderType !== viewerType &&
          !m.readByRecipient
        ) {
          return { ...m, readByRecipient: true };
        }
        return m;
      })
    );
  };

  const getDisclosureStage = (
    userId: string,
    providerId: string
  ): DisclosureConsent => {
    const existing = disclosures.find(
      (d) => d.userId === userId && d.providerId === providerId
    );
    if (existing) return existing;
    const hasMessages = messages.some(
      (m) => m.userId === userId && m.providerId === providerId
    );
    return {
      userId,
      providerId,
      stage: hasMessages ? 2 : 1,
      disclosedFields: {
        nicknameAndRole: true,
        nearestStationArea: true,
        preferredContactMethod: true,
        consultationSupportOffice: true,
        detailedScheduleNote: true,
        piiContactAccess: false,
      },
    };
  };

  const grantStage3Disclosure = (
    userId: string,
    providerId: string,
    allowPiiContactAccess: boolean = true
  ) => {
    const fields = {
      nicknameAndRole: true,
      nearestStationArea: true,
      preferredContactMethod: true,
      consultationSupportOffice: true,
      detailedScheduleNote: true,
      piiContactAccess: allowPiiContactAccess,
    };
    setDisclosures((prev) => {
      const existing = prev.find(
        (d) => d.userId === userId && d.providerId === providerId
      );
      if (existing) {
        return prev.map((d) =>
          d.userId === userId && d.providerId === providerId
            ? {
                ...d,
                stage: 3,
                consentedAt: '2026-11-09 10:40',
                revokedAt: undefined,
                disclosedFields: fields,
              }
            : d
        );
      }
      return [
        ...prev,
        {
          userId,
          providerId,
          stage: 3,
          consentedAt: '2026-11-09 10:40',
          disclosedFields: fields,
        },
      ];
    });

    addAuditLog(
      'CONSENT_GRANTED',
      `利用者による特定事業所への第3段階情報開示同意 (Provider: ${providerId}, PII連絡先許可: ${allowPiiContactAccess})`,
      providerId
    );
  };

  const revokeStage3Disclosure = (userId: string, providerId: string) => {
    setDisclosures((prev) =>
      prev.map((d) =>
        d.userId === userId && d.providerId === providerId
          ? {
              ...d,
              stage: 2,
              revokedAt: '2026-11-09 10:45',
              disclosedFields: { ...d.disclosedFields, piiContactAccess: false },
            }
          : d
      )
    );
    addAuditLog(
      'CONSENT_REVOKED',
      `利用者による第3段階詳細情報の開示取り消し (Provider: ${providerId})`,
      providerId
    );
  };

  const toggleMfaSetting = () => {
    setSession((prev) => {
      const next = !prev.mfaEnabled;
      addAuditLog(
        'ADMIN_SECURITY_EVENT',
        `MFA（多要素認証）設定変更: ${next ? '有効化' : '無効化'} (User: ${prev.userId})`
      );
      return { ...prev, mfaEnabled: next, mfaVerified: next };
    });
  };

  const simulateRateLimitTrigger = () => {
    const fakeIp = '203.0.113.45';
    let currentMap = rateLimitMap;
    for (let i = 0; i < 5; i++) {
      const res = SecurityController.recordFailedAttempt(fakeIp, currentMap);
      currentMap = res.newState;
    }
    setRateLimitMap(currentMap);
    addAuditLog(
      'ACCOUNT_LOCKED',
      `【不正アクセス遮断】IP ${fakeIp} からの短時間連続ログイン失敗を検知し、一時ロックを実行しました`,
      undefined,
      true
    );
    setSecurityAlertMessage(
      '【シミュレーション検知】不審な連続ログイン試行（5回失敗）を遮断し、対象IPを一時ブロックしました。監査ログに記録されました。'
    );
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserPIIList([]);
    setUserProfiles([]);
    setUserNeeds([]);
    setUserPreferences([]);
    setProviderProfiles([]);
    setProviderCapabilities([]);
    setProviderAvailabilities([]);
    setInteractions([]);
    setMessages([]);
    setDisclosures([]);
    setAuditLogs([]);
    setSubscriptionPlans(DEFAULT_SUBSCRIPTION_PLANS);
    setProviderSubscriptions([]);
    setChatRequests([]);
    setAccountCredentials([]);
    setPendingMfaChallenge(null);
    setActiveUserId('');
    setActiveProviderId('');
    setRole('guest');
    setLastRegisteredRole(null);
    setRegistrationBanner(null);
    setRateLimitMap({});
    navigateTo('top');
  };

  return (
    <AppStateContext.Provider
      value={{
        role,
        currentView,
        activeUserId,
        activeProviderId,
        selectedProviderIdForDetail,
        selectedUserIdForDetail,
        activeChatPartnerId,
        userWizardStep,
        providerWizardStep,
        userPIIList,
        userProfiles,
        userNeeds,
        userPreferences,
        providerProfiles,
        providerCapabilities,
        providerAvailabilities,
        interactions,
        messages,
        disclosures,
        subscriptionPlans,
        providerSubscriptions,
        chatRequests,
        currentProviderSubscription,
        currentProviderPlanDef,
        isCurrentProviderPaid,
        showChatUpgradeModal,
        setShowChatUpgradeModal,
        session,
        auditLogs,
        rateLimitMap,
        securityAlertMessage,
        setSecurityAlertMessage,
        currentUserBundle,
        currentProviderBundle,
        getUserBundleById,
        getProviderBundleById,
        getProviderSubscription,
        getChatRequestBetween,
        getPiiIfPermitted,
        accountCredentials,
        pendingMfaChallenge,
        loginTab,
        setLoginTab,
        openLoginScreen,
        initiateCredentialLogin,
        verifyLoginMfaCode,
        resendMfaCode,
        cancelMfaChallenge,
        logout,
        registerTab,
        setRegisterTab,
        lastRegisteredRole,
        registrationBanner,
        setRegistrationBanner,
        openRegistrationScreen,
        completeUserRegistration,
        completeProviderRegistration,
        loginByEmail,
        navigateTo,
        startAsUserDemo,
        startAsProviderDemo,
        startAsAdminDemo,
        startNewUserRegistration,
        startNewProviderRegistration,
        setActiveUserId,
        setActiveProviderId,
        openProviderDetail,
        openUserDetailForProvider,
        openChatWith,
        setUserWizardStep,
        setProviderWizardStep,
        subscribeProviderToPlan,
        updateProviderPaymentMethod,
        cancelProviderSubscription,
        updatePlanMonthlyPrice,
        updateProviderApprovalStatus,
        sendChatRequest,
        respondToChatRequest,
        updateCaseManagementStatus,
        saveUserBundle,
        saveProviderBundle,
        updateProviderAcceptanceStatus,
        toggleUserFavoriteProvider,
        updateUserFavoriteNote,
        setProviderReactionToUser,
        sendMessage,
        markMessagesRead,
        grantStage3Disclosure,
        revokeStage3Disclosure,
        getDisclosureStage,
        resetDemoData,
        toggleMfaSetting,
        simulateRateLimitTrigger,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}

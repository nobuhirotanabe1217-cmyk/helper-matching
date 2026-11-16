import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AccountCredential,
  AuditActionType,
  AuditLogEntry,
  AuthSession,
  AuthUserRole,
  BillingCycle,
  CaseManagementStatus,
  ChatMessage,
  ChatMessageKind,
  ChatRequest,
  ConfirmedInterviewRecord,
  CoordinatorProfile,
  DisclosureConsent,
  DisclosureHistoryEntry,
  DisclosureStage,
  DiscrepancyReportReason,
  MatchingInteraction,
  PendingMfaChallenge,
  ProviderAcceptanceStatus,
  ProviderAccountApprovalStatus,
  ProviderAvailability,
  ProviderBranch,
  ProviderCapabilities,
  ProviderDiscrepancyReport,
  ProviderPaymentSummary,
  ProviderProfile,
  ProviderReactionStatus,
  ProviderStaffMember,
  ProviderSubscription,
  ProviderUpdateHistoryEntry,
  ScheduleCandidateSlot,
  SharedCaseToCoordinator,
  SubscriptionPlanDefinition,
  SubscriptionPlanId,
  SupportDetailPolicy,
  UserPII,
  UserPreferences,
  UserProfile,
  UserRecruitmentStatus,
  UserSupportNeeds,
} from '../types/domain';
import {
  createMfaChallenge,
  normalizeEmail,
  verifyOtpCode,
  verifyPasswordLogin,
} from '../utils/auth';
import {
  addMonthsToIso,
  daysSinceIsoDate,
  formatJapaneseMonthOnly,
  getCurrentYearMonth,
  getEffectiveReferenceDate,
  getNowDateTime,
  getTodayIso,
} from '../utils/date';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CHAT_REQUESTS,
  INITIAL_CONFIRMED_INTERVIEWS,
  INITIAL_COORDINATORS,
  INITIAL_CREDENTIALS,
  INITIAL_DISCLOSURES,
  INITIAL_DISCLOSURE_HISTORY,
  INITIAL_INTERACTIONS,
  INITIAL_MESSAGES,
  INITIAL_PROVIDER_AVAILABILITY,
  INITIAL_PROVIDER_CAPABILITIES,
  INITIAL_PROVIDER_PROFILES,
  INITIAL_PROVIDER_REPORTS,
  INITIAL_PROVIDER_SUBSCRIPTIONS,
  INITIAL_SHARED_CASES,
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
import { migratePersistedState } from '../utils/migration';
import { RateLimitState, SecurityController } from '../utils/security';
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  getProviderPlanDefinition,
  isPaidPlanActive,
  verifyProviderChatAccess,
} from '../utils/subscription';

export type AppRole = 'guest' | 'user' | 'provider' | 'coordinator' | 'admin';

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
  | 'coordinator-dashboard'
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
  communicationConsiderations: UserSupportNeeds['communicationConsiderations'];
  dislikesAndAccommodations: string;
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
  designatedNumber: string;
  email: string;
  phoneNumber?: string;
  contactPersonName: string;
  locationCity: string;
  coverageAreas: string[];
  serviceTypes: ProviderProfile['serviceTypes'];
  planId: SubscriptionPlanId;
  billingCycle?: BillingCycle;
  businessDaysHours: string;
  introduction: string;
  appealMessage: string;
  supportedCareItems: ProviderCapabilities['supportedCareItems'];
  supportedDisabilities: ProviderCapabilities['supportedDisabilities'];
  supportsBehavioralDisorder: SupportDetailPolicy;
  behavioralDisorderNote?: string;
  supportsMedicalCare: SupportDetailPolicy;
  medicalCareRangeText?: string;
  supportsEpilepsyResponse: SupportDetailPolicy;
  epilepsyResponseNote?: string;
  supportedCommunicationMethods: string[];
  supportsTransport: boolean;
  transportRangeText?: string;
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

export interface NewCoordinatorRegistrationInput {
  name: string;
  officeName: string;
  area: string;
  email?: string;
}

interface AppStateContextValue {
  role: AppRole;
  currentView: AppView;
  activeUserId: string;
  activeProviderId: string;
  activeCoordinatorId: string;
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
  disclosureHistory: DisclosureHistoryEntry[];
  providerReports: ProviderDiscrepancyReport[];
  confirmedInterviews: ConfirmedInterviewRecord[];
  timeTravelDaysOffset: number;
  effectiveReferenceDate: Date;

  // 相談支援専門員（無料ロール）
  coordinators: CoordinatorProfile[];
  sharedCases: SharedCaseToCoordinator[];
  currentCoordinator: CoordinatorProfile | undefined;

  // サブスクリプション＆チャット開始申請
  subscriptionPlans: SubscriptionPlanDefinition[];
  providerSubscriptions: ProviderSubscription[];
  chatRequests: ChatRequest[];
  currentProviderSubscription: ProviderSubscription;
  currentProviderPlanDef: SubscriptionPlanDefinition;
  isCurrentProviderPaid: boolean;
  showChatUpgradeModal: boolean;
  setShowChatUpgradeModal: (show: boolean) => void;

  // セキュリティ・監査ログ・セッション
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
  registerCoordinator: (
    input: NewCoordinatorRegistrationInput,
    navigateToWorkspace?: boolean
  ) => CoordinatorProfile;
  startAsCoordinatorDemo: (coordinatorId?: string) => void;
  shareUserWithCoordinator: (
    userId: string,
    coordinatorId: string,
    noteToCoordinator?: string
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

  // Subscription, Branches, Staff & Chat Request actions
  subscribeProviderToPlan: (
    providerId: string,
    planId: SubscriptionPlanId,
    paymentSummary?: ProviderPaymentSummary,
    billingCycle?: BillingCycle
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
  markProviderUpdatedToday: (providerId: string) => void;
  markProviderNoChangeToday: (providerId: string) => {
    previousUpdatedAt: string;
    daysSincePrevious: number;
    updatedAt: string;
  };
  confirmUserNeedsUnchanged: (userId: string) => {
    confirmedAt: string;
    daysSincePrevious: number;
  };
  setUserRecruitmentStatus: (
    userId: string,
    status: UserRecruitmentStatus
  ) => void;
  submitProviderReport: (params: {
    providerId: string;
    userId: string;
    reason: DiscrepancyReportReason;
    note?: string;
  }) => { reportCount: number; isUnderReview: boolean };
  advanceTimeByDays: (days?: number) => void;
  resetTimeToToday: () => void;
  toggleProviderMatchFilter: (providerId: string) => void;
  addProviderStaffMember: (
    providerId: string,
    staff: Omit<ProviderStaffMember, 'id'>
  ) => void;
  removeProviderStaffMember: (providerId: string, staffId: string) => void;
  addProviderBranch: (
    providerId: string,
    branch: Omit<ProviderBranch, 'id'>
  ) => void;
  removeProviderBranch: (providerId: string, branchId: string) => void;
  sendChatRequest: (
    userId: string,
    providerId: string,
    initiatedBy: 'provider' | 'user',
    initialMessage: string
  ) => { ok: boolean; message?: string };
  respondToChatRequest: (
    requestId: string,
    decision: 'approved' | 'declined'
  ) => void;
  updateCaseManagementStatus: (
    userId: string,
    providerId: string,
    caseStatus: CaseManagementStatus
  ) => void;

  // Security, Chat & 3-Stage Disclosure mutations
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
    text: string,
    options?: {
      messageKind?: ChatMessageKind;
      proposedSlots?: ScheduleCandidateSlot[];
      confirmedSlot?: ScheduleCandidateSlot;
      confirmedKind?: 'interview' | 'visit';
    }
  ) => void;
  confirmInterviewOrVisitSchedule: (params: {
    userId: string;
    providerId: string;
    confirmedBy: 'user' | 'provider';
    kind: 'interview' | 'visit';
    slot: ScheduleCandidateSlot;
  }) => void;
  markMessagesRead: (
    userId: string,
    providerId: string,
    viewerType: 'user' | 'provider'
  ) => void;
  grantStage2Disclosure: (userId: string, providerId: string) => void;
  grantStage3Disclosure: (
    userId: string,
    providerId: string,
    allowPiiContactAccess?: boolean
  ) => { ok: boolean; message?: string };
  revokeDisclosureToStage: (
    userId: string,
    providerId: string,
    targetStage?: 1 | 2
  ) => void;
  revokeStage3Disclosure: (userId: string, providerId: string) => void;
  getDisclosureStage: (userId: string, providerId: string) => DisclosureConsent;
  resetDemoData: () => void;
  loadDemoData: () => void;
  toggleMfaSetting: () => void;
  simulateRateLimitTrigger: () => void;
}

const STORAGE_KEY = 'carepita_business_state_v2';
const LEGACY_STORAGE_KEY = 'carepita_clean_blank_v1';
const RESET_FLAG_KEY = 'carepita_is_reset_v1';

const AppStateContext = createContext<AppStateContextValue | null>(null);

function loadInitialPersistedOrSeed() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      return migratePersistedState(JSON.parse(raw));
    }
    if (localStorage.getItem(RESET_FLAG_KEY) === '1') {
      return null;
    }
  } catch {
    // ignore storage errors
  }

  return {
    userPIIList: INITIAL_USER_PII,
    userProfiles: INITIAL_USER_PROFILES,
    userNeeds: INITIAL_USER_NEEDS,
    userPreferences: INITIAL_USER_PREFERENCES,
    providerProfiles: INITIAL_PROVIDER_PROFILES,
    providerCapabilities: INITIAL_PROVIDER_CAPABILITIES,
    providerAvailabilities: INITIAL_PROVIDER_AVAILABILITY,
    interactions: INITIAL_INTERACTIONS,
    messages: INITIAL_MESSAGES,
    disclosures: INITIAL_DISCLOSURES,
    disclosureHistory: INITIAL_DISCLOSURE_HISTORY,
    coordinators: INITIAL_COORDINATORS,
    sharedCases: INITIAL_SHARED_CASES,
    auditLogs: INITIAL_AUDIT_LOGS,
    subscriptionPlans: DEFAULT_SUBSCRIPTION_PLANS,
    providerSubscriptions: INITIAL_PROVIDER_SUBSCRIPTIONS,
    chatRequests: INITIAL_CHAT_REQUESTS,
    accountCredentials: INITIAL_CREDENTIALS,
    providerReports: INITIAL_PROVIDER_REPORTS,
    confirmedInterviews: INITIAL_CONFIRMED_INTERVIEWS,
    timeTravelDaysOffset: 0,
  };
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [initialData] = useState(() => loadInitialPersistedOrSeed());

  const [role, setRole] = useState<AppRole>('guest');
  const [currentView, setCurrentView] = useState<AppView>('top');
  const [activeUserId, setActiveUserId] = useState<string>(
    initialData?.userProfiles?.[0]?.id || ''
  );
  const [activeProviderId, setActiveProviderId] = useState<string>(
    initialData?.providerProfiles?.[0]?.id || ''
  );
  const [activeCoordinatorId, setActiveCoordinatorId] = useState<string>(
    initialData?.coordinators?.[0]?.id || ''
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
  const [rateLimitMap, setRateLimitMap] = useState<
    Record<string, RateLimitState>
  >({});
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

  // 永続化データ群
  const [userPIIList, setUserPIIList] = useState<UserPII[]>(
    initialData?.userPIIList || []
  );
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(
    initialData?.userProfiles || []
  );
  const [userNeeds, setUserNeeds] = useState<UserSupportNeeds[]>(
    initialData?.userNeeds || []
  );
  const [userPreferences, setUserPreferences] = useState<UserPreferences[]>(
    initialData?.userPreferences || []
  );
  const [providerProfiles, setProviderProfiles] = useState<ProviderProfile[]>(
    initialData?.providerProfiles || []
  );
  const [providerCapabilities, setProviderCapabilities] = useState<
    ProviderCapabilities[]
  >(initialData?.providerCapabilities || []);
  const [providerAvailabilities, setProviderAvailabilities] = useState<
    ProviderAvailability[]
  >(initialData?.providerAvailabilities || []);
  const [interactions, setInteractions] = useState<MatchingInteraction[]>(
    initialData?.interactions || []
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialData?.messages || []
  );
  const [disclosures, setDisclosures] = useState<DisclosureConsent[]>(
    initialData?.disclosures || []
  );
  const [disclosureHistory, setDisclosureHistory] = useState<
    DisclosureHistoryEntry[]
  >(initialData?.disclosureHistory || []);
  const [coordinators, setCoordinators] = useState<CoordinatorProfile[]>(
    initialData?.coordinators || []
  );
  const [sharedCases, setSharedCases] = useState<SharedCaseToCoordinator[]>(
    initialData?.sharedCases || []
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(
    initialData?.auditLogs || []
  );
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlanDefinition[]
  >(initialData?.subscriptionPlans || DEFAULT_SUBSCRIPTION_PLANS);
  const [providerSubscriptions, setProviderSubscriptions] = useState<
    ProviderSubscription[]
  >(initialData?.providerSubscriptions || []);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>(
    initialData?.chatRequests || []
  );
  const [accountCredentials, setAccountCredentials] = useState<
    AccountCredential[]
  >(initialData?.accountCredentials || []);
  const [providerReports, setProviderReports] = useState<
    ProviderDiscrepancyReport[]
  >(initialData?.providerReports || []);
  const [confirmedInterviews, setConfirmedInterviews] = useState<
    ConfirmedInterviewRecord[]
  >(initialData?.confirmedInterviews || []);
  const [timeTravelDaysOffset, setTimeTravelDaysOffset] = useState<number>(
    initialData?.timeTravelDaysOffset || 0
  );

  const effectiveReferenceDate = getEffectiveReferenceDate(timeTravelDaysOffset);

  // 認証セッション
  const [session, setSession] = useState<AuthSession>(() => ({
    userId: 'guest',
    role: 'user',
    email: '',
    mfaEnabled: true,
    mfaVerified: false,
    ipAddress: '192.168.1.10',
    lastActive: getNowDateTime(),
    accountStatus: 'active',
  }));

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
          disclosureHistory,
          coordinators,
          sharedCases,
          auditLogs,
          subscriptionPlans,
          providerSubscriptions,
          chatRequests,
          accountCredentials,
          providerReports,
          confirmedInterviews,
          timeTravelDaysOffset,
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
    disclosureHistory,
    coordinators,
    sharedCases,
    auditLogs,
    subscriptionPlans,
    providerSubscriptions,
    chatRequests,
    accountCredentials,
    providerReports,
    confirmedInterviews,
    timeTravelDaysOffset,
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
          : role === 'coordinator'
          ? activeCoordinatorId || 'coordinator'
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

  const currentCoordinator =
    coordinators.find((c) => c.id === activeCoordinatorId) || coordinators[0];

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
      billingCycle: 'monthly',
      status: 'active',
      startedAt: getTodayIso(),
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

  const getPiiIfPermitted = (
    targetUserId: string
  ): { permitted: boolean; data?: UserPII; reason: string } => {
    const actorId =
      role === 'provider'
        ? activeProviderId
        : role === 'coordinator'
        ? activeCoordinatorId
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
      lastActive: getNowDateTime(),
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
      lastActive: getNowDateTime(),
      accountStatus: 'active',
    });
    addAuditLog('AUTH_LOGIN', `事業所セッション開始 (${targetId})`);
    setProviderWizardStep(1);
    navigateTo(targetView || 'provider-dashboard');
  };

  const registerCoordinator = (
    input: NewCoordinatorRegistrationInput,
    navigateToWorkspace: boolean = true
  ): CoordinatorProfile => {
    const newNum = coordinators.length + 1;
    const newCoord: CoordinatorProfile = {
      id: `coord-${String(newNum).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
      name: input.name.trim(),
      officeName: input.officeName.trim(),
      area: input.area.trim() || '杉並区',
      email: input.email?.trim() || '',
      registeredAt: getTodayIso(),
    };
    setCoordinators((prev) => [newCoord, ...prev]);
    setActiveCoordinatorId(newCoord.id);
    setRole('coordinator');
    setSession({
      userId: newCoord.id,
      role: 'coordinator',
      email: newCoord.email || 'coordinator@carepita.local',
      mfaEnabled: false,
      mfaVerified: true,
      lastActive: getNowDateTime(),
      accountStatus: 'active',
    });
    addAuditLog(
      'AUTH_LOGIN',
      `相談支援専門員 簡易登録・開始 (${newCoord.officeName} / ${newCoord.name})`
    );
    setRegistrationBanner(
      `相談支援専門員「${newCoord.name}（${newCoord.officeName}）」として利用を開始しました（完全無料）。`
    );
    if (navigateToWorkspace) {
      navigateTo('coordinator-dashboard');
    }
    return newCoord;
  };

  const startAsCoordinatorDemo = (coordinatorId?: string) => {
    const target =
      (coordinatorId && coordinators.find((c) => c.id === coordinatorId)) ||
      coordinators[0] ||
      INITIAL_COORDINATORS[0];

    if (!coordinators.some((c) => c.id === target.id)) {
      setCoordinators([target]);
    }
    setActiveCoordinatorId(target.id);
    setRole('coordinator');
    setSession({
      userId: target.id,
      role: 'coordinator',
      email: target.email || 'coordinator@carepita.local',
      mfaEnabled: false,
      mfaVerified: true,
      lastActive: getNowDateTime(),
      accountStatus: 'active',
    });
    addAuditLog('AUTH_LOGIN', `相談支援専門員セッション開始 (${target.id})`);
    navigateTo('coordinator-dashboard');
  };

  const shareUserWithCoordinator = (
    userId: string,
    coordinatorId: string,
    noteToCoordinator?: string
  ) => {
    const nowStr = getNowDateTime();
    const coord =
      coordinators.find((c) => c.id === coordinatorId) || coordinators[0];
    if (!coord) return;

    setSharedCases((prev) => {
      const existing = prev.find(
        (sc) => sc.userId === userId && sc.coordinatorId === coord.id
      );
      if (existing) {
        return prev.map((sc) =>
          sc.id === existing.id
            ? {
                ...sc,
                sharedAt: nowStr,
                noteToCoordinator:
                  noteToCoordinator?.trim() || sc.noteToCoordinator,
              }
            : sc
        );
      }
      return [
        {
          id: `share-${Date.now()}`,
          userId,
          coordinatorId: coord.id,
          sharedAt: nowStr,
          noteToCoordinator:
            noteToCoordinator?.trim() ||
            '希望条件・特性プロフィールの確認と事業所探しの相談をお願いします。',
        },
        ...prev,
      ];
    });

    setUserProfiles((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              sharedCoordinatorIds: Array.from(
                new Set([...(u.sharedCoordinatorIds || []), coord.id])
              ),
            }
          : u
      )
    );

    addAuditLog(
      'CONSENT_GRANTED',
      `利用者が担当相談支援専門員（${coord.officeName} / ${coord.name}）に希望条件と特性プロフィールを共有`,
      coord.id
    );
  };

  const startAsAdminDemo = () => {
    setRole('admin');
    setSession({
      userId: 'admin-001',
      role: 'admin',
      email: 'security.admin@matching.system.local',
      mfaEnabled: true,
      mfaVerified: true,
      lastActive: getNowDateTime(),
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
    const newId = `user-${padded}-${Date.now().toString().slice(-3)}`;
    const newCode = `利用希望者${padded}`;
    const today = getTodayIso(effectiveReferenceDate);
    const nowDt = getNowDateTime(effectiveReferenceDate);

    const newProfile: UserProfile = {
      id: newId,
      anonymousCode: newCode,
      nickname: input.nickname,
      ageGroup: input.ageGroup,
      gender: input.gender,
      city: input.city,
      registrantRole: input.registrantRole,
      certificateStatus: input.certificateStatus,
      registeredAt: `${today}（新規登録）`,
      confirmedAt: today,
      recruitmentStatus: '募集中',
      isNewArrival: true,
      briefSummaryForFreePlan: `${input.city}にて${input.desiredServices.join('・')}（${input.preferredDays.join('・')}曜）を希望`,
      familyShareToken: `fam_${newId}`,
      sharedCoordinatorIds: [],
      disclosableInfo: {
        contactPersonRole: `${input.registrantRole}（${input.nickname}）`,
        nearestStationArea: input.nearestStationArea,
        preferredContactMethod: 'サイト内メッセージ',
        consultationSupportOffice: '担当相談支援事業所（必要時に共有可能）',
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
      communicationConsiderations:
        input.communicationConsiderations.length > 0
          ? input.communicationConsiderations
          : ['言葉でのコミュニケーションが可能'],
      communicationFreeText: input.freeMessageToProvider,
      dislikesAndAccommodations: input.dislikesAndAccommodations,
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
      updatedAt: nowDt,
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
      createdAt: nowDt,
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
      lastActive: nowDt,
      accountStatus: 'active',
    });
    setUserWizardStep(1);
    setLastRegisteredRole('user');
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `新規利用者アカウント登録完了 (${newCode} / 特性プロフィール含む / 2FA: ${mfaEnabled ? mfaMethod : 'off'})`
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
    const newId = `prov-${padded}-${Date.now().toString().slice(-3)}`;
    const today = getTodayIso(effectiveReferenceDate);
    const nowDt = getNowDateTime(effectiveReferenceDate);
    const cycle: BillingCycle = input.billingCycle || 'monthly';

    const newProfile: ProviderProfile = {
      id: newId,
      name: input.name,
      designatedNumber: input.designatedNumber,
      updatedAt: today,
      locationCity: input.locationCity,
      serviceTypes: input.serviceTypes,
      introduction: input.introduction,
      features: [
        '指定事業所番号 登録済み',
        '受入条件カード掲載',
        `${input.locationCity}拠点`,
      ],
      contactPersonName: input.contactPersonName,
      coverageAreas: input.coverageAreas,
      businessDaysHours: input.businessDaysHours,
      messageFromProvider: input.acceptableConditionsNote,
      appealMessage:
        input.appealMessage.trim() ||
        input.acceptableConditionsNote.slice(0, 60) ||
        'ご希望条件に合わせて丁寧に受け入れ相談を行います。',
      filterOnlyMatchingRequests: false,
      staffMembers: [
        {
          id: `st-${Date.now()}`,
          name: input.contactPersonName,
          roleTitle: '管理者・サービス提供責任者',
          qualifications: '介護福祉士等',
          active: true,
        },
      ],
      branches: [
        {
          id: `br-${Date.now()}`,
          name: `${input.name}（本店）`,
          designatedNumber: input.designatedNumber,
          city: input.locationCity,
          addressNote: `${input.locationCity}エリア`,
          serviceTypes: input.serviceTypes,
          isMain: true,
        },
      ],
      updateHistory: [
        {
          id: `uh-${Date.now()}`,
          providerId: newId,
          updatedAt: today,
          timestamp: nowDt,
          actorName: input.contactPersonName || '管理者',
          kind: 'content_updated',
          summary: '事業所と受入条件カードを新規登録',
        },
      ],
    };

    const newCaps: ProviderCapabilities = {
      providerId: newId,
      supportedCareItems: input.supportedCareItems,
      supportedDisabilities: input.supportedDisabilities,
      supportsBehavioralDisorder: input.supportsBehavioralDisorder,
      behavioralDisorderNote: input.behavioralDisorderNote || '',
      supportsMedicalCare: input.supportsMedicalCare,
      medicalCareRangeText:
        input.medicalCareRangeText?.trim() || '服薬確認・見守り（詳細は面談時確認）',
      supportsEpilepsyResponse: input.supportsEpilepsyResponse,
      epilepsyResponseNote: input.epilepsyResponseNote || '',
      supportedCommunicationMethods:
        input.supportedCommunicationMethods.length > 0
          ? input.supportedCommunicationMethods
          : ['言葉・音声での対話'],
      supportsTransport: input.supportsTransport,
      transportRangeText:
        input.transportRangeText?.trim() ||
        (input.supportsTransport ? `${input.locationCity}周辺` : '送迎なし'),
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
      updatedAt: today,
      weeklySchedule: allDays.map((d) => {
        const isAvail = input.availableDays.includes(d);
        return {
          day: d,
          available: isAvail,
          timeSlots: isAvail ? input.availableTimeSlots : [],
          note: isAvail ? '受入条件カードの通り対応可' : '対応不可',
        };
      }),
    };

    const newSub: ProviderSubscription = {
      providerId: newId,
      planId: input.planId,
      billingCycle: cycle,
      status: 'active',
      startedAt: today,
      nextRenewalDate:
        input.planId === 'free'
          ? '-'
          : addMonthsToIso(today, cycle === 'annual' ? 12 : 1),
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
      createdAt: nowDt,
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
      lastActive: nowDt,
      accountStatus: 'active',
    });
    setProviderWizardStep(1);
    setLastRegisteredRole('provider');
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `新規事業所登録完了 (${newId} / 指定番号:${input.designatedNumber} / プラン:${input.planId})`
    );
    if (targetView === 'registration-complete') {
      setRegistrationBanner(null);
    } else {
      setRegistrationBanner(
        `事業所「${input.name}」（指定事業所番号：${input.designatedNumber}）の新規登録が完了しました！`
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
      lastActive: getNowDateTime(),
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
      lastActive: getNowDateTime(),
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

    const matchedPii = userPIIList.find(
      (p) => p.email.toLowerCase() === trimmed
    );
    if (matchedPii) {
      const u = userProfiles.find((item) => item.id === matchedPii.userId);
      startAsUserDemo(matchedPii.userId, 'user-dashboard');
      setRegistrationBanner(
        `「${u?.nickname || matchedPii.fullName}」としてログインしました。`
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
        `「${matchedUserByName.nickname}」としてログインしました。`
      );
      return { success: true, message: 'ログインしました。' };
    }

    const matchedProv = providerProfiles.find(
      (p) =>
        p.name.toLowerCase().includes(trimmed) || p.id.toLowerCase() === trimmed
    );
    if (matchedProv) {
      startAsProviderDemo(matchedProv.id, 'provider-dashboard');
      setRegistrationBanner(
        `事業所「${matchedProv.name}」としてログインしました。`
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
    addAuditLog('DATA_VIEW_MATCHING', `事業所詳細・受入条件カードの閲覧 (${providerId})`, providerId);
    navigateTo('user-provider-detail');
  };

  const openUserDetailForProvider = (userId: string) => {
    setSelectedUserIdForDetail(userId);
    addAuditLog('DATA_VIEW_MATCHING', `事業所による利用希望者情報の閲覧 (${userId})`, userId);
    navigateTo('provider-user-detail');
  };

  const appendDisclosureHistory = (params: {
    userId: string;
    providerId: string;
    stage: DisclosureStage;
    action: 'granted' | 'revoked';
    disclosedItems: string[];
  }) => {
    const prov = providerProfiles.find((p) => p.id === params.providerId);
    const entry: DisclosureHistoryEntry = {
      id: `dhist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: params.userId,
      providerId: params.providerId,
      providerName: prov?.name || params.providerId,
      stage: params.stage,
      action: params.action,
      disclosedItems: params.disclosedItems,
      timestamp: getNowDateTime(),
    };
    setDisclosureHistory((prev) => [entry, ...prev]);
  };

  const ensureStage1ConsentRecord = (userId: string, providerId: string) => {
    const existing = disclosures.find(
      (d) => d.userId === userId && d.providerId === providerId
    );
    if (existing) return;

    setDisclosures((prev) => [
      ...prev,
      {
        userId,
        providerId,
        stage: 1,
        disclosedFields: {
          nicknameAndRole: true,
          conditionProfile: false,
          nearestStationArea: false,
          preferredContactMethod: false,
          consultationSupportOffice: false,
          detailedScheduleNote: false,
          piiContactAccess: false,
        },
      },
    ]);
    appendDisclosureHistory({
      userId,
      providerId,
      stage: 1,
      action: 'granted',
      disclosedItems: ['ニックネーム', '希望条件の概要（匿名相談開始）'],
    });
  };

  const openChatWith = (partnerId: string) => {
    if (role === 'provider') {
      const sub = getProviderSubscription(activeProviderId);
      const req = getChatRequestBetween(partnerId, activeProviderId);
      const check = verifyProviderChatAccess({
        subscription: sub,
        plans: subscriptionPlans,
        chatRequest: req,
        allProviderChatRequests: chatRequests,
        currentYearMonth: getCurrentYearMonth(),
      });
      if (!check.canSendMessage && !check.canRequestChat) {
        setShowChatUpgradeModal(true);
        addAuditLog(
          'DATA_VIEW_MATCHING',
          `無料プランの月間新規申請上限到達 (${activeProviderId})`,
          partnerId
        );
        return;
      }
      if (!check.canSendMessage && check.canRequestChat) {
        setSelectedUserIdForDetail(partnerId);
        navigateTo('provider-user-detail');
        return;
      }
    }

    setActiveChatPartnerId(partnerId);
    if (role === 'user') {
      ensureStage1ConsentRecord(activeUserId, partnerId);
      markMessagesRead(activeUserId, partnerId, 'user');
    } else if (role === 'provider') {
      ensureStage1ConsentRecord(partnerId, activeProviderId);
      markMessagesRead(partnerId, activeProviderId, 'provider');
    }
    navigateTo('chat');
  };

  const subscribeProviderToPlan = (
    providerId: string,
    planId: SubscriptionPlanId,
    paymentSummary?: ProviderPaymentSummary,
    billingCycle?: BillingCycle
  ) => {
    const today = getTodayIso();
    setProviderSubscriptions((prev) => {
      const existing = prev.find((s) => s.providerId === providerId);
      const cycle: BillingCycle =
        billingCycle || existing?.billingCycle || 'monthly';
      const nextDate =
        planId === 'free'
          ? '-'
          : addMonthsToIso(today, cycle === 'annual' ? 12 : 1);
      const updated: ProviderSubscription = {
        providerId,
        planId,
        billingCycle: cycle,
        status: 'active',
        startedAt: today,
        nextRenewalDate: nextDate,
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
      `事業所プラン変更: ${planId} (${billingCycle || 'monthly'}) (${providerId})`,
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
    const today = getTodayIso();
    setProviderSubscriptions((prev) =>
      prev.map((s) =>
        s.providerId === providerId
          ? {
              ...s,
              planId: 'free',
              status: 'active',
              nextRenewalDate: '-',
              canceledAt: today,
            }
          : s
      )
    );
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `事業所による有料プラン解約 -> 無料プランへ移行 (${providerId})`,
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

  const markProviderNoChangeToday = (providerId: string) => {
    const today = getTodayIso(effectiveReferenceDate);
    const nowDt = getNowDateTime(effectiveReferenceDate);
    const target = providerProfiles.find((p) => p.id === providerId);
    const previousUpdatedAt = target?.updatedAt || today;
    const daysSincePrevious = daysSinceIsoDate(
      previousUpdatedAt,
      effectiveReferenceDate
    );

    const newEntry: ProviderUpdateHistoryEntry = {
      id: `uh-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      providerId,
      updatedAt: today,
      timestamp: nowDt,
      actorName: target?.contactPersonName || '事業所担当者',
      kind: 'no_change',
      summary: `内容に変更なし（前回の更新から${daysSincePrevious}日ぶりに更新）`,
    };

    setProviderProfiles((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              updatedAt: today,
              updateHistory: [newEntry, ...(p.updateHistory || [])].slice(0, 20),
            }
          : p
      )
    );
    setProviderAvailabilities((prev) =>
      prev.map((a) =>
        a.providerId === providerId ? { ...a, updatedAt: today } : a
      )
    );
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `事業所情報「内容に変更なし」で本日（${today}）へ更新（前回から${daysSincePrevious}日経過）`,
      providerId
    );

    return {
      previousUpdatedAt,
      daysSincePrevious,
      updatedAt: today,
    };
  };

  const markProviderUpdatedToday = (providerId: string) => {
    markProviderNoChangeToday(providerId);
  };

  const confirmUserNeedsUnchanged = (userId: string) => {
    const today = getTodayIso(effectiveReferenceDate);
    const target = userProfiles.find((u) => u.id === userId);
    const prevBase = target?.confirmedAt || target?.registeredAt || '';
    const daysSincePrevious = prevBase
      ? daysSinceIsoDate(prevBase, effectiveReferenceDate)
      : 0;

    setUserProfiles((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, confirmedAt: today, recruitmentStatus: '募集中' }
          : u
      )
    );
    addAuditLog(
      'DATA_UPDATE_NEEDS',
      `利用者が「希望は変わっていません」を確認し最新日（${today}）へ更新・募集中へ設定`,
      userId
    );
    return {
      confirmedAt: today,
      daysSincePrevious,
    };
  };

  const setUserRecruitmentStatus = (
    userId: string,
    status: UserRecruitmentStatus
  ) => {
    const today = getTodayIso(effectiveReferenceDate);
    setUserProfiles((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              recruitmentStatus: status,
              confirmedAt: status === '募集中' ? today : u.confirmedAt,
            }
          : u
      )
    );
    addAuditLog(
      'DATA_UPDATE_NEEDS',
      `利用者の募集状態を「${status}」へ変更 (${userId})`,
      userId
    );
  };

  const submitProviderReport = (params: {
    providerId: string;
    userId: string;
    reason: DiscrepancyReportReason;
    note?: string;
  }) => {
    const today = getTodayIso(effectiveReferenceDate);
    const nowDt = getNowDateTime(effectiveReferenceDate);
    const newReport: ProviderDiscrepancyReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      providerId: params.providerId,
      reporterUserId: params.userId,
      reason: params.reason,
      note: params.note?.trim() || undefined,
      createdAt: today,
      timestamp: nowDt,
    };

    const nextList = [newReport, ...providerReports];
    setProviderReports(nextList);

    const reportCount = nextList.filter(
      (r) => r.providerId === params.providerId
    ).length;

    addAuditLog(
      'ADMIN_SECURITY_EVENT',
      `利用者より「情報と違った」報告を受信（理由: ${params.reason} / 累計${reportCount}件）`,
      params.providerId,
      reportCount >= 3
    );

    return {
      reportCount,
      isUnderReview: reportCount >= 3,
    };
  };

  const advanceTimeByDays = (days: number = 30) => {
    setTimeTravelDaysOffset((prev) => prev + days);
    addAuditLog(
      'ADMIN_ACCESS_CHECK',
      `運営検証シミュレーター：経過日数を +${days}日 進めました`
    );
  };

  const resetTimeToToday = () => {
    setTimeTravelDaysOffset(0);
    addAuditLog(
      'ADMIN_ACCESS_CHECK',
      '運営検証シミュレーター：日付シミュレーションを今日（+0日）に戻しました'
    );
  };

  const toggleProviderMatchFilter = (providerId: string) => {
    setProviderProfiles((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, filterOnlyMatchingRequests: !p.filterOnlyMatchingRequests }
          : p
      )
    );
  };

  const addProviderStaffMember = (
    providerId: string,
    staff: Omit<ProviderStaffMember, 'id'>
  ) => {
    const newStaff: ProviderStaffMember = {
      ...staff,
      id: `st-${Date.now()}`,
    };
    setProviderProfiles((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, staffMembers: [...(p.staffMembers || []), newStaff] }
          : p
      )
    );
  };

  const removeProviderStaffMember = (providerId: string, staffId: string) => {
    setProviderProfiles((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              staffMembers: (p.staffMembers || []).filter(
                (s) => s.id !== staffId
              ),
            }
          : p
      )
    );
  };

  const addProviderBranch = (
    providerId: string,
    branch: Omit<ProviderBranch, 'id'>
  ) => {
    const newBranch: ProviderBranch = {
      ...branch,
      id: `br-${Date.now()}`,
    };
    setProviderProfiles((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, branches: [...(p.branches || []), newBranch] }
          : p
      )
    );
  };

  const removeProviderBranch = (providerId: string, branchId: string) => {
    setProviderProfiles((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              branches: (p.branches || []).filter((b) => b.id !== branchId),
            }
          : p
      )
    );
  };

  const sendChatRequest = (
    userId: string,
    providerId: string,
    initiatedBy: 'provider' | 'user',
    initialMessage: string
  ): { ok: boolean; message?: string } => {
    const providerSub = getProviderSubscription(providerId);
    const existing = chatRequests.find(
      (r) => r.userId === userId && r.providerId === providerId
    );

    if (initiatedBy === 'provider') {
      const check = verifyProviderChatAccess({
        subscription: providerSub,
        plans: subscriptionPlans,
        chatRequest: existing,
        allProviderChatRequests: chatRequests,
        currentYearMonth: getCurrentYearMonth(),
      });
      if (!check.canRequestChat && !check.canSendMessage) {
        setShowChatUpgradeModal(true);
        return { ok: false, message: check.reason };
      }
    }

    const nowStr = getNowDateTime();
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
          'ご登録の希望条件と受入条件カードの内容が近いため、ご相談したくご連絡いたしました。',
        requestedAt: nowStr,
        respondedAt: initiatedBy === 'user' ? nowStr : undefined,
      };
      setChatRequests((prev) => [newReq, ...prev]);
    }

    ensureStage1ConsentRecord(userId, providerId);

    if (initiatedBy === 'user' && initialMessage.trim()) {
      sendMessage(userId, providerId, 'user', initialMessage.trim());
    }

    addAuditLog(
      'CHAT_MESSAGE_SENT',
      `チャット開始申請の送信 (送信元: ${initiatedBy}, 状態: ${nextStatus})`,
      initiatedBy === 'provider' ? userId : providerId
    );
    return { ok: true };
  };

  const respondToChatRequest = (
    requestId: string,
    decision: 'approved' | 'declined'
  ) => {
    const targetReq = chatRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const nowStr = getNowDateTime();
    setChatRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: decision, respondedAt: nowStr }
          : r
      )
    );

    if (decision === 'approved') {
      ensureStage1ConsentRecord(targetReq.userId, targetReq.providerId);
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
          messageKind: 'text',
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
        decision === 'approved' ? '承認（第1段階：匿名相談開始）' : '見送り'
      }」しました`,
      targetReq.providerId
    );
  };

  const updateCaseManagementStatus = (
    userId: string,
    providerId: string,
    caseStatus: CaseManagementStatus
  ) => {
    const nowStr = getNowDateTime();
    setInteractions((prev) => {
      const existing = prev.find(
        (i) => i.userId === userId && i.providerId === providerId
      );
      if (existing) {
        return prev.map((i) =>
          i.userId === userId && i.providerId === providerId
            ? { ...i, caseStatus, updatedAt: nowStr }
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
          updatedAt: nowStr,
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
    const today = getTodayIso(effectiveReferenceDate);
    const nowStr = getNowDateTime(effectiveReferenceDate);
    const stampedProfile: UserProfile = {
      ...bundle.profile,
      confirmedAt: today,
      recruitmentStatus: bundle.profile.recruitmentStatus || '募集中',
    };
    setUserProfiles((prev) =>
      prev.map((u) => (u.id === bundle.profile.id ? stampedProfile : u))
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
          item.userId === bundle.profile.id
            ? { ...item, ...pii, updatedAt: nowStr }
            : item
        )
      );
    }
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `利用者プロファイル・特性プロフィール・希望条件を保存（確認日: ${today} / ${bundle.profile.id}）`
    );
  };

  const saveProviderBundle = (bundle: FullProviderBundle) => {
    const today = getTodayIso(effectiveReferenceDate);
    const nowDt = getNowDateTime(effectiveReferenceDate);
    const entry: ProviderUpdateHistoryEntry = {
      id: `uh-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      providerId: bundle.profile.id,
      updatedAt: today,
      timestamp: nowDt,
      actorName: bundle.profile.contactPersonName || '事業所担当者',
      kind: 'content_updated',
      summary: '受入条件カード・受け入れ内容を更新',
    };

    const existingHist =
      providerProfiles.find((p) => p.id === bundle.profile.id)?.updateHistory ||
      bundle.profile.updateHistory ||
      [];

    const updatedProfile: ProviderProfile = {
      ...bundle.profile,
      updatedAt: today,
      updateHistory: [entry, ...existingHist].slice(0, 20),
    };
    const updatedAvailability: ProviderAvailability = {
      ...bundle.availability,
      updatedAt: today,
    };
    setProviderProfiles((prev) =>
      prev.map((p) => (p.id === bundle.profile.id ? updatedProfile : p))
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
        a.providerId === bundle.availability.providerId ? updatedAvailability : a
      )
    );
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `事業所情報・受入条件カードを更新（最終更新日: ${today} / ${bundle.profile.id}）`
    );
  };

  const updateProviderAcceptanceStatus = (
    providerId: string,
    status: ProviderAcceptanceStatus,
    note?: string
  ) => {
    const today = getTodayIso(effectiveReferenceDate);
    const nowDt = getNowDateTime(effectiveReferenceDate);
    const target = providerProfiles.find((p) => p.id === providerId);
    const entry: ProviderUpdateHistoryEntry = {
      id: `uh-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      providerId,
      updatedAt: today,
      timestamp: nowDt,
      actorName: target?.contactPersonName || '事業所担当者',
      kind: 'content_updated',
      summary: `受け入れ状況を変更（${status}）`,
    };
    setProviderProfiles((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              updatedAt: today,
              updateHistory: [entry, ...(p.updateHistory || [])].slice(0, 20),
            }
          : p
      )
    );
    setProviderAvailabilities((prev) =>
      prev.map((a) =>
        a.providerId === providerId
          ? {
              ...a,
              acceptanceStatus: status,
              acceptableConditionsNote:
                note !== undefined ? note : a.acceptableConditionsNote,
              updatedAt: today,
            }
          : a
      )
    );
    addAuditLog(
      'DATA_UPDATE_PROFILE',
      `事業所受け入れ状況の更新: ${status} (${providerId})`
    );
  };

  const toggleUserFavoriteProvider = (userId: string, providerId: string) => {
    const nowStr = getNowDateTime();
    setInteractions((prev) =>
      applyToggleFavoriteInteraction(prev, userId, providerId, nowStr)
    );
  };

  const updateUserFavoriteNote = (
    userId: string,
    providerId: string,
    note: string
  ) => {
    const nowStr = getNowDateTime();
    setInteractions((prev) =>
      applyUpdateFavoriteNoteInteraction(prev, userId, providerId, note, nowStr)
    );
  };

  const setProviderReactionToUser = (
    userId: string,
    providerId: string,
    reaction: ProviderReactionStatus
  ) => {
    const nowStr = getNowDateTime();
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
                updatedAt: nowStr,
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
          updatedAt: nowStr,
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
    text: string,
    options?: {
      messageKind?: ChatMessageKind;
      proposedSlots?: ScheduleCandidateSlot[];
      confirmedSlot?: ScheduleCandidateSlot;
      confirmedKind?: 'interview' | 'visit';
    }
  ) => {
    if (!text.trim()) return;
    if (senderType === 'provider') {
      const providerSub = getProviderSubscription(providerId);
      const existingReq = chatRequests.find(
        (r) => r.userId === userId && r.providerId === providerId
      );
      const check = verifyProviderChatAccess({
        subscription: providerSub,
        plans: subscriptionPlans,
        chatRequest: existingReq,
        allProviderChatRequests: chatRequests,
        currentYearMonth: getCurrentYearMonth(),
      });
      if (!check.canSendMessage) {
        setShowChatUpgradeModal(true);
        return;
      }
    }

    const nowStr = getNowDateTime();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      userId,
      providerId,
      senderType,
      text: text.trim(),
      createdAt: nowStr,
      readByRecipient: false,
      messageKind: options?.messageKind || 'text',
      proposedSlots: options?.proposedSlots,
      confirmedSlot: options?.confirmedSlot,
      confirmedKind: options?.confirmedKind,
    };
    setMessages((prev) => [...prev, newMsg]);

    if (senderType === 'user') {
      setChatRequests((prev) => {
        const ex = prev.find(
          (r) => r.userId === userId && r.providerId === providerId
        );
        if (ex) {
          return prev.map((r) =>
            r.id === ex.id
              ? { ...r, status: 'approved', respondedAt: nowStr }
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
            requestedAt: nowStr,
            respondedAt: nowStr,
          },
        ];
      });
    }

    ensureStage1ConsentRecord(userId, providerId);

    addAuditLog(
      'CHAT_MESSAGE_SENT',
      `チャットメッセージ送受信 (${options?.messageKind || 'text'} / 送信元: ${senderType})`,
      senderType === 'user' ? providerId : userId
    );
  };

  const confirmInterviewOrVisitSchedule = (params: {
    userId: string;
    providerId: string;
    confirmedBy: 'user' | 'provider';
    kind: 'interview' | 'visit';
    slot: ScheduleCandidateSlot;
  }) => {
    const today = getTodayIso(effectiveReferenceDate);
    const nowStr = getNowDateTime(effectiveReferenceDate);
    const kindLabel = params.kind === 'visit' ? '見学' : '面談';
    const summary = `${kindLabel}：${params.slot.day}曜 ${params.slot.timeSlot}`;

    sendMessage(
      params.userId,
      params.providerId,
      params.confirmedBy,
      `【${kindLabel}日程の決定】${summary} で日程が確定しました。必要に応じ「第3段階：連絡先の開示」をご確認いただけます。`,
      {
        messageKind: 'schedule_confirmed',
        confirmedKind: params.kind,
        confirmedSlot: params.slot,
      }
    );

    const interviewRecord: ConfirmedInterviewRecord = {
      id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      providerId: params.providerId,
      userId: params.userId,
      confirmedAt: today,
      confirmedMonthLabel: formatJapaneseMonthOnly(today) || '今月',
      kind: params.kind,
    };
    setConfirmedInterviews((prev) => [interviewRecord, ...prev]);

    setDisclosures((prev) => {
      const existing = prev.find(
        (d) => d.userId === params.userId && d.providerId === params.providerId
      );
      if (existing) {
        return prev.map((d) =>
          d.userId === params.userId && d.providerId === params.providerId
            ? {
                ...d,
                scheduleDecidedAt: nowStr,
                scheduleSummary: summary,
              }
            : d
        );
      }
      return [
        ...prev,
        {
          userId: params.userId,
          providerId: params.providerId,
          stage: 1,
          scheduleDecidedAt: nowStr,
          scheduleSummary: summary,
          disclosedFields: {
            nicknameAndRole: true,
            conditionProfile: false,
            nearestStationArea: false,
            preferredContactMethod: false,
            consultationSupportOffice: false,
            detailedScheduleNote: false,
            piiContactAccess: false,
          },
        },
      ];
    });
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
    return {
      userId,
      providerId,
      stage: 1,
      disclosedFields: {
        nicknameAndRole: true,
        conditionProfile: false,
        nearestStationArea: false,
        preferredContactMethod: false,
        consultationSupportOffice: false,
        detailedScheduleNote: false,
        piiContactAccess: false,
      },
    };
  };

  const grantStage2Disclosure = (userId: string, providerId: string) => {
    const nowStr = getNowDateTime();
    setDisclosures((prev) => {
      const existing = prev.find(
        (d) => d.userId === userId && d.providerId === providerId
      );
      const nextFields = {
        nicknameAndRole: true,
        conditionProfile: true,
        nearestStationArea: true,
        preferredContactMethod: true,
        consultationSupportOffice: true,
        detailedScheduleNote: true,
        piiContactAccess:
          existing?.stage === 3 ? Boolean(existing.disclosedFields.piiContactAccess) : false,
      };
      if (existing) {
        return prev.map((d) =>
          d.userId === userId && d.providerId === providerId
            ? {
                ...d,
                stage: d.stage === 3 ? 3 : 2,
                consentedAt: nowStr,
                revokedAt: undefined,
                disclosedFields: nextFields,
              }
            : d
        );
      }
      return [
        ...prev,
        {
          userId,
          providerId,
          stage: 2,
          consentedAt: nowStr,
          disclosedFields: nextFields,
        },
      ];
    });

    appendDisclosureHistory({
      userId,
      providerId,
      stage: 2,
      action: 'granted',
      disclosedItems: ['障害種別', '介助内容', '希望曜日・時間帯', '特性プロフィール・配慮事項'],
    });

    addAuditLog(
      'CONSENT_GRANTED',
      `第2段階「条件の開示」に利用者が同意 (Provider: ${providerId})`,
      providerId
    );
  };

  const grantStage3Disclosure = (
    userId: string,
    providerId: string,
    allowPiiContactAccess: boolean = true
  ): { ok: boolean; message?: string } => {
    const current = getDisclosureStage(userId, providerId);
    if (!current.scheduleDecidedAt) {
      return {
        ok: false,
        message:
          '氏名・電話番号・メールアドレスは、チャットで「面談」または「見学」の日程が決まった後に開示できます。',
      };
    }

    const nowStr = getNowDateTime();
    const fields = {
      nicknameAndRole: true,
      conditionProfile: true,
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
                consentedAt: nowStr,
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
          consentedAt: nowStr,
          scheduleDecidedAt: current.scheduleDecidedAt,
          scheduleSummary: current.scheduleSummary,
          disclosedFields: fields,
        },
      ];
    });

    appendDisclosureHistory({
      userId,
      providerId,
      stage: 3,
      action: 'granted',
      disclosedItems: ['氏名', '電話番号', 'メールアドレス（面談/見学日程決定後の連絡先開示）'],
    });

    addAuditLog(
      'CONSENT_GRANTED',
      `第3段階「連絡先の開示」に利用者が同意 (Provider: ${providerId}, PII連絡先許可: ${allowPiiContactAccess})`,
      providerId
    );
    return { ok: true };
  };

  const revokeDisclosureToStage = (
    userId: string,
    providerId: string,
    targetStage: 1 | 2 = 1
  ) => {
    const nowStr = getNowDateTime();
    setDisclosures((prev) =>
      prev.map((d) =>
        d.userId === userId && d.providerId === providerId
          ? {
              ...d,
              stage: targetStage,
              revokedAt: nowStr,
              disclosedFields: {
                nicknameAndRole: true,
                conditionProfile: targetStage >= 2,
                nearestStationArea: targetStage >= 2,
                preferredContactMethod: targetStage >= 2,
                consultationSupportOffice: targetStage >= 2,
                detailedScheduleNote: targetStage >= 2,
                piiContactAccess: false,
              },
            }
          : d
      )
    );

    appendDisclosureHistory({
      userId,
      providerId,
      stage: targetStage,
      action: 'revoked',
      disclosedItems:
        targetStage === 1
          ? ['条件詳細・連絡先の開示を取り消し（第1段階「匿名相談」へ戻しました）']
          : ['連絡先（氏名・電話番号・メール）の開示を取り消し（第2段階へ戻しました）'],
    });

    addAuditLog(
      'CONSENT_REVOKED',
      `利用者による開示取り消し -> 第${targetStage}段階へ変更 (Provider: ${providerId})`,
      providerId
    );
  };

  const revokeStage3Disclosure = (userId: string, providerId: string) => {
    revokeDisclosureToStage(userId, providerId, 2);
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
    localStorage.setItem(RESET_FLAG_KEY, '1');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
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
    setDisclosureHistory([]);
    setCoordinators([]);
    setSharedCases([]);
    setAuditLogs([]);
    setSubscriptionPlans(DEFAULT_SUBSCRIPTION_PLANS);
    setProviderSubscriptions([]);
    setChatRequests([]);
    setAccountCredentials([]);
    setProviderReports([]);
    setConfirmedInterviews([]);
    setTimeTravelDaysOffset(0);
    setPendingMfaChallenge(null);
    setActiveUserId('');
    setActiveProviderId('');
    setActiveCoordinatorId('');
    setRole('guest');
    setLastRegisteredRole(null);
    setRegistrationBanner('登録データをすべて消去して0件にリセットしました。新規登録から試せます。');
    setRateLimitMap({});
    navigateTo('top');
  };

  const loadDemoData = () => {
    localStorage.removeItem(RESET_FLAG_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setUserPIIList(INITIAL_USER_PII);
    setUserProfiles(INITIAL_USER_PROFILES);
    setUserNeeds(INITIAL_USER_NEEDS);
    setUserPreferences(INITIAL_USER_PREFERENCES);
    setProviderProfiles(INITIAL_PROVIDER_PROFILES);
    setProviderCapabilities(INITIAL_PROVIDER_CAPABILITIES);
    setProviderAvailabilities(INITIAL_PROVIDER_AVAILABILITY);
    setInteractions(INITIAL_INTERACTIONS);
    setMessages(INITIAL_MESSAGES);
    setDisclosures(INITIAL_DISCLOSURES);
    setDisclosureHistory(INITIAL_DISCLOSURE_HISTORY);
    setCoordinators(INITIAL_COORDINATORS);
    setSharedCases(INITIAL_SHARED_CASES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSubscriptionPlans(DEFAULT_SUBSCRIPTION_PLANS);
    setProviderSubscriptions(INITIAL_PROVIDER_SUBSCRIPTIONS);
    setChatRequests(INITIAL_CHAT_REQUESTS);
    setAccountCredentials(INITIAL_CREDENTIALS);
    setProviderReports(INITIAL_PROVIDER_REPORTS);
    setConfirmedInterviews(INITIAL_CONFIRMED_INTERVIEWS);
    setTimeTravelDaysOffset(0);
    setActiveUserId(INITIAL_USER_PROFILES[0].id);
    setActiveProviderId(INITIAL_PROVIDER_PROFILES[0].id);
    setActiveCoordinatorId(INITIAL_COORDINATORS[0].id);
    setPendingMfaChallenge(null);
    setRole('guest');
    setRegistrationBanner(
      '初期の動作確認用サンプルデータ（利用者5名・事業所5社・相談支援専門員1名）を読み込みました。'
    );
    navigateTo('top');
  };

  return (
    <AppStateContext.Provider
      value={{
        role,
        currentView,
        activeUserId,
        activeProviderId,
        activeCoordinatorId,
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
        disclosureHistory,
        providerReports,
        confirmedInterviews,
        timeTravelDaysOffset,
        effectiveReferenceDate,
        coordinators,
        sharedCases,
        currentCoordinator,
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
        registerCoordinator,
        startAsCoordinatorDemo,
        shareUserWithCoordinator,
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
        markProviderUpdatedToday,
        markProviderNoChangeToday,
        confirmUserNeedsUnchanged,
        setUserRecruitmentStatus,
        submitProviderReport,
        advanceTimeByDays,
        resetTimeToToday,
        toggleProviderMatchFilter,
        addProviderStaffMember,
        removeProviderStaffMember,
        addProviderBranch,
        removeProviderBranch,
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
        confirmInterviewOrVisitSchedule,
        markMessagesRead,
        grantStage2Disclosure,
        grantStage3Disclosure,
        revokeDisclosureToStage,
        revokeStage3Disclosure,
        getDisclosureStage,
        resetDemoData,
        loadDemoData,
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

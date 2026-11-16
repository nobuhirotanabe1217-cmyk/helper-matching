// ==============================================================================
// 1. 基本ドメイン型
// ==============================================================================
export type ServiceType =
  | '移動支援'
  | '居宅介護'
  | '重度訪問介護'
  | '同行援護';

export type RegistrantRole = '本人' | '家族' | '支援者';

export type AgeGroup =
  | '10代以下'
  | '20代'
  | '30代'
  | '40代'
  | '50代'
  | '60代'
  | '70代以上';

export type UserGender = '男性' | '女性' | 'その他・回答しない';

export type CertificateStatus =
  | '受給者証を持っている'
  | '現在申請中'
  | '更新手続き中'
  | '支給決定済みだが利用開始前'
  | 'これから申請を検討している'
  | 'その他・わからない';

export type DisabilityType =
  | '身体障害'
  | '知的障害'
  | '精神障害'
  | '発達障害'
  | '難病'
  | '視覚障害'
  | 'その他・複数該当';

export type SupportCategoryLevel =
  | '区分1'
  | '区分2'
  | '区分3'
  | '区分4'
  | '区分5'
  | '区分6'
  | '非該当・未認定'
  | '申請中'
  | 'わからない';

export type CareNeedItem =
  | '食事の介助'
  | '排泄の介助'
  | '入浴の介助'
  | '着替えの介助'
  | '移乗の介助'
  | '車いすの操作・介助'
  | '歩行の見守り・介助'
  | '外出時の付き添い'
  | '通院時の付き添い'
  | '買い物の付き添い'
  | '家事援助'
  | '調理'
  | '掃除'
  | '洗濯'
  | 'その他';

export type PhysicalConditionItem =
  | '自立歩行が可能'
  | '杖を使用'
  | '歩行器を使用'
  | '車いすを使用'
  | '電動車いすを使用'
  | 'ベッドから車いすへの移乗介助が必要'
  | '2人介助が必要'
  | '見守りが中心'
  | '身体介助が中心'
  | 'その他';

export type CommunicationConsiderationItem =
  | '言葉でのコミュニケーションが可能'
  | '筆談・文字盤などを使用'
  | '絵カードなどを使用'
  | '意思表示に時間が必要'
  | '強いこだわりがある'
  | '環境の変化が苦手'
  | 'パニック時の対応が必要'
  | '行動面で専門的な配慮が必要'
  | '特に配慮事項なし'
  | 'その他';

export type HelperGenderPreference =
  | '男性ヘルパーを希望'
  | '女性ヘルパーを希望'
  | '性別は問わない'
  | 'できれば同性を希望'
  | '内容によって異なる';

export type DayOfWeek = '月' | '火' | '水' | '木' | '金' | '土' | '日';

export type TimeSlot =
  | '早朝（6時〜9時）'
  | '午前（9時〜12時）'
  | '午後（12時〜17時）'
  | '夕方・夜間（17時〜22時）'
  | '深夜・泊まり（22時以降）';

export type UsageFrequency =
  | '毎日'
  | '週3〜5回'
  | '週1〜2回'
  | '月数回・不定期'
  | '相談して決めたい';

export type StartTiming =
  | 'できるだけ早く（1か月以内）'
  | '1〜2か月以内'
  | '3か月以内'
  | '良い事業所があれば時期は相談';

// ==============================================================================
// 2. 個人情報の分離管理（A: 本人特定情報 vs B: 支援ニーズ・特性プロフィール）
// ==============================================================================

/**
 * データ領域 A: 本人特定情報 (Personally Identifiable Information - PII)
 * 物理・論理的に別コレクション/テーブルに隔離保管。
 * 面談または見学の日程が決まり、かつ第3段階で利用者が同意した場合のみ開示。
 */
export interface UserPII {
  userId: string;
  fullName: string;
  fullNameKana: string;
  phoneNumber: string;
  email: string;
  postalCode: string;
  detailedAddress: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  updatedAt: string;
}

/**
 * データ領域 B: 支援ニーズ・照合用公開情報 (Public Matching Profile)
 */
export interface UserProfile {
  id: string;
  anonymousCode: string;
  nickname: string;
  ageGroup: AgeGroup;
  gender: UserGender;
  city: string;
  registrantRole: RegistrantRole;
  certificateStatus: CertificateStatus;
  registeredAt?: string;
  isNewArrival?: boolean;
  briefSummaryForFreePlan?: string;
  familyShareToken?: string;
  sharedCoordinatorIds?: string[];
  disclosableInfo: {
    contactPersonRole: string;
    nearestStationArea: string;
    preferredContactMethod: string;
    consultationSupportOffice: string;
    detailedScheduleNote: string;
  };
}

export interface UserSupportNeeds {
  userId: string;
  desiredServices: ServiceType[];
  serviceNotes?: Partial<Record<ServiceType, string>>;
  disabilityTypes: DisabilityType[];
  supportCategory: SupportCategoryLevel;
  careNeeds: CareNeedItem[];
  essentialCareNeeds: CareNeedItem[];
  physicalConditions: PhysicalConditionItem[];
  communicationConsiderations: CommunicationConsiderationItem[];
  communicationFreeText: string;
  /** 特性プロフィール：苦手なこと・配慮してほしいこと */
  dislikesAndAccommodations: string;
}

export interface UserPreferences {
  userId: string;
  helperGenderPreference: HelperGenderPreference;
  isGenderPreferenceStrict: boolean;
  preferredDays: DayOfWeek[];
  preferredTimeSlots: TimeSlot[];
  frequency: UsageFrequency;
  startTiming: StartTiming;
  preferredAreas: string[];
  otherRequests: string;
  freeMessageToProvider: string;
}

// ==============================================================================
// 3. 事業所側：受入条件カード＆指定事業所番号＆鮮度管理
// ==============================================================================
export type ProviderCapabilityDisability =
  | '身体障害'
  | '知的障害'
  | '精神障害'
  | '発達障害'
  | '難病'
  | '視覚障害'
  | '重度障害'
  | '行動面で配慮が必要な方'
  | '医療的な配慮が必要な方'
  | 'その他';

export type ProviderGenderPolicy =
  | '男性ヘルパーの対応が可能'
  | '女性ヘルパーの対応が可能'
  | '男女どちらも対応可能'
  | '同性介助の希望に可能な範囲で対応'
  | '条件によって相談可能';

export type ProviderAcceptanceStatus =
  | '新規利用者を積極的に募集中'
  | '条件によって受け入れ相談可能'
  | '一部の曜日・時間帯のみ受け入れ可能'
  | '現在は受け入れ困難'
  | '問い合わせのみ受け付ける';

export type SupportDetailPolicy = '対応可能' | '条件付きで相談可' | '対応不可';

export interface DayAvailability {
  day: DayOfWeek;
  available: boolean;
  timeSlots: TimeSlot[];
  note: string;
}

export interface ProviderStaffMember {
  id: string;
  name: string;
  roleTitle: string;
  qualifications: string;
  active: boolean;
}

export interface ProviderBranch {
  id: string;
  name: string;
  designatedNumber: string;
  city: string;
  addressNote: string;
  serviceTypes: ServiceType[];
  isMain: boolean;
}

export interface ProviderProfile {
  id: string;
  name: string;
  /** 指定事業所番号（10桁必須） */
  designatedNumber: string;
  /** 最終更新日（YYYY-MM-DD） */
  updatedAt: string;
  locationCity: string;
  serviceTypes: ServiceType[];
  introduction: string;
  features: string[];
  contactPersonName: string;
  coverageAreas: string[];
  businessDaysHours: string;
  messageFromProvider: string;
  /** ひとことアピール（例：「土曜の午前なら、車いすの方を受けられます」） */
  appealMessage: string;
  /** 有料プラン：受入条件に合う希望だけが届く設定 */
  filterOnlyMatchingRequests?: boolean;
  /** 有料プラン：複数スタッフ管理 */
  staffMembers?: ProviderStaffMember[];
  /** 上位プラン：複数拠点管理 */
  branches?: ProviderBranch[];
}

export interface ProviderCapabilities {
  providerId: string;
  supportedCareItems: CareNeedItem[];
  supportedDisabilities: ProviderCapabilityDisability[];
  /** 支援の細目 */
  supportsBehavioralDisorder: SupportDetailPolicy;
  behavioralDisorderNote?: string;
  supportsMedicalCare: SupportDetailPolicy;
  medicalCareRangeText: string;
  supportsEpilepsyResponse: SupportDetailPolicy;
  epilepsyResponseNote?: string;
  supportedCommunicationMethods: string[];
  supportsTransport: boolean;
  transportRangeText: string;
  supportsTwoPersonCare: boolean;
  supportsWheelchairTransfer: boolean;
  helperGenderPolicy: ProviderGenderPolicy;
  availableHelperGenders: ('男性' | '女性')[];
}

export interface ProviderAvailability {
  providerId: string;
  acceptanceStatus: ProviderAcceptanceStatus;
  weeklySchedule: DayAvailability[];
  acceptableConditionsNote: string;
  updatedAt: string;
}

// ==============================================================================
// 3-B. 事業者料金プラン・サブスクリプション・決済手段
// ==============================================================================
export type SubscriptionPlanId = 'free' | 'standard' | 'pro';
export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionPlanDefinition {
  id: SubscriptionPlanId;
  name: string;
  monthlyPriceYen: number;
  annualPriceYen: number;
  badgeText: string;
  description: string;
  features: string[];
  /** 月間送信申請上限（null = 無制限） */
  monthlyOutboundRequestLimit: number | null;
  canSendChatRequest: boolean;
  canManageCases: boolean;
  canReceiveNewAlerts: boolean;
  canManageStaff: boolean;
  canHighlightCard: boolean;
  canManageMultiBranches: boolean;
  canViewRegionalAnalytics: boolean;
  isAvailableNow: boolean;
}

export type ProviderAccountApprovalStatus =
  | 'approved'
  | 'pending'
  | 'suspended';

export type PaymentMethodType = 'bank_transfer' | 'credit_card' | 'invoice';

export type PaymentSetupStatus =
  | 'card_verified'
  | 'bank_active'
  | 'bank_pending_verification'
  | 'invoice_issued';

export interface ProviderPaymentSummary {
  method: PaymentMethodType;
  displayLabel: string;
  billingDayLabel: string;
  status: PaymentSetupStatus;
  updatedAt: string;
  invoiceNumber?: string;
  invoiceDueDate?: string;
}

export interface ProviderSubscription {
  providerId: string;
  planId: SubscriptionPlanId;
  billingCycle?: BillingCycle;
  status: 'active' | 'canceled';
  startedAt: string;
  nextRenewalDate: string;
  canceledAt?: string;
  accountApprovalStatus: ProviderAccountApprovalStatus;
  paymentSummary?: ProviderPaymentSummary;
}

// ==============================================================================
// 3-C. 相談支援専門員（無料ロール・利用者から共有を受けて検索支援）
// ==============================================================================
export interface CoordinatorProfile {
  id: string;
  name: string;
  officeName: string;
  area: string;
  email?: string;
  registeredAt: string;
}

export interface SharedCaseToCoordinator {
  id: string;
  userId: string;
  coordinatorId: string;
  sharedAt: string;
  noteToCoordinator: string;
}

// ==============================================================================
// 4. マッチング・定型チャット・3段階情報開示・履歴
// ==============================================================================
export type ProviderReactionStatus =
  | '未対応'
  | '対応を検討したい'
  | '詳しい条件を確認したい'
  | 'メッセージを送る'
  | '今回は対応が難しい';

export type CaseManagementStatus =
  | '未対応'
  | '検討中'
  | '対応中'
  | '対応不可';

export interface MatchingInteraction {
  userId: string;
  providerId: string;
  isUserFavorite: boolean;
  userFavoriteNote?: string;
  favoritedAt?: string;
  providerReaction: ProviderReactionStatus;
  caseStatus?: CaseManagementStatus;
  updatedAt: string;
}

export type ChatRequestStatus = 'pending' | 'approved' | 'declined';

export interface ChatRequest {
  id: string;
  userId: string;
  providerId: string;
  initiatedBy: 'provider' | 'user';
  status: ChatRequestStatus;
  initialMessage: string;
  requestedAt: string;
  respondedAt?: string;
}

export type ChatMessageKind =
  | 'text'
  | 'interview_request'
  | 'visit_request'
  | 'schedule_proposal'
  | 'schedule_confirmed';

export interface ScheduleCandidateSlot {
  day: DayOfWeek;
  timeSlot: TimeSlot;
}

export interface ChatMessage {
  id: string;
  userId: string;
  providerId: string;
  senderType: 'user' | 'provider';
  text: string;
  createdAt: string;
  readByRecipient: boolean;
  messageKind?: ChatMessageKind;
  proposedSlots?: ScheduleCandidateSlot[];
  confirmedSlot?: ScheduleCandidateSlot;
  confirmedKind?: 'interview' | 'visit';
}

/**
 * 個人情報3段階開示
 * 第1段階「匿名相談」: ニックネームと希望条件の概要のみでチャット可能（障害詳細・連絡先は非表示）
 * 第2段階「条件の開示」: 利用者同意により、障害種別・特性プロフィール・介助内容・希望曜日を開示
 * 第3段階「連絡先の開示」: 面談/見学の日程決定後、利用者同意により氏名・電話番号・メールを開示
 */
export type DisclosureStage = 1 | 2 | 3;

export interface DisclosureConsent {
  userId: string;
  providerId: string;
  stage: DisclosureStage;
  consentedAt?: string;
  revokedAt?: string;
  scheduleDecidedAt?: string;
  scheduleSummary?: string;
  disclosedFields: {
    nicknameAndRole: boolean;
    conditionProfile: boolean;
    nearestStationArea: boolean;
    preferredContactMethod: boolean;
    consultationSupportOffice: boolean;
    detailedScheduleNote: boolean;
    piiContactAccess?: boolean;
  };
}

export interface DisclosureHistoryEntry {
  id: string;
  userId: string;
  providerId: string;
  providerName: string;
  stage: DisclosureStage;
  action: 'granted' | 'revoked';
  disclosedItems: string[];
  timestamp: string;
}

// ==============================================================================
// 5. セキュリティ・認証・監査ログ・RBAC
// ==============================================================================
export type AuthUserRole = 'user' | 'provider' | 'coordinator' | 'admin';

export type TwoFactorMethod = 'email' | 'sms' | 'none';

export interface AccountCredential {
  id: string;
  role: 'user' | 'provider';
  displayName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  mfaEnabled: boolean;
  mfaMethod: 'email' | 'sms';
  createdAt: string;
}

export interface PendingMfaChallenge {
  challengeId: string;
  accountId: string;
  role: 'user' | 'provider';
  displayName: string;
  email: string;
  method: 'email' | 'sms';
  maskedDestination: string;
  code: string;
  expiresAt: number;
  attemptsRemaining: number;
}

export interface AuthSession {
  userId: string;
  role: AuthUserRole;
  email: string;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  mfaMethod?: 'email' | 'sms';
  ipAddress?: string;
  userAgent?: string;
  sessionToken?: string;
  lastActive: string;
  accountStatus: 'active' | 'suspended' | 'locked';
}

export type AuditActionType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_FAILED'
  | 'ACCOUNT_LOCKED'
  | 'DATA_VIEW_MATCHING'
  | 'DATA_VIEW_PII'
  | 'DATA_UPDATE_PROFILE'
  | 'DATA_UPDATE_NEEDS'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'CHAT_MESSAGE_SENT'
  | 'ADMIN_ACCESS_CHECK'
  | 'ADMIN_SECURITY_EVENT';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: AuthUserRole;
  action: AuditActionType;
  targetId?: string;
  ipAddress: string;
  detail: string;
  isSecurityAlert?: boolean;
}

export interface SecurityEventSummary {
  failedLoginAttempts: number;
  suspiciousAccessCount: number;
  piiAccessDeniedCount: number;
  activeRateLimitBlocks: number;
  isAiDataGatingActive: boolean;
}

// ==============================================================================
// 6. マッチングスコア型（100点満点：25 / 25 / 20 / 15 / 10 / 5）
// ==============================================================================
export type MatchJudgmentStatus =
  | 'マッチング候補'
  | '要確認'
  | 'マッチング対象外';

export interface ScoreBreakdown {
  serviceScore: number; // max 25
  careNeedsScore: number; // max 25
  disabilityExpScore: number; // max 20 (障害特性・支援細目)
  scheduleScore: number; // max 15
  areaScore: number; // max 10
  genderScore: number; // max 5
  totalScore: number; // max 100
}

export interface MatchResult {
  userId: string;
  providerId: string;
  breakdown: ScoreBreakdown;
  judgment: MatchJudgmentStatus;
  /** あなたの希望と合っている点 */
  matchingPoints: string[];
  criticalWarnings: string[];
  positiveReasons: string[];
  cautionReasons: string[];
  summaryText: string;
  isStaleProvider?: boolean;
  daysSinceUpdate?: number;
}

// ==============================================================================
// 7. 定数・選択肢（福祉用語にはやさしい説明を併記）
// ==============================================================================
export const SERVICE_TYPES: {
  value: ServiceType;
  label: ServiceType;
  shortDesc: string;
  detailHelp: string;
}[] = [
  {
    value: '移動支援',
    label: '移動支援',
    shortDesc: '外出時の付き添い・余暇や社会参加のための移動をサポート',
    detailHelp:
      'お買い物・余暇・地域のイベントなど、外出するときにヘルパーが付き添うサービスです。',
  },
  {
    value: '居宅介護',
    label: '居宅介護',
    shortDesc: '自宅での入浴・排泄・食事などの介助や、調理・掃除などの家事サポート',
    detailHelp:
      'ご自宅にヘルパーが訪問し、入浴・排泄・食事のサポートや、料理・お掃除・洗濯などを行います。',
  },
  {
    value: '重度訪問介護',
    label: '重度訪問介護',
    shortDesc: '重度の障害がある方へ、自宅で長い時間の見守りから外出まで継続サポート',
    detailHelp:
      '常に介護や見守りが必要な方に、ご自宅での生活全般から外出まで、長い時間ゆっくり寄り添うサービスです。',
  },
  {
    value: '同行援護',
    label: '同行援護',
    shortDesc: '視覚に障害がある方へ、外出時の同行・案内・代読や代筆をサポート',
    detailHelp:
      '目の見えづらさがある方の外出に付き添い、安全に歩けるよう案内したり、書類の読み上げや代筆を行います。',
  },
];

export const CERTIFICATE_STATUS_OPTIONS: CertificateStatus[] = [
  '受給者証を持っている',
  '現在申請中',
  '更新手続き中',
  '支給決定済みだが利用開始前',
  'これから申請を検討している',
  'その他・わからない',
];

export const DISABILITY_TYPE_OPTIONS: DisabilityType[] = [
  '身体障害',
  '知的障害',
  '精神障害',
  '発達障害',
  '難病',
  '視覚障害',
  'その他・複数該当',
];

export const PROVIDER_DISABILITY_OPTIONS: ProviderCapabilityDisability[] = [
  '身体障害',
  '知的障害',
  '精神障害',
  '発達障害',
  '難病',
  '視覚障害',
  '重度障害',
  '行動面で配慮が必要な方',
  '医療的な配慮が必要な方',
  'その他',
];

export const SUPPORT_CATEGORY_OPTIONS: SupportCategoryLevel[] = [
  '区分1',
  '区分2',
  '区分3',
  '区分4',
  '区分5',
  '区分6',
  '非該当・未認定',
  '申請中',
  'わからない',
];

export const CARE_NEED_ITEMS: CareNeedItem[] = [
  '食事の介助',
  '排泄の介助',
  '入浴の介助',
  '着替えの介助',
  '移乗の介助',
  '車いすの操作・介助',
  '歩行の見守り・介助',
  '外出時の付き添い',
  '通院時の付き添い',
  '買い物の付き添い',
  '家事援助',
  '調理',
  '掃除',
  '洗濯',
  'その他',
];

export const PROVIDER_CARE_LABELS: Record<CareNeedItem, string> = {
  '食事の介助': '食事介助',
  '排泄の介助': '排泄介助',
  '入浴の介助': '入浴介助',
  '着替えの介助': '着替え介助',
  '移乗の介助': '移乗介助',
  '車いすの操作・介助': '車いす介助',
  '歩行の見守り・介助': '歩行介助',
  '外出時の付き添い': '外出支援',
  '通院時の付き添い': '通院介助',
  '買い物の付き添い': '買い物同行・支援',
  '家事援助': '家事援助',
  '調理': '調理',
  '掃除': '掃除',
  '洗濯': '洗濯',
  'その他': 'その他',
};

export const PHYSICAL_CONDITION_ITEMS: PhysicalConditionItem[] = [
  '自立歩行が可能',
  '杖を使用',
  '歩行器を使用',
  '車いすを使用',
  '電動車いすを使用',
  'ベッドから車いすへの移乗介助が必要',
  '2人介助が必要',
  '見守りが中心',
  '身体介助が中心',
  'その他',
];

export const COMMUNICATION_ITEMS: CommunicationConsiderationItem[] = [
  '言葉でのコミュニケーションが可能',
  '筆談・文字盤などを使用',
  '絵カードなどを使用',
  '意思表示に時間が必要',
  '強いこだわりがある',
  '環境の変化が苦手',
  'パニック時の対応が必要',
  '行動面で専門的な配慮が必要',
  '特に配慮事項なし',
  'その他',
];

export const SUPPORTED_COMMUNICATION_METHODS: string[] = [
  '言葉・音声での対話',
  'ゆっくり・短い言葉での説明',
  '筆談・文字盤',
  '絵カード・スケジュール表',
  'ジェスチャー・指さし',
  '手話・触手話',
  '音声案内・代読代筆（視覚配慮）',
];

export const HELPER_GENDER_PREFERENCES: HelperGenderPreference[] = [
  '女性ヘルパーを希望',
  '男性ヘルパーを希望',
  'できれば同性を希望',
  '性別は問わない',
  '内容によって異なる',
];

export const DAYS_OF_WEEK: DayOfWeek[] = ['月', '火', '水', '木', '金', '土', '日'];

export const TIME_SLOTS: TimeSlot[] = [
  '早朝（6時〜9時）',
  '午前（9時〜12時）',
  '午後（12時〜17時）',
  '夕方・夜間（17時〜22時）',
  '深夜・泊まり（22時以降）',
];

export const AREA_OPTIONS: string[] = [
  '杉並区',
  '中野区',
  '世田谷区',
  '練馬区',
  '新宿区',
  '渋谷区',
  '武蔵野市',
  '三鷹市',
];

export const CHAT_TEMPLATES_USER: string[] = [
  '利用について詳しく相談したいです',
  'この曜日で対応可能でしょうか',
  '支援内容について確認したいです',
  '一度お話を伺いたいです',
];

export const CHAT_TEMPLATES_PROVIDER: string[] = [
  'ご登録の希望条件を拝見しました。一度詳しくお話を伺いたいです。',
  'ご希望の曜日・時間帯での対応が可能です。支援内容について確認させてください。',
  '同性介助のご希望に対応可能です。利用開始時期についてご相談できますでしょうか。',
  '詳しい条件を確認したいです。差し支えない範囲で教えていただけますでしょうか。',
];

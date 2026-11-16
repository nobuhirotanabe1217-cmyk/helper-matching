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
// 2. 個人情報の分離管理（指示書 2. A:本人特定情報 vs B:支援ニーズ情報）
// ==============================================================================

/**
 * データ領域 A: 本人特定情報 (Personally Identifiable Information - PII)
 * 物理・論理的に別コレクション/テーブルに隔離保管。
 * 事業所検索APIでは絶対に取得させず、本人の明示的同意およびサーバーサイド検証がある場合のみ開示。
 */
export interface UserPII {
  userId: string; // 内部ランダムUUID (例: usr_sec_8f9e...)
  fullName: string; // 氏名 (試作・デモでは架空名義)
  fullNameKana: string; // フリガナ
  phoneNumber: string; // 電話番号
  email: string; // メールアドレス
  postalCode: string; // 郵便番号
  detailedAddress: string; // 詳細住所（番地・建物名・部屋番号）
  emergencyContactName?: string; // 緊急連絡先氏名
  emergencyContactPhone?: string; // 緊急連絡先電話番号
  updatedAt: string;
}

/**
 * データ領域 B: 支援ニーズ・照合用公開情報 (Public Matching Profile)
 * 個人を特定する情報（氏名・詳細住所・連絡先等）を含まず、
 * 検索・マッチングに必要な条件のみを保持。
 */
export interface UserProfile {
  id: string; // 内部ランダムID
  anonymousCode: string; // 外部表示用匿名コード (例: 利用希望者001)
  nickname: string; // 画面呼び名（仮名可）
  ageGroup: AgeGroup;
  gender: UserGender;
  city: string; // 市区町村単位まで（町名番地は一切含めない）
  registrantRole: RegistrantRole;
  certificateStatus: CertificateStatus;
  registeredAt?: string; // 登録時期 (例: 2026年11月・新着)
  isNewArrival?: boolean; // 新着フラグ
  briefSummaryForFreePlan?: string; // 無料プラン事業所向けの個人特定されない配慮概要
  // 第3段階（本人の明示的同意後）に特定事業所へ限定開示する相談用情報
  disclosableInfo: {
    contactPersonRole: string; // 例: 母（主介護者・同居）
    nearestStationArea: string; // 最寄り駅・大まかな徒歩圏（詳細住所ではない）
    preferredContactMethod: string; // 希望する連絡手段
    consultationSupportOffice: string; // 担当の特定相談支援事業所名
    detailedScheduleNote: string; // 具体的な時間割メモ
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
// 3. 事業所側の型定義
// ==============================================================================
export type ProviderCapabilityDisability =
  | '身体障害'
  | '知的障害'
  | '精神障害'
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

export interface DayAvailability {
  day: DayOfWeek;
  available: boolean;
  timeSlots: TimeSlot[];
  note: string;
}

export interface ProviderProfile {
  id: string; // 例: prov_sec_991...
  name: string;
  locationCity: string;
  serviceTypes: ServiceType[];
  introduction: string;
  features: string[];
  contactPersonName: string;
  coverageAreas: string[];
  businessDaysHours: string;
  messageFromProvider: string;
}

export interface ProviderCapabilities {
  providerId: string;
  supportedCareItems: CareNeedItem[];
  supportedDisabilities: ProviderCapabilityDisability[];
  medicalCareRangeText: string;
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
// 3-B. 事業者料金プラン・サブスクリプション・アカウント承認状態
// ==============================================================================
export type SubscriptionPlanId = 'free' | 'standard' | 'pro';

export interface SubscriptionPlanDefinition {
  id: SubscriptionPlanId;
  name: string;
  monthlyPriceYen: number;
  badgeText: string;
  description: string;
  features: string[];
  canSendChatRequest: boolean;
  canManageCases: boolean;
  canReceiveNewAlerts: boolean;
  isAvailableNow: boolean;
}

export type ProviderAccountApprovalStatus =
  | 'approved'
  | 'pending'
  | 'suspended';

export type PaymentMethodType = 'credit_card' | 'bank_transfer';

export type PaymentSetupStatus =
  | 'card_verified'
  | 'bank_active'
  | 'bank_pending_verification';

export interface ProviderPaymentSummary {
  method: PaymentMethodType;
  displayLabel: string;
  billingDayLabel: string;
  status: PaymentSetupStatus;
  updatedAt: string;
}

export interface ProviderSubscription {
  providerId: string;
  planId: SubscriptionPlanId;
  status: 'active' | 'canceled';
  startedAt: string;
  nextRenewalDate: string;
  canceledAt?: string;
  accountApprovalStatus: ProviderAccountApprovalStatus;
  paymentSummary?: ProviderPaymentSummary;
}

// ==============================================================================
// 4. マッチング・メッセージ・チャット開始申請・情報開示
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

export interface ChatMessage {
  id: string;
  userId: string;
  providerId: string;
  senderType: 'user' | 'provider';
  text: string;
  createdAt: string;
  readByRecipient: boolean;
}

export type DisclosureStage = 1 | 2 | 3;

export interface DisclosureConsent {
  userId: string;
  providerId: string;
  stage: DisclosureStage;
  consentedAt?: string;
  revokedAt?: string;
  disclosedFields: {
    nicknameAndRole: boolean;
    nearestStationArea: boolean;
    preferredContactMethod: boolean;
    consultationSupportOffice: boolean;
    detailedScheduleNote: boolean;
    piiContactAccess?: boolean; // 本人特定情報へのアクセス許諾（第3段階でさらに明示同意が必要）
  };
}

// ==============================================================================
// 5. セキュリティ・認証・監査ログ・RBAC (指示書 3, 4, 7, 8)
// ==============================================================================
export type AuthUserRole = 'user' | 'provider' | 'admin';

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
  targetId?: string; // 対象のuserIdまたはproviderId
  ipAddress: string;
  detail: string; // 機微情報を含めない安全な要約
  isSecurityAlert?: boolean;
}

export interface SecurityEventSummary {
  failedLoginAttempts: number;
  suspiciousAccessCount: number;
  piiAccessDeniedCount: number;
  activeRateLimitBlocks: number;
  isAiDataGatingActive: boolean; // AIへの機微データ送信遮断フラグ（指示書6）
}

// ==============================================================================
// 6. マッチングスコア型
// ==============================================================================
export type MatchJudgmentStatus =
  | 'マッチング候補'
  | '要確認'
  | 'マッチング対象外';

export interface ScoreBreakdown {
  serviceScore: number;
  careNeedsScore: number;
  scheduleScore: number;
  areaScore: number;
  disabilityExpScore: number;
  genderScore: number;
  totalScore: number;
}

export interface MatchResult {
  userId: string;
  providerId: string;
  breakdown: ScoreBreakdown;
  judgment: MatchJudgmentStatus;
  criticalWarnings: string[];
  positiveReasons: string[];
  cautionReasons: string[];
  summaryText: string;
}

// ==============================================================================
// 7. 定数・選択肢
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
    shortDesc: '外出時の付き添い・余暇活動や社会参加のための移動をサポート',
    detailHelp:
      '市区町村の地域生活支援事業として行われる外出支援です。買い物・余暇・冠婚葬祭など、社会参加のための外出時にヘルパーが付き添います。',
  },
  {
    value: '居宅介護',
    label: '居宅介護',
    shortDesc: '自宅での入浴・排泄・食事などの身体介助や、調理・掃除などの家事援助',
    detailHelp:
      'ご自宅にホームヘルパーが訪問し、入浴・排泄・食事などの「身体介護」や、調理・洗濯・掃除などの「家事援助」、通院等介助を行います。',
  },
  {
    value: '重度訪問介護',
    label: '重度訪問介護',
    shortDesc: '重度の肢体不自由や行動障害がある方へ、長時間にわたり生活全般から外出まで総合支援',
    detailHelp:
      '常時介護を必要とする方に、自宅での身体介護・家事援助・見守りから外出時の移動中の介護までを、比較的長時間にわたり総合的・継続的に提供します。',
  },
  {
    value: '同行援護',
    label: '同行援護',
    shortDesc: '視覚障害により移動が困難な方へ、外出時の同行・代読・代筆・移動支援',
    detailHelp:
      '視覚障害により移動に著しい困難を有する方に、外出時に同行し、移動に必要な視覚的情報の提供（代読・代筆を含む）や移動の援護、排泄・食事等の介護を行います。',
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
  '視覚障害',
  'その他・複数該当',
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

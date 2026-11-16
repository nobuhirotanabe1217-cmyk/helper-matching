import type { AppView } from '../context/AppStateContext';
import type { HelpGuideItem } from './helpGuides';

/**
 * 読み上げ速度を安全な範囲（0.7倍〜1.8倍）に丸めます。
 */
export function clampSpeechRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1.0;
  return Math.max(0.7, Math.min(1.8, Math.round(rate * 100) / 100));
}

/**
 * 長文を Chrome などの Web Speech API 途中停止バグを避けるため、
 * 句点・改行単位で自然な長さ（デフォルト約160文字以内）に分割します。
 */
export function splitSpeechChunks(text: string, maxChars = 160): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[。！？\n])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = '';

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (buffer) {
        chunks.push(buffer);
        buffer = '';
      }
      // 句読点（、）や空白でさらに分割
      const subParts = sentence.split(/(?<=[、,])/).map((p) => p.trim()).filter(Boolean);
      let subBuf = '';
      for (const part of subParts) {
        if ((subBuf + part).length > maxChars && subBuf) {
          chunks.push(subBuf);
          subBuf = part;
        } else {
          subBuf += part;
        }
      }
      if (subBuf) {
        if (subBuf.length > maxChars) {
          for (let i = 0; i < subBuf.length; i += maxChars) {
            chunks.push(subBuf.slice(i, i + maxChars));
          }
        } else {
          chunks.push(subBuf);
        }
      }
      continue;
    }

    if (buffer && buffer.length + sentence.length > maxChars) {
      chunks.push(buffer);
      buffer = sentence;
    } else {
      buffer = buffer ? `${buffer} ${sentence}` : sentence;
    }
  }

  if (buffer) {
    chunks.push(buffer);
  }

  return chunks;
}

const VIEW_ANNOUNCEMENTS: Record<AppView, string> = {
  top: 'トップ画面（ケアピタ）',
  login: 'ログイン・2段階認証画面',
  register: '新規登録画面',
  'registration-complete': '登録完了画面',
  'user-dashboard': '利用者マイページ',
  'user-wizard': '希望条件の登録・変更画面',
  'user-search': '相性の良い事業所一覧',
  'user-favorites': 'お気に入り登録した事業所一覧',
  'user-provider-detail': '事業所の詳細画面',
  'user-privacy': '個人情報の公開設定画面',
  'provider-dashboard': '事業所マイページ',
  'provider-wizard': '事業所条件・空き枠の編集画面',
  'provider-search': '利用希望者一覧',
  'provider-user-detail': '利用希望者の詳細画面',
  'provider-billing': '料金プラン・決済管理画面',
  'admin-security': '運営管理者コンソール',
  chat: 'チャット・相談画面',
  'google-drive': 'Google ドライブ連携画面',
};

export function getViewTitleForAnnouncement(view: AppView): string {
  return VIEW_ANNOUNCEMENTS[view] || 'ケアピタ';
}

export function buildTopScreenSpeechText(params: {
  userCount: number;
  providerCount: number;
}): string {
  return [
    'ケアピタのトップ画面です。',
    '障害福祉ヘルパーを探す利用者・ご家族と、支援可能な事業所を匿名条件で安全につなぐマッチングサイトです。',
    `現在の登録数は、利用者が${params.userCount}名、事業所が${params.providerCount}社です。`,
    '画面の左側から利用者としての新規登録、右側から事業所としての新規登録を始められます。利用者は完全無料です。',
  ].join(' ');
}

export function buildLoginScreenSpeechText(params: {
  loginTab: 'user' | 'provider';
  isMfaStep: boolean;
  maskedDestination?: string;
  mfaMethod?: 'email' | 'sms';
  accountCount: number;
}): string {
  const roleLabel = params.loginTab === 'provider' ? '事業所' : '利用者';
  if (params.isMfaStep) {
    const channelLabel =
      params.mfaMethod === 'sms' ? 'SMSショートメッセージ' : 'メールアドレス';
    return [
      `${roleLabel}ログインの2段階認証ステップです。`,
      `登録済みの${channelLabel}（${params.maskedDestination || ''}）宛てに送信された6桁の確認コードを入力して、ログインを完了してください。`,
      'コードが届かない場合は、再送信ボタンをご利用いただけます。',
    ].join(' ');
  }

  return [
    `${roleLabel}ログイン画面です。`,
    `登録済みの${roleLabel}アカウントは現在${params.accountCount}件あります。`,
    'メールアドレスとパスワードを入力して「次へ（認証コード送信）」を押すと、メールまたはSMSによる2段階認証へ進みます。',
    'まだ登録がお済みでない場合は、新規登録画面からアカウントを作成できます。',
  ].join(' ');
}

export function buildUserDashboardSpeechText(params: {
  nickname: string;
  city: string;
  services: string[];
  helperGenderPreference: string;
  highMatchCount: number;
  totalProviders: number;
  favoriteCount: number;
  pendingRequestsCount: number;
  approvedChatCount: number;
  disclosedCount: number;
}): string {
  const parts = [
    `利用者マイページです。${params.nickname}さんの希望条件は、${params.city}、サービスは${params.services.join('と')}、ヘルパーの希望は${params.helperGenderPreference}です。`,
    `お気に入りは${params.favoriteCount}社、承認待ちの相談申請は${params.pendingRequestsCount}件、チャット相談中は${params.approvedChatCount}件、第3段階の詳細開示は${params.disclosedCount}社です。`,
  ];

  if (params.totalProviders === 0) {
    parts.push('現在、事業所はまだ登録されていません。事業所を新規登録すると相性スコアが計算されます。');
  } else {
    parts.push(
      `登録されている事業所は${params.totalProviders}社あり、そのうち相性80パーセント以上の好適な事業所が${params.highMatchCount}社あります。`
    );
  }

  return parts.join(' ');
}

export function buildProviderCardSpeechText(params: {
  name: string;
  score: number;
  judgment: string;
  locationCity: string;
  coverageAreas: string[];
  services: string[];
  acceptanceStatus: string;
  availableDays: string[];
  isFavorite?: boolean;
  favoriteNote?: string;
  summaryText?: string;
}): string {
  const parts = [
    `事業所名、${params.name}。`,
    `相性スコアは${params.score}パーセント、判定は${params.judgment}です。`,
    `所在地は${params.locationCity}、対応エリアは${params.coverageAreas.join('、')}。`,
    `提供サービスは${params.services.join('、')}。`,
    `現在の受け入れ状況は、${params.acceptanceStatus}。`,
    params.availableDays.length > 0
      ? `対応可能な曜日は${params.availableDays.join('、')}曜日です。`
      : '対応可能な曜日の登録はまだありません。',
  ];

  if (params.isFavorite) {
    parts.push('お気に入り登録済みです。');
    if (params.favoriteNote?.trim()) {
      parts.push(`個人メモ：${params.favoriteNote.trim()}。`);
    }
  }

  if (params.summaryText?.trim()) {
    parts.push(`ポイント：${params.summaryText.trim()}`);
  }

  return parts.join(' ');
}

export function buildUserSearchSpeechText(params: {
  favoritesOnly: boolean;
  nickname: string;
  city: string;
  resultCount: number;
  topProvider?: {
    name: string;
    score: number;
    judgment: string;
  };
}): string {
  const header = params.favoritesOnly
    ? `お気に入り登録した事業所の一覧です。${params.nickname}さんのお気に入りは${params.resultCount}社あります。`
    : `相性の良い事業所の検索結果一覧です。${params.nickname}さん（${params.city}）の条件に該当する事業所が${params.resultCount}社見つかりました。`;

  if (params.resultCount === 0) {
    return `${header} 条件を変えるか、新しく事業所を登録してお試しください。`;
  }

  if (params.topProvider) {
    return `${header} 最も相性が高い候補は、${params.topProvider.name}で、相性${params.topProvider.score}パーセント（${params.topProvider.judgment}）です。`;
  }

  return header;
}

export function buildProviderDetailSpeechText(params: {
  name: string;
  locationCity: string;
  acceptanceStatus: string;
  services: string[];
  score: number;
  judgment: string;
  introduction: string;
  messageFromProvider: string;
  availableDays: string[];
  disclosureStage: number;
  isFavorite: boolean;
}): string {
  return [
    `事業所「${params.name}」の詳細画面です。`,
    `相性スコアは${params.score}パーセント、判定は${params.judgment}です。`,
    `所在地域は${params.locationCity}、受け入れ状況は${params.acceptanceStatus}、対応サービスは${params.services.join('、')}です。`,
    params.availableDays.length > 0
      ? `空き曜日は${params.availableDays.join('、')}曜日です。`
      : '',
    params.isFavorite ? '現在お気に入りに保存されています。' : '',
    `事業所からのメッセージ：${params.messageFromProvider}`,
    `紹介文：${params.introduction}`,
    `現在の個人情報開示段階は第${params.disclosureStage}段階です。`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildUserPrivacySpeechText(params: {
  nickname: string;
  providerCount: number;
  stage3Count: number;
}): string {
  return [
    '登録内容の公開設定、個人情報の段階的開示の管理画面です。',
    `${params.nickname}さんの氏名や連絡先は、初期状態ではどの事業所にも公開されません。`,
    `現在登録されている${params.providerCount}社のうち、第3段階の詳細相談情報まで開示を許可しているのは${params.stage3Count}社です。`,
    '画面内の各事業所ボタンから、いつでも詳細情報の開示や取り消しができます。',
  ].join(' ');
}

export function buildProviderDashboardSpeechText(params: {
  providerName: string;
  planName: string;
  acceptanceStatus: string;
  candidateCount: number;
  waitingReplyCount: number;
  activeCaseCount: number;
  completedStepsCount: number;
}): string {
  return [
    `事業所マイページです。事業所名は${params.providerName}、現在の契約プランは${params.planName}、受け入れ状況は${params.acceptanceStatus}です。`,
    `導入3ステップの完了数は3件中${params.completedStepsCount}件です。`,
    `利用希望者は${params.candidateCount}名、承認待ちが${params.waitingReplyCount}件、チャット対応中が${params.activeCaseCount}件あります。`,
  ].join(' ');
}

export function buildProviderSearchSpeechText(params: {
  providerName: string;
  planName: string;
  resultCount: number;
  topUser?: {
    anonymousCode: string;
    city: string;
    score: number;
  };
}): string {
  const base = `利用希望者の検索画面です。${params.providerName}（${params.planName}）の条件に該当する匿名利用希望者は${params.resultCount}名います。`;
  if (params.topUser) {
    return `${base} 最も一致度が高い候補は${params.topUser.anonymousCode}（${params.topUser.city}）、マッチング度${params.topUser.score}パーセントです。`;
  }
  return base;
}

export function buildUserDetailForProviderSpeechText(params: {
  anonymousCode: string;
  city: string;
  desiredServices: string[];
  careNeeds: string[];
  preferredDays: string[];
  score: number;
  judgment: string;
  disclosureStage: number;
}): string {
  return [
    `利用希望者 ${params.anonymousCode} の詳細画面です。`,
    `マッチング度は${params.score}パーセント（${params.judgment}）。希望地域は${params.city}、希望サービスは${params.desiredServices.join('、')}です。`,
    `必要な介助は${params.careNeeds.join('、')}。希望曜日は${params.preferredDays.join('、')}曜日です。`,
    `現在の情報開示レベルは第${params.disclosureStage}段階です。`,
  ].join(' ');
}

export function buildProviderBillingSpeechText(params: {
  providerName: string;
  planName: string;
  monthlyPriceYen: number;
  paymentSummaryLabel?: string;
}): string {
  return [
    `プラン契約・決済管理画面です。対象事業所は${params.providerName}、現在の契約は${params.planName}、月額${params.monthlyPriceYen.toLocaleString()}円です。`,
    params.paymentSummaryLabel
      ? `登録済みのお支払い方法は、${params.paymentSummaryLabel}です。`
      : 'お支払い方法はクレジットカードまたは銀行口座振替から選択できます。',
    '登録、検索掲載、利用者から届いた相談への返信は無料のままご利用いただけます。',
  ].join(' ');
}

export function buildChatSpeechText(params: {
  isUserMode: boolean;
  partnerTitle: string;
  disclosureStage: number;
  messages: Array<{
    senderType: 'user' | 'provider';
    text: string;
    createdAt: string;
  }>;
}): string {
  const opener = `${params.partnerTitle}とのチャット画面です。現在の情報開示段階は第${params.disclosureStage}段階です。`;
  if (params.messages.length === 0) {
    return `${opener} まだメッセージはありません。画面下の定型文ボタンまたは入力欄から送信できます。`;
  }

  const recent = params.messages.slice(-5);
  const spokenMessages = recent
    .map((m) => {
      const isMine =
        (params.isUserMode && m.senderType === 'user') ||
        (!params.isUserMode && m.senderType === 'provider');
      const speaker = isMine ? 'あなたの送信' : `${params.partnerTitle}からの受信`;
      return `${speaker}、${m.createdAt}。${m.text}`;
    })
    .join(' ');

  return `${opener} 最新のメッセージ${recent.length}件を読み上げます。 ${spokenMessages}`;
}

export function buildSingleChatMessageSpeechText(params: {
  isMine: boolean;
  partnerTitle: string;
  text: string;
  createdAt: string;
}): string {
  const who = params.isMine ? 'あなたのメッセージ' : `${params.partnerTitle}からのメッセージ`;
  return `${who}、${params.createdAt}。${params.text}`;
}

export function buildHelpGuideSpeechText(guide: HelpGuideItem): string {
  const stepsText = guide.steps
    .map((s, idx) => `ステップ${idx + 1}、${s.heading}。${s.detail}`)
    .join(' ');
  return [
    `「${guide.title}」の使い方をご案内します。`,
    guide.summary,
    stepsText,
    guide.tip ? `補足ポイント。${guide.tip}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

import {
  AuditActionType,
  AuditLogEntry,
  AuthSession,
  AuthUserRole,
  DisclosureConsent,
  UserPII,
} from '../types/domain';

export interface RateLimitState {
  attempts: number;
  lastAttemptTime: number;
  isBlocked: boolean;
  blockedUntil?: number;
}

export interface SecurityContextState {
  currentSession: AuthSession;
  auditLogs: AuditLogEntry[];
  rateLimitMap: Record<string, RateLimitState>;
}

/**
 * サーバー側・エッジ側でのアクセス検証ロジックを模した純粋なセキュリティガード
 */
export class SecurityController {
  private static MAX_FAILED_ATTEMPTS = 5;
  private static BLOCK_DURATION_MS = 60 * 1000; // 1分ロック

  /**
   * 1. ログイン試行制限（Rate Limiting & Account Lockout）
   */
  public static checkLoginRateLimit(
    ipOrEmail: string,
    state: Record<string, RateLimitState>
  ): { allowed: boolean; remainingSeconds?: number } {
    const entry = state[ipOrEmail];
    if (!entry) return { allowed: true };

    const now = Date.now();
    if (entry.isBlocked && entry.blockedUntil && entry.blockedUntil > now) {
      const remainingSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
      return { allowed: false, remainingSeconds };
    }

    return { allowed: true };
  }

  public static recordFailedAttempt(
    ipOrEmail: string,
    state: Record<string, RateLimitState>
  ): { newState: Record<string, RateLimitState>; isNowBlocked: boolean } {
    const now = Date.now();
    const current = state[ipOrEmail] || {
      attempts: 0,
      lastAttemptTime: now,
      isBlocked: false,
    };
    const attempts = current.attempts + 1;
    const isNowBlocked = attempts >= this.MAX_FAILED_ATTEMPTS;

    const updated: RateLimitState = {
      attempts,
      lastAttemptTime: now,
      isBlocked: isNowBlocked,
      blockedUntil: isNowBlocked ? now + this.BLOCK_DURATION_MS : undefined,
    };

    return {
      newState: { ...state, [ipOrEmail]: updated },
      isNowBlocked,
    };
  }

  public static resetRateLimit(
    ipOrEmail: string,
    state: Record<string, RateLimitState>
  ): Record<string, RateLimitState> {
    const next = { ...state };
    delete next[ipOrEmail];
    return next;
  }

  /**
   * 2. PII (本人特定情報) へのアクセス認可チェック (RBAC & 同意検証)
   * - 利用者自身: 許可
   * - 事業所: 第3段階の同意 かつ piiContactAccess が真である場合のみ許可
   * - 運営管理者: デフォルトでは機微情報・PIIへの無制限閲覧は拒否 (原則最小特権)
   */
  public static verifyPiiAccess(params: {
    actorId: string;
    actorRole: AuthUserRole;
    targetUserId: string;
    disclosure?: DisclosureConsent;
  }): { allowed: boolean; reason: string } {
    const { actorId, actorRole, targetUserId, disclosure } = params;

    // 利用者本人による自己情報アクセス
    if (actorId === targetUserId && actorRole === 'user') {
      return { allowed: true, reason: '本人によるアクセス認可' };
    }

    // 事業所によるアクセス検証
    if (actorRole === 'provider') {
      if (!disclosure) {
        return {
          allowed: false,
          reason: '情報開示の同意レコードが存在しません（未開示）',
        };
      }
      if (disclosure.stage !== 3) {
        return {
          allowed: false,
          reason: `現在は第${disclosure.stage}段階（匿名状態）のため、本人特定情報へのアクセスは拒否されました`,
        };
      }
      if (!disclosure.disclosedFields.piiContactAccess) {
        return {
          allowed: false,
          reason: '第3段階ですが、本人特定情報（氏名・詳細住所）の直接開示項目は未許諾です',
        };
      }
      return {
        allowed: true,
        reason: '利用者本人の第3段階明示同意に基づき、事業所への開示を許可しました',
      };
    }

    // 運営管理者
    if (actorRole === 'admin') {
      return {
        allowed: false,
        reason: '【最小特権原則】運営管理者であっても個人の機微な本人特定情報の無制限閲覧は制限されています（監査ログのみ閲覧可）',
      };
    }

    return { allowed: false, reason: '認可されていない役割からのアクセスです' };
  }

  /**
   * 3. 監査ログ生成（機微情報・パスワード等の漏洩を防止した安全な記録）
   */
  public static createAuditLog(params: {
    actorId: string;
    actorRole: AuthUserRole;
    action: AuditActionType;
    targetId?: string;
    detail: string;
    ipAddress?: string;
    isSecurityAlert?: boolean;
  }): AuditLogEntry {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    return {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: timeStr,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      targetId: params.targetId,
      ipAddress: params.ipAddress || '192.168.1.10 (LocalDev)',
      detail: params.detail,
      isSecurityAlert: params.isSecurityAlert || false,
    };
  }

  /**
   * 4. AI送信データのサニタイズ遮断（指示書 6. AI機能の利用制限）
   * 障害情報や本人特定情報がAIに誤送信されないよう検証・ブロック
   */
  public static validateAiTransmission(data: unknown): {
    canSend: boolean;
    reason: string;
  } {
    // 今回の試作品では一切のAI送信を禁止
    return {
      canSend: false,
      reason: '【安全保護規定】利用者の障害情報・生活状況・支援ニーズは生成AI等の外部サービスへ一切送信されません。マッチングはローカルの決定論的ルールで照合されます。',
    };
  }
}

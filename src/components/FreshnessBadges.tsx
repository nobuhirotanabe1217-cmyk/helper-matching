import React from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  PauseCircle,
  Sparkles,
} from 'lucide-react';
import {
  ProviderDiscrepancySummary,
  ProviderFreshnessInfo,
  ProviderInterviewTrustInfo,
  UserFreshnessInfo,
} from '../utils/freshness';

export const ProviderFreshnessBadge: React.FC<{
  info: ProviderFreshnessInfo;
  compact?: boolean;
}> = ({ info, compact = false }) => {
  if (info.tier === 'paused') {
    return (
      <span
        data-testid="provider-freshness-badge"
        data-tier="paused"
        className={`inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 font-extrabold ${
          compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <PauseCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
        <span>{info.badgeText}</span>
      </span>
    );
  }

  if (info.tier === 'warning') {
    return (
      <span
        data-testid="provider-freshness-badge"
        data-tier="warning"
        className={`inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-extrabold ${
          compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>{info.badgeText}</span>
      </span>
    );
  }

  return (
    <span
      data-testid="provider-freshness-badge"
      data-tier="fresh"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 font-extrabold ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
      <span>{info.badgeText}</span>
    </span>
  );
};

export const ProviderReportWarningBadge: React.FC<{
  summary: ProviderDiscrepancySummary;
}> = ({ summary }) => {
  if (!summary.isUnderReview || !summary.label) return null;
  return (
    <span
      data-testid="provider-report-warning-badge"
      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-900"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
      <span>{summary.label}</span>
    </span>
  );
};

export const ProviderInterviewTrustBadge: React.FC<{
  info: ProviderInterviewTrustInfo;
}> = ({ info }) => {
  if (!info.hasRecord || !info.badgeText) return null;
  return (
    <span
      data-testid="provider-interview-trust-badge"
      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-900"
    >
      <CalendarCheck className="w-3.5 h-3.5 text-sky-700 shrink-0" />
      <span>{info.badgeText}</span>
    </span>
  );
};

export const UserRecruitmentStatusBadge: React.FC<{
  info: UserFreshnessInfo;
  showAutoReason?: boolean;
}> = ({ info, showAutoReason = true }) => {
  if (info.effectiveStatus === '休止中') {
    return (
      <span
        data-testid="user-recruitment-status-badge"
        data-status="休止中"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-700"
      >
        <PauseCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        <span>
          休止中
          {showAutoReason && info.isAutoPaused
            ? '（90日未確認のため自動切替）'
            : ''}
        </span>
      </span>
    );
  }

  return (
    <span
      data-testid="user-recruitment-status-badge"
      data-status="募集中"
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-900"
    >
      <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
      <span>募集中</span>
    </span>
  );
};

export const UserConfirmedDateBadge: React.FC<{
  info: UserFreshnessInfo;
}> = ({ info }) => {
  return (
    <span
      data-testid="user-confirmed-date-badge"
      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900"
    >
      <CalendarCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
      <span>{info.confirmedLabel}</span>
    </span>
  );
};

import React from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { FullProviderBundle } from '../utils/matching';
import {
  DAYS_OF_WEEK,
  PROVIDER_CARE_LABELS,
  SupportDetailPolicy,
} from '../types/domain';
import { formatJapaneseDate } from '../utils/date';
import { getProviderFreshnessInfo } from '../utils/freshness';
import { ProviderFreshnessBadge } from './FreshnessBadges';

function policyStyle(policy: SupportDetailPolicy): {
  label: SupportDetailPolicy;
  className: string;
} {
  if (policy === '対応可能') {
    return {
      label: policy,
      className: 'bg-emerald-50 text-emerald-950 border-emerald-200',
    };
  }
  if (policy === '条件付きで相談可') {
    return {
      label: policy,
      className: 'bg-amber-50 text-amber-950 border-amber-200',
    };
  }
  return {
    label: policy,
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  };
}

export interface AcceptanceCardViewProps {
  bundle: FullProviderBundle;
  matchingPoints?: string[];
  isPaidHighlighted?: boolean;
  compact?: boolean;
  hideHeaderMeta?: boolean;
  referenceDate?: Date;
}

export const AcceptanceCardView: React.FC<AcceptanceCardViewProps> = ({
  bundle,
  matchingPoints = [],
  isPaidHighlighted = false,
  compact = false,
  hideHeaderMeta = false,
  referenceDate,
}) => {
  const { profile, capabilities, availability } = bundle;
  const updatedAt = profile.updatedAt || availability.updatedAt;
  const freshness = getProviderFreshnessInfo(updatedAt, referenceDate);
  const hasDesignatedNumber = /^\d{10}$/.test(
    (profile.designatedNumber || '').replace(/[-\s]/g, '')
  );

  const openDays = availability.weeklySchedule.filter((d) => d.available);
  const uniqueSlots = Array.from(
    new Set(openDays.flatMap((d) => d.timeSlots))
  );

  const behaviorBadge = policyStyle(capabilities.supportsBehavioralDisorder);
  const medicalBadge = policyStyle(capabilities.supportsMedicalCare);
  const epilepsyBadge = policyStyle(capabilities.supportsEpilepsyResponse);

  return (
    <div
      data-testid={`acceptance-card-${profile.id}`}
      className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${
        isPaidHighlighted
          ? 'bg-indigo-50/25 border-indigo-300'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* メタ情報行：指定事業所番号登録済み ／ 最終更新日 ／ 30日経過注意 */}
      {!hideHeaderMeta && (
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            {hasDesignatedNumber ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-950 text-xs font-bold tabular-nums">
                <BadgeCheck className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                <span>指定事業所番号登録済み（{profile.designatedNumber}）</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                指定事業所番号 未確認
              </span>
            )}

            {isPaidHighlighted && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-950 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-700 shrink-0" aria-hidden="true" />
                <span>受入条件強調（※適合度スコア不変）</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <ProviderFreshnessBadge info={freshness} />
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-bold tabular-nums">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
              <span>最終更新日：{formatJapaneseDate(updatedAt)}</span>
            </span>
          </div>
        </div>
      )}

      {/* ひとことアピール */}
      {profile.appealMessage && (
        <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 flex items-start gap-2.5">
          <MessageSquare
            className="w-4 h-4 text-teal-800 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-teal-800 block">
              事業所からのひとことアピール（受入可能条件）
            </span>
            <p className="text-sm font-bold text-teal-950 leading-snug">
              「{profile.appealMessage}」
            </p>
          </div>
        </div>
      )}

      {/* あなたの希望と合っている点 */}
      {matchingPoints.length > 0 && (
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
          <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>あなたの希望と合っている点</span>
          </p>
          <ul className="space-y-1">
            {matchingPoints.map((pt, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-emerald-950 font-medium flex items-start gap-2"
              >
                <span className="text-emerald-700 font-bold shrink-0">✓</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 受入可能条件カード 7項目グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
        {/* 1. 対応サービス */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <p className="text-xs font-bold text-slate-600">
            1. 対応サービス（{availability.acceptanceStatus}）
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.serviceTypes.map((srv) => (
              <span
                key={srv}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-900 font-bold text-xs"
              >
                {srv}
              </span>
            ))}
          </div>
        </div>

        {/* 2. ヘルパーの性別 & 対応エリア */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>2. ヘルパーの性別・対応エリア</span>
          </p>
          <p className="font-bold text-slate-900">
            {capabilities.helperGenderPolicy}
            <span className="text-xs font-medium text-slate-600 ml-1.5">
              （在籍：{capabilities.availableHelperGenders.join('・') || '要相談'}）
            </span>
          </p>
          <p className="text-xs text-slate-600">
            対応地域：{profile.coverageAreas.join('・')}
          </p>
        </div>

        {/* 3. 対応できる介助内容 */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>3. 対応できる介助内容</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {(compact
              ? capabilities.supportedCareItems.slice(0, 6)
              : capabilities.supportedCareItems
            ).map((item) => (
              <span
                key={item}
                className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 text-xs font-medium"
              >
                {PROVIDER_CARE_LABELS[item] || item}
              </span>
            ))}
            {compact && capabilities.supportedCareItems.length > 6 && (
              <span className="px-2 py-0.5 text-xs font-bold text-slate-500 tabular-nums">
                ほか+{capabilities.supportedCareItems.length - 6}項目
              </span>
            )}
          </div>
        </div>

        {/* 4. 対応できる障害特性 */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <p className="text-xs font-bold text-slate-600">
            4. 対応できる障害特性
          </p>
          <div className="flex flex-wrap gap-1">
            {capabilities.supportedDisabilities.map((d) => (
              <span
                key={d}
                className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 text-xs font-medium"
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* 5. 対応できる曜日・時間帯 */}
        <div className="md:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>5. 対応できる曜日・時間帯</span>
            </p>
            <span className="text-xs font-medium text-slate-600">
              {profile.businessDaysHours}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS_OF_WEEK.map((day) => {
              const entry = availability.weeklySchedule.find((d) => d.day === day);
              const isOpen = Boolean(entry?.available);
              return (
                <div
                  key={day}
                  className={`p-1.5 rounded-lg border text-center ${
                    isOpen
                      ? 'bg-teal-50 border-teal-200 text-teal-950'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="block text-xs font-bold">{day}</span>
                  <span className="block text-[10px] font-bold">
                    {isOpen ? '受入可' : '休'}
                  </span>
                </div>
              );
            })}
          </div>
          {uniqueSlots.length > 0 && (
            <p className="text-xs text-slate-700">
              対応時間帯：
              <span className="font-bold">{uniqueSlots.join(' ／ ')}</span>
            </p>
          )}
        </div>

        {/* 6. 支援の細目（行動障害・医療的ケア・てんかん・コミュニケーション・送迎） */}
        {!compact && (
          <div className="md:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-700" aria-hidden="true" />
              <span>6. 支援の細目（専門配慮・医療的ケア・送迎・コミュニケーション）</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  行動障害への対応
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded border font-bold ${behaviorBadge.className}`}
                >
                  {behaviorBadge.label}
                </span>
                {capabilities.behavioralDisorderNote && (
                  <p className="text-slate-600 leading-snug pt-0.5">
                    {capabilities.behavioralDisorderNote}
                  </p>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  医療的ケアへの対応
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded border font-bold ${medicalBadge.className}`}
                >
                  {medicalBadge.label}
                </span>
                {capabilities.medicalCareRangeText && (
                  <p className="text-slate-600 leading-snug pt-0.5">
                    {capabilities.medicalCareRangeText}
                  </p>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-slate-400" aria-hidden="true" />
                  てんかん発作時の対応
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded border font-bold ${epilepsyBadge.className}`}
                >
                  {epilepsyBadge.label}
                </span>
                {capabilities.epilepsyResponseNote && (
                  <p className="text-slate-600 leading-snug pt-0.5">
                    {capabilities.epilepsyResponseNote}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  対応可能なコミュニケーション手段
                </span>
                <p className="font-medium text-slate-800">
                  {capabilities.supportedCommunicationMethods.length > 0
                    ? capabilities.supportedCommunicationMethods.join('／')
                    : '相談時に確認'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  送迎・車いす／2人介助
                </span>
                <p className="font-bold text-slate-900">
                  送迎：
                  {capabilities.supportsTransport
                    ? `対応可（${capabilities.transportRangeText || '範囲相談'}）`
                    : '送迎なし'}
                </p>
                <p className="text-slate-600">
                  車いす移乗：{capabilities.supportsWheelchairTransfer ? '可' : '要確認'} ／ 2人介助：
                  {capabilities.supportsTwoPersonCare ? '可' : '要相談'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

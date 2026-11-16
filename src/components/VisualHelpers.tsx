import React from 'react';
import {
  Utensils,
  Bath,
  Shirt,
  Accessibility,
  Footprints,
  MapPin,
  Stethoscope,
  ShoppingBag,
  Home,
  ChefHat,
  Sparkles,
  HeartHandshake,
  Eye,
  Clock,
  Sun,
  Sunset,
  Moon,
  Sunrise,
  ShieldCheck,
  MessageCircle,
  Lock,
  Unlock,
  Check,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Activity,
  Bookmark,
} from 'lucide-react';
import { CareNeedItem, DayOfWeek, DAYS_OF_WEEK, ServiceType, TimeSlot } from '../types/domain';
import { HelpTooltip } from './HelpTooltip';

// ==============================================================================
// 1. ヒーロー＆4大サービスの温かみのあるSVGイラスト
// ==============================================================================

export const HeroWelfareIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-[260px] h-auto',
}) => (
  <svg
    viewBox="0 0 280 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* 構造的な背景グリッド＆サーフェス */}
    <rect x="8" y="10" width="264" height="160" rx="18" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.2" />
    <path d="M32 50H248M32 90H248M32 130H248" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 4" />

    {/* 左カード：利用者条件ノード */}
    <rect x="26" y="42" width="84" height="96" rx="14" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.4" />
    <rect x="38" y="54" width="28" height="28" rx="8" fill="#CCFBF1" />
    <circle cx="52" cy="64" r="4.5" stroke="#0F766E" strokeWidth="1.7" />
    <path d="M44.5 76C45.8 72.5 58.2 72.5 59.5 76" stroke="#0F766E" strokeWidth="1.7" strokeLinecap="round" />
    <rect x="38" y="92" width="58" height="6" rx="3" fill="#0F766E" fillOpacity="0.85" />
    <rect x="38" y="104" width="44" height="5" rx="2.5" fill="#94A3B8" fillOpacity="0.45" />
    <rect x="38" y="115" width="52" height="5" rx="2.5" fill="#94A3B8" fillOpacity="0.3" />

    {/* 右カード：事業所受入ノード */}
    <rect x="170" y="42" width="84" height="96" rx="14" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.4" />
    <rect x="182" y="54" width="28" height="28" rx="8" fill="#E0E7FF" />
    <path
      d="M188 76V64L196 58L204 64V76H188Z"
      stroke="#3730A3"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M194 76V70H198V76" stroke="#3730A3" strokeWidth="1.7" strokeLinejoin="round" />
    <rect x="182" y="92" width="58" height="6" rx="3" fill="#3730A3" fillOpacity="0.85" />
    <rect x="182" y="104" width="48" height="5" rx="2.5" fill="#94A3B8" fillOpacity="0.45" />
    <rect x="182" y="115" width="38" height="5" rx="2.5" fill="#94A3B8" fillOpacity="0.3" />

    {/* 中央の接続ブリッジ＆認証シールド */}
    <path d="M110 90H170" stroke="#0F766E" strokeWidth="1.8" strokeDasharray="4 3" />
    <circle cx="140" cy="90" r="19" fill="#0F766E" stroke="#FFFFFF" strokeWidth="3" />
    <path
      d="M133.5 90L138 94.5L147 85.5"
      stroke="#FFFFFF"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export type NotificationStatusType = 'new' | 'pending' | 'completed';

export const StatusNewIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect width="28" height="28" rx="8" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1" />
    <path
      d="M14 7C11.24 7 9 9.24 9 12V15.5L7.5 17.2C7.2 17.55 7.45 18.1 7.92 18.1H20.08C20.55 18.1 20.8 17.55 20.5 17.2L19 15.5V12C19 9.24 16.76 7 14 7Z"
      stroke="#0369A1"
      strokeWidth="1.65"
      strokeLinejoin="round"
    />
    <path
      d="M12.2 19.8C12.55 20.6 13.22 21.1 14 21.1C14.78 21.1 15.45 20.6 15.8 19.8"
      stroke="#0369A1"
      strokeWidth="1.65"
      strokeLinecap="round"
    />
    <circle cx="20.5" cy="7.5" r="2.5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.2" />
  </svg>
);

export const StatusPendingIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect width="28" height="28" rx="8" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
    <circle
      cx="14"
      cy="14"
      r="7"
      stroke="#B45309"
      strokeWidth="1.65"
    />
    <path
      d="M14 10.2V14.2L16.6 15.8"
      stroke="#B45309"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StatusCompletedIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect width="28" height="28" rx="8" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
    <path
      d="M14 6.5L19.8 8.9V13.8C19.8 17.5 17.3 20.6 14 21.8C10.7 20.6 8.2 17.5 8.2 13.8V8.9L14 6.5Z"
      stroke="#047857"
      strokeWidth="1.65"
      strokeLinejoin="round"
    />
    <path
      d="M11.3 14.1L13.1 15.9L16.9 12.1"
      stroke="#047857"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const NotificationStatusBadge: React.FC<{
  status: NotificationStatusType;
  customLabel?: string;
  subLabel?: string;
  size?: 'sm' | 'md';
}> = ({ status, customLabel, subLabel, size = 'md' }) => {
  const paddingClass =
    size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (status === 'new') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-sky-50 text-sky-900 border border-sky-200 whitespace-nowrap ${paddingClass}`}
      >
        <span>{customLabel || '新着'}</span>
        {subLabel && (
          <span className="text-sky-700 font-semibold border-l border-sky-200 pl-1.5">
            {subLabel}
          </span>
        )}
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-amber-50 text-amber-950 border border-amber-200 whitespace-nowrap ${paddingClass}`}
      >
        <span>{customLabel || '承認待ち'}</span>
        {subLabel && (
          <span className="text-amber-800 font-semibold border-l border-amber-200 pl-1.5">
            {subLabel}
          </span>
        )}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-emerald-50 text-emerald-950 border border-emerald-200 whitespace-nowrap ${paddingClass}`}
    >
      <span>{customLabel || '完了'}</span>
      {subLabel && (
        <span className="text-emerald-800 font-semibold border-l border-emerald-200 pl-1.5">
          {subLabel}
        </span>
      )}
    </span>
  );
};

export const NotificationStatusIcon: React.FC<{
  status: NotificationStatusType;
  className?: string;
}> = ({ status, className = 'w-10 h-10 shrink-0' }) => {
  if (status === 'new') return <StatusNewIcon className={className} />;
  if (status === 'pending') return <StatusPendingIcon className={className} />;
  return <StatusCompletedIcon className={className} />;
};

export const StepProfileIcon: React.FC<{ className?: string }> = ({
  className = 'w-10 h-10 shrink-0',
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="0.5" y="0.5" width="39" height="39" rx="10" fill="#F0FDFA" stroke="#99F6E4" />
    <rect x="11" y="9.5" width="18" height="21" rx="3.5" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.65" />
    <circle cx="20" cy="16.2" r="2.8" stroke="#0F766E" strokeWidth="1.5" />
    <path d="M15.5 23.2C16.5 20.8 23.5 20.8 24.5 23.2" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="15" y1="26.5" x2="25" y2="26.5" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const StepScheduleIcon: React.FC<{ className?: string }> = ({
  className = 'w-10 h-10 shrink-0',
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="0.5" y="0.5" width="39" height="39" rx="10" fill="#ECFDF5" stroke="#A7F3D0" />
    <rect x="9.5" y="11.5" width="21" height="18.5" rx="3.5" fill="#FFFFFF" stroke="#047857" strokeWidth="1.65" />
    <path d="M9.5 17H30.5" stroke="#047857" strokeWidth="1.5" />
    <line x1="15" y1="9" x2="15" y2="13" stroke="#047857" strokeWidth="1.75" strokeLinecap="round" />
    <line x1="25" y1="9" x2="25" y2="13" stroke="#047857" strokeWidth="1.75" strokeLinecap="round" />
    <path
      d="M16 23L18.6 25.5L24.2 20"
      stroke="#047857"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StepMatchingIcon: React.FC<{ className?: string }> = ({
  className = 'w-10 h-10 shrink-0',
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="0.5" y="0.5" width="39" height="39" rx="10" fill="#EEF2FF" stroke="#C7D2FE" />
    <circle cx="15.5" cy="16.5" r="3.2" fill="#FFFFFF" stroke="#3730A3" strokeWidth="1.6" />
    <path d="M10.5 26.5C11.4 23 19.6 23 20.5 26.5" stroke="#3730A3" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="24.8" cy="17.2" r="2.8" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.6" />
    <path d="M20.8 26.5C21.6 23.6 28.4 23.6 29.2 26.5" stroke="#0F766E" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const ServiceIllustration: React.FC<{
  service: ServiceType;
  className?: string;
}> = ({ service, className = 'w-12 h-12 shrink-0' }) => {
  if (service === '移動支援') {
    return (
      <div
        className={`${className} rounded-xl bg-sky-50/80 border border-sky-200 flex items-center justify-center`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6">
          <circle cx="11" cy="25" r="3" stroke="#0369A1" strokeWidth="1.7" />
          <circle cx="25" cy="11" r="3" stroke="#0369A1" strokeWidth="1.7" />
          <path
            d="M14 25H19.5C21.4 25 23 23.4 23 21.5V19.5C23 17.6 21.4 16 19.5 16H16.5C14.6 16 13 14.4 13 12.5C13 11.7 13.7 11 14.5 11H22"
            stroke="#0369A1"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }
  if (service === '居宅介護') {
    return (
      <div
        className={`${className} rounded-xl bg-teal-50/80 border border-teal-200 flex items-center justify-center`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6">
          <path
            d="M7 17L18 8L29 17V27C29 27.8 28.3 28.5 27.5 28.5H8.5C7.7 28.5 7 27.8 7 27V17Z"
            fill="#FFFFFF"
            stroke="#0F766E"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M18 15.5V22.5M14.5 19H21.5"
            stroke="#0F766E"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }
  if (service === '重度訪問介護') {
    return (
      <div
        className={`${className} rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-center`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6">
          <path
            d="M18 6.5L27.5 10.5V17.8C27.5 23.6 23.4 28.4 18 30C12.6 28.4 8.5 23.6 8.5 17.8V10.5L18 6.5Z"
            fill="#FFFFFF"
            stroke="#047857"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M13.5 18.2L16.5 21.2L22.8 14.9"
            stroke="#047857"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  return (
    <div
      className={`${className} rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-center`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6">
        <circle cx="18" cy="18" r="10.5" fill="#FFFFFF" stroke="#B45309" strokeWidth="1.7" />
        <path
          d="M21.8 14.2L19.6 19.6L14.2 21.8L16.4 16.4L21.8 14.2Z"
          fill="#FEF3C7"
          stroke="#B45309"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// ==============================================================================
// 2. 介助項目（CareNeedItem）ごとのアイコンと短縮ラベル
// ==============================================================================

export function getCareNeedVisual(item: CareNeedItem): {
  icon: React.FC<{ className?: string }>;
  shortLabel: string;
  category: '身体' | '移動・外出' | '家事';
} {
  switch (item) {
    case '食事の介助':
      return { icon: Utensils, shortLabel: '食事介助', category: '身体' };
    case '排泄の介助':
      return { icon: ShieldCheck, shortLabel: '排泄介助', category: '身体' };
    case '入浴の介助':
      return { icon: Bath, shortLabel: '入浴介助', category: '身体' };
    case '着替えの介助':
      return { icon: Shirt, shortLabel: '着替え', category: '身体' };
    case '移乗の介助':
      return { icon: HeartHandshake, shortLabel: '移乗介助', category: '身体' };
    case '車いすの操作・介助':
      return { icon: Accessibility, shortLabel: '車いす', category: '移動・外出' };
    case '歩行の見守り・介助':
      return { icon: Footprints, shortLabel: '歩行介助', category: '移動・外出' };
    case '外出時の付き添い':
      return { icon: MapPin, shortLabel: '外出付添', category: '移動・外出' };
    case '通院時の付き添い':
      return { icon: Stethoscope, shortLabel: '通院付添', category: '移動・外出' };
    case '買い物の付き添い':
      return { icon: ShoppingBag, shortLabel: '買い物', category: '移動・外出' };
    case '家事援助':
      return { icon: Home, shortLabel: '家事全般', category: '家事' };
    case '調理':
      return { icon: ChefHat, shortLabel: '調理', category: '家事' };
    case '掃除':
      return { icon: Sparkles, shortLabel: '掃除', category: '家事' };
    case '洗濯':
      return { icon: Shirt, shortLabel: '洗濯', category: '家事' };
    default:
      return { icon: HeartHandshake, shortLabel: item, category: '身体' };
  }
}

export function getTimeSlotVisual(slot: TimeSlot): {
  icon: React.FC<{ className?: string }>;
  shortLabel: string;
  subLabel: string;
} {
  if (slot.startsWith('早朝')) {
    return { icon: Sunrise, shortLabel: '早朝', subLabel: '6〜9時' };
  }
  if (slot.startsWith('午前')) {
    return { icon: Sun, shortLabel: '午前', subLabel: '9〜12時' };
  }
  if (slot.startsWith('午後')) {
    return { icon: Clock, shortLabel: '午後', subLabel: '12〜17時' };
  }
  if (slot.startsWith('夕方')) {
    return { icon: Sunset, shortLabel: '夕方・夜', subLabel: '17〜22時' };
  }
  return { icon: Moon, shortLabel: '深夜・泊', subLabel: '22時〜' };
}

// ==============================================================================
// 3. 円形マッチング度リング（視覚的に一目で相性がわかるゲージ）
// ==============================================================================

export const MatchScoreRing: React.FC<{
  score: number;
  judgment: 'マッチング候補' | '要確認' | 'マッチング対象外';
  size?: 'sm' | 'md' | 'lg';
}> = ({ score, judgment, size = 'md' }) => {
  const radius = size === 'sm' ? 22 : size === 'lg' ? 34 : 28;
  const stroke = size === 'sm' ? 5 : 6;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const ringColor =
    judgment === 'マッチング候補'
      ? '#0F766E'
      : judgment === '要確認'
      ? '#D97706'
      : '#94A3B8';

  const badgeText =
    judgment === 'マッチング候補'
      ? '相性◎'
      : judgment === '要確認'
      ? '要相談'
      : '対象外';

  const boxSize = radius * 2;

  return (
    <div
      className="flex items-center gap-2.5 shrink-0"
      role="img"
      aria-label={`一致度 ${clamped}パーセント、判定 ${judgment}`}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: boxSize, height: boxSize }}
        aria-hidden="true"
      >
        <svg height={boxSize} width={boxSize} className="-rotate-90">
          <circle
            stroke="#E2E8F0"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={ringColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            className={`font-mono tabular-nums font-bold text-slate-900 ${
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'
            }`}
          >
            {clamped}
            <span className="text-[10px] font-normal">%</span>
          </span>
        </div>
      </div>
      <div className="text-left" aria-hidden="true">
        <span
          className={`block text-xs font-bold ${
            judgment === 'マッチング候補'
              ? 'text-teal-900'
              : judgment === '要確認'
              ? 'text-amber-800'
              : 'text-slate-500'
          }`}
        >
          {badgeText}
        </span>
        <span className="block text-[11px] text-slate-500">一致度</span>
      </div>
    </div>
  );
};

// ==============================================================================
// 4. 曜日カレンダー・ビジュアルストリップ（月〜日を一目で表示）
// ==============================================================================

export const WeeklyDayStrip: React.FC<{
  activeDays: DayOfWeek[];
  highlightDays?: DayOfWeek[];
}> = ({ activeDays, highlightDays }) => {
  const dayLabelText =
    activeDays.length > 0
      ? `対応曜日：${activeDays.join('・')}曜日`
      : '対応曜日の登録なし';

  return (
    <div
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={dayLabelText}
    >
      {DAYS_OF_WEEK.map((day) => {
        const isAvailable = activeDays.includes(day);
        const isHighlighted = highlightDays
          ? highlightDays.includes(day) && isAvailable
          : isAvailable;

        return (
          <span
            key={day}
            aria-hidden="true"
            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center select-none ${
              isHighlighted
                ? 'bg-teal-800 text-white'
                : isAvailable
                ? 'bg-teal-50 text-teal-900 border border-teal-300'
                : 'bg-slate-100 text-slate-400'
            }`}
            title={`${day}曜日: ${isAvailable ? '対応・希望あり' : 'なし'}`}
          >
            {day}
          </span>
        );
      })}
    </div>
  );
};

// ==============================================================================
// 5. 介助ニーズのアイコンタグ一覧（文字だらけを防ぎアイコンで直感表示）
// ==============================================================================

export const CareNeedsIconGrid: React.FC<{
  items: CareNeedItem[];
  supportedItems?: CareNeedItem[];
  maxShow?: number;
}> = ({ items, supportedItems, maxShow = 6 }) => {
  const visible = items.slice(0, maxShow);
  const restCount = Math.max(0, items.length - maxShow);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((item) => {
        const { icon: Icon, shortLabel } = getCareNeedVisual(item);
        const isSupported = supportedItems
          ? supportedItems.includes(item)
          : true;

        return (
          <span
            key={item}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
              isSupported
                ? 'bg-teal-50/70 border-teal-200 text-teal-950'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5 text-teal-800 shrink-0" aria-hidden="true" />
            <span>{shortLabel}</span>
            {supportedItems && (
              <>
                {isSupported ? (
                  <Check className="w-3 h-3 text-teal-700 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-700 shrink-0" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {isSupported ? '（対応可）' : '（要確認）'}
                </span>
              </>
            )}
          </span>
        );
      })}
      {restCount > 0 && (
        <span className="text-xs font-bold text-slate-500 px-1.5">
          他 {restCount} 項目
        </span>
      )}
    </div>
  );
};

// ==============================================================================
// 6. 3段階プライバシー保護のビジュアル図解
// ==============================================================================

export const PrivacyThreeStageVisual: React.FC = () => {
  const stages = [
    {
      num: '第1段階「匿名相談」',
      title: 'ニックネーム・希望概要のみ',
      sub: '氏名・連絡先・障害の詳細は非表示のまま相談可能',
      icon: Lock,
      bg: 'bg-slate-50 border-slate-200 text-slate-800',
      iconBg: 'bg-slate-200 text-slate-700',
    },
    {
      num: '第2段階「条件の開示」',
      title: '利用者の同意後に条件開示',
      sub: '同意した事業所のみ障害種別・介助内容・希望曜日を開示',
      icon: MessageCircle,
      bg: 'bg-sky-50/60 border-sky-200 text-sky-950',
      iconBg: 'bg-sky-100 text-sky-800',
    },
    {
      num: '第3段階「連絡先の開示」',
      title: '面談・見学決定＆同意後のみ',
      sub: '日程確定後に同意した事業所へ氏名・電話・メールを開示',
      icon: Unlock,
      bg: 'bg-teal-50/70 border-teal-200 text-teal-950',
      iconBg: 'bg-teal-700 text-white',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stages.map((st) => {
        const Icon = st.icon;
        return (
          <div
            key={st.num}
            className={`p-4 rounded-2xl border ${st.bg} flex sm:flex-col items-center sm:text-center gap-3.5 sm:gap-2`}
          >
            <div
              className={`w-11 h-11 rounded-2xl ${st.iconBg} flex items-center justify-center shrink-0`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold opacity-75 block">
                {st.num}
              </span>
              <p className="text-sm font-bold">{st.title}</p>
              <p className="text-xs opacity-85 leading-snug">{st.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==============================================================================
// 7. 追加イラスト群（ケアピタ・ブランドロゴ／地域街並み／チャット招待／料金プラン）
// ==============================================================================

export const BrandLogoMark: React.FC<{ className?: string }> = ({
  className = 'w-8 h-8',
}) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="carepitaBrandGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
    </defs>
    <rect width="36" height="36" rx="10" fill="url(#carepitaBrandGrad)" />
    {/* 2つの支援リンクが精密に重なる建築的ロゴマーク */}
    <path
      d="M18 7.5L26.5 11.2V17.6C26.5 22.8 22.8 27.1 18 28.5C13.2 27.1 9.5 22.8 9.5 17.6V11.2L18 7.5Z"
      fill="#FFFFFF"
      fillOpacity="0.16"
      stroke="#CCFBF1"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M14.2 18.2L16.8 20.8L22.2 15.2"
      stroke="#FFFFFF"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CommunityTownIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-[220px] h-auto',
}) => (
  <svg
    viewBox="0 0 240 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* 空と太陽 */}
    <circle cx="36" cy="28" r="14" fill="#FDE68A" />
    <path
      d="M12 104H228"
      stroke="#0F766E"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* 杉並・中野・練馬の緑の木々 */}
    <circle cx="62" cy="78" r="14" fill="#99F6E4" stroke="#0F766E" strokeWidth="2" />
    <line x1="62" y1="92" x2="62" y2="104" stroke="#0F766E" strokeWidth="2.5" />
    <circle cx="192" cy="76" r="16" fill="#A7F3D0" stroke="#0F766E" strokeWidth="2" />
    <line x1="192" y1="92" x2="192" y2="104" stroke="#0F766E" strokeWidth="2.5" />

    {/* 家1 */}
    <path
      d="M84 68L108 48L132 68V104H84V68Z"
      fill="#FFFFFF"
      stroke="#0F766E"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <rect x="101" y="80" width="14" height="24" rx="2" fill="#FED7AA" stroke="#0F766E" strokeWidth="1.8" />

    {/* ケアステーション建物 */}
    <rect
      x="138"
      y="56"
      width="42"
      height="48"
      rx="4"
      fill="#E0F2FE"
      stroke="#0F766E"
      strokeWidth="2.2"
    />
    <rect x="147" y="65" width="10" height="10" rx="2" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.6" />
    <rect x="161" y="65" width="10" height="10" rx="2" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.6" />
    <path d="M159 44V56M153 50H165" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const MatchingConnectIllustration: React.FC<{ className?: string }> = ({
  className = 'w-28 h-20 shrink-0',
}) => (
  <svg
    viewBox="0 0 140 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="8" y="18" width="52" height="44" rx="12" fill="#CCFBF1" stroke="#0F766E" strokeWidth="2" />
    <circle cx="34" cy="36" r="8" fill="#FFFFFF" stroke="#0F766E" strokeWidth="2" />
    <path d="M22 54C22 47 46 47 46 54" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />

    <rect x="80" y="28" width="52" height="44" rx="12" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
    <circle cx="106" cy="46" r="8" fill="#FFFFFF" stroke="#D97706" strokeWidth="2" />
    <path d="M94 64C94 57 118 57 118 64" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />

    {/* 中央のつながるハート */}
    <circle cx="70" cy="46" r="13" fill="#0F766E" />
    <path
      d="M65 46L68.5 49.5L75.5 42.5"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SubscriptionPlanIllustration: React.FC<{ className?: string }> = ({
  className = 'w-24 h-20 shrink-0',
}) => (
  <svg
    viewBox="0 0 120 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="18" y="14" width="68" height="68" rx="14" fill="#F0FDFA" stroke="#0F766E" strokeWidth="2.2" />
    <line x1="32" y1="32" x2="72" y2="32" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="32" y1="46" x2="64" y2="46" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="32" y1="60" x2="54" y2="60" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="84" cy="64" r="20" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.2" />
    <path
      d="M76 64L81.5 69.5L92 59"
      stroke="#D97706"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChatInvitationIllustration: React.FC<{ className?: string }> = ({
  className = 'w-16 h-16 shrink-0',
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="40" cy="40" r="36" fill="#FEF3C7" />
    <rect x="18" y="26" width="44" height="32" rx="6" fill="#FFFFFF" stroke="#0F766E" strokeWidth="2.2" />
    <path d="M20 29L40 43L60 29" stroke="#0F766E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="58" cy="24" r="9" fill="#0F766E" />
    <path d="M54.5 24L57 26.5L62 21.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ==============================================================================
// 8. 無料プラン事業所向け チャット機能制限モーダル（指示書 第5章）
// ==============================================================================

export const FreePlanChatUpgradeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onViewPlanDetails: () => void;
  monthlyPriceYen?: number;
}> = ({ isOpen, onClose, onViewPlanDetails, monthlyPriceYen = 3980 }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-upgrade-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            今月の無料申請枠（月1件）の上限到達
          </span>
          <SubscriptionPlanIllustration className="w-16 h-14" />
        </div>

        <div className="space-y-2.5">
          <h2
            id="chat-upgrade-modal-title"
            className="text-xl font-bold text-slate-900 leading-snug"
          >
            今月の無料プラン申請上限（月1件まで）に達しました
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            まずは無料で掲載できます。利用者からのチャット受信・返信は0円のまま制限なくご利用いただけます。有料プランは、受入条件を発信して、条件の合う希望を受け取り、進捗を管理するための業務道具です。
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm text-slate-700">
          <p className="font-bold text-teal-900">
            有料プラン（月額 {monthlyPriceYen.toLocaleString()}円税込・口座振替／カード対応）でできること：
          </p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-700 shrink-0" />
              <span>事業所からのチャット申請が無制限・相性の高い利用者の新着通知</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-700 shrink-0" />
              <span>受入条件に合う希望だけが届く設定・候補者の進捗管理</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-700 shrink-0" />
              <span>複数スタッフ管理・受入条件カードの強調表示（※適合度％不変）</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={onViewPlanDetails}
            className="w-full min-h-[52px] px-5 py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>料金プラン・お申し込みを見る</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] px-5 py-2.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm cursor-pointer"
          >
            今は申し込まない
          </button>
        </div>
      </div>
    </div>
  );
};

// ==============================================================================
// 9. 一目でわかるビジュアルグラフ＆◎○△×判定マトリクス（文字を減らし直感的に把握）
// ==============================================================================

export interface ScoreBreakdownInput {
  serviceScore: number; // max 25
  careNeedsScore: number; // max 25
  disabilityExpScore: number; // max 20 (障害特性・支援細目)
  scheduleScore: number; // max 15
  areaScore: number; // max 10
  genderScore: number; // max 5
  totalScore: number; // max 100
}

function getSymbolAndStyle(ratio: number): {
  mark: '◎' | '○' | '△' | '×';
  barColor: string;
  badgeClass: string;
} {
  if (ratio >= 0.85) {
    return {
      mark: '◎',
      barColor: 'bg-emerald-600',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    };
  }
  if (ratio >= 0.6) {
    return {
      mark: '○',
      barColor: 'bg-sky-600',
      badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    };
  }
  if (ratio >= 0.35) {
    return {
      mark: '△',
      barColor: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
    };
  }
  return {
    mark: '×',
    barColor: 'bg-rose-500',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
  };
}

export const MatchBreakdownBarGraph: React.FC<{
  breakdown: ScoreBreakdownInput;
  compact?: boolean;
}> = ({ breakdown, compact = false }) => {
  const axes = [
    {
      label: 'サービス',
      score: breakdown.serviceScore,
      max: 25,
      ratio: breakdown.serviceScore / 25,
    },
    {
      label: '介助内容',
      score: breakdown.careNeedsScore,
      max: 25,
      ratio: breakdown.careNeedsScore / 25,
    },
    {
      label: '障害特性・細目',
      score: breakdown.disabilityExpScore,
      max: 20,
      ratio: breakdown.disabilityExpScore / 20,
    },
    {
      label: '曜日・時間帯',
      score: breakdown.scheduleScore,
      max: 15,
      ratio: breakdown.scheduleScore / 15,
    },
    {
      label: 'エリア',
      score: breakdown.areaScore,
      max: 10,
      ratio: breakdown.areaScore / 10,
    },
    {
      label: 'ヘルパー性別',
      score: breakdown.genderScore,
      max: 5,
      ratio: breakdown.genderScore / 5,
    },
  ];

  const ratingMeaning = (mark: string) =>
    mark === '◎'
      ? '十分一致'
      : mark === '○'
        ? '相談可能'
        : mark === '△'
          ? '一部一致'
          : '不一致';

  if (compact) {
    return (
      <div
        className="rounded-xl bg-slate-50 border border-slate-200/90 p-3 space-y-2"
        role="group"
        aria-label="6項目別適合度グラフ（100点満点内訳）"
      >
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span>適合度の内訳（100点満点）</span>
          <span className="font-mono text-slate-600" aria-hidden="true">
            ◎=十分 ○=相談可 △=一部 ×=不可
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
          {axes.map((axis) => {
            const pct = Math.max(0, Math.min(100, Math.round(axis.ratio * 100)));
            const { mark, barColor, badgeClass } = getSymbolAndStyle(axis.ratio);
            return (
              <div
                key={axis.label}
                className="bg-white rounded-lg px-2.5 py-1.5 border border-slate-200/80 flex items-center gap-2"
              >
                <span
                  aria-hidden="true"
                  className={`w-5 h-5 rounded border text-[11px] font-bold flex items-center justify-center shrink-0 ${badgeClass}`}
                >
                  {mark}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="font-bold text-slate-700 truncate">
                      {axis.label}
                    </span>
                    <span className="font-mono font-bold text-slate-700 tabular-nums shrink-0">
                      <span className="sr-only">{ratingMeaning(mark)}、</span>
                      {axis.score}/{axis.max}点
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl bg-slate-50 border border-slate-200/90 p-3.5 space-y-2"
      role="group"
      aria-label="6項目別適合度グラフ（100点満点内訳）"
    >
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-0.5">
        <span>受入条件との適合度内訳（計100点）</span>
        <span className="font-mono text-slate-600" aria-hidden="true">
          ◎=十分 / ○=相談可 / △=一部 / ×=不可
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {axes.map((axis) => {
          const pct = Math.max(0, Math.min(100, Math.round(axis.ratio * 100)));
          const { mark, barColor, badgeClass } = getSymbolAndStyle(axis.ratio);
          return (
            <div
              key={axis.label}
              className="bg-white rounded-lg p-2 border border-slate-200/80 flex flex-col justify-between gap-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-slate-700 truncate">
                  {axis.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`w-6 h-6 rounded-md border text-xs font-bold flex items-center justify-center shrink-0 ${badgeClass}`}
                >
                  {mark}
                </span>
              </div>
              <div className="space-y-1">
                <div
                  className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="block text-right text-[11px] font-mono font-bold text-slate-700 tabular-nums">
                  <span className="sr-only">{ratingMeaning(mark)}、</span>
                  {axis.score}/{axis.max}点
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const UserMatchDistributionChart: React.FC<{
  highCount: number;
  midCount: number;
  lowCount: number;
  averageBreakdown?: ScoreBreakdownInput;
}> = ({ highCount, midCount, lowCount }) => {
  const total = Math.max(1, highCount + midCount + lowCount);
  const rows = [
    {
      mark: '◎',
      label: '相性80%以上（ピタッと一致）',
      count: highCount,
      pct: Math.round((highCount / total) * 100),
      barClass: 'bg-emerald-600',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    {
      mark: '○',
      label: '相性60〜79%（条件相談可）',
      count: midCount,
      pct: Math.round((midCount / total) * 100),
      barClass: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
    },
    {
      mark: '△',
      label: '相性60%未満・対象外',
      count: lowCount,
      pct: Math.round((lowCount / total) * 100),
      barClass: 'bg-slate-400',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">
          あなたの条件に合う事業所の相性グラフ
        </h3>
        <span className="text-xs font-bold text-teal-800 font-mono tabular-nums">
          全 {highCount + midCount + lowCount} 事業所を比較
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-md border font-bold flex items-center justify-center ${r.badgeClass}`}
                >
                  {r.mark}
                </span>
                <span className="font-bold text-slate-800">{r.label}</span>
              </div>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {r.count} 社（{r.pct}%）
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${r.barClass}`}
                style={{ width: `${Math.max(r.count > 0 ? 12 : 0, r.pct)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProviderWeeklyDemandChart: React.FC<{
  providerActiveDays: DayOfWeek[];
  demandByDay: Record<DayOfWeek, number>;
  candidateCount: number;
  requestCount: number;
  activeCaseCount: number;
}> = ({
  providerActiveDays,
  demandByDay,
  candidateCount,
  requestCount,
  activeCaseCount,
}) => {
  const maxDemand = Math.max(
    1,
    ...DAYS_OF_WEEK.map((d) => demandByDay[d] || 0)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 左：曜日別 地域ニーズ数 vs 自事業所の空き枠グラフ */}
      <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-700" aria-hidden="true" />
            曜日別：地域の希望者数と自事業所の空き枠（◎＝対応可）
          </span>
          <span className="text-[11px] font-bold text-indigo-800">
            棒の高さ＝希望者数
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2 pt-1 items-end">
          {DAYS_OF_WEEK.map((day) => {
            const count = demandByDay[day] || 0;
            const isOpen = providerActiveDays.includes(day);
            const heightPct = Math.round((count / maxDemand) * 100);
            return (
              <div
                key={day}
                className="flex flex-col items-center gap-1.5 bg-white border border-slate-200/80 rounded-xl p-2"
              >
                <span className="text-[11px] font-mono font-bold text-slate-600 tabular-nums">
                  {count}人
                </span>
                <div className="w-full h-16 bg-slate-100 rounded-lg flex items-end justify-center p-1">
                  <div
                    className={`w-full rounded-md transition-all ${
                      isOpen ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                    style={{
                      height: `${Math.max(count > 0 ? 20 : 6, heightPct)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {day}
                </span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                    isOpen
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  title={isOpen ? '受入枠あり' : '受入枠なし'}
                >
                  {isOpen ? '◎空' : '－'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右：マッチング進捗ファネルグラフ */}
      <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3">
        <span className="text-xs sm:text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-indigo-700" aria-hidden="true" />
          マッチング進捗状況グラフ
        </span>
        <div className="space-y-2.5">
          {[
            {
              label: '1. 条件一致の候補者',
              value: `${candidateCount}名`,
              pct: 100,
              color: 'bg-indigo-600',
              mark: '◎',
            },
            {
              label: '2. チャット申請・アプローチ済',
              value: `${requestCount}件`,
              pct: Math.min(
                100,
                Math.max(25, Math.round((requestCount / Math.max(1, candidateCount)) * 100))
              ),
              color: 'bg-amber-500',
              mark: '○',
            },
            {
              label: '3. 承認完了・対応中の案件',
              value: `${activeCaseCount}件`,
              pct: Math.min(
                100,
                Math.max(20, Math.round((activeCaseCount / Math.max(1, candidateCount)) * 100))
              ),
              color: 'bg-emerald-600',
              mark: '★',
            },
          ].map((step) => (
            <div key={step.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">{step.label}</span>
                <span className="font-mono font-extrabold text-slate-900 tabular-nums">
                  {step.value}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white border border-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${step.color}`}
                  style={{ width: `${step.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==============================================================================
// 10. ダッシュボード用：直感的なマッチング進捗バー＆ステータス構成比グラフコンポーネント
// ==============================================================================

export interface ActiveProviderProgressItem {
  providerId: string;
  providerName: string;
  matchScore: number;
  stage: 'favorite' | 'pending' | 'chatting' | 'disclosed';
  stageLabel: string;
  progressPct: number;
  onAction: () => void;
}

export const UserMatchingProgressBoard: React.FC<{
  highCount: number;
  midCount: number;
  lowCount: number;
  favoriteCount: number;
  pendingRequestCount: number;
  approvedChatCount: number;
  disclosedCount: number;
  activeProviders: ActiveProviderProgressItem[];
  onOpenFavorites?: () => void;
}> = ({
  highCount,
  midCount,
  lowCount,
  favoriteCount,
  pendingRequestCount,
  approvedChatCount,
  disclosedCount,
  activeProviders,
  onOpenFavorites,
}) => {
  // 全体進捗ステップの算出 (1〜4)
  const currentStep =
    disclosedCount > 0
      ? 4
      : approvedChatCount > 0
      ? 3
      : pendingRequestCount > 0 || favoriteCount > 0 || highCount > 0
      ? 2
      : 1;

  const overallPct =
    currentStep === 4
      ? 100
      : currentStep === 3
      ? 75
      : currentStep === 2
      ? 50
      : 25;

  const steps = [
    {
      num: 1,
      title: '条件登録',
      sub: '登録完了',
      done: currentStep >= 1,
      active: currentStep === 1,
    },
    {
      num: 2,
      title: 'お気に入り・申請',
      sub: `保存${favoriteCount}社 / 申請${pendingRequestCount}件`,
      done: currentStep >= 2,
      active: currentStep === 2,
    },
    {
      num: 3,
      title: '匿名チャット相談',
      sub: `相談中 ${approvedChatCount}社`,
      done: currentStep >= 3,
      active: currentStep === 3,
    },
    {
      num: 4,
      title: '連絡先開示・調整',
      sub: `開示済 ${disclosedCount}社`,
      done: currentStep >= 4,
      active: currentStep === 4,
    },
  ];

  const totalProviders = Math.max(1, highCount + midCount + lowCount);
  const highPct = Math.round((highCount / totalProviders) * 100);
  const midPct = Math.round((midCount / totalProviders) * 100);
  const lowPct = Math.max(0, 100 - highPct - midPct);

  return (
    <div
      aria-label="利用者マッチング進捗・ステータスグラフ"
      className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4"
    >
      {/* 上段：4段階マッチング進捗ステップバー */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-900">
              <TrendingUp className="w-4 h-4 text-teal-700" aria-hidden="true" />
              マッチング進捗
            </span>
            <HelpTooltip
              guideKey="user-progress-board"
              compact
              align="left"
              label="進捗バーの見方"
            />
            <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
              STEP {currentStep} / 4（{overallPct}%）
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenFavorites && (
              <button
                type="button"
                onClick={onOpenFavorites}
                className="min-h-[30px] px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span className="tabular-nums">お気に入り {favoriteCount}社</span>
              </button>
            )}
            {pendingRequestCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold tabular-nums">
                承認待ち {pendingRequestCount}件
              </span>
            )}
          </div>
        </div>

        {/* プログレスバー本体 */}
        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-700 transition-all duration-300"
            style={{ width: `${overallPct}%` }}
          />
        </div>

        {/* 4ステップノード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                s.active
                  ? 'bg-teal-900 border-teal-900 text-white'
                  : s.done
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-white/60 border-slate-200/70 text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md text-xs font-bold tabular-nums flex items-center justify-center shrink-0 ${
                  s.active
                    ? 'bg-emerald-400 text-teal-950'
                    : s.done
                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {s.done && !s.active ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold block truncate">
                  {s.title}
                </span>
                <span
                  className={`text-[11px] font-medium block truncate tabular-nums ${
                    s.active ? 'text-teal-200' : 'text-slate-500'
                  }`}
                >
                  {s.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 下段：左＝相性ランク構成比バー / 右＝進行中の事業所別ステータス進捗バー */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-2 border-t border-slate-200">
        {/* 左：相性ランク構成比（100%積み上げバー） */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
              全{highCount + midCount + lowCount}事業所の相性分布
            </span>
            <span className="font-mono text-teal-800 font-bold tabular-nums">
              80%以上：{highCount}社
            </span>
          </div>

          {/* 100%積み上げバー */}
          <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
            {highCount > 0 && (
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${highPct}%` }}
                title={`相性80%以上: ${highCount}社`}
              />
            )}
            {midCount > 0 && (
              <div
                className="h-full bg-amber-400 transition-all"
                style={{ width: `${midPct}%` }}
                title={`相性60〜79%: ${midCount}社`}
              />
            )}
            {lowCount > 0 && (
              <div
                className="h-full bg-slate-300 transition-all"
                style={{ width: `${lowPct}%` }}
                title={`60%未満: ${lowCount}社`}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-center">
              <span className="font-bold text-emerald-900 block">
                ◎ 80%以上
              </span>
              <span className="font-mono font-bold text-sm text-emerald-950 tabular-nums">
                {highCount}社
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-50/70 border border-amber-200 text-center">
              <span className="font-bold text-amber-900 block">
                ○ 60〜79%
              </span>
              <span className="font-mono font-bold text-sm text-amber-950 tabular-nums">
                {midCount}社
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="font-bold text-slate-600 block">
                △ 60%未満
              </span>
              <span className="font-mono font-bold text-sm text-slate-700 tabular-nums">
                {lowCount}社
              </span>
            </div>
          </div>
        </div>

        {/* 右：事業所ごとのやりとり進捗バー */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
              お気に入り・進行中の事業所
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              選択で詳細へ移動
            </span>
          </div>

          {activeProviders.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">
              まだお気に入り保存やチャット中の事業所はありません。下の事業所一覧から「お気に入り」または「チャット相談」をお試しください。
            </p>
          ) : (
            <div className="space-y-2">
              {activeProviders.slice(0, 3).map((item) => {
                const barColor =
                  item.stage === 'disclosed'
                    ? 'bg-emerald-600'
                    : item.stage === 'chatting'
                    ? 'bg-teal-600'
                    : item.stage === 'pending'
                    ? 'bg-amber-500'
                    : 'bg-sky-600';
                const badgeStyle =
                  item.stage === 'disclosed'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                    : item.stage === 'chatting'
                    ? 'bg-teal-50 text-teal-950 border-teal-200'
                    : item.stage === 'pending'
                    ? 'bg-amber-50 text-amber-950 border-amber-200'
                    : 'bg-sky-50 text-sky-950 border-sky-200';

                return (
                  <button
                    key={item.providerId}
                    type="button"
                    onClick={item.onAction}
                    className="w-full p-2 rounded-lg bg-slate-50/70 hover:bg-teal-50/50 border border-slate-200 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate tabular-nums">
                          {item.providerName}（相性{item.matchScore}%）
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 tabular-nums whitespace-nowrap ${badgeStyle}`}
                        >
                          {item.stageLabel}（{item.progressPct}%）
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${item.progressPct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-800 shrink-0 whitespace-nowrap">
                      開く →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProviderMatchingProgressBoard: React.FC<{
  providerActiveDays: DayOfWeek[];
  demandByDay: Record<DayOfWeek, number>;
  totalUsersCount: number;
  unapproachedCount: number;
  pendingRequestCount: number;
  activeCaseCount: number;
  declinedOrUnavailableCount: number;
  disclosedCount: number;
}> = ({
  providerActiveDays,
  demandByDay,
  totalUsersCount,
  unapproachedCount,
  pendingRequestCount,
  activeCaseCount,
  declinedOrUnavailableCount,
  disclosedCount,
}) => {
  const total = Math.max(
    1,
    unapproachedCount +
      pendingRequestCount +
      activeCaseCount +
      declinedOrUnavailableCount
  );

  const activePct = Math.round((activeCaseCount / total) * 100);
  const pendingPct = Math.round((pendingRequestCount / total) * 100);
  const unapproachedPct = Math.round((unapproachedCount / total) * 100);
  const declinedPct = Math.max(0, 100 - activePct - pendingPct - unapproachedPct);

  const maxDemand = Math.max(
    1,
    ...DAYS_OF_WEEK.map((d) => demandByDay[d] || 0)
  );

  const statusRows = [
    {
      label: '完了・チャット対応中',
      sub: disclosedCount > 0 ? `うち連絡先開示 ${disclosedCount}名` : '双方向相談中',
      count: activeCaseCount,
      pct: activePct,
      barColor: 'bg-emerald-600',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    },
    {
      label: '承認待ち（申請送信済）',
      sub: '利用者の承認待ち',
      count: pendingRequestCount,
      pct: pendingPct,
      barColor: 'bg-amber-500',
      dotColor: 'bg-amber-500',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-950',
    },
    {
      label: '新着・検討中（未申請）',
      sub: 'アプローチ可能',
      count: unapproachedCount,
      pct: unapproachedPct,
      barColor: 'bg-sky-600',
      dotColor: 'bg-sky-500',
      badgeBg: 'bg-sky-50 border-sky-200 text-sky-950',
    },
    {
      label: '対応不可・見送り',
      sub: '条件不一致等',
      count: declinedOrUnavailableCount,
      pct: declinedPct,
      barColor: 'bg-slate-400',
      dotColor: 'bg-slate-400',
      badgeBg: 'bg-slate-50 border-slate-200 text-slate-600',
    },
  ];

  return (
    <div
      aria-label="事業所マッチング進捗・曜日別ニーズグラフ"
      className="grid grid-cols-1 lg:grid-cols-12 gap-4"
    >
      {/* 左（7列）：案件ステータス構成比バー＆進捗メーター */}
      <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-700" aria-hidden="true" />
              マッチング進捗・案件ステータス内訳（全 {totalUsersCount} 名）
            </span>
            <HelpTooltip
              guideKey="provider-progress-board"
              compact
              align="left"
              tone="indigo"
              label="案件進捗ボードの見方"
            />
          </div>
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-900 text-white text-xs font-bold tabular-nums">
            対応中 {activeCaseCount}件 / 承認待ち {pendingRequestCount}件
          </span>
        </div>

        {/* 100% 積み上げ横棒グラフ */}
        <div className="space-y-1">
          <div className="h-3.5 w-full rounded-full bg-white border border-slate-200 overflow-hidden flex">
            {activeCaseCount > 0 && (
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${activePct}%` }}
                title={`対応中: ${activeCaseCount}名`}
              />
            )}
            {pendingRequestCount > 0 && (
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${pendingPct}%` }}
                title={`承認待ち: ${pendingRequestCount}名`}
              />
            )}
            {unapproachedCount > 0 && (
              <div
                className="h-full bg-sky-500 transition-all"
                style={{ width: `${unapproachedPct}%` }}
                title={`未申請・検討中: ${unapproachedCount}名`}
              />
            )}
            {declinedOrUnavailableCount > 0 && (
              <div
                className="h-full bg-slate-300 transition-all"
                style={{ width: `${declinedPct}%` }}
                title={`対応不可: ${declinedOrUnavailableCount}名`}
              />
            )}
          </div>
        </div>

        {/* 4ステータスの個別プログレスバーカード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {statusRows.map((row) => (
            <div
              key={row.label}
              className={`p-2.5 rounded-xl border ${row.badgeBg} space-y-1.5`}
            >
              <div className="flex items-center justify-between gap-1.5 text-xs">
                <span className="font-bold flex items-center gap-1.5 truncate">
                  <span className="truncate">{row.label}</span>
                </span>
                <span className="font-mono font-bold text-sm shrink-0 tabular-nums">
                  {row.count}名
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/80 overflow-hidden">
                <div
                  className={`h-full rounded-full ${row.barColor}`}
                  style={{
                    width: `${Math.max(row.count > 0 ? 15 : 0, row.pct)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] opacity-80 font-bold">
                <span>{row.sub}</span>
                <span className="font-mono tabular-nums">{row.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右（5列）：曜日別 地域の希望者数 vs 自事業所の空き枠（◎/－）グラフ */}
      <div className="lg:col-span-5 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-700" aria-hidden="true" />
            曜日別：希望者数と空き枠
          </span>
          <span className="text-[11px] font-bold text-indigo-900">
            ◎＝受入枠あり
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-1 items-end">
          {DAYS_OF_WEEK.map((day) => {
            const count = demandByDay[day] || 0;
            const isOpen = providerActiveDays.includes(day);
            const heightPct = Math.round((count / maxDemand) * 100);
            return (
              <div
                key={day}
                className="flex flex-col items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1.5"
              >
                <span className="text-[10px] font-mono font-bold text-slate-600 tabular-nums">
                  {count}人
                </span>
                <div className="w-full h-16 bg-slate-100 rounded-lg flex items-end justify-center p-1">
                  <div
                    className={`w-full rounded-md transition-all ${
                      isOpen ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                    style={{
                      height: `${Math.max(count > 0 ? 20 : 6, heightPct)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-extrabold text-slate-900">
                  {day}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                    isOpen
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  title={isOpen ? '受入枠あり' : '受入枠なし'}
                >
                  {isOpen ? '◎' : '－'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const CandidateCaseProgressBar: React.FC<{
  stage: 'unapproached' | 'considering' | 'pending' | 'active' | 'declined';
}> = ({ stage }) => {
  const config =
    stage === 'active'
      ? {
          pct: 100,
          label: 'STEP 4/4：チャット開通・対応中',
          color: 'bg-emerald-600',
          textClass: 'text-emerald-900',
        }
      : stage === 'pending'
      ? {
          pct: 75,
          label: 'STEP 3/4：チャット申請・承認待ち',
          color: 'bg-amber-500',
          textClass: 'text-amber-900',
        }
      : stage === 'considering'
      ? {
          pct: 50,
          label: 'STEP 2/4：条件検討中',
          color: 'bg-sky-600',
          textClass: 'text-sky-900',
        }
      : stage === 'declined'
      ? {
          pct: 15,
          label: '対応不可・見送り',
          color: 'bg-slate-400',
          textClass: 'text-slate-500',
        }
      : {
          pct: 25,
          label: 'STEP 1/4：未対応（アプローチ可能）',
          color: 'bg-indigo-500',
          textClass: 'text-indigo-900',
        };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-extrabold">
        <span className={config.textClass}>{config.label}</span>
        <span className="font-mono text-slate-600 tabular-nums">
          進捗 {config.pct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${config.color}`}
          style={{ width: `${config.pct}%` }}
        />
      </div>
    </div>
  );
};




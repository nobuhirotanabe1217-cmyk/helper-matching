import React, { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle, X, Lightbulb } from 'lucide-react';
import { HelpGuideKey, getHelpGuide } from '../utils/helpGuides';
import { buildHelpGuideSpeechText } from '../utils/speech';
import { SpeechButton } from './SpeechButton';

interface HelpTooltipProps {
  guideKey: HelpGuideKey;
  /** 表示ラベル（compact=true の場合はアイコンのみ表示） */
  label?: string;
  /** アイコンのみ表示したいコンパクト配置用 */
  compact?: boolean;
  /** デスクトップ表示時のポップオーバー位置 */
  align?: 'left' | 'right';
  /** カラートーン（利用者側＝teal / 事業所側＝indigo） */
  tone?: 'teal' | 'indigo' | 'slate';
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  guideKey,
  label = 'この機能の使い方',
  compact = false,
  align = 'right',
  tone = 'teal',
  className = '',
}) => {
  const guide = getHelpGuide(guideKey);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const panelId = useId();

  const isOpen = isPinned || isHovered;

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPinned(false);
        setIsHovered(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPinned(false);
        setIsHovered(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    clearCloseTimer();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 140);
  };

  const handleToggleClick = () => {
    clearCloseTimer();
    if (isPinned) {
      setIsPinned(false);
      setIsHovered(false);
    } else {
      setIsPinned(true);
    }
  };

  const handleClose = () => {
    clearCloseTimer();
    setIsPinned(false);
    setIsHovered(false);
  };

  const toneTriggerClasses =
    tone === 'indigo'
      ? isOpen
        ? 'bg-indigo-800 border-indigo-800 text-white shadow-xs'
        : 'bg-white border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-950'
      : tone === 'slate'
        ? isOpen
          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900'
        : isOpen
          ? 'bg-teal-800 border-teal-800 text-white shadow-xs'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900';

  const toneBadgeClasses =
    tone === 'indigo'
      ? 'text-indigo-800 bg-indigo-50 border-indigo-200'
      : tone === 'slate'
        ? 'text-slate-800 bg-slate-100 border-slate-200'
        : 'text-teal-800 bg-teal-50 border-teal-200';

  const toneStepNumClasses =
    tone === 'indigo'
      ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
      : tone === 'slate'
        ? 'bg-slate-100 text-slate-800 border-slate-200'
        : 'bg-teal-100 text-teal-900 border-teal-200';

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center shrink-0 ${className}`}
    >
      <button
        type="button"
        data-testid={`help-trigger-${guideKey}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${guide.title}（${label}）`}
        title={`${label}：${guide.title}`}
        onClick={handleToggleClick}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
          compact
            ? 'min-h-[32px] min-w-[32px] p-1.5'
            : 'min-h-[36px] px-2.5 py-1.5'
        } ${toneTriggerClasses}`}
      >
        <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        {!compact && <span>{label}</span>}
      </button>

      {isOpen && (
        <>
          {/* モバイル用の背景オーバーレイ */}
          <div
            aria-hidden="true"
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-[1px] z-40 sm:hidden"
          />

          {/* ツールチップ／使い方ポップオーバー本体 */}
          <div
            id={panelId}
            role="dialog"
            aria-label={`${guide.title}の使い方`}
            data-testid={`help-popover-${guideKey}`}
            className={`fixed left-3 right-3 top-20 z-50 sm:top-full sm:mt-2 sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:inset-auto sm:absolute ${
              align === 'left' ? 'sm:left-0' : 'sm:right-0'
            } bg-white border border-slate-200 rounded-2xl shadow-xl p-4 sm:p-5 text-left space-y-3.5 max-h-[calc(100dvh-7rem)] overflow-y-auto`}
          >
            {/* ヘッダー */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="space-y-1 min-w-0">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${toneBadgeClasses}`}
                >
                  <HelpCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>この機能の使い方</span>
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {guide.title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <SpeechButton
                  compact
                  speechId={`help-${guideKey}`}
                  getText={() => buildHelpGuideSpeechText(guide)}
                  label="音声で聞く"
                  stopLabel="停止"
                  tone={tone}
                />
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="使い方を閉じる"
                  data-testid={`help-close-${guideKey}`}
                  className="min-h-[32px] min-w-[32px] rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* 概要 */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {guide.summary}
            </p>

            {/* ステップ一覧 */}
            <ol className="space-y-2.5">
              {guide.steps.map((step, index) => (
                <li
                  key={step.heading}
                  className="flex items-start gap-2.5 text-xs leading-relaxed"
                >
                  <span
                    className={`w-5 h-5 rounded-md border font-bold tabular-nums flex items-center justify-center shrink-0 mt-0.5 text-[11px] ${toneStepNumClasses}`}
                  >
                    {index + 1}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-slate-900">{step.heading}</p>
                    <p className="text-slate-600 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* 補足ヒント */}
            {guide.tip && (
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2 leading-relaxed">
                <Lightbulb
                  className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{guide.tip}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

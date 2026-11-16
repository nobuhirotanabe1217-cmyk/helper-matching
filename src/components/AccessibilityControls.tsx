import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Volume2,
  Square,
  Eye,
  Type,
  X,
  Gauge,
  Keyboard,
} from 'lucide-react';
import { useSpeech } from '../context/SpeechContext';

const RATE_OPTIONS = [
  { value: 0.85, label: '0.85x ゆっくり' },
  { value: 1.0, label: '1.0x 標準' },
  { value: 1.25, label: '1.25x 速め' },
  { value: 1.5, label: '1.5x 倍速' },
];

export const AccessibilityControls: React.FC = () => {
  const {
    isSpeaking,
    speechRate,
    setSpeechRate,
    highContrast,
    setHighContrast,
    largeText,
    setLargeText,
    readCurrentScreen,
    stop,
  } = useSpeech();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  const hasCustomVisual = highContrast || largeText;

  return (
    <div ref={containerRef} className="relative inline-flex items-center shrink-0">
      <button
        type="button"
        data-testid="a11y-settings-btn"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="音声読み上げ・視覚障害者向け設定を開く"
        title="音声読み上げ・視覚障害者向け表示設定"
        onClick={() => setOpen((prev) => !prev)}
        className={`min-h-[36px] px-2 sm:px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap transition-colors ${
          open || hasCustomVisual || isSpeaking
            ? 'bg-slate-900 border-slate-900 text-white'
            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
        }`}
      >
        <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden lg:inline">音声・視覚補助</span>
        <span className="sr-only lg:hidden">音声・視覚補助設定</span>
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-[1px] z-40 sm:hidden"
          />

          <div
            id={panelId}
            role="dialog"
            aria-label="音声読み上げと視覚障害者向けアクセシビリティ設定"
            data-testid="a11y-settings-popover"
            className="fixed left-3 right-3 top-20 z-50 sm:top-full sm:mt-2 sm:w-88 sm:max-w-[calc(100vw-2rem)] sm:inset-auto sm:absolute sm:right-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 sm:p-5 text-left space-y-4 max-h-[calc(100dvh-7rem)] overflow-y-auto"
          >
            {/* ヘッダー */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-teal-800 block">
                  アクセシビリティ設定
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  音声読み上げ・視覚サポート
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="アクセシビリティ設定を閉じる"
                className="min-h-[32px] min-w-[32px] rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* 1. 現在の画面を読み上げ / 停止 */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                現在の画面の音声読み上げ
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="a11y-read-screen-btn"
                  onClick={readCurrentScreen}
                  className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSpeaking ? (
                    <>
                      <Square
                        className="w-3.5 h-3.5 fill-current"
                        aria-hidden="true"
                      />
                      <span>読み上げを停止</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                      <span>この画面を読み上げ再生</span>
                    </>
                  )}
                </button>
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={() => stop(false)}
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    停止
                  </button>
                )}
              </div>
            </div>

            {/* 2. 読み上げ速度 */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-teal-800" aria-hidden="true" />
                読み上げ速度
              </span>
              <div
                role="group"
                aria-label="読み上げ速度の選択"
                className="grid grid-cols-2 gap-1.5"
              >
                {RATE_OPTIONS.map((opt) => {
                  const active = Math.abs(speechRate - opt.value) < 0.01;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSpeechRate(opt.value)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer tabular-nums transition-colors ${
                        active
                          ? 'bg-teal-800 border-teal-800 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 視覚障害・ロービジョン向け表示切替 */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-700 block">
                見やすさ・フォーカス補助（弱視・ロービジョン対応）
              </span>

              <button
                type="button"
                data-testid="a11y-high-contrast-toggle"
                aria-pressed={highContrast}
                onClick={() => setHighContrast(!highContrast)}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  highContrast
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>高コントラスト＆太枠フォーカス</span>
                </span>
                <span className="tabular-nums">
                  {highContrast ? 'オン' : 'オフ'}
                </span>
              </button>

              <button
                type="button"
                data-testid="a11y-large-text-toggle"
                aria-pressed={largeText}
                onClick={() => setLargeText(!largeText)}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  largeText
                    ? 'bg-teal-800 border-teal-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Type className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>文字サイズを大きくする</span>
                </span>
                <span className="tabular-nums">
                  {largeText ? '大きめ' : '標準'}
                </span>
              </button>
            </div>

            {/* 4. キーボードショートカット案内 */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-teal-800" aria-hidden="true" />
                キーボード・スクリーンリーダー操作
              </p>
              <p>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">
                  Alt + R
                </kbd>{' '}
                現在の画面を読み上げ ／{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">
                  Alt + S
                </kbd>{' '}
                停止
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

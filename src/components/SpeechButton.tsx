import React, { useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import { useSpeech } from '../context/SpeechContext';

interface SpeechButtonProps {
  speechId: string;
  getText: () => string;
  /** 通常時のボタンラベル */
  label?: string;
  /** 再生中のボタンラベル */
  stopLabel?: string;
  /** アイコンのみ表示したいコンパクト配置用 */
  compact?: boolean;
  /** 画面のメイン読み上げボタン（Alt+Rで呼び出せるように登録） */
  isPrimaryScreenReader?: boolean;
  tone?: 'teal' | 'indigo' | 'slate';
  className?: string;
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({
  speechId,
  getText,
  label = '読み上げ再生',
  stopLabel = '停止',
  compact = false,
  isPrimaryScreenReader = false,
  tone = 'teal',
  className = '',
}) => {
  const { speakingId, toggleSpeak, registerPrimaryReader } = useSpeech();
  const isPlaying = speakingId === speechId;

  useEffect(() => {
    if (!isPrimaryScreenReader) return;
    return registerPrimaryReader(speechId, getText);
  }, [isPrimaryScreenReader, speechId, getText, registerPrimaryReader]);

  const activeClasses =
    tone === 'indigo'
      ? 'bg-indigo-800 border-indigo-800 text-white shadow-xs'
      : tone === 'slate'
        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
        : 'bg-teal-800 border-teal-800 text-white shadow-xs';

  const idleClasses =
    tone === 'indigo'
      ? 'bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-50 hover:border-indigo-300'
      : tone === 'slate'
        ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
        : 'bg-white border-teal-200 text-teal-900 hover:bg-teal-50 hover:border-teal-300';

  const ariaText = isPlaying ? `${label}を停止する` : `${label}（音声で聞く）`;

  return (
    <button
      type="button"
      data-testid={`speech-btn-${speechId}`}
      aria-pressed={isPlaying}
      aria-label={ariaText}
      title={ariaText}
      onClick={() => toggleSpeak(speechId, getText())}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
        compact
          ? 'min-h-[34px] px-2.5 py-1'
          : 'min-h-[36px] px-2.5 sm:px-3 py-1.5'
      } ${isPlaying ? activeClasses : idleClasses} ${className}`}
    >
      {isPlaying ? (
        <Square
          className="w-3.5 h-3.5 fill-current shrink-0"
          aria-hidden="true"
        />
      ) : (
        <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      <span>{isPlaying ? stopLabel : label}</span>
    </button>
  );
};

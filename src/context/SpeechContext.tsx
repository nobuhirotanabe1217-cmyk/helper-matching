import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAppState } from './AppStateContext';
import {
  clampSpeechRate,
  getViewTitleForAnnouncement,
  splitSpeechChunks,
} from '../utils/speech';

const STORAGE_SPEECH_RATE = 'carepita_a11y_speech_rate_v1';
const STORAGE_HIGH_CONTRAST = 'carepita_a11y_high_contrast_v1';
const STORAGE_LARGE_TEXT = 'carepita_a11y_large_text_v1';

interface ScreenReaderEntry {
  id: string;
  getText: () => string;
}

interface SpeechContextValue {
  speakingId: string | null;
  isSpeaking: boolean;
  speechSupported: boolean;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  largeText: boolean;
  setLargeText: (enabled: boolean) => void;
  liveAnnouncement: string;
  announce: (message: string) => void;
  speak: (id: string, text: string) => void;
  stop: (silent?: boolean) => void;
  toggleSpeak: (id: string, text: string) => void;
  registerPrimaryReader: (id: string, getText: () => string) => () => void;
  readCurrentScreen: () => void;
}

const SpeechContext = createContext<SpeechContextValue | null>(null);

function pickJapaneseVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  try {
    const voices = synth.getVoices();
    if (!voices || voices.length === 0) return null;
    const exactJa = voices.find(
      (v) => v.lang.toLowerCase() === 'ja-jp' || v.lang.toLowerCase().startsWith('ja')
    );
    return exactJa || null;
  } catch {
    return null;
  }
}

export const SpeechProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentView } = useAppState();

  const speechSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined';

  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechRate, setSpeechRateState] = useState<number>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_SPEECH_RATE);
      return saved ? clampSpeechRate(Number(saved)) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_HIGH_CONTRAST) === '1';
    } catch {
      return false;
    }
  });
  const [largeText, setLargeTextState] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_LARGE_TEXT) === '1';
    } catch {
      return false;
    }
  });
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  const sessionTokenRef = useRef<number>(0);
  const primaryReaderRef = useRef<ScreenReaderEntry | null>(null);
  const previousViewRef = useRef<string>(currentView);
  const fallbackTimerRef = useRef<number | null>(null);

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const announce = useCallback((message: string) => {
    // 同じ文字列連続時にもスクリーンリーダーが再読できるよう空白調整で切替
    setLiveAnnouncement('');
    window.requestAnimationFrame(() => {
      setLiveAnnouncement(message);
    });
  }, []);

  const stop = useCallback(
    (silent = false) => {
      sessionTokenRef.current += 1;
      clearFallbackTimer();
      if (speechSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
      setSpeakingId(null);
      if (!silent) {
        announce('音声読み上げを停止しました。');
      }
    },
    [speechSupported, announce]
  );

  const speak = useCallback(
    (id: string, text: string) => {
      const cleaned = text.trim();
      if (!cleaned) return;

      sessionTokenRef.current += 1;
      const myToken = sessionTokenRef.current;
      clearFallbackTimer();

      if (!speechSupported) {
        setSpeakingId(id);
        announce(`読み上げ内容：${cleaned}`);
        fallbackTimerRef.current = window.setTimeout(() => {
          if (sessionTokenRef.current === myToken) {
            setSpeakingId(null);
          }
        }, 2500);
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      const chunks = splitSpeechChunks(cleaned, 150);
      if (chunks.length === 0) {
        setSpeakingId(null);
        return;
      }

      setSpeakingId(id);
      announce('音声読み上げを開始しました。');

      const voice = pickJapaneseVoice(window.speechSynthesis);
      const rate = clampSpeechRate(speechRate);

      const speakNextChunk = (idx: number) => {
        if (sessionTokenRef.current !== myToken) return;
        if (idx >= chunks.length) {
          setSpeakingId(null);
          return;
        }

        const utterance = new window.SpeechSynthesisUtterance(chunks[idx]);
        utterance.lang = 'ja-JP';
        utterance.rate = rate;
        utterance.pitch = 1.0;
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onend = () => {
          if (sessionTokenRef.current !== myToken) return;
          speakNextChunk(idx + 1);
        };

        utterance.onerror = (event) => {
          if (sessionTokenRef.current !== myToken) return;
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            announce(`読み上げ内容：${cleaned}`);
          }
          setSpeakingId(null);
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          setSpeakingId(null);
        }
      };

      speakNextChunk(0);
    },
    [speechSupported, speechRate, announce]
  );

  const toggleSpeak = useCallback(
    (id: string, text: string) => {
      if (speakingId === id) {
        stop(false);
      } else {
        speak(id, text);
      }
    },
    [speakingId, stop, speak]
  );

  const registerPrimaryReader = useCallback(
    (id: string, getText: () => string) => {
      primaryReaderRef.current = { id, getText };
      return () => {
        if (primaryReaderRef.current?.id === id) {
          primaryReaderRef.current = null;
        }
      };
    },
    []
  );

  const readCurrentScreen = useCallback(() => {
    const entry = primaryReaderRef.current;
    if (entry) {
      toggleSpeak(entry.id, entry.getText());
      return;
    }
    const title = getViewTitleForAnnouncement(currentView);
    toggleSpeak(`view-${currentView}`, `現在の画面は、${title}です。`);
  }, [currentView, toggleSpeak]);

  const setSpeechRate = useCallback(
    (rate: number) => {
      const clamped = clampSpeechRate(rate);
      setSpeechRateState(clamped);
      try {
        window.localStorage.setItem(STORAGE_SPEECH_RATE, String(clamped));
      } catch {
        // ignore
      }
      announce(`読み上げ速度を ${clamped} 倍に設定しました。`);
    },
    [announce]
  );

  const setHighContrast = useCallback(
    (enabled: boolean) => {
      setHighContrastState(enabled);
      try {
        window.localStorage.setItem(STORAGE_HIGH_CONTRAST, enabled ? '1' : '0');
      } catch {
        // ignore
      }
      announce(
        enabled
          ? '高コントラスト・太枠フォーカス表示をオンにしました。'
          : '高コントラスト表示をオフにしました。'
      );
    },
    [announce]
  );

  const setLargeText = useCallback(
    (enabled: boolean) => {
      setLargeTextState(enabled);
      try {
        window.localStorage.setItem(STORAGE_LARGE_TEXT, enabled ? '1' : '0');
      } catch {
        // ignore
      }
      announce(
        enabled
          ? '文字サイズを大きく設定しました。'
          : '文字サイズを標準に戻しました。'
      );
    },
    [announce]
  );

  // 高コントラスト・文字サイズクラスのDOM反映
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('a11y-high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('a11y-large-text', largeText);
  }, [largeText]);

  // 画面遷移時：読み上げ停止 + document.title更新 + スクリーンリーダー向け画面遷移アナウンス
  useEffect(() => {
    const title = getViewTitleForAnnouncement(currentView);
    if (typeof document !== 'undefined') {
      document.title = `${title}｜ケアピタ（CarePita）`;
    }

    if (previousViewRef.current !== currentView) {
      previousViewRef.current = currentView;
      stop(true);
      announce(`「${title}」を開きました。`);
    }
  }, [currentView, stop, announce]);

  // グローバルキーボードショートカット（Alt+R: 画面読み上げ / Alt+S: 読み上げ停止）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'r') {
        e.preventDefault();
        readCurrentScreen();
      } else if (key === 's') {
        e.preventDefault();
        stop(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readCurrentScreen, stop]);

  // アンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      clearFallbackTimer();
      if (speechSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [speechSupported]);

  return (
    <SpeechContext.Provider
      value={{
        speakingId,
        isSpeaking: speakingId !== null,
        speechSupported,
        speechRate,
        setSpeechRate,
        highContrast,
        setHighContrast,
        largeText,
        setLargeText,
        liveAnnouncement,
        announce,
        speak,
        stop,
        toggleSpeak,
        registerPrimaryReader,
        readCurrentScreen,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
};

export function useSpeech(): SpeechContextValue {
  const ctx = useContext(SpeechContext);
  if (!ctx) {
    throw new Error('useSpeech must be used within SpeechProvider');
  }
  return ctx;
}

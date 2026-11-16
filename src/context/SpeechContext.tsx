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
const STORAGE_TEXT_SCALE = 'carepita_a11y_text_scale_v2';
const STORAGE_LINE_HEIGHT_WIDE = 'carepita_a11y_line_wide_v2';
const STORAGE_COLOR_MODE = 'carepita_a11y_color_mode_v2';
const STORAGE_FONT_FAMILY = 'carepita_a11y_font_family_v2';

export type A11yTextScale = 'standard' | 'large' | 'xl';
export type A11yColorMode = 'standard' | 'high-contrast' | 'cud';
export type A11yFontFamily = 'standard' | 'rounded' | 'mincho';

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
  textScale: A11yTextScale;
  setTextScale: (scale: A11yTextScale) => void;
  wideLeading: boolean;
  setWideLeading: (enabled: boolean) => void;
  colorMode: A11yColorMode;
  setColorMode: (mode: A11yColorMode) => void;
  fontFamily: A11yFontFamily;
  setFontFamily: (font: A11yFontFamily) => void;
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

  const [textScale, setTextScaleState] = useState<A11yTextScale>(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_TEXT_SCALE);
      if (v === 'large' || v === 'xl') return v;
      return 'standard';
    } catch {
      return 'standard';
    }
  });

  const [wideLeading, setWideLeadingState] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_LINE_HEIGHT_WIDE) === '1';
    } catch {
      return false;
    }
  });

  const [colorMode, setColorModeState] = useState<A11yColorMode>(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_COLOR_MODE);
      if (v === 'high-contrast' || v === 'cud') return v;
      return 'standard';
    } catch {
      return 'standard';
    }
  });

  const [fontFamily, setFontFamilyState] = useState<A11yFontFamily>(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_FONT_FAMILY);
      if (v === 'rounded' || v === 'mincho') return v;
      return 'standard';
    } catch {
      return 'standard';
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

  const setTextScale = useCallback(
    (scale: A11yTextScale) => {
      setTextScaleState(scale);
      try {
        window.localStorage.setItem(STORAGE_TEXT_SCALE, scale);
      } catch {
        // ignore
      }
      const label =
        scale === 'xl' ? '特大' : scale === 'large' ? '大きめ' : '標準';
      announce(`文字サイズを「${label}」に設定しました。`);
    },
    [announce]
  );

  const setWideLeading = useCallback(
    (enabled: boolean) => {
      setWideLeadingState(enabled);
      try {
        window.localStorage.setItem(STORAGE_LINE_HEIGHT_WIDE, enabled ? '1' : '0');
      } catch {
        // ignore
      }
      announce(enabled ? '行間を広めに設定しました。' : '行間を標準に戻しました。');
    },
    [announce]
  );

  const setColorMode = useCallback(
    (mode: A11yColorMode) => {
      setColorModeState(mode);
      try {
        window.localStorage.setItem(STORAGE_COLOR_MODE, mode);
      } catch {
        // ignore
      }
      const label =
        mode === 'high-contrast'
          ? '高コントラスト表示'
          : mode === 'cud'
          ? '色覚サポート（青・オレンジ配色）'
          : '標準配色';
      announce(`配色設定を「${label}」に切り替えました。`);
    },
    [announce]
  );

  const setFontFamily = useCallback(
    (font: A11yFontFamily) => {
      setFontFamilyState(font);
      try {
        window.localStorage.setItem(STORAGE_FONT_FAMILY, font);
      } catch {
        // ignore
      }
      const label =
        font === 'rounded'
          ? '読みやすい丸ゴシック'
          : font === 'mincho'
          ? '明朝体'
          : '標準ゴシック';
      announce(`書体を「${label}」に設定しました。`);
    },
    [announce]
  );

  const highContrast = colorMode === 'high-contrast';
  const setHighContrast = useCallback(
    (enabled: boolean) => {
      setColorMode(enabled ? 'high-contrast' : 'standard');
    },
    [setColorMode]
  );

  const largeText = textScale !== 'standard';
  const setLargeText = useCallback(
    (enabled: boolean) => {
      setTextScale(enabled ? 'large' : 'standard');
    },
    [setTextScale]
  );

  // DOM クラス反映
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('a11y-large-text', textScale === 'large');
    root.classList.toggle('a11y-xl-text', textScale === 'xl');
    root.classList.toggle('a11y-wide-leading', wideLeading);
    root.classList.toggle('a11y-high-contrast', colorMode === 'high-contrast');
    root.classList.toggle('a11y-color-cud', colorMode === 'cud');
    root.classList.toggle('a11y-font-rounded', fontFamily === 'rounded');
    root.classList.toggle('a11y-font-mincho', fontFamily === 'mincho');
  }, [textScale, wideLeading, colorMode, fontFamily]);

  // 画面遷移時：読み上げ停止 + document.title更新 + アナウンス
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

  // キーボードショートカット (Alt+R / Alt+S)
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
        textScale,
        setTextScale,
        wideLeading,
        setWideLeading,
        colorMode,
        setColorMode,
        fontFamily,
        setFontFamily,
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

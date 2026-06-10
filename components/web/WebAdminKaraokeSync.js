import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiBaseUrl } from '../../constants/api';
import {
  aiSyncKaraokeLyrics,
  autoSyncKaraokeLyrics,
  fetchKaraokeAiConfig,
  updateMusicTrack,
} from '../../api/musicApi';
import { buildAutoLyricsTimings } from '../../utils/autoLyricsTimings';
import { formatLyricTime, parseLyrics } from '../../utils/parseLyrics';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';

function formatClock(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function WebAdminKaraokeSync({ track, description, onTimingsSaved }) {
  const { isMobile } = useWebBreakpoint();
  const lines = useMemo(() => parseLyrics(description), [description]);
  const audioRef = useRef(null);

  const [timings, setTimings] = useState(() => {
    if (track.lyricsTimings?.length === lines.length) {
      return [...track.lyricsTimings];
    }
    return lines.map(() => null);
  });
  const [syncIndex, setSyncIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [saving, setSaving] = useState(false);
  const [autosyncing, setAutosyncing] = useState(false);
  const [aiSyncing, setAiSyncing] = useState(false);
  const [geminiReady, setGeminiReady] = useState(false);
  const [geminiModel, setGeminiModel] = useState('');
  const [trackDuration, setTrackDuration] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const audioUrl =
    Platform.OS === 'web'
      ? `${getApiBaseUrl()}/music/${encodeURIComponent(track.filename)}`
      : null;

  const allMarked =
    lines.length > 0 && timings.length === lines.length && timings.every((t) => t != null);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    let cancelled = false;
    fetchKaraokeAiConfig()
      .then((config) => {
        if (cancelled) return;
        setGeminiReady(Boolean(config.configured));
        setGeminiModel(config.model || '');
      })
      .catch(() => {
        if (!cancelled) {
          setGeminiReady(false);
          setGeminiModel('');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (track.lyricsTimings?.length === lines.length) {
      setTimings([...track.lyricsTimings]);
      setSyncIndex(lines.length);
    } else {
      setTimings(lines.map(() => null));
      setSyncIndex(0);
    }
  }, [track.filename, description, lines.length]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !audioUrl) return undefined;

    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentSec(audio.currentTime);
    const onLoadedMetadata = () => {
      const duration = audio.duration;
      if (Number.isFinite(duration) && duration > 0) {
        setTrackDuration(duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentSec(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    if (Platform.OS !== 'web' || !audioRef.current) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setError('Не удалось воспроизвести. Запустите npm start');
    }
  };

  const handleMarkLine = () => {
    if (!lines.length || syncIndex >= lines.length) return;

    const time = audioRef.current?.currentTime ?? currentSec;
    const prev = syncIndex > 0 ? timings[syncIndex - 1] : -1;

    if (prev >= 0 && time < prev) {
      setError('Время должно быть позже предыдущей строки');
      return;
    }

    setError('');
    const next = [...timings];
    next[syncIndex] = Math.round(time * 100) / 100;
    setTimings(next);
    setSyncIndex(syncIndex + 1);
    setMessage(`Строка ${syncIndex + 1}: ${formatLyricTime(time)}`);
  };

  const handleGoBack = () => {
    if (syncIndex <= 0) return;

    const targetIndex =
      syncIndex >= lines.length ? lines.length - 1 : syncIndex - 1;

    const next = [...timings];
    for (let i = targetIndex; i < lines.length; i += 1) {
      next[i] = null;
    }

    setTimings(next);
    setSyncIndex(targetIndex);
    setError('');
    setMessage(
      `Вернулись к строке ${targetIndex + 1} — отметьте снова`
    );

    const seekTo =
      targetIndex > 0 && next[targetIndex - 1] != null
        ? next[targetIndex - 1]
        : 0;

    if (audioRef.current) {
      audioRef.current.currentTime = seekTo;
      setCurrentSec(seekTo);
    }
  };

  const applyTimings = (nextTimings, durationSec, saved, kind, modelUsed) => {
    setTimings([...nextTimings]);
    setSyncIndex(lines.length);
    setError('');
    if (kind === 'ai') {
      const modelNote = modelUsed ? ` (${modelUsed})` : '';
      setMessage(
        saved
          ? `ИИ (Gemini) сохранён${modelNote}: ${lines.length} строк, ${formatClock(durationSec)}`
          : `ИИ (Gemini)${modelNote}: ${lines.length} строк. Проверьте по аудио и подправьте при необходимости.`
      );
      return;
    }
    setMessage(
      saved
        ? `Автосинхронизация сохранена (${lines.length} строк, ${formatClock(durationSec)})`
        : `Автосинхронизация: ${lines.length} строк. Прослушайте и подправьте вручную при необходимости.`
    );
  };

  const applyAutoTimings = (nextTimings, durationSec, saved = false) => {
    applyTimings(nextTimings, durationSec, saved, 'auto');
  };

  const handleAutoSync = async (saveAfter = false) => {
    if (!lines.length) return;

    setAutosyncing(true);
    setError('');

    try {
      const result = await autoSyncKaraokeLyrics(track.filename, {
        description,
        save: saveAfter,
      });
      applyAutoTimings(result.lyricsTimings, result.durationSec, saveAfter);
      if (saveAfter) {
        onTimingsSaved?.(result);
      }
    } catch (apiErr) {
      const duration = trackDuration || audioRef.current?.duration;
      if (!duration || !Number.isFinite(duration) || duration <= 0) {
        setError(
          apiErr.message ||
            'Не удалось автосинхронизацию. Запустите npm start или дождитесь загрузки аудио.'
        );
        return;
      }

      const fallback = buildAutoLyricsTimings(lines, duration);
      if (fallback.length !== lines.length) {
        setError(apiErr.message || 'Не удалось построить метки');
        return;
      }

      if (saveAfter) {
        try {
          const result = await updateMusicTrack(track.filename, {
            description,
            lyricsTimings: fallback,
          });
          applyAutoTimings(fallback, duration, true);
          onTimingsSaved?.(result);
        } catch (saveErr) {
          setError(saveErr.message || 'Не удалось сохранить');
        }
      } else {
        applyAutoTimings(fallback, duration, false);
      }
    } finally {
      setAutosyncing(false);
    }
  };

  const handleAiSync = async (saveAfter = false) => {
    if (!lines.length) return;
    if (!geminiReady) {
      setError(
        'Добавьте GEMINI_API_KEY в .env в корне проекта и перезапустите npm start'
      );
      return;
    }

    setAiSyncing(true);
    setError('');
    setMessage('ИИ слушает трек… это может занять 30–90 секунд');

    try {
      const result = await aiSyncKaraokeLyrics(track.filename, {
        description,
        save: saveAfter,
      });
      if (result.model) {
        setGeminiModel(result.model);
      }
      applyTimings(
        result.lyricsTimings,
        result.durationSec,
        saveAfter,
        'ai',
        result.model
      );
      if (saveAfter) {
        onTimingsSaved?.(result);
      }
    } catch (err) {
      setError(err.message || 'ИИ-синхронизация не удалась');
      setMessage('');
    } finally {
      setAiSyncing(false);
    }
  };

  const busy = autosyncing || aiSyncing || saving;

  const handleResetSync = () => {
    setTimings(lines.map(() => null));
    setSyncIndex(0);
    setMessage('');
    setError('');
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentSec(0);
    }
  };

  const handleSaveTimings = async () => {
    if (!allMarked) {
      setError('Отметьте все строки перед сохранением');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const result = await updateMusicTrack(track.filename, {
        description,
        lyricsTimings: timings,
      });
      setMessage('Синхронизация сохранена');
      onTimingsSaved?.(result);
    } catch (err) {
      setError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <Text style={styles.webOnly}>
        Синхронизация караоке доступна только в веб-админке
      </Text>
    );
  }

  if (!lines.length) {
    return (
      <Text style={styles.hint}>
        Сначала добавьте текст песни (каждая строка с новой строки)
      </Text>
    );
  }

  const currentLine = lines[syncIndex] ?? lines[lines.length - 1];

  return (
    <View style={styles.box}>
      <Text style={styles.sectionTitle}>Синхронизация караоке</Text>
      <Text style={styles.instructions}>
        ИИ (Gemini): слушает MP3 и ставит метки по вашему тексту — точнее авто.{'\n'}
        Авто: быстрый черновик по длине строк.{'\n'}
        Вручную: «Слушать» → «Отметить эту строку» → «Сохранить»
      </Text>

      <View style={[styles.aiRow, isMobile && styles.autoRowMobile]}>
        <Pressable
          style={[
            styles.aiBtn,
            (!geminiReady || busy) && styles.autoBtnDisabled,
          ]}
          onPress={() => handleAiSync(false)}
          disabled={!geminiReady || busy}
        >
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.aiBtnText}>
            {aiSyncing ? 'ИИ слушает…' : 'ИИ (Gemini)'}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.aiSaveBtn,
            (!geminiReady || busy) && styles.autoBtnDisabled,
          ]}
          onPress={() => handleAiSync(true)}
          disabled={!geminiReady || busy}
        >
          <Text style={styles.aiSaveBtnText}>ИИ и сохранить</Text>
        </Pressable>
      </View>
      {geminiReady ? (
        <Text style={styles.aiHint}>
          Модель: {geminiModel || 'gemini'}. Ключ загружен с сервера.
        </Text>
      ) : (
        <Text style={styles.aiHintWarn}>
          ИИ выключен: создайте .env с GEMINI_API_KEY (см. .env.example) и
          перезапустите npm start
        </Text>
      )}

      <View style={[styles.autoRow, isMobile && styles.autoRowMobile]}>
        <Pressable
          style={[styles.autoBtn, busy && styles.autoBtnDisabled]}
          onPress={() => handleAutoSync(false)}
          disabled={busy}
        >
          <Ionicons name="flash" size={18} color="#fff" />
          <Text style={styles.autoBtnText}>
            {autosyncing ? 'Считаем...' : 'Автосинхронизация'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.autoSaveBtn, busy && styles.autoBtnDisabled]}
          onPress={() => handleAutoSync(true)}
          disabled={busy}
        >
          <Text style={styles.autoSaveBtnText}>Авто и сохранить</Text>
        </Pressable>
      </View>

      <View style={styles.playerRow}>
        <Pressable style={styles.playBtn} onPress={togglePlay}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#fff" />
          <Text style={styles.playBtnText}>
            {isPlaying ? 'Пауза' : 'Слушать'}
          </Text>
        </Pressable>
        <Text style={styles.clock}>{formatClock(currentSec)}</Text>
      </View>

      <View style={styles.currentLineBox}>
        <Text style={styles.currentLabel}>
          {syncIndex < lines.length
            ? `Строка ${syncIndex + 1} из ${lines.length}`
            : 'Все строки отмечены'}
        </Text>
        <Text style={styles.currentLine}>{currentLine}</Text>
      </View>

      <View style={[styles.markRow, isMobile && styles.markRowMobile]}>
        <Pressable
          style={[
            styles.backBtn,
            isMobile && styles.backBtnMobile,
            syncIndex <= 0 && styles.backBtnDisabled,
          ]}
          onPress={handleGoBack}
          disabled={syncIndex <= 0}
        >
          <Ionicons name="arrow-undo" size={20} color="#111" />
          <Text style={styles.backBtnText}>Назад</Text>
        </Pressable>

        <Pressable
          style={[
            styles.markBtn,
            syncIndex >= lines.length && styles.markBtnDisabled,
          ]}
          onPress={handleMarkLine}
          disabled={syncIndex >= lines.length}
        >
          <Ionicons name="radio-button-on" size={20} color="#fff" />
          <Text style={styles.markBtnText}>
            {syncIndex < lines.length
              ? 'Отметить эту строку'
              : 'Готово'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.actionsRow, isMobile && styles.actionsRowMobile]}>
        <Pressable
          style={[styles.secondaryBtn, isMobile && styles.secondaryBtnMobile]}
          onPress={handleResetSync}
        >
          <Text style={styles.secondaryBtnText}>Сбросить</Text>
        </Pressable>
        <Pressable
          style={[
            styles.saveBtn,
            isMobile && styles.saveBtnMobile,
            (!allMarked || saving) && styles.saveBtnDisabled,
          ]}
          onPress={handleSaveTimings}
          disabled={!allMarked || saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Сохранение...' : 'Сохранить синхронизацию'}
          </Text>
        </Pressable>
      </View>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.linesList, isMobile && styles.linesListMobile]}>
        {lines.map((line, index) => (
          <View
            key={`${index}-${line}`}
            style={[
              styles.lineRow,
              index === syncIndex && styles.lineRowActive,
              timings[index] != null && styles.lineRowDone,
            ]}
          >
            <Text style={styles.lineIndex}>{index + 1}</Text>
            <Text style={styles.lineText} numberOfLines={2}>
              {line}
            </Text>
            <Text style={styles.lineTime}>
              {formatLyricTime(timings[index])}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  aiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  aiBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 10,
  },
  aiSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  aiSaveBtnText: {
    color: '#5b21b6',
    fontWeight: '700',
    fontSize: 14,
  },
  aiHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  aiHintWarn: {
    fontSize: 12,
    color: '#b45309',
    marginBottom: 12,
    lineHeight: 18,
  },
  autoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  autoRowMobile: {
    flexDirection: 'column',
  },
  autoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
  },
  autoSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoBtnDisabled: {
    opacity: 0.55,
  },
  autoBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  autoSaveBtnText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 14,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  playBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  clock: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  currentLineBox: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#111',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  currentLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  currentLine: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  markRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  markRowMobile: {
    flexDirection: 'column',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#111',
    backgroundColor: '#fff',
  },
  backBtnMobile: {
    width: '100%',
    justifyContent: 'center',
  },
  backBtnDisabled: {
    opacity: 0.35,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  markBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#c00',
    paddingVertical: 16,
    borderRadius: 12,
  },
  markBtnDisabled: {
    backgroundColor: '#999',
  },
  markBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionsRowMobile: {
    flexDirection: 'column',
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryBtnMobile: {
    width: '100%',
    minHeight: 48,
  },
  secondaryBtnText: {
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  saveBtnMobile: {
    width: '100%',
    minHeight: 48,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  success: {
    color: '#0a7a2f',
    marginBottom: 8,
  },
  error: {
    color: '#c00',
    marginBottom: 8,
  },
  linesList: {
    gap: 6,
    maxHeight: 220,
  },
  linesListMobile: {
    maxHeight: undefined,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  lineRowActive: {
    borderWidth: 2,
    borderColor: '#c00',
  },
  lineRowDone: {
    opacity: 0.85,
  },
  lineIndex: {
    width: 24,
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  lineText: {
    flex: 1,
    fontSize: 13,
  },
  lineTime: {
    fontSize: 12,
    color: '#111',
    fontWeight: '600',
    minWidth: 48,
    textAlign: 'right',
  },
  hint: {
    fontSize: 13,
    color: '#888',
    marginTop: 16,
  },
  webOnly: {
    fontSize: 13,
    color: '#888',
    marginTop: 16,
  },
});

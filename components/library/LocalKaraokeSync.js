import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';
import { formatLyricTime, parseLyrics } from '../../utils/parseLyrics';

function formatClock(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function LocalKaraokeSync({
  audioUri,
  description,
  lyricsTimings = [],
  onSaveTimings,
}) {
  const lines = useMemo(() => parseLyrics(description), [description]);
  const playerRef = useRef(null);
  const listenerRef = useRef(null);

  const [timings, setTimings] = useState([]);
  const [syncIndex, setSyncIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (lyricsTimings?.length === lines.length) {
      setTimings([...lyricsTimings]);
      setSyncIndex(lines.length);
    } else {
      setTimings(lines.map(() => null));
      setSyncIndex(0);
    }
  }, [audioUri, description, lines.length, lyricsTimings]);

  useEffect(() => {
    if (!audioUri) return undefined;

    const player = createAudioPlayer({ uri: audioUri });
    playerRef.current = player;

    const listener = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.isLoaded) return;
      setCurrentSec(status.currentTime || 0);
      if (status.duration > 0) {
        setDurationSec(status.duration);
      }
      setIsPlaying(!!status.playing);
    });

    listenerRef.current = listener;

    return () => {
      listener.remove();
      player.remove();
      playerRef.current = null;
      listenerRef.current = null;
    };
  }, [audioUri]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekTo = (seconds) => {
    const player = playerRef.current;
    if (!player) return;
    const safe = Math.max(0, seconds);
    player.seekTo(safe).catch(() => {});
    setCurrentSec(safe);
  };

  const markLine = () => {
    if (!lines.length || syncIndex >= lines.length) return;
    const time = Math.round(currentSec * 100) / 100;
    const prev = syncIndex > 0 ? timings[syncIndex - 1] : -1;
    if (prev >= 0 && time < prev) {
      setMessage('Время должно быть позже предыдущей строки');
      return;
    }
    const next = [...timings];
    next[syncIndex] = time;
    setTimings(next);
    setSyncIndex((value) => Math.min(value + 1, lines.length));
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
    const seekToSec =
      targetIndex > 0 && next[targetIndex - 1] != null
        ? next[targetIndex - 1]
        : 0;
    seekTo(seekToSec);
    setMessage(`Строка ${targetIndex + 1} — отметьте снова`);
  };

  const handleLinePress = (index) => {
    if (index < 0 || index >= lines.length) return;
    const next = [...timings];
    for (let i = index; i < lines.length; i += 1) {
      next[i] = null;
    }
    setTimings(next);
    setSyncIndex(index);
    const seekToSec =
      index > 0 && next[index - 1] != null ? next[index - 1] : 0;
    seekTo(seekToSec);
    setMessage(`Строка ${index + 1} — нажмите «Отметить» в нужный момент`);
  };

  const resetTimings = () => {
    setTimings(lines.map(() => null));
    setSyncIndex(0);
    setMessage('');
  };

  const handleSave = async () => {
    const complete =
      lines.length > 0 &&
      timings.length === lines.length &&
      timings.every((value) => typeof value === 'number');

    if (!complete) {
      setMessage('Отметьте все строки или используйте авто-синхрон');
      return;
    }

    setSaving(true);
    try {
      await onSaveTimings?.(timings);
      setMessage('Тайминги сохранены');
    } finally {
      setSaving(false);
    }
  };

  if (!lines.length) {
    return (
      <Text style={styles.hint}>
        Добавьте текст песни выше, чтобы настроить караоке вручную.
      </Text>
    );
  }

  const allMarked =
    timings.length === lines.length &&
    timings.every((value) => typeof value === 'number');

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Ручная синхронизация</Text>
      <Text style={styles.hint}>
        Включите трек и нажимайте «Отметить» в момент каждой строки.
      </Text>

      <View style={styles.transport}>
        <Pressable style={styles.playBtn} onPress={togglePlay}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#fff" />
        </Pressable>
        <Text style={styles.clock}>
          {formatClock(currentSec)}
          {durationSec > 0 ? ` / ${formatClock(durationSec)}` : ''}
        </Text>
        <Pressable
          style={[styles.backLineBtn, syncIndex <= 0 && styles.backLineBtnDisabled]}
          onPress={handleGoBack}
          disabled={syncIndex <= 0}
        >
          <Ionicons name="arrow-undo" size={18} color="#111" />
        </Pressable>
        <Pressable
          style={[styles.markBtn, syncIndex >= lines.length && styles.markBtnDone]}
          onPress={markLine}
          disabled={syncIndex >= lines.length}
        >
          <Text style={styles.markBtnText}>
            {syncIndex >= lines.length ? 'Готово' : `Отметить ${syncIndex + 1}`}
          </Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.ghostBtn} onPress={resetTimings}>
          <Text style={styles.ghostBtnText}>Сбросить</Text>
        </Pressable>
        <Pressable
          style={[styles.saveBtn, !allMarked && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || !allMarked}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Сохранить тайминги</Text>
          )}
        </Pressable>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.lines}>
        {lines.map((line, index) => {
          const active = index === syncIndex && syncIndex < lines.length;
          const marked = typeof timings[index] === 'number';
          return (
            <Pressable
              key={`${index}-${line.slice(0, 12)}`}
              style={[
                styles.lineRow,
                active && styles.lineRowActive,
                marked && styles.lineRowMarked,
              ]}
              onPress={() => handleLinePress(index)}
            >
              <Text style={styles.lineIndex}>{index + 1}</Text>
              <Text style={styles.lineText} numberOfLines={2}>
                {line}
              </Text>
              {marked ? (
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              ) : null}
              <Text style={[styles.lineTime, marked && styles.lineTimeMarked]}>
                {marked ? formatLyricTime(timings[index]) : '—'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ececec',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#777',
    lineHeight: 17,
    marginBottom: 12,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  clock: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  backLineBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backLineBtnDisabled: {
    opacity: 0.35,
  },
  markBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  markBtnDone: {
    backgroundColor: '#666',
  },
  markBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  ghostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ghostBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  message: {
    fontSize: 12,
    color: '#444',
    marginBottom: 8,
  },
  lines: {
    gap: 6,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  lineRowActive: {
    borderWidth: 1,
    borderColor: '#111',
  },
  lineRowMarked: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  lineIndex: {
    width: 22,
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
  },
  lineText: {
    flex: 1,
    fontSize: 13,
    color: '#222',
  },
  lineTime: {
    fontSize: 12,
    color: '#666',
    fontVariant: ['tabular-nums'],
  },
  lineTimeMarked: {
    color: '#166534',
    fontWeight: '600',
  },
});

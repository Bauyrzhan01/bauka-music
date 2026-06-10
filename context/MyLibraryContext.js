import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
  loadMyLibraryEntries,
  saveMyLibraryEntries,
} from '../storage/myLibraryStorage';
import {
  deleteLibraryFile,
  importAudioToLibrary,
  importCoverToLibrary,
  importVideoToLibrary,
  titleFromFileName,
  verifyLibraryFile,
} from '../utils/myLibraryFiles';
import { localLibraryEntriesToTracks } from '../utils/localLibraryToTrack';
import { autoSyncKaraokeLocal } from '../utils/karaokeAutoLocal';
import {
  exportLibraryZip,
  pickAndImportLibraryZip,
} from '../utils/libraryBackup';
import { pickProfileImage } from '../utils/pickProfileImage';
import { resolveDeviceMusicUri } from '../utils/importFromDeviceMusic';
import {
  buildImportEntryFields,
  enrichAllLibraryEntries,
  enrichLibraryEntry,
  lyricsNeedAutoSync,
} from '../utils/autoLibraryEnrich';

const MyLibraryContext = createContext(null);

function createEntry(partial) {
  const now = new Date().toISOString();
  return {
    id: partial.id,
    title: partial.title || 'Без названия',
    artist: partial.artist || 'Я',
    description: partial.description || '',
    lyricsTimings: partial.lyricsTimings || [],
    clipUrl: partial.clipUrl || '',
    audioUri: partial.audioUri,
    coverUri: partial.coverUri || null,
    videos: partial.videos || [],
    createdAt: partial.createdAt || now,
    updatedAt: now,
  };
}

export function MyLibraryProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const hydrate = useCallback(async () => {
    const saved = await loadMyLibraryEntries();
    const verified = [];

    for (const entry of saved) {
      const audioOk = await verifyLibraryFile(entry.audioUri);
      if (!audioOk) continue;

      const videos = [];
      for (const video of entry.videos || []) {
        if (await verifyLibraryFile(video.uri)) {
          videos.push(video);
        } else {
          await deleteLibraryFile(video.uri);
        }
      }

      let coverUri = entry.coverUri;
      if (coverUri && !(await verifyLibraryFile(coverUri))) {
        coverUri = null;
      }

      verified.push({ ...entry, videos, coverUri });
    }

    if (verified.length !== saved.length) {
      await saveMyLibraryEntries(verified);
    }

    setEntries(verified);
    setReady(true);

    const needsAutomation = verified.some(
      (entry) =>
        !entry.coverUri ||
        (entry.description?.trim() && !entry.lyricsTimings?.length)
    );

    if (!needsAutomation) return;

    enrichAllLibraryEntries(verified)
      .then(async ({ entries: enriched }) => {
        if (JSON.stringify(enriched) === JSON.stringify(verified)) return;
        setEntries(enriched);
        await saveMyLibraryEntries(enriched);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const catalogTracks = useMemo(
    () => localLibraryEntriesToTracks(entries),
    [entries]
  );

  const persist = useCallback(async (next) => {
    setEntries(next);
    await saveMyLibraryEntries(next);
  }, []);

  const pickAndAddTrack = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.length) {
      return { ok: false, cancelled: true };
    }

    setBusy(true);
    try {
      const asset = result.assets[0];
      const imported = await importAudioToLibrary(asset.uri, asset.name);
      const meta = await buildImportEntryFields({ filename: asset.name });
      let entry = createEntry({
        id: imported.trackId,
        title: meta.title,
        artist: meta.artist,
        audioUri: imported.audioUri,
      });
      const { patch } = await enrichLibraryEntry(entry, { karaoke: false });
      entry = { ...entry, ...patch };
      const next = [entry, ...entries];
      await persist(next);
      return { ok: true, entry };
    } catch (error) {
      return { ok: false, error: error.message || 'Не удалось добавить трек' };
    } finally {
      setBusy(false);
    }
  }, [entries, persist]);

  const updateEntry = useCallback(
    async (id, patch) => {
      const index = entries.findIndex((item) => item.id === id);
      if (index < 0) return { ok: false, error: 'Трек не найден' };

      let merged = {
        ...entries[index],
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      const timingsForCheck =
        patch.lyricsTimings !== undefined
          ? patch.lyricsTimings
          : merged.lyricsTimings;
      const runKaraoke = lyricsNeedAutoSync(merged.description, timingsForCheck);

      const { patch: autoPatch, notes } = await enrichLibraryEntry(merged, {
        author: Boolean(patch.artist) || !merged.coverUri,
        cover: !merged.coverUri,
        karaoke: runKaraoke,
      });

      if (Object.keys(autoPatch).length) {
        merged = {
          ...merged,
          ...autoPatch,
          updatedAt: new Date().toISOString(),
        };
      }

      const next = [...entries];
      next[index] = merged;
      await persist(next);
      return { ok: true, entry: merged, autoNotes: notes };
    },
    [entries, persist]
  );

  const autoSyncKaraoke = useCallback(
    async (id) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry) return { ok: false, error: 'Трек не найден' };

      try {
        const result = await autoSyncKaraokeLocal(
          entry.audioUri,
          entry.description
        );
        await updateEntry(id, { lyricsTimings: result.lyricsTimings });
        return { ok: true, ...result };
      } catch (error) {
        return { ok: false, error: error.message || 'Ошибка синхронизации' };
      }
    },
    [entries, updateEntry]
  );

  const addVideoToEntry = useCallback(
    async (id) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry) return { ok: false, error: 'Трек не найден' };

      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return { ok: false, cancelled: true };
      }

      setBusy(true);
      try {
        const asset = result.assets[0];
        const imported = await importVideoToLibrary(
          asset.uri,
          asset.name,
          entry.id
        );
        const video = {
          id: imported.videoId,
          title: titleFromFileName(asset.name),
          uri: imported.uri,
          createdAt: new Date().toISOString(),
        };
        await updateEntry(id, {
          videos: [...(entry.videos || []), video],
        });
        return { ok: true, video };
      } catch (error) {
        return { ok: false, error: error.message || 'Не удалось добавить видео' };
      } finally {
        setBusy(false);
      }
    },
    [entries, updateEntry]
  );

  const removeVideoFromEntry = useCallback(
    async (trackId, videoId) => {
      const entry = entries.find((item) => item.id === trackId);
      if (!entry) return { ok: false };

      const video = (entry.videos || []).find((item) => item.id === videoId);
      if (video) {
        await deleteLibraryFile(video.uri);
      }

      await updateEntry(trackId, {
        videos: (entry.videos || []).filter((item) => item.id !== videoId),
      });
      return { ok: true };
    },
    [entries, updateEntry]
  );

  const deleteEntry = useCallback(
    async (id) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry) return { ok: false };

      await deleteLibraryFile(entry.audioUri);
      await deleteLibraryFile(entry.coverUri);
      for (const video of entry.videos || []) {
        await deleteLibraryFile(video.uri);
      }

      const next = entries.filter((item) => item.id !== id);
      await persist(next);
      return { ok: true };
    },
    [entries, persist]
  );

  const getEntryById = useCallback(
    (id) => entries.find((item) => item.id === id) || null,
    [entries]
  );

  const setCoverForEntry = useCallback(
    async (id) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry) return { ok: false, error: 'Трек не найден' };

      const picked = await pickProfileImage();
      if (picked.cancelled) return { ok: false, cancelled: true };
      if (!picked.ok) {
        return { ok: false, error: picked.error || 'Не удалось выбрать фото' };
      }

      setBusy(true);
      try {
        if (entry.coverUri) {
          await deleteLibraryFile(entry.coverUri);
        }
        const coverUri = await importCoverToLibrary(picked.uri, id);
        await updateEntry(id, { coverUri });
        return { ok: true, coverUri };
      } catch (error) {
        return { ok: false, error: error.message || 'Не удалось сохранить обложку' };
      } finally {
        setBusy(false);
      }
    },
    [entries, updateEntry]
  );

  const removeCoverForEntry = useCallback(
    async (id) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry?.coverUri) return { ok: true };
      await deleteLibraryFile(entry.coverUri);
      await updateEntry(id, { coverUri: null });
      return { ok: true };
    },
    [entries, updateEntry]
  );

  const exportBackup = useCallback(async () => {
    setBusy(true);
    try {
      const path = await exportLibraryZip(entries);
      return { ok: true, path };
    } catch (error) {
      return { ok: false, error: error.message || 'Не удалось экспортировать' };
    } finally {
      setBusy(false);
    }
  }, [entries]);

  const importDeviceMusicAssets = useCallback(
    async (assets) => {
      if (!assets?.length) {
        return { ok: false, cancelled: true };
      }

      setBusy(true);
      try {
        const imported = [];

        for (const asset of assets) {
          const sourceUri = await resolveDeviceMusicUri(asset);
          const importedFile = await importAudioToLibrary(
            sourceUri,
            asset.filename
          );
          const meta = await buildImportEntryFields({
            filename: asset.filename,
            asset,
          });
          let entry = createEntry({
            id: importedFile.trackId,
            title: meta.title,
            artist: meta.artist,
            audioUri: importedFile.audioUri,
          });
          const { patch } = await enrichLibraryEntry(entry, { karaoke: false });
          imported.push({ ...entry, ...patch });
        }

        const next = [...imported, ...entries];
        await persist(next);
        return { ok: true, count: imported.length, entries: imported };
      } catch (error) {
        return {
          ok: false,
          error: error.message || 'Не удалось импортировать с телефона',
        };
      } finally {
        setBusy(false);
      }
    },
    [entries, persist]
  );

  const importBackup = useCallback(
    async ({ replace = false } = {}) => {
      setBusy(true);
      try {
        const existingIds = new Set(entries.map((item) => item.id));
        const result = await pickAndImportLibraryZip(existingIds);
        if (result.cancelled) {
          return { ok: false, cancelled: true };
        }
        if (!result.entries?.length) {
          return { ok: false, error: 'В резервной копии нет треков' };
        }

        if (replace) {
          for (const entry of entries) {
            await deleteLibraryFile(entry.audioUri);
            await deleteLibraryFile(entry.coverUri);
            for (const video of entry.videos || []) {
              await deleteLibraryFile(video.uri);
            }
          }
        }

        const next = replace
          ? result.entries
          : [...result.entries, ...entries];
        await persist(next);
        return { ok: true, count: result.count };
      } catch (error) {
        return { ok: false, error: error.message || 'Не удалось импортировать' };
      } finally {
        setBusy(false);
      }
    },
    [entries, persist]
  );

  const runBatchAutomation = useCallback(async () => {
    setBusy(true);
    try {
      const { entries: enriched, stats } = await enrichAllLibraryEntries(entries);
      await persist(enriched);
      return { ok: true, stats };
    } catch (error) {
      return {
        ok: false,
        error: error.message || 'Не удалось автоматизировать',
      };
    } finally {
      setBusy(false);
    }
  }, [entries, persist]);

  return (
    <MyLibraryContext.Provider
      value={{
        entries,
        catalogTracks,
        ready,
        busy,
        refreshLibrary: hydrate,
        pickAndAddTrack,
        updateEntry,
        autoSyncKaraoke,
        addVideoToEntry,
        removeVideoFromEntry,
        deleteEntry,
        getEntryById,
        setCoverForEntry,
        removeCoverForEntry,
        exportBackup,
        importBackup,
        importDeviceMusicAssets,
        importCoverToLibrary,
        runBatchAutomation,
      }}
    >
      {children}
    </MyLibraryContext.Provider>
  );
}

export function useMyLibrary() {
  const context = useContext(MyLibraryContext);
  if (!context) {
    throw new Error('useMyLibrary используется вне MyLibraryProvider');
  }
  return context;
}

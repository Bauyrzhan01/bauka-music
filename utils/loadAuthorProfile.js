import { isStandaloneApp } from '../constants/standalone';
import { fetchAuthor } from '../api/authorsApi';
import { LOCAL_TRACKS } from '../data/localTracks';
import { loadLocalAuthors } from '../storage/localAuthorsStorage';
import {
  buildAuthorsFromTracks,
  findAuthorForTrack,
  findStoredAuthor,
  mergeStoredAuthors,
} from './localAuthors';
import { resolveAuthorAvatarUrl } from './resolveServerMediaUrl';

function normalize(text) {
  return String(text || '')
    .trim()
    .toLowerCase();
}

export function getTracksForAuthor(authorId, allTracks = LOCAL_TRACKS) {
  if (authorId.startsWith('artist:')) {
    const artistName = authorId.slice('artist:'.length);
    return allTracks.filter(
      (track) => normalize(track.artist) === normalize(artistName)
    );
  }

  return allTracks.filter((track) => track.authorId === authorId);
}

export async function loadAuthorProfile(
  authorId,
  authorName = '',
  allTracks = LOCAL_TRACKS
) {
  const tracks = getTracksForAuthor(authorId, allTracks);
  let name = authorName;
  let bio = '';
  let avatarUrl = null;
  let avatarPath = null;

  if (isStandaloneApp()) {
    const storedAuthors = await loadLocalAuthors();
    const stored = findStoredAuthor(storedAuthors, authorId);
    const derivedAuthors = buildAuthorsFromTracks(allTracks);
    const mergedAuthors = mergeStoredAuthors(derivedAuthors, storedAuthors);
    const fromCatalog = findAuthorForTrack(mergedAuthors, {
      authorId,
      artist: authorName || tracks[0]?.artist,
    });

    if (fromCatalog) {
      name = fromCatalog.name || name;
      bio = fromCatalog.bio || '';
      avatarUrl = fromCatalog.avatarUrl || null;
    } else if (stored) {
      name = stored.name || name;
      bio = stored.bio || '';
      avatarUrl = stored.avatarUri || null;
    }
  } else if (!authorId.startsWith('artist:')) {
    try {
      const data = await fetchAuthor(authorId);
      if (data) {
        name = data.name || name;
        bio = data.bio || '';
        avatarUrl = data.avatarUrl || null;
        avatarPath = data.avatarPath || null;
      }
    } catch {
      // offline — use local name
    }
  }

  if (!name) {
    name = tracks[0]?.artist || 'Автор';
  }

  const profile = {
    id: authorId,
    name: name || 'Автор',
    bio: bio || '',
    avatarPath,
    avatarUrl: avatarUrl || null,
    tracks,
    trackCount: tracks.length,
  };

  profile.avatarUrl = resolveAuthorAvatarUrl(profile);
  return profile;
}

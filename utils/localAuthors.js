function normalize(text) {
  return String(text || '')
    .trim()
    .toLowerCase();
}

export function normalizeAuthorName(name) {
  return normalize(name);
}

export function resolveTrackAuthorId(track) {
  if (!track) return null;
  if (track.authorId) return track.authorId;
  const trimmed = track.artist?.trim();
  return trimmed ? authorIdFromName(trimmed) : null;
}

export function findAuthorForTrack(authors = [], track) {
  if (!track) return null;

  const authorId = resolveTrackAuthorId(track);
  const artistName = track.artist || '';

  if (authorId) {
    const byId = authors.find((item) => item.id === authorId);
    if (byId) return byId;

    const byDerivedId = authors.find(
      (item) => authorIdFromName(item.name) === authorId
    );
    if (byDerivedId) return byDerivedId;

    if (authorId.startsWith('artist:')) {
      const fromId = authorId.slice('artist:'.length);
      const normFromId = normalize(fromId);
      if (normFromId) {
        const byNormId = authors.find(
          (item) => normalize(item.name) === normFromId
        );
        if (byNormId) return byNormId;
      }
    }
  }

  const normArtist = normalize(artistName);
  if (normArtist) {
    return (
      authors.find((item) => normalize(item.name) === normArtist) || null
    );
  }

  return null;
}

export function authorIdFromName(name) {
  const trimmed = String(name || '').trim();
  return trimmed ? `artist:${trimmed}` : 'artist:Автор';
}

export function buildAuthorsFromTracks(tracks = []) {
  const map = new Map();

  for (const track of tracks) {
    const authorId = track.authorId;
    const artist = track.artist || 'Автор';
    const key = authorId || `artist:${normalize(artist)}`;
    const id = authorId || `artist:${artist}`;

    if (!map.has(key)) {
      map.set(key, {
        id,
        name: artist,
        bio: '',
        avatarUrl: null,
        trackCount: 0,
      });
    }

    map.get(key).trackCount += 1;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'ru')
  );
}

export function mergeStoredAuthors(derivedAuthors = [], storedAuthors = []) {
  const derivedByName = new Map(
    derivedAuthors.map((author) => [normalize(author.name), author])
  );
  const seenNames = new Set();

  const merged = storedAuthors.map((stored) => {
    const key = normalize(stored.name);
    seenNames.add(key);
    const derived = derivedByName.get(key);
    return {
      id: stored.id || authorIdFromName(stored.name),
      name: stored.name,
      bio: stored.bio || '',
      avatarUrl: stored.avatarUri || null,
      trackCount: derived?.trackCount ?? 0,
    };
  });

  for (const author of derivedAuthors) {
    if (!seenNames.has(normalize(author.name))) {
      merged.push(author);
    }
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export function findStoredAuthor(storedAuthors = [], authorId) {
  const byId =
    storedAuthors.find((item) => item.id === authorId) ||
    storedAuthors.find((item) => authorIdFromName(item.name) === authorId);

  if (byId) return byId;

  if (authorId?.startsWith('artist:')) {
    const norm = normalize(authorId.slice('artist:'.length));
    if (norm) {
      return (
        storedAuthors.find((item) => normalize(item.name) === norm) || null
      );
    }
  }

  return null;
}

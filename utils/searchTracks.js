import { LOCAL_TRACKS } from '../data/localTracks';
import { MUSIC_CATEGORIES } from '../data/categories';

function normalize(text) {
  return text.trim().toLowerCase();
}

export function searchTracks(
  query,
  categoryId,
  authorId,
  allTracks = LOCAL_TRACKS
) {
  const q = normalize(query);

  let tracks = allTracks;

  if (authorId) {
    if (authorId.startsWith('artist:')) {
      const artistName = authorId.slice('artist:'.length);
      tracks = tracks.filter(
        (track) => normalize(track.artist || '') === normalize(artistName)
      );
    } else {
      tracks = tracks.filter((track) => track.authorId === authorId);
    }
  }

  if (categoryId) {
    const category = MUSIC_CATEGORIES.find((item) => item.id === categoryId);
    if (category) {
      const catName = normalize(category.name);
      tracks = tracks.filter(
        (track) =>
          normalize(track.title).includes(catName) ||
          normalize(track.artist).includes(catName)
      );
    }
  }

  if (!q) {
    return tracks;
  }

  return tracks.filter((track) => {
    const title = normalize(track.title);
    const artist = normalize(track.artist || '');
    return title.includes(q) || artist.includes(q) || q.split(' ').every(
      (word) => title.includes(word) || artist.includes(word)
    );
  });
}

export function searchCategories(query) {
  const q = normalize(query);
  if (!q) return [];

  return MUSIC_CATEGORIES.filter((cat) =>
    normalize(cat.name).includes(q)
  );
}

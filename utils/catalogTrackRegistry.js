import { LOCAL_TRACKS } from '../data/localTracks';

let catalogTracks = LOCAL_TRACKS;
const listeners = new Set();

export function setCatalogTracks(tracks) {
  catalogTracks = tracks?.length ? tracks : LOCAL_TRACKS;
  listeners.forEach((listener) => {
    try {
      listener(catalogTracks);
    } catch {
      // ignore listener errors
    }
  });
}

export function getCatalogTracks() {
  return catalogTracks;
}

export function subscribeCatalogTracks(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

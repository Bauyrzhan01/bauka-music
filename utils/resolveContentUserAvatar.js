import { resolveServerMediaUrl } from './resolveServerMediaUrl';

/**
 * Аватар автора контента: URL с сервера или локальный профиль текущего пользователя.
 */
export function resolveContentUserAvatar(item, currentUser) {
  const remote =
    resolveServerMediaUrl(item?.userAvatarUrl) ||
    resolveServerMediaUrl(item?.userAvatarUri);
  if (remote) {
    return { uri: remote };
  }

  const itemEmail = item?.userEmail?.trim().toLowerCase();
  const userEmail = currentUser?.email?.trim().toLowerCase();

  if (
    itemEmail &&
    userEmail &&
    itemEmail === userEmail &&
    currentUser?.avatarUri
  ) {
    const uri =
      resolveServerMediaUrl(currentUser.avatarUri) || currentUser.avatarUri;
    return {
      uri,
      accentColor: currentUser.avatarAccentColor,
    };
  }

  return { uri: null, accentColor: null };
}

export function filterMyReels(versions, userEmail) {
  const email = userEmail?.trim().toLowerCase();
  if (!email || !versions?.length) return [];

  return versions.filter(
    (item) =>
      item.type === 'video' &&
      item.mediaUrl &&
      item.userEmail?.trim().toLowerCase() === email
  );
}

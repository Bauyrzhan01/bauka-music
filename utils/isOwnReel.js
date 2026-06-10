export function isOwnReel(item, userEmail) {
  const owner = item?.userEmail?.trim().toLowerCase();
  const me = userEmail?.trim().toLowerCase();
  return Boolean(owner && me && owner === me);
}

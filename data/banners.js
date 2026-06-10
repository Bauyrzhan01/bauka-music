export const DEFAULT_NBO_BANNERS = [];

export function normalizeBanner(banner) {
  return {
    id: banner.id,
    imageUri: banner.imageUri ?? null,
    active: !!banner.active,
  };
}

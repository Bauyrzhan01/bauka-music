import { useMemo } from 'react';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import MoreFromAuthorSection from './MoreFromAuthorSection';

function pickRecommendedAuthor(authors, tracks) {
  if (!authors.length) return null;

  const countByAuthor = {};
  tracks.forEach((track) => {
    if (!track.authorId) return;
    countByAuthor[track.authorId] = (countByAuthor[track.authorId] || 0) + 1;
  });

  const ranked = [...authors].sort(
    (a, b) => (countByAuthor[b.id] || 0) - (countByAuthor[a.id] || 0)
  );

  return ranked.find((author) => (countByAuthor[author.id] || 0) > 0) ?? ranked[0];
}

export default function HomeRecommendedSection({
  featuredAuthor,
  onOpenProfile,
}) {
  const { authors, tracks } = useMusicCatalog();

  const recommended = useMemo(
    () => pickRecommendedAuthor(authors, tracks),
    [authors, tracks]
  );

  if (featuredAuthor || !recommended) return null;

  return (
    <MoreFromAuthorSection
      author={recommended}
      titlePrefix="Рекомендуем"
      onOpenProfile={onOpenProfile}
    />
  );
}

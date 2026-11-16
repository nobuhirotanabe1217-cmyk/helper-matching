import { MatchingInteraction } from '../types/domain';

export function normalizeFavoriteNote(raw: string): string {
  return raw.replace(/\r\n/g, '\n').trim().slice(0, 160);
}

export function isProviderFavorited(
  interactions: MatchingInteraction[],
  userId: string,
  providerId: string
): boolean {
  return Boolean(
    interactions.find(
      (item) =>
        item.userId === userId &&
        item.providerId === providerId &&
        item.isUserFavorite
    )
  );
}

export function getFavoriteInteractionsForUser(
  interactions: MatchingInteraction[],
  userId: string
): MatchingInteraction[] {
  return interactions.filter(
    (item) => item.userId === userId && item.isUserFavorite
  );
}

export function countUserFavorites(
  interactions: MatchingInteraction[],
  userId: string
): number {
  return getFavoriteInteractionsForUser(interactions, userId).length;
}

export function applyToggleFavoriteInteraction(
  interactions: MatchingInteraction[],
  userId: string,
  providerId: string,
  timestamp: string
): MatchingInteraction[] {
  const existing = interactions.find(
    (item) => item.userId === userId && item.providerId === providerId
  );

  if (existing) {
    const nextFavorited = !existing.isUserFavorite;
    return interactions.map((item) =>
      item.userId === userId && item.providerId === providerId
        ? {
            ...item,
            isUserFavorite: nextFavorited,
            favoritedAt: nextFavorited ? timestamp : item.favoritedAt,
            updatedAt: timestamp,
          }
        : item
    );
  }

  return [
    ...interactions,
    {
      userId,
      providerId,
      isUserFavorite: true,
      favoritedAt: timestamp,
      providerReaction: '未対応',
      caseStatus: '未対応',
      updatedAt: timestamp,
    },
  ];
}

export function applyUpdateFavoriteNoteInteraction(
  interactions: MatchingInteraction[],
  userId: string,
  providerId: string,
  rawNote: string,
  timestamp: string
): MatchingInteraction[] {
  const note = normalizeFavoriteNote(rawNote);
  const existing = interactions.find(
    (item) => item.userId === userId && item.providerId === providerId
  );

  if (existing) {
    return interactions.map((item) =>
      item.userId === userId && item.providerId === providerId
        ? {
            ...item,
            isUserFavorite: true,
            favoritedAt: item.favoritedAt || timestamp,
            userFavoriteNote: note,
            updatedAt: timestamp,
          }
        : item
    );
  }

  return [
    ...interactions,
    {
      userId,
      providerId,
      isUserFavorite: true,
      favoritedAt: timestamp,
      userFavoriteNote: note,
      providerReaction: '未対応',
      caseStatus: '未対応',
      updatedAt: timestamp,
    },
  ];
}

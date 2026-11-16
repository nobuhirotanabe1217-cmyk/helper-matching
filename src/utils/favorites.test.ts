import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyToggleFavoriteInteraction,
  applyUpdateFavoriteNoteInteraction,
  countUserFavorites,
  isProviderFavorited,
  normalizeFavoriteNote,
} from './favorites';
import { MatchingInteraction } from '../types/domain';

test('toggling favorite creates and toggles user favorite state cleanly', () => {
  const initial: MatchingInteraction[] = [];
  const added = applyToggleFavoriteInteraction(
    initial,
    'user-1',
    'prov-1',
    '2026-11-14 10:00'
  );
  assert.equal(isProviderFavorited(added, 'user-1', 'prov-1'), true);
  assert.equal(countUserFavorites(added, 'user-1'), 1);
  assert.equal(added[0].favoritedAt, '2026-11-14 10:00');

  const removed = applyToggleFavoriteInteraction(
    added,
    'user-1',
    'prov-1',
    '2026-11-14 10:05'
  );
  assert.equal(isProviderFavorited(removed, 'user-1', 'prov-1'), false);
  assert.equal(countUserFavorites(removed, 'user-1'), 0);
});

test('updating favorite note normalizes whitespace and preserves/enables favorite flag', () => {
  const updated = applyUpdateFavoriteNoteInteraction(
    [],
    'user-1',
    'prov-2',
    '   火曜午前の移動支援を優先相談したい   ',
    '2026-11-14 10:15'
  );
  assert.equal(isProviderFavorited(updated, 'user-1', 'prov-2'), true);
  assert.equal(
    updated[0].userFavoriteNote,
    '火曜午前の移動支援を優先相談したい'
  );

  const longText = 'あ'.repeat(200);
  assert.equal(normalizeFavoriteNote(longText).length, 160);
});

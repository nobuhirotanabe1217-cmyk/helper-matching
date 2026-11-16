import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysToIso,
  addMonthsToIso,
  daysSinceIsoDate,
  formatJapaneseDate,
  getTodayIso,
  isProviderStale,
} from './date';

test('daysSinceIsoDate and isProviderStale detect >= 30 days accurately', () => {
  const ref = new Date(2026, 10, 16); // 2026-11-16
  assert.equal(getTodayIso(ref), '2026-11-16');
  assert.equal(daysSinceIsoDate('2026-11-16', ref), 0);
  assert.equal(daysSinceIsoDate('2026-10-18', ref), 29);
  assert.equal(isProviderStale('2026-10-18', ref), false);

  assert.equal(daysSinceIsoDate('2026-10-17', ref), 30);
  assert.equal(isProviderStale('2026-10-17', ref), true);
  assert.equal(isProviderStale('2026-09-25', ref), true);
  assert.equal(isProviderStale(undefined, ref), true);
});

test('addDaysToIso, addMonthsToIso and formatJapaneseDate format consistently', () => {
  assert.equal(addDaysToIso('2026-11-16', 14), '2026-11-30');
  assert.equal(addMonthsToIso('2026-11-16', 1), '2026-12-16');
  assert.equal(formatJapaneseDate('2026-11-16'), '2026年11月16日');
});

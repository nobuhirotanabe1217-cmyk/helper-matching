import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMatchResult,
  compareProvidersForUserSearch,
  FullProviderBundle,
  FullUserBundle,
} from './matching';
import {
  INITIAL_PROVIDER_AVAILABILITY,
  INITIAL_PROVIDER_CAPABILITIES,
  INITIAL_PROVIDER_PROFILES,
  INITIAL_USER_NEEDS,
  INITIAL_USER_PREFERENCES,
  INITIAL_USER_PROFILES,
} from '../data/mockData';

function getUserBundle(userId: string): FullUserBundle {
  return {
    profile: INITIAL_USER_PROFILES.find((u) => u.id === userId)!,
    needs: INITIAL_USER_NEEDS.find((u) => u.userId === userId)!,
    preferences: INITIAL_USER_PREFERENCES.find((u) => u.userId === userId)!,
  };
}

function getProviderBundle(providerId: string): FullProviderBundle {
  return {
    profile: INITIAL_PROVIDER_PROFILES.find((p) => p.id === providerId)!,
    capabilities: INITIAL_PROVIDER_CAPABILITIES.find(
      (p) => p.providerId === providerId
    )!,
    availability: INITIAL_PROVIDER_AVAILABILITY.find(
      (p) => p.providerId === providerId
    )!,
  };
}

test('Score breakdown totals 100 max with 25/25/20/15/10/5 weights and populates matchingPoints', () => {
  const user1 = getUserBundle('user-001');
  const prov1 = getProviderBundle('prov-001');
  const result = calculateMatchResult(user1, prov1);

  assert.equal(result.judgment, 'マッチング候補');
  assert.equal(result.breakdown.serviceScore, 25);
  assert.equal(result.breakdown.careNeedsScore, 25);
  assert.equal(result.breakdown.disabilityExpScore, 20);
  assert.equal(result.breakdown.scheduleScore, 15);
  assert.equal(result.breakdown.areaScore, 10);
  assert.equal(result.breakdown.genderScore, 5);
  assert.equal(result.breakdown.totalScore, 100);
  assert.ok(result.matchingPoints.length >= 4);
  assert.equal(result.isStaleProvider, false);
});

test('User 004 (Visual impairment, Accompanied support) matches 要確認 with Provider 005 (stale > 30 days)', () => {
  const user4 = getUserBundle('user-004');
  const prov5 = getProviderBundle('prov-005');
  const result = calculateMatchResult(user4, prov5);

  assert.equal(result.judgment, '要確認');
  assert.ok(result.breakdown.serviceScore < 25);
  assert.ok(result.criticalWarnings.length > 0);
  assert.equal(result.isStaleProvider, true);
  assert.ok((result.daysSinceUpdate || 0) >= 30);
});

test('Stale providers (>=30 days) always sort lower than fresh providers regardless of score', () => {
  const user1 = getUserBundle('user-001');
  const prov1 = getProviderBundle('prov-001');
  const prov5 = getProviderBundle('prov-005');
  const m1 = calculateMatchResult(user1, prov1);
  const m5 = calculateMatchResult(user1, prov5);

  const sorted = compareProvidersForUserSearch({ match: m5 }, { match: m1 });
  assert.ok(sorted > 0);
});

test('Out of area or unsupported service results in マッチング対象外', () => {
  const user3 = getUserBundle('user-003');
  const prov5 = getProviderBundle('prov-005');
  const result = calculateMatchResult(user3, prov5);

  assert.equal(result.judgment, 'マッチング対象外');
  assert.equal(result.breakdown.serviceScore, 0);
});

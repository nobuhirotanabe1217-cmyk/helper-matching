import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMatchResult, FullProviderBundle, FullUserBundle } from './matching';
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

test('User 001 (Suginami, Mobility + Home care, Wheelchair, Female helper) matches strongly with Provider 001', () => {
  const user1 = getUserBundle('user-001');
  const prov1 = getProviderBundle('prov-001');
  const result = calculateMatchResult(user1, prov1);

  assert.equal(result.judgment, 'マッチング候補');
  assert.equal(result.breakdown.serviceScore, 25);
  assert.equal(result.breakdown.careNeedsScore, 25);
  assert.equal(result.breakdown.areaScore, 10);
  assert.equal(result.breakdown.genderScore, 10);
  assert.ok(result.breakdown.totalScore >= 85);
});

test('User 004 (Visual impairment, Accompanied support) is out of match for Provider 005 (Home care only)', () => {
  const user4 = getUserBundle('user-004');
  const prov5 = getProviderBundle('prov-005');
  const result = calculateMatchResult(user4, prov5);

  // User 004 wants 同行援護 + 居宅介護; Provider 005 only offers 居宅介護 and lacks 通院時の付き添い
  assert.equal(result.judgment, '要確認');
  assert.ok(result.breakdown.serviceScore < 25);
  assert.ok(result.criticalWarnings.length > 0);
});

test('Out of area or unsupported service results in マッチング対象外', () => {
  const user3 = getUserBundle('user-003'); // Wants 移動支援 in 世田谷区・杉並区
  const prov5 = getProviderBundle('prov-005'); // Only offers 居宅介護
  const result = calculateMatchResult(user3, prov5);

  assert.equal(result.judgment, 'マッチング対象外');
  assert.equal(result.breakdown.serviceScore, 0);
});

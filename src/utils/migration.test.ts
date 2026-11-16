import test from 'node:test';
import assert from 'node:assert/strict';
import { migratePersistedState } from './migration';

test('migratePersistedState preserves existing entities and backfills new fields safely', () => {
  const legacySaved = {
    userProfiles: [
      {
        id: 'u-legacy',
        anonymousCode: '利用希望者Z',
        nickname: 'たろう',
        city: '杉並区',
        disclosableInfo: { contactPersonRole: '本人' },
      },
    ],
    userNeeds: [
      {
        userId: 'u-legacy',
        desiredServices: ['移動支援'],
        disabilityTypes: ['発達障害'],
        careNeeds: ['外出時の付き添い'],
      },
    ],
    providerProfiles: [
      {
        id: 'p-legacy',
        name: 'レガシー事業所',
        locationCity: '杉並区',
        serviceTypes: ['移動支援'],
      },
    ],
    providerCapabilities: [
      {
        providerId: 'p-legacy',
        supportedCareItems: ['外出時の付き添い'],
        supportedDisabilities: ['知的障害'],
      },
    ],
  };

  const migrated = migratePersistedState(legacySaved);

  assert.equal(migrated.userProfiles[0].nickname, 'たろう');
  assert.ok(migrated.userProfiles[0].familyShareToken);
  assert.equal(migrated.userNeeds[0].dislikesAndAccommodations, '');

  assert.equal(migrated.providerProfiles[0].name, 'レガシー事業所');
  assert.match(migrated.providerProfiles[0].designatedNumber, /^\d{10}$/);
  assert.match(migrated.providerProfiles[0].updatedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(migrated.providerProfiles[0].appealMessage.length > 0);

  assert.equal(migrated.providerCapabilities[0].supportsBehavioralDisorder, '条件付きで相談可');
  assert.ok(Array.isArray(migrated.coordinators));
  assert.ok(Array.isArray(migrated.disclosureHistory));
});

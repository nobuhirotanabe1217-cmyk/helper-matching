import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getProviderFreshnessInfo,
  getUserFreshnessInfo,
  getProviderDiscrepancySummary,
  getProviderInterviewTrustBadge,
  calculateFreshnessDashboardMetrics,
} from './freshness';
import {
  calculateMatchResult,
  compareProvidersForUserSearch,
} from './matching';
import {
  INITIAL_PROVIDER_AVAILABILITY,
  INITIAL_PROVIDER_CAPABILITIES,
  INITIAL_PROVIDER_PROFILES,
  INITIAL_USER_NEEDS,
  INITIAL_USER_PREFERENCES,
  INITIAL_USER_PROFILES,
} from '../data/mockData';
import { addDaysToIso, getTodayIso } from './date';
import { ProviderDiscrepancyReport } from '../types/domain';

describe('CarePita Freshness & Trust Rules', () => {
  it('classifies provider freshness tiers cleanly at 25d, 30d, 31d, 60d, and 61d boundaries', () => {
    const ref = new Date(2026, 10, 16); // 2026-11-16

    const day24 = getProviderFreshnessInfo('2026-10-23', ref);
    assert.equal(day24.daysElapsed, 24);
    assert.equal(day24.tier, 'fresh');
    assert.equal(day24.isApproachingReminder, false);
    assert.equal(day24.badgeText, '10月23日に確認済み');

    const day25 = getProviderFreshnessInfo('2026-10-22', ref);
    assert.equal(day25.daysElapsed, 25);
    assert.equal(day25.tier, 'fresh');
    assert.equal(day25.isApproachingReminder, true);

    const day30 = getProviderFreshnessInfo('2026-10-17', ref);
    assert.equal(day30.daysElapsed, 30);
    assert.equal(day30.tier, 'fresh');
    assert.equal(day30.badgeText, '10月17日に確認済み');

    const day31 = getProviderFreshnessInfo('2026-10-16', ref);
    assert.equal(day31.daysElapsed, 31);
    assert.equal(day31.tier, 'warning');
    assert.equal(day31.isAutoPaused, false);
    assert.equal(day31.badgeText, '30日以上、未更新です');

    const day60 = getProviderFreshnessInfo('2026-09-17', ref);
    assert.equal(day60.daysElapsed, 60);
    assert.equal(day60.tier, 'warning');
    assert.equal(day60.isAutoPaused, false);

    const day61 = getProviderFreshnessInfo('2026-09-16', ref);
    assert.equal(day61.daysElapsed, 61);
    assert.equal(day61.tier, 'paused');
    assert.equal(day61.isAutoPaused, true);
    assert.equal(day61.badgeText, '60日以上未更新・要確認');
    assert.equal(
      day61.pauseNoticeText,
      '事業所の情報確認中です。更新されると再開します'
    );
  });

  it('auto-pauses users after 90 days without re-confirmation and restores upon confirmation', () => {
    const ref = new Date(2026, 10, 16);

    const activeUser = getUserFreshnessInfo(
      {
        confirmedAt: '2026-08-19', // 89 days ago
        registeredAt: '2026-08-01',
        recruitmentStatus: '募集中',
      },
      ref
    );
    assert.equal(activeUser.daysElapsed, 89);
    assert.equal(activeUser.isAutoPaused, false);
    assert.equal(activeUser.effectiveStatus, '募集中');

    const pausedUser = getUserFreshnessInfo(
      {
        confirmedAt: '2026-08-18', // 90 days ago
        registeredAt: '2026-08-01',
        recruitmentStatus: '募集中',
      },
      ref
    );
    assert.equal(pausedUser.daysElapsed, 90);
    assert.equal(pausedUser.isAutoPaused, true);
    assert.equal(pausedUser.effectiveStatus, '休止中');

    const reconfirmedUser = getUserFreshnessInfo(
      {
        confirmedAt: '2026-11-16',
        registeredAt: '2026-08-01',
        recruitmentStatus: '募集中',
      },
      ref
    );
    assert.equal(reconfirmedUser.isAutoPaused, false);
    assert.equal(reconfirmedUser.effectiveStatus, '募集中');
    assert.equal(reconfirmedUser.confirmedLabel, '11月16日に希望を確認済み');
  });

  it('marks provider as 情報の確認中です when 3 or more discrepancy reports exist', () => {
    const reports: ProviderDiscrepancyReport[] = [
      {
        id: 'rep-1',
        providerId: 'prov-001',
        reporterUserId: 'user-001',
        reason: '受入条件が実際と違った',
        createdAt: '2026-11-14',
        timestamp: '2026-11-14 10:00',
      },
      {
        id: 'rep-2',
        providerId: 'prov-001',
        reporterUserId: 'user-002',
        reason: 'すでに受付を終了していた',
        createdAt: '2026-11-15',
        timestamp: '2026-11-15 11:00',
      },
    ];

    assert.equal(
      getProviderDiscrepancySummary('prov-001', reports).isUnderReview,
      false
    );

    const withThree: ProviderDiscrepancyReport[] = [
      ...reports,
      {
        id: 'rep-3',
        providerId: 'prov-001',
        reporterUserId: 'user-003',
        reason: '連絡がつかなかった',
        createdAt: '2026-11-16',
        timestamp: '2026-11-16 09:00',
      },
    ];

    const summary = getProviderDiscrepancySummary('prov-001', withThree);
    assert.equal(summary.count, 3);
    assert.equal(summary.isUnderReview, true);
    assert.equal(summary.label, '情報の確認中です');
  });

  it('produces interview trust badge from confirmed interview records and disclosures', () => {
    const badge = getProviderInterviewTrustBadge(
      'prov-004',
      [],
      [
        {
          userId: 'user-001',
          providerId: 'prov-004',
          stage: 3,
          scheduleDecidedAt: '2026-11-12 15:30',
          disclosedFields: {
            nicknameAndRole: true,
            conditionProfile: true,
            nearestStationArea: true,
            preferredContactMethod: true,
            consultationSupportOffice: true,
            detailedScheduleNote: true,
            piiContactAccess: true,
          },
        },
      ]
    );
    assert.equal(badge.hasRecord, true);
    assert.equal(badge.badgeText, '11月に面談が決まった実績があります');
  });

  it('keeps compatibility score identical regardless of staleness while sorting fresher providers higher', () => {
    const user1 = {
      profile: INITIAL_USER_PROFILES[0],
      needs: INITIAL_USER_NEEDS[0],
      preferences: INITIAL_USER_PREFERENCES[0],
    };
    const today = getTodayIso();
    const provFresh = {
      profile: { ...INITIAL_PROVIDER_PROFILES[0], updatedAt: addDaysToIso(today, -2) },
      capabilities: INITIAL_PROVIDER_CAPABILITIES[0],
      availability: { ...INITIAL_PROVIDER_AVAILABILITY[0], updatedAt: addDaysToIso(today, -2) },
    };
    const provOld = {
      profile: { ...INITIAL_PROVIDER_PROFILES[0], id: 'prov-old', updatedAt: addDaysToIso(today, -40) },
      capabilities: INITIAL_PROVIDER_CAPABILITIES[0],
      availability: { ...INITIAL_PROVIDER_AVAILABILITY[0], providerId: 'prov-old', updatedAt: addDaysToIso(today, -40) },
    };
    const provPaused = {
      profile: { ...INITIAL_PROVIDER_PROFILES[0], id: 'prov-paused', updatedAt: addDaysToIso(today, -70) },
      capabilities: INITIAL_PROVIDER_CAPABILITIES[0],
      availability: { ...INITIAL_PROVIDER_AVAILABILITY[0], providerId: 'prov-paused', updatedAt: addDaysToIso(today, -70) },
    };

    const mFresh = calculateMatchResult(user1, provFresh);
    const mOld = calculateMatchResult(user1, provOld);
    const mPaused = calculateMatchResult(user1, provPaused);

    // 適合度％の計算自体は変わらない
    assert.equal(mFresh.breakdown.totalScore, mOld.breakdown.totalScore);
    assert.equal(mFresh.breakdown.totalScore, mPaused.breakdown.totalScore);

    // 標準順：fresh < warning < paused
    assert.ok(
      compareProvidersForUserSearch({ match: mFresh }, { match: mOld }) < 0
    );
    assert.ok(
      compareProvidersForUserSearch({ match: mOld }, { match: mPaused }) < 0
    );

    // 更新が新しい順：2日前 < 40日前 < 70日前
    assert.ok(
      compareProvidersForUserSearch(
        { match: mFresh },
        { match: mOld },
        { sortBy: 'newest_update' }
      ) < 0
    );
  });

  it('computes admin freshness dashboard metrics accurately', () => {
    const ref = new Date(2026, 10, 16);
    const providers = [
      { ...INITIAL_PROVIDER_PROFILES[0], updatedAt: '2026-11-15' },
      { ...INITIAL_PROVIDER_PROFILES[1], updatedAt: '2026-10-10' }, // 37d
      { ...INITIAL_PROVIDER_PROFILES[2], updatedAt: '2026-09-01' }, // 76d
    ];
    const users = [
      { ...INITIAL_USER_PROFILES[0], confirmedAt: '2026-11-10', recruitmentStatus: '募集中' as const },
      { ...INITIAL_USER_PROFILES[1], confirmedAt: '2026-07-01', recruitmentStatus: '募集中' as const }, // >90d auto paused
    ];

    const metrics = calculateFreshnessDashboardMetrics({
      providers,
      users,
      reports: [],
      referenceDate: ref,
    });

    assert.equal(metrics.totalProviders, 3);
    assert.equal(metrics.updatedWithin30Count, 1);
    assert.equal(metrics.updateRatePercent, 33);
    assert.equal(metrics.warningProvidersCount, 1);
    assert.equal(metrics.pausedProvidersCount, 1);
    assert.equal(metrics.providersByStaleness[0].freshness.daysElapsed, 76);
    assert.equal(metrics.pausedUsersCount, 1);
    assert.equal(metrics.autoPausedUsersCount, 1);
  });
});

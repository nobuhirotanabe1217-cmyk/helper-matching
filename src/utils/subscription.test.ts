import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  calculateAdminBusinessMetrics,
  calculateRegionalDemandAnalytics,
  isPaidPlanActive,
  isProPlanActive,
  verifyProviderChatAccess,
} from './subscription';
import { ChatRequest, ProviderSubscription } from '../types/domain';
import { INITIAL_USER_NEEDS, INITIAL_USER_PREFERENCES, INITIAL_USER_PROFILES } from '../data/mockData';

test('Free plan provider can send 1 outbound request per month and is blocked on 2nd', () => {
  const freeSub: ProviderSubscription = {
    providerId: 'prov-free',
    planId: 'free',
    status: 'active',
    startedAt: '2026-11-01',
    nextRenewalDate: '-',
    accountApprovalStatus: 'approved',
  };

  assert.equal(isPaidPlanActive(freeSub), false);
  const firstAccess = verifyProviderChatAccess({
    subscription: freeSub,
    allProviderChatRequests: [],
    currentYearMonth: '2026-11',
  });
  assert.equal(firstAccess.canRequestChat, true);
  assert.equal(firstAccess.monthlyOutboundLimit, 1);
  assert.equal(firstAccess.remainingFreeRequests, 1);

  const sentOne: ChatRequest = {
    id: 'req-1',
    userId: 'user-001',
    providerId: 'prov-free',
    initiatedBy: 'provider',
    status: 'pending',
    initialMessage: '申請1件目',
    requestedAt: '2026-11-10 10:00',
  };
  const secondAccess = verifyProviderChatAccess({
    subscription: freeSub,
    allProviderChatRequests: [sentOne],
    currentYearMonth: '2026-11',
  });
  assert.equal(secondAccess.canRequestChat, false);
  assert.equal(secondAccess.remainingFreeRequests, 0);
  assert.ok(secondAccess.reason.includes('月1件まで'));
});

test('Standard and Pro plan providers have unlimited outbound requests and correct tier flags', () => {
  const paidSub: ProviderSubscription = {
    providerId: 'prov-paid',
    planId: 'standard',
    status: 'active',
    startedAt: '2026-11-01',
    nextRenewalDate: '2026-12-01',
    accountApprovalStatus: 'approved',
  };
  const proSub: ProviderSubscription = {
    providerId: 'prov-pro',
    planId: 'pro',
    billingCycle: 'annual',
    status: 'active',
    startedAt: '2026-11-01',
    nextRenewalDate: '2027-11-01',
    accountApprovalStatus: 'approved',
  };

  assert.equal(isPaidPlanActive(paidSub), true);
  assert.equal(isProPlanActive(paidSub), false);
  assert.equal(isPaidPlanActive(proSub), true);
  assert.equal(isProPlanActive(proSub), true);

  const step1 = verifyProviderChatAccess({ subscription: paidSub });
  assert.equal(step1.canRequestChat, true);
  assert.equal(step1.monthlyOutboundLimit, null);

  const step3 = verifyProviderChatAccess({
    subscription: paidSub,
    chatRequest: {
      id: 'req-1',
      userId: 'user-001',
      providerId: 'prov-paid',
      initiatedBy: 'provider',
      status: 'approved',
      initialMessage: 'ご相談したいです',
      requestedAt: '2026-11-09 10:00',
      respondedAt: '2026-11-09 10:30',
    },
  });
  assert.equal(step3.canRequestChat, false);
  assert.equal(step3.canSendMessage, true);
});

test('Regional demand analytics aggregates user needs by area, service, and day', () => {
  const analytics = calculateRegionalDemandAnalytics({
    userProfiles: INITIAL_USER_PROFILES,
    userNeeds: INITIAL_USER_NEEDS,
    userPreferences: INITIAL_USER_PREFERENCES,
  });

  assert.equal(analytics.totalUsers, 5);
  assert.ok(analytics.demandByArea.some((a) => a.area === '杉並区' && a.count >= 4));
  assert.ok(analytics.demandByService.some((s) => s.service === '移動支援'));
  assert.ok(analytics.topCareNeeds.length > 0);
});

test('Admin business metrics accurately compute conversion rate and revenue', () => {
  const metrics = calculateAdminBusinessMetrics({
    users: [],
    providers: [
      {
        id: 'p1',
        name: 'A',
        designatedNumber: '1311501111',
        updatedAt: '2026-11-16',
        locationCity: '杉並区',
        serviceTypes: ['居宅介護', '移動支援'],
        introduction: '',
        features: [],
        contactPersonName: '',
        coverageAreas: ['杉並区'],
        businessDaysHours: '',
        messageFromProvider: '',
        appealMessage: '',
      },
      {
        id: 'p2',
        name: 'B',
        designatedNumber: '1311402222',
        updatedAt: '2026-11-16',
        locationCity: '中野区',
        serviceTypes: ['重度訪問介護'],
        introduction: '',
        features: [],
        contactPersonName: '',
        coverageAreas: ['中野区'],
        businessDaysHours: '',
        messageFromProvider: '',
        appealMessage: '',
      },
    ],
    subscriptions: [
      {
        providerId: 'p1',
        planId: 'standard',
        status: 'active',
        startedAt: '2026-11-01',
        nextRenewalDate: '2026-12-01',
        accountApprovalStatus: 'approved',
      },
      {
        providerId: 'p2',
        planId: 'free',
        status: 'active',
        startedAt: '2026-11-01',
        nextRenewalDate: '-',
        accountApprovalStatus: 'approved',
      },
    ],
    plans: DEFAULT_SUBSCRIPTION_PLANS,
    chatRequests: [],
    interactions: [],
  });

  assert.equal(metrics.totalProviders, 2);
  assert.equal(metrics.paidProvidersCount, 1);
  assert.equal(metrics.freeProvidersCount, 1);
  assert.equal(metrics.paidConversionRatePercent, 50);
  assert.equal(metrics.estimatedMonthlyRevenueYen, 3980);
});

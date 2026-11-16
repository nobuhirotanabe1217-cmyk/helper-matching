import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  calculateAdminBusinessMetrics,
  isPaidPlanActive,
  verifyProviderChatAccess,
} from './subscription';
import { ProviderSubscription } from '../types/domain';

test('Free plan provider is blocked from chat and chat requests', () => {
  const freeSub: ProviderSubscription = {
    providerId: 'prov-free',
    planId: 'free',
    status: 'active',
    startedAt: '2026-11-01',
    nextRenewalDate: '-',
    accountApprovalStatus: 'approved',
  };

  assert.equal(isPaidPlanActive(freeSub), false);
  const access = verifyProviderChatAccess({ subscription: freeSub });
  assert.equal(access.canRequestChat, false);
  assert.equal(access.canSendMessage, false);
  assert.ok(access.reason.includes('有料プラン'));
});

test('Paid plan provider can request chat, but can only send messages after user approval', () => {
  const paidSub: ProviderSubscription = {
    providerId: 'prov-paid',
    planId: 'standard',
    status: 'active',
    startedAt: '2026-11-01',
    nextRenewalDate: '2026-12-01',
    accountApprovalStatus: 'approved',
  };

  assert.equal(isPaidPlanActive(paidSub), true);

  // Before sending chat request
  const step1 = verifyProviderChatAccess({ subscription: paidSub });
  assert.equal(step1.canRequestChat, true);
  assert.equal(step1.canSendMessage, false);

  // While pending approval
  const step2 = verifyProviderChatAccess({
    subscription: paidSub,
    chatRequest: {
      id: 'req-1',
      userId: 'user-001',
      providerId: 'prov-paid',
      initiatedBy: 'provider',
      status: 'pending',
      initialMessage: 'ご相談したいです',
      requestedAt: '2026-11-09 10:00',
    },
  });
  assert.equal(step2.canRequestChat, false);
  assert.equal(step2.canSendMessage, false);

  // After user approval
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

test('Admin business metrics accurately compute conversion rate and revenue', () => {
  const metrics = calculateAdminBusinessMetrics({
    users: [],
    providers: [
      {
        id: 'p1',
        name: 'A',
        locationCity: '杉並区',
        serviceTypes: ['居宅介護', '移動支援'],
        introduction: '',
        features: [],
        contactPersonName: '',
        coverageAreas: ['杉並区'],
        businessDaysHours: '',
        messageFromProvider: '',
      },
      {
        id: 'p2',
        name: 'B',
        locationCity: '中野区',
        serviceTypes: ['重度訪問介護'],
        introduction: '',
        features: [],
        contactPersonName: '',
        coverageAreas: ['中野区'],
        businessDaysHours: '',
        messageFromProvider: '',
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

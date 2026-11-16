import test from 'node:test';
import assert from 'node:assert/strict';
import { SecurityController } from './security';
import { DisclosureConsent } from '../types/domain';

test('SecurityController: Rate limit blocks after 5 failed attempts', () => {
  let rateState = {};
  const ip = '192.168.1.100';

  for (let i = 1; i <= 4; i++) {
    const res = SecurityController.recordFailedAttempt(ip, rateState);
    rateState = res.newState;
    assert.equal(res.isNowBlocked, false);
    assert.equal(SecurityController.checkLoginRateLimit(ip, rateState).allowed, true);
  }

  // 5th failed attempt should trigger block
  const res5 = SecurityController.recordFailedAttempt(ip, rateState);
  rateState = res5.newState;
  assert.equal(res5.isNowBlocked, true);
  const check = SecurityController.checkLoginRateLimit(ip, rateState);
  assert.equal(check.allowed, false);
  assert.ok((check.remainingSeconds || 0) > 0);

  // Reset clears the block
  rateState = SecurityController.resetRateLimit(ip, rateState);
  assert.equal(SecurityController.checkLoginRateLimit(ip, rateState).allowed, true);
});

test('SecurityController: PII Access RBAC & consent verification', () => {
  const userId = 'usr_001';
  const providerId = 'prov_001';

  // 1. User accessing own PII -> Allowed
  const userAccess = SecurityController.verifyPiiAccess({
    actorId: userId,
    actorRole: 'user',
    targetUserId: userId,
  });
  assert.equal(userAccess.allowed, true);

  // 2. Provider with NO consent -> Denied
  const providerNoConsent = SecurityController.verifyPiiAccess({
    actorId: providerId,
    actorRole: 'provider',
    targetUserId: userId,
  });
  assert.equal(providerNoConsent.allowed, false);

  // 3. Provider with Stage 1 / Stage 2 consent -> Denied
  const stage2Consent: DisclosureConsent = {
    userId,
    providerId,
    stage: 2,
    disclosedFields: {
      nicknameAndRole: true,
      conditionProfile: true,
      nearestStationArea: true,
      preferredContactMethod: true,
      consultationSupportOffice: true,
      detailedScheduleNote: true,
      piiContactAccess: false,
    },
  };
  const providerStage2 = SecurityController.verifyPiiAccess({
    actorId: providerId,
    actorRole: 'provider',
    targetUserId: userId,
    disclosure: stage2Consent,
  });
  assert.equal(providerStage2.allowed, false);

  // 4. Provider with Stage 3 AND piiContactAccess: true -> Allowed
  const stage3Consent: DisclosureConsent = {
    ...stage2Consent,
    stage: 3,
    disclosedFields: {
      ...stage2Consent.disclosedFields,
      piiContactAccess: true,
    },
  };
  const providerStage3 = SecurityController.verifyPiiAccess({
    actorId: providerId,
    actorRole: 'provider',
    targetUserId: userId,
    disclosure: stage3Consent,
  });
  assert.equal(providerStage3.allowed, true);

  // 5. Admin requesting PII directly -> Denied by Least Privilege principle
  const adminAccess = SecurityController.verifyPiiAccess({
    actorId: 'admin_001',
    actorRole: 'admin',
    targetUserId: userId,
    disclosure: stage3Consent,
  });
  assert.equal(adminAccess.allowed, false);
});

test('SecurityController: AI transmission blocking strictly prevents leak', () => {
  const check = SecurityController.validateAiTransmission({
    disability: '身体障害',
    needs: ['車いすの操作・介助'],
  });
  assert.equal(check.canSend, false);
  assert.ok(check.reason.includes('安全保護規定'));
});

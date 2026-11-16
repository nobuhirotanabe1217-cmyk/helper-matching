import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMfaChallenge,
  createRegistrationOtpChallenge,
  generateOtpCode,
  maskEmail,
  maskPhoneNumber,
  validateAuthCredentials,
  verifyOtpCode,
  verifyPasswordLogin,
} from './auth';
import { AccountCredential } from '../types/domain';

const SAMPLE_CREDS: AccountCredential[] = [
  {
    id: 'user-001',
    role: 'user',
    displayName: 'さくらの母',
    email: 'Sakura@Example.jp',
    phoneNumber: '090-1234-5678',
    password: 'CarePita2026!',
    mfaEnabled: true,
    mfaMethod: 'email',
    createdAt: '2026-11-14 10:00',
  },
  {
    id: 'prov-001',
    role: 'provider',
    displayName: 'ケアセンター杉並',
    email: 'staff@suginami-care.jp',
    phoneNumber: '080-9876-5432',
    password: 'ProviderPass99!',
    mfaEnabled: true,
    mfaMethod: 'sms',
    createdAt: '2026-11-14 10:05',
  },
];

test('validateAuthCredentials validates email, password length, and SMS phone requirement', () => {
  const invalidEmail = validateAuthCredentials({
    email: 'invalid-email',
    password: 'CarePita2026!',
    mfaMethod: 'email',
  });
  assert.equal(invalidEmail.valid, false);
  assert.ok(invalidEmail.errors.some((e) => e.includes('メールアドレス')));

  const shortPassword = validateAuthCredentials({
    email: 'user@example.jp',
    password: '123',
    mfaMethod: 'email',
  });
  assert.equal(shortPassword.valid, false);
  assert.ok(shortPassword.errors.some((e) => e.includes('8文字以上')));

  const missingSmsPhone = validateAuthCredentials({
    email: 'user@example.jp',
    password: 'CarePita2026!',
    mfaMethod: 'sms',
    phoneNumber: '',
  });
  assert.equal(missingSmsPhone.valid, false);
  assert.ok(missingSmsPhone.errors.some((e) => e.includes('携帯電話番号')));

  const validSms = validateAuthCredentials({
    email: 'user@example.jp',
    password: 'CarePita2026!',
    mfaMethod: 'sms',
    phoneNumber: '090-1234-5678',
  });
  assert.equal(validSms.valid, true);
  assert.equal(validSms.errors.length, 0);
});

test('maskEmail and maskPhoneNumber obscure sensitive local digits safely', () => {
  assert.equal(maskEmail('sakura@example.jp'), 'sa***@example.jp');
  assert.equal(maskEmail('a@test.jp'), 'a***@test.jp');
  assert.equal(maskPhoneNumber('090-1234-5678'), '090-****-5678');
});

test('generateOtpCode returns 6 numeric digits', () => {
  const code = generateOtpCode(() => 0.123456);
  assert.match(code, /^\d{6}$/);
});

test('verifyPasswordLogin authenticates by role and case-insensitive email', () => {
  const okUser = verifyPasswordLogin({
    role: 'user',
    email: 'sakura@example.jp',
    password: 'CarePita2026!',
    credentials: SAMPLE_CREDS,
  });
  assert.equal(okUser.ok, true);
  assert.equal(okUser.account?.id, 'user-001');

  const wrongRole = verifyPasswordLogin({
    role: 'provider',
    email: 'sakura@example.jp',
    password: 'CarePita2026!',
    credentials: SAMPLE_CREDS,
  });
  assert.equal(wrongRole.ok, false);

  const wrongPassword = verifyPasswordLogin({
    role: 'provider',
    email: 'staff@suginami-care.jp',
    password: 'wrong-password',
    credentials: SAMPLE_CREDS,
  });
  assert.equal(wrongPassword.ok, false);
});

test('createMfaChallenge and verifyOtpCode track attempts, expiry, and success', () => {
  const challenge = createMfaChallenge(SAMPLE_CREDS[1], {
    nowMs: 1_000_000,
    randomFn: () => 0.5,
  });
  assert.equal(challenge.method, 'sms');
  assert.equal(challenge.maskedDestination, '080-****-5432');
  assert.equal(challenge.code.length, 6);

  // Wrong attempt 1
  const r1 = verifyOtpCode(challenge, '000000', 1_001_000);
  assert.equal(r1.ok, false);
  assert.equal(r1.locked, false);
  assert.equal(r1.remainingAttempts, 2);

  // Expired attempt
  const rExpired = verifyOtpCode(challenge, challenge.code, 1_000_000 + 6 * 60 * 1000);
  assert.equal(rExpired.ok, false);
  assert.equal(rExpired.expired, true);

  // Exact match within expiry
  const rOk = verifyOtpCode(challenge, challenge.code, 1_002_000);
  assert.equal(rOk.ok, true);
  assert.equal(rOk.locked, false);
});

test('createRegistrationOtpChallenge supports both email and sms verification before account creation', () => {
  const emailChallenge = createRegistrationOtpChallenge({
    role: 'user',
    displayName: 'ゆうき',
    email: 'yuki@example.jp',
    method: 'email',
    nowMs: 2_000_000,
    randomFn: () => 0.25,
  });
  assert.equal(emailChallenge.method, 'email');
  assert.equal(emailChallenge.maskedDestination, 'yu***@example.jp');
  assert.equal(verifyOtpCode(emailChallenge, emailChallenge.code, 2_010_000).ok, true);

  const smsChallenge = createRegistrationOtpChallenge({
    role: 'provider',
    displayName: 'あおぞらケア',
    email: 'aozora@example.jp',
    phoneNumber: '080-2345-6789',
    method: 'sms',
    nowMs: 2_000_000,
    randomFn: () => 0.75,
  });
  assert.equal(smsChallenge.method, 'sms');
  assert.equal(smsChallenge.maskedDestination, '080-****-6789');
  assert.equal(verifyOtpCode(smsChallenge, '111111', 2_010_000).ok, false);
  assert.equal(verifyOtpCode(smsChallenge, smsChallenge.code, 2_010_000).ok, true);
});

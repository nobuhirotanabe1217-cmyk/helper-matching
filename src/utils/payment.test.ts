import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMaskedBankSummary,
  buildMaskedCardSummary,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  validateBankTransferForm,
  validateCreditCardForm,
} from './payment';
import { verifyProviderChatAccess } from './subscription';
import { ChatRequest, ProviderSubscription } from '../types/domain';

test('Credit card formatting and brand detection work reliably', () => {
  assert.equal(formatCardNumber('4242424242424242'), '4242 4242 4242 4242');
  assert.equal(formatExpiry('1228'), '12/28');
  assert.equal(detectCardBrand('4242 4242 4242 4242'), 'Visa');
  assert.equal(detectCardBrand('5100 0000 0000 0000'), 'Mastercard');
  assert.equal(detectCardBrand('3528 0000 0000 0000'), 'JCB');
});

test('Credit card validation rejects empty/invalid values and masks PAN in summary', () => {
  const invalid = validateCreditCardForm({
    cardNumber: '1234',
    expiry: '99/20',
    cvc: '1',
    cardHolder: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.cardNumber);
  assert.ok(invalid.errors.expiry);
  assert.ok(invalid.errors.cvc);
  assert.ok(invalid.errors.cardHolder);

  const valid = validateCreditCardForm({
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/28',
    cvc: '123',
    cardHolder: 'AOZORA CARE',
  });
  assert.equal(valid.valid, true);

  const summary = buildMaskedCardSummary({
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/28',
    cvc: '123',
    cardHolder: 'AOZORA CARE',
  });
  assert.equal(summary.method, 'credit_card');
  assert.equal(summary.status, 'card_verified');
  assert.ok(summary.displayLabel.includes('•••• 4242'));
  assert.ok(!summary.displayLabel.includes('4242 4242'));
});

test('Bank transfer validation requires branch/account/kana and produces masked summary', () => {
  const invalid = validateBankTransferForm({
    bankName: '',
    branchCode: '12',
    branchName: '',
    accountType: '普通',
    accountNumber: '123',
    accountHolderKana: '',
    verificationMode: 'online',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.bankName);
  assert.ok(invalid.errors.accountNumber);
  assert.ok(invalid.errors.accountHolderKana);

  const valid = validateBankTransferForm({
    bankName: 'みずほ銀行',
    branchCode: '123',
    branchName: '杉並支店',
    accountType: '普通',
    accountNumber: '1234567',
    accountHolderKana: 'カ）アオゾラケア',
    verificationMode: 'paper',
  });
  assert.equal(valid.valid, true);

  const summary = buildMaskedBankSummary({
    bankName: 'みずほ銀行',
    branchCode: '123',
    branchName: '杉並支店',
    accountType: '普通',
    accountNumber: '1234567',
    accountHolderKana: 'カ）アオゾラケア',
    verificationMode: 'paper',
  });
  assert.equal(summary.method, 'bank_transfer');
  assert.equal(summary.status, 'bank_pending_verification');
  assert.ok(summary.displayLabel.includes('••••567'));
  assert.ok(!summary.displayLabel.includes('1234567'));
});

test('Free-plan provider can reply to user-initiated inquiries but cannot initiate outbound scout requests', () => {
  const freeSub: ProviderSubscription = {
    providerId: 'prov-free',
    planId: 'free',
    status: 'active',
    startedAt: '2026-11-14',
    nextRenewalDate: '-',
    accountApprovalStatus: 'approved',
  };

  // Outbound without prior contact -> blocked
  const outbound = verifyProviderChatAccess({ subscription: freeSub });
  assert.equal(outbound.canRequestChat, false);
  assert.equal(outbound.canSendMessage, false);

  // User-initiated inquiry -> allowed to reply!
  const userInquiry: ChatRequest = {
    id: 'creq-1',
    userId: 'user-001',
    providerId: 'prov-free',
    initiatedBy: 'user',
    status: 'approved',
    initialMessage: '利用について相談したいです',
    requestedAt: '2026-11-14 10:00',
  };
  const reply = verifyProviderChatAccess({
    subscription: freeSub,
    chatRequest: userInquiry,
  });
  assert.equal(reply.canSendMessage, true);
});

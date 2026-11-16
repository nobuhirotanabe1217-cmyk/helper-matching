import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_SCREEN_VIEWS,
  HELP_GUIDES,
  filterHelpGuidesByRole,
  getHelpGuide,
  validateHelpGuide,
} from './helpGuides';

test('every ScreenView has a valid non-empty help guide', () => {
  for (const view of ALL_SCREEN_VIEWS) {
    const guide = getHelpGuide(view);
    assert.equal(guide.key, view, `Help guide key mismatch for ${view}`);
    assert.equal(
      validateHelpGuide(guide),
      true,
      `Help guide for ${view} must have title, summary, and >=2 non-empty steps`
    );
  }
});

test('every sub-feature guide in HELP_GUIDES passes content validation', () => {
  for (const [key, guide] of Object.entries(HELP_GUIDES)) {
    assert.equal(guide.key, key);
    assert.equal(
      validateHelpGuide(guide),
      true,
      `Sub-feature guide ${key} failed validation`
    );
  }
});

test('filterHelpGuidesByRole returns role-scoped guides cleanly', () => {
  const userGuides = filterHelpGuidesByRole('user');
  const providerGuides = filterHelpGuidesByRole('provider');

  assert.ok(userGuides.some((g) => g.key === 'user-dashboard'));
  assert.ok(userGuides.some((g) => g.key === 'user-favorites'));
  assert.ok(providerGuides.some((g) => g.key === 'provider-dashboard'));
  assert.ok(providerGuides.some((g) => g.key === 'provider-billing'));
  assert.equal(
    userGuides.some((g) => g.key === 'provider-billing'),
    false
  );
});

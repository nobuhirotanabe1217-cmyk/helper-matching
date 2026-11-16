import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChatSpeechText,
  buildHelpGuideSpeechText,
  buildProviderCardSpeechText,
  buildUserDashboardSpeechText,
  buildUserSearchSpeechText,
  clampSpeechRate,
  getViewTitleForAnnouncement,
  splitSpeechChunks,
} from './speech';
import { ALL_SCREEN_VIEWS, getHelpGuide } from './helpGuides';

test('clampSpeechRate constrains speech speed safely', () => {
  assert.equal(clampSpeechRate(0.2), 0.7);
  assert.equal(clampSpeechRate(1.0), 1.0);
  assert.equal(clampSpeechRate(1.25), 1.25);
  assert.equal(clampSpeechRate(3.5), 1.8);
  assert.equal(clampSpeechRate(Number.NaN), 1.0);
});

test('splitSpeechChunks breaks long Japanese text on sentence boundaries without dropping text', () => {
  const text =
    '最初の文章です。二番目の文章は少し長めに書かれています。三番目の文章も追加して分割を確かめます！最後に四番目の文章です。';
  const chunks = splitSpeechChunks(text, 35);
  assert.ok(chunks.length >= 2);
  for (const c of chunks) {
    assert.ok(c.length <= 35, `Chunk exceeded maxChars: ${c.length}`);
  }
  assert.ok(chunks.join('').includes('最初の文章です。'));
  assert.ok(chunks.join('').includes('最後に四番目の文章です。'));
});

test('getViewTitleForAnnouncement provides Japanese title for every AppView', () => {
  for (const view of ALL_SCREEN_VIEWS) {
    const title = getViewTitleForAnnouncement(view);
    assert.ok(title.trim().length > 0, `Empty announcement for view ${view}`);
  }
});

test('speech builders generate natural Japanese summaries for user dashboard, cards, search, chat, and help', () => {
  const dashText = buildUserDashboardSpeechText({
    nickname: 'ゆうき',
    city: '杉並区',
    services: ['居宅介護', '移動支援'],
    helperGenderPreference: '女性ヘルパーを希望',
    highMatchCount: 2,
    totalProviders: 3,
    favoriteCount: 1,
    pendingRequestsCount: 1,
    approvedChatCount: 0,
    disclosedCount: 0,
  });
  assert.ok(dashText.includes('ゆうきさん'));
  assert.ok(dashText.includes('80パーセント以上'));

  const cardText = buildProviderCardSpeechText({
    name: 'あおぞらケア杉並',
    score: 96,
    judgment: 'マッチング候補',
    locationCity: '杉並区',
    coverageAreas: ['杉並区', '中野区'],
    services: ['居宅介護'],
    acceptanceStatus: '新規利用者を積極的に募集中',
    availableDays: ['月', '火', '木'],
    isFavorite: true,
    favoriteNote: '火曜午前に面談希望',
  });
  assert.ok(cardText.includes('あおぞらケア杉並'));
  assert.ok(cardText.includes('96パーセント'));
  assert.ok(cardText.includes('お気に入り登録済み'));
  assert.ok(cardText.includes('火曜午前に面談希望'));

  const favSearchText = buildUserSearchSpeechText({
    favoritesOnly: true,
    nickname: 'ゆうき',
    city: '杉並区',
    resultCount: 1,
    topProvider: { name: 'あおぞらケア杉並', score: 96, judgment: 'マッチング候補' },
  });
  assert.ok(favSearchText.includes('お気に入り登録した事業所の一覧'));

  const chatText = buildChatSpeechText({
    isUserMode: true,
    partnerTitle: 'あおぞらケア杉並',
    disclosureStage: 2,
    messages: [
      {
        senderType: 'provider',
        text: '土曜日の午後に見学可能です。',
        createdAt: '10:30',
      },
    ],
  });
  assert.ok(chatText.includes('あおぞらケア杉並からの受信'));
  assert.ok(chatText.includes('土曜日の午後に見学可能です'));

  const helpText = buildHelpGuideSpeechText(getHelpGuide('user-favorites'));
  assert.ok(helpText.includes('お気に入り事業所の比較・メモ管理'));
  assert.ok(helpText.includes('ステップ1'));
});

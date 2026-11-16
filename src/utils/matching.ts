import {
  MatchJudgmentStatus,
  MatchResult,
  ProviderAvailability,
  ProviderCapabilities,
  ProviderProfile,
  ScoreBreakdown,
  UserPreferences,
  UserProfile,
  UserSupportNeeds,
  PROVIDER_CARE_LABELS,
} from '../types/domain';
import { daysSinceIsoDate, isProviderStale } from './date';

export interface FullUserBundle {
  profile: UserProfile;
  needs: UserSupportNeeds;
  preferences: UserPreferences;
}

export interface FullProviderBundle {
  profile: ProviderProfile;
  capabilities: ProviderCapabilities;
  availability: ProviderAvailability;
}

/**
 * 相性％（適合度 100点満点）の計算
 * - サービス種別: 25点
 * - 介助内容: 25点
 * - 障害特性・支援細目: 20点
 * - 曜日・時間帯: 15点
 * - エリア: 10点
 * - ヘルパー性別: 5点
 * ※有料プランかどうかによってスコア・順位を変えることは一切ありません
 */
export function calculateMatchResult(
  user: FullUserBundle,
  provider: FullProviderBundle,
  referenceDate: Date = new Date()
): MatchResult {
  const positiveReasons: string[] = [];
  const matchingPoints: string[] = [];
  const cautionReasons: string[] = [];
  const criticalWarnings: string[] = [];

  const latestUpdatedAt =
    provider.profile.updatedAt || provider.availability.updatedAt;
  const daysSinceUpdate = daysSinceIsoDate(latestUpdatedAt, referenceDate);
  const stale = isProviderStale(latestUpdatedAt, referenceDate);

  // 1. 対応サービスとの一致 (25点)
  const desiredServices = user.needs.desiredServices;
  const matchedServices = desiredServices.filter((s) =>
    provider.profile.serviceTypes.includes(s)
  );
  let serviceScore = 0;
  let noServiceMatch = false;

  if (desiredServices.length === 0) {
    serviceScore = 25;
  } else if (matchedServices.length === 0) {
    serviceScore = 0;
    noServiceMatch = true;
    criticalWarnings.push(
      `希望サービス（${desiredServices.join('・')}）に対応していません`
    );
  } else if (matchedServices.length === desiredServices.length) {
    serviceScore = 25;
    const msg = `希望するサービス（${matchedServices.join('・')}）にすべて対応`;
    positiveReasons.push(msg);
    matchingPoints.push(`対応サービス：${matchedServices.join('・')}がすべて一致`);
  } else {
    serviceScore = Math.round(
      (matchedServices.length / desiredServices.length) * 25
    );
    const missing = desiredServices.filter(
      (s) => !provider.profile.serviceTypes.includes(s)
    );
    matchingPoints.push(`対応サービス：${matchedServices.join('・')}に対応`);
    cautionReasons.push(
      `${matchedServices.join('・')}には対応していますが、${missing.join('・')}は対象外です`
    );
  }

  // 2. 介助内容・身体介助との一致 (25点)
  const userCareNeeds = user.needs.careNeeds;
  const matchedCare = userCareNeeds.filter((c) =>
    provider.capabilities.supportedCareItems.includes(c)
  );
  let careNeedsScore = 0;
  let missingEssentialCare = false;

  const essentialList =
    user.needs.essentialCareNeeds && user.needs.essentialCareNeeds.length > 0
      ? user.needs.essentialCareNeeds
      : userCareNeeds;

  const missingEssentials = essentialList.filter(
    (c) => !provider.capabilities.supportedCareItems.includes(c)
  );

  const requiresTwoPerson =
    user.needs.physicalConditions.includes('2人介助が必要');
  const requiresTransfer =
    user.needs.physicalConditions.includes(
      'ベッドから車いすへの移乗介助が必要'
    ) || userCareNeeds.includes('移乗の介助');

  if (userCareNeeds.length === 0) {
    careNeedsScore = 25;
  } else {
    const baseRatio = matchedCare.length / userCareNeeds.length;
    careNeedsScore = Math.round(baseRatio * 25);

    if (requiresTwoPerson && !provider.capabilities.supportsTwoPersonCare) {
      careNeedsScore = Math.max(0, careNeedsScore - 5);
      missingEssentialCare = true;
      criticalWarnings.push('必須条件の「2人介助」への対応が難しい可能性があります');
    }
    if (requiresTransfer && !provider.capabilities.supportsWheelchairTransfer) {
      careNeedsScore = Math.max(0, careNeedsScore - 5);
      missingEssentialCare = true;
      criticalWarnings.push(
        'ベッド・車いす間の移乗介助への対応確認が必要です'
      );
    }

    if (missingEssentials.length > 0) {
      missingEssentialCare = true;
      const labels = missingEssentials.map((c) => PROVIDER_CARE_LABELS[c] || c);
      criticalWarnings.push(
        `必要な介助内容のうち「${labels.join('・')}」が受入条件に含まれていません`
      );
    }

    if (matchedCare.length > 0) {
      const topCare = matchedCare
        .slice(0, 3)
        .map((c) => PROVIDER_CARE_LABELS[c] || c)
        .join('・');
      if (matchedCare.length === userCareNeeds.length) {
        positiveReasons.push(
          `必要な介助内容（${topCare}${matchedCare.length > 3 ? 'ほか' : ''}）にすべて対応可能`
        );
        matchingPoints.push(
          `介助内容：ご希望の${matchedCare.length}項目すべてに対応可能`
        );
      } else {
        matchingPoints.push(`介助内容：${topCare}などに対応`);
      }
    }
  }

  // 3. 障害特性・支援細目との一致 (20点)
  const userDisabilities = user.needs.disabilityTypes;
  const matchedDisabilities = userDisabilities.filter((d) => {
    if (d === 'その他・複数該当') return true;
    return provider.capabilities.supportedDisabilities.includes(
      d as ProviderCapabilities['supportedDisabilities'][number]
    );
  });

  // 障害種別の一致（最大10点）
  let disabilityTypePts = 10;
  if (userDisabilities.length > 0) {
    disabilityTypePts = Math.round(
      (matchedDisabilities.length / userDisabilities.length) * 10
    );
    if (matchedDisabilities.length > 0) {
      matchingPoints.push(
        `障害特性：${matchedDisabilities.join('・')}の受け入れに対応`
      );
    } else {
      cautionReasons.push(
        `${userDisabilities.join('・')}の受け入れ経験について事前確認を推奨します`
      );
    }
  }

  // 支援細目の一致（行動障害・医療的ケア・てんかん・コミュニケーション・車いす/送迎：最大10点）
  let detailPts = 0;

  // 行動面・パニック配慮 (3点)
  const needsBehaviorCare =
    user.needs.communicationConsiderations.includes('パニック時の対応が必要') ||
    user.needs.communicationConsiderations.includes('行動面で専門的な配慮が必要') ||
    user.needs.communicationConsiderations.includes('強いこだわりがある');
  const behaviorPolicy = provider.capabilities.supportsBehavioralDisorder;
  if (!needsBehaviorCare) {
    detailPts += 3;
  } else if (
    behaviorPolicy === '対応可能' ||
    provider.capabilities.supportedDisabilities.includes('行動面で配慮が必要な方')
  ) {
    detailPts += 3;
    matchingPoints.push('支援細目：行動面・パニック時の専門配慮に対応可能');
  } else if (behaviorPolicy === '条件付きで相談可') {
    detailPts += 2;
    cautionReasons.push('行動面への配慮について事前の条件相談が可能です');
  } else {
    cautionReasons.push('行動面・パニック時の配慮について受入可否の確認が必要です');
  }

  // 医療的ケア・てんかん配慮 (3点)
  const dislikesText = `${user.needs.dislikesAndAccommodations || ''} ${user.needs.communicationFreeText || ''}`;
  const mentionsMedicalOrEpilepsy =
    /医療|吸引|胃ろう|経管|てんかん|発作/.test(dislikesText);
  if (!mentionsMedicalOrEpilepsy) {
    detailPts += 3;
  } else if (
    provider.capabilities.supportsMedicalCare === '対応可能' ||
    provider.capabilities.supportsEpilepsyResponse === '対応可能'
  ) {
    detailPts += 3;
    matchingPoints.push('支援細目：医療的ケアまたは発作時の見守り体制あり');
  } else if (
    provider.capabilities.supportsMedicalCare === '条件付きで相談可' ||
    provider.capabilities.supportsEpilepsyResponse === '条件付きで相談可'
  ) {
    detailPts += 2;
    cautionReasons.push('医療的配慮・発作時の対応手順は事前面談で相談可能です');
  } else {
    cautionReasons.push('医療的ケアや発作対応の可否を事前に確認してください');
  }

  // コミュニケーション手段の一致 (2点)
  const usesAlternativeComm =
    user.needs.communicationConsiderations.includes('筆談・文字盤などを使用') ||
    user.needs.communicationConsiderations.includes('絵カードなどを使用') ||
    user.needs.communicationConsiderations.includes('意思表示に時間が必要');
  const commMethods = provider.capabilities.supportedCommunicationMethods || [];
  if (!usesAlternativeComm) {
    detailPts += 2;
  } else if (
    commMethods.some((m) => /筆談|文字盤|絵カード|ゆっくり|ジェスチャー|手話/.test(m))
  ) {
    detailPts += 2;
    matchingPoints.push('支援細目：筆談・絵カード・ゆっくり説明などの伝達方法に対応');
  } else {
    detailPts += 1;
    cautionReasons.push('希望のコミュニケーション方法の対応可否を確認してください');
  }

  // 送迎または車いす配慮 (2点)
  const usesWheelchair =
    user.needs.physicalConditions.includes('車いすを使用') ||
    user.needs.physicalConditions.includes('電動車いすを使用');
  if (usesWheelchair) {
    if (provider.capabilities.supportsWheelchairTransfer || provider.capabilities.supportsTransport) {
      detailPts += 2;
      matchingPoints.push(
        provider.capabilities.supportsTransport
          ? `支援細目：車いす配慮・送迎（${provider.capabilities.transportRangeText || '相談可'}）に対応`
          : '支援細目：車いすの介助・移乗配慮に対応可能'
      );
    } else {
      cautionReasons.push('車いすでの移乗・移動サポートについて事前確認が必要です');
    }
  } else {
    detailPts += 2;
  }

  const disabilityExpScore = Math.min(20, disabilityTypePts + detailPts);

  // 4. 対応できる曜日・時間帯との一致 (15点)
  const preferredDays = user.preferences.preferredDays;
  const preferredSlots = user.preferences.preferredTimeSlots;
  let scheduleScore = 0;

  if (preferredDays.length === 0) {
    scheduleScore = 15;
  } else {
    let dayMatchCount = 0;
    let dayAndSlotMatchCount = 0;
    const matchedDaysList: string[] = [];
    const unmatchedDays: string[] = [];

    for (const day of preferredDays) {
      const dayEntry = provider.availability.weeklySchedule.find(
        (d) => d.day === day
      );
      if (dayEntry && dayEntry.available) {
        dayMatchCount += 1;
        if (
          preferredSlots.length === 0 ||
          preferredSlots.some((slot) => dayEntry.timeSlots.includes(slot))
        ) {
          dayAndSlotMatchCount += 1;
          matchedDaysList.push(day);
        } else {
          unmatchedDays.push(`${day}曜（時間帯要相談）`);
        }
      } else {
        unmatchedDays.push(`${day}曜`);
      }
    }

    const dayRatio = dayMatchCount / preferredDays.length;
    const slotRatio = dayAndSlotMatchCount / preferredDays.length;
    scheduleScore = Math.round(dayRatio * 7 + slotRatio * 8);

    if (dayAndSlotMatchCount === preferredDays.length) {
      positiveReasons.push(
        `希望曜日（${preferredDays.join('・')}）と時間帯がすべて一致`
      );
      matchingPoints.push(
        `曜日・時間帯：ご希望の${preferredDays.join('・')}曜日（${preferredSlots.join('／') || '終日'}）に対応`
      );
    } else if (dayMatchCount > 0) {
      if (matchedDaysList.length > 0) {
        matchingPoints.push(
          `曜日・時間帯：${matchedDaysList.join('・')}曜日の希望時間帯に対応`
        );
      }
      cautionReasons.push(
        `曜日・時間帯は一部確認が必要です（${unmatchedDays.join('、')}）`
      );
    } else {
      cautionReasons.push(
        `希望曜日（${preferredDays.join('・')}）の対応可否について相談が必要です`
      );
    }
  }

  // 5. 対応エリアとの一致 (10点)
  const targetAreas =
    user.preferences.preferredAreas.length > 0
      ? user.preferences.preferredAreas
      : [user.profile.city];
  const matchedAreas = targetAreas.filter(
    (area) =>
      provider.profile.coverageAreas.some(
        (cov) => area.includes(cov) || cov.includes(area)
      ) ||
      area.includes(provider.profile.locationCity) ||
      provider.profile.locationCity.includes(area)
  );

  let areaScore = 0;
  let outOfArea = false;

  if (matchedAreas.length > 0) {
    areaScore = 10;
    positiveReasons.push(`対応地域（${matchedAreas.join('・')}）に該当`);
    matchingPoints.push(`エリア：ご希望の「${matchedAreas.join('・')}」をカバー`);
  } else {
    areaScore = 0;
    outOfArea = true;
    criticalWarnings.push(
      `希望地域（${targetAreas.join('・')}）が事業所の対応地域外です`
    );
  }

  // 6. ヘルパーの性別に関する希望との一致 (5点)
  const genderPref = user.preferences.helperGenderPreference;
  const availGenders = provider.capabilities.availableHelperGenders;
  const policy = provider.capabilities.helperGenderPolicy;
  let genderScore = 5;
  let genderMismatchCritical = false;

  const checkGenderMatch = (target: '男性' | '女性'): boolean =>
    availGenders.includes(target);

  if (genderPref === '性別は問わない') {
    genderScore = 5;
  } else if (genderPref === '女性ヘルパーを希望') {
    if (checkGenderMatch('女性')) {
      genderScore = 5;
      positiveReasons.push('女性ヘルパーの希望に対応可能');
      matchingPoints.push('ヘルパー性別：女性ヘルパーの在籍・対応が可能');
    } else {
      genderScore = 0;
      if (user.preferences.isGenderPreferenceStrict) {
        genderMismatchCritical = true;
        criticalWarnings.push('必須条件である「女性ヘルパー希望」に対応できません');
      } else {
        cautionReasons.push('女性ヘルパーの配置が可能か確認が必要です');
      }
    }
  } else if (genderPref === '男性ヘルパーを希望') {
    if (checkGenderMatch('男性')) {
      genderScore = 5;
      positiveReasons.push('男性ヘルパーの希望に対応可能');
      matchingPoints.push('ヘルパー性別：男性ヘルパーの在籍・対応が可能');
    } else {
      genderScore = 0;
      if (user.preferences.isGenderPreferenceStrict) {
        genderMismatchCritical = true;
        criticalWarnings.push('必須条件である「男性ヘルパー希望」に対応できません');
      } else {
        cautionReasons.push('男性ヘルパーの配置が可能か確認が必要です');
      }
    }
  } else if (genderPref === 'できれば同性を希望') {
    const desiredSameGender =
      user.profile.gender === '女性'
        ? '女性'
        : user.profile.gender === '男性'
        ? '男性'
        : null;
    if (!desiredSameGender || checkGenderMatch(desiredSameGender)) {
      genderScore = 5;
      positiveReasons.push('同性ヘルパーの希望に対応可能');
      matchingPoints.push('ヘルパー性別：同性介助のご希望に対応可能');
    } else if (
      policy === '同性介助の希望に可能な範囲で対応' ||
      policy === '条件によって相談可能'
    ) {
      genderScore = 3;
      cautionReasons.push('同性介助の希望について時間帯等の相談が必要です');
    } else {
      genderScore = 0;
      if (user.preferences.isGenderPreferenceStrict) {
        genderMismatchCritical = true;
        criticalWarnings.push('同性ヘルパーの配置に対応できません');
      } else {
        cautionReasons.push('同性ヘルパーの配置が難しい場合があります');
      }
    }
  } else if (genderPref === '内容によって異なる') {
    if (
      availGenders.length === 2 ||
      policy === '男女どちらも対応可能' ||
      policy === '同性介助の希望に可能な範囲で対応'
    ) {
      genderScore = 5;
      positiveReasons.push('介助内容に応じたヘルパー性別の相談が可能');
      matchingPoints.push('ヘルパー性別：介助内容に応じた性別調整が可能');
    } else {
      genderScore = 3;
      cautionReasons.push('介助内容別のヘルパー性別について事前相談が必要です');
    }
  }

  const totalScore =
    serviceScore +
    careNeedsScore +
    disabilityExpScore +
    scheduleScore +
    areaScore +
    genderScore;

  // 判定ステータス（マッチング候補 / 要確認 / マッチング対象外）
  let judgment: MatchJudgmentStatus = 'マッチング候補';

  if (
    noServiceMatch ||
    outOfArea ||
    provider.availability.acceptanceStatus === '現在は受け入れ困難'
  ) {
    judgment = 'マッチング対象外';
    if (provider.availability.acceptanceStatus === '現在は受け入れ困難') {
      criticalWarnings.push('現在、事業所の新規受け入れが停止中です');
    }
  } else if (
    genderMismatchCritical ||
    missingEssentialCare ||
    scheduleScore < 7 ||
    serviceScore < 25 ||
    provider.availability.acceptanceStatus === '問い合わせのみ受け付ける'
  ) {
    judgment = '要確認';
  }

  // 要約文の生成
  let summaryText = '';
  if (judgment === 'マッチング対象外') {
    summaryText =
      criticalWarnings[0] ||
      '希望サービスまたは対応地域などの基本条件が一致していません。';
  } else if (judgment === '要確認') {
    const mainPos = positiveReasons[0] || '一部の希望条件に対応しています';
    const mainWarn =
      criticalWarnings[0] ||
      cautionReasons[0] ||
      '詳細条件について事前の確認が必要です';
    summaryText = `${mainPos}。ただし、${mainWarn}。`;
  } else {
    const posJoined = positiveReasons.slice(0, 2).join('。');
    const extraCaution =
      cautionReasons.length > 0 ? ` ${cautionReasons[0]}。` : '';
    summaryText = `${
      posJoined || '希望するサービスと支援内容が一致しています'
    }。${extraCaution}`.trim();
  }

  const breakdown: ScoreBreakdown = {
    serviceScore,
    careNeedsScore,
    disabilityExpScore,
    scheduleScore,
    areaScore,
    genderScore,
    totalScore,
  };

  return {
    userId: user.profile.id,
    providerId: provider.profile.id,
    breakdown,
    judgment,
    matchingPoints,
    criticalWarnings,
    positiveReasons,
    cautionReasons,
    summaryText,
    isStaleProvider: stale,
    daysSinceUpdate,
  };
}

/**
 * 利用者検索画面向けの並び順比較関数
 * - 更新から30日以上経過した事業所は一覧の表示順を下げる（有料プラン有無では順位・相性を変えない）
 * - そのうえで相性スコア降順（お気に入り優先フィルタ時を除く）
 */
export function compareProvidersForUserSearch(
  a: { match: MatchResult; isFavorite?: boolean },
  b: { match: MatchResult; isFavorite?: boolean },
  prioritizeFavorites: boolean = false
): number {
  const aStale = Boolean(a.match.isStaleProvider);
  const bStale = Boolean(b.match.isStaleProvider);
  if (aStale !== bStale) {
    return aStale ? 1 : -1;
  }

  if (prioritizeFavorites && Boolean(a.isFavorite) !== Boolean(b.isFavorite)) {
    return a.isFavorite ? -1 : 1;
  }

  return b.match.breakdown.totalScore - a.match.breakdown.totalScore;
}

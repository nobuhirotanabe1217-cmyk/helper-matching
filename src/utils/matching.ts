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

export function calculateMatchResult(
  user: FullUserBundle,
  provider: FullProviderBundle
): MatchResult {
  const positiveReasons: string[] = [];
  const cautionReasons: string[] = [];
  const criticalWarnings: string[] = [];

  // 1. 希望サービスとの一致 (25点)
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
      `希望サービス（${desiredServices.join('・')}）を提供していません`
    );
  } else if (matchedServices.length === desiredServices.length) {
    serviceScore = 25;
    positiveReasons.push(
      `希望するサービス（${matchedServices.join('・')}）にすべて対応しています`
    );
  } else {
    serviceScore = Math.round(
      (matchedServices.length / desiredServices.length) * 25
    );
    const missing = desiredServices.filter(
      (s) => !provider.profile.serviceTypes.includes(s)
    );
    cautionReasons.push(
      `${matchedServices.join('・')}には対応していますが、${missing.join('・')}は対象外です`
    );
  }

  // 2. 支援内容・介助内容との一致 (25点)
  const userCareNeeds = user.needs.careNeeds;
  const matchedCare = userCareNeeds.filter((c) =>
    provider.capabilities.supportedCareItems.includes(c)
  );
  let careNeedsScore = 0;
  let missingEssentialCare = false;

  // 必須介助のチェック
  const essentialList =
    user.needs.essentialCareNeeds && user.needs.essentialCareNeeds.length > 0
      ? user.needs.essentialCareNeeds
      : userCareNeeds;

  const missingEssentials = essentialList.filter(
    (c) => !provider.capabilities.supportedCareItems.includes(c)
  );

  // 身体状況（2人介助・移乗介助）のチェック
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
      careNeedsScore = Math.max(0, careNeedsScore - 6);
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
        `希望される介助内容のうち「${labels.join('・')}」が対応項目に含まれていません`
      );
    } else if (matchedCare.length === userCareNeeds.length) {
      positiveReasons.push(
        `必要な介助内容（${matchedCare.slice(0, 3).join('・')}${
          matchedCare.length > 3 ? 'ほか' : ''
        }）にすべて対応可能です`
      );
    }
  }

  // 3. 希望曜日・時間帯との一致 (20点)
  const preferredDays = user.preferences.preferredDays;
  const preferredSlots = user.preferences.preferredTimeSlots;
  let scheduleScore = 0;

  if (preferredDays.length === 0) {
    scheduleScore = 20;
  } else {
    let dayMatchCount = 0;
    let dayAndSlotMatchCount = 0;
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
        } else {
          unmatchedDays.push(`${day}曜（時間帯要相談）`);
        }
      } else {
        unmatchedDays.push(`${day}曜`);
      }
    }

    const dayRatio = dayMatchCount / preferredDays.length;
    const slotRatio = dayAndSlotMatchCount / preferredDays.length;
    scheduleScore = Math.round(dayRatio * 10 + slotRatio * 10);

    if (dayAndSlotMatchCount === preferredDays.length) {
      positiveReasons.push(
        `希望曜日（${preferredDays.join('・')}）と時間帯がすべて一致しています`
      );
    } else if (dayMatchCount > 0) {
      cautionReasons.push(
        `曜日・時間帯は一部確認が必要です（${unmatchedDays.join('、')}）`
      );
    } else {
      cautionReasons.push(
        `希望曜日（${preferredDays.join('・')}）の空き枠について個別相談が必要です`
      );
    }
  }

  // 4. 対応地域との一致 (10点)
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
    positiveReasons.push(`対応地域（${matchedAreas.join('・')}）に含まれています`);
  } else {
    areaScore = 0;
    outOfArea = true;
    criticalWarnings.push(
      `希望地域（${targetAreas.join('・')}）が事業所の対応地域外です`
    );
  }

  // 5. 障害特性・支援経験との一致 (10点)
  const userDisabilities = user.needs.disabilityTypes;
  let disabilityExpScore = 0;
  const matchedDisabilities = userDisabilities.filter((d) => {
    if (d === 'その他・複数該当') return true;
    return provider.capabilities.supportedDisabilities.includes(d);
  });

  const needsBehaviorCare =
    user.needs.communicationConsiderations.includes('パニック時の対応が必要') ||
    user.needs.communicationConsiderations.includes(
      '行動面で専門的な配慮が必要'
    );
  const providerHasBehaviorExp =
    provider.capabilities.supportedDisabilities.includes(
      '行動面で配慮が必要な方'
    );

  if (userDisabilities.length === 0) {
    disabilityExpScore = 10;
  } else {
    disabilityExpScore = Math.round(
      (matchedDisabilities.length / userDisabilities.length) * 8
    );
    if (!needsBehaviorCare || providerHasBehaviorExp) {
      disabilityExpScore += 2;
    } else {
      cautionReasons.push('行動面・パニック時の専門的配慮について事前確認を推奨します');
    }
  }

  // 6. ヘルパーの性別に関する希望との一致 (10点)
  const genderPref = user.preferences.helperGenderPreference;
  const availGenders = provider.capabilities.availableHelperGenders;
  const policy = provider.capabilities.helperGenderPolicy;
  let genderScore = 10;
  let genderMismatchCritical = false;

  const checkGenderMatch = (target: '男性' | '女性'): boolean => {
    return availGenders.includes(target);
  };

  if (genderPref === '性別は問わない') {
    genderScore = 10;
  } else if (genderPref === '女性ヘルパーを希望') {
    if (checkGenderMatch('女性')) {
      genderScore = 10;
      positiveReasons.push('女性ヘルパーの希望に対応可能です');
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
      genderScore = 10;
      positiveReasons.push('男性ヘルパーの希望に対応可能です');
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
      genderScore = 10;
      positiveReasons.push('同性ヘルパーの希望に対応可能です');
    } else if (
      policy === '同性介助の希望に可能な範囲で対応' ||
      policy === '条件によって相談可能'
    ) {
      genderScore = 6;
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
      genderScore = 10;
      positiveReasons.push('介助内容に応じたヘルパー性別の相談が可能です');
    } else {
      genderScore = 7;
      cautionReasons.push('介助内容別のヘルパー性別について事前相談が必要です');
    }
  }

  const totalScore =
    serviceScore +
    careNeedsScore +
    scheduleScore +
    areaScore +
    disabilityExpScore +
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
    scheduleScore < 10 ||
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
    const mainPos =
      positiveReasons[0] || '一部の希望条件に対応しています';
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
    scheduleScore,
    areaScore,
    disabilityExpScore,
    genderScore,
    totalScore,
  };

  return {
    userId: user.profile.id,
    providerId: provider.profile.id,
    breakdown,
    judgment,
    criticalWarnings,
    positiveReasons,
    cautionReasons,
    summaryText,
  };
}

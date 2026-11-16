import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Check,
  History,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import { buildUserPrivacySpeechText } from '../utils/speech';

export const UserPrivacySettings: React.FC = () => {
  const {
    activeUserId,
    currentUserBundle,
    userPIIList,
    providerProfiles,
    disclosureHistory,
    getDisclosureStage,
    grantStage2Disclosure,
    grantStage3Disclosure,
    revokeDisclosureToStage,
    revokeStage3Disclosure,
    navigateTo,
    openProviderDetail,
    openChatWith,
  } = useAppState();

  const [previewProviderId, setPreviewProviderId] = useState<string | null>(
    null
  );
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const { profile, needs, preferences } = currentUserBundle;
  const userPii = userPIIList.find((p) => p.userId === activeUserId);
  const myHistory = disclosureHistory.filter((h) => h.userId === activeUserId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigateTo('user-dashboard')}
          className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200/70 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          利用者ホームへ戻る
        </button>
        <div className="flex items-center gap-2">
          <SpeechButton
            speechId="screen-user-privacy"
            isPrimaryScreenReader
            getText={() =>
              buildUserPrivacySpeechText({
                nickname: profile.nickname,
                providerCount: providerProfiles.length,
                stage3Count: providerProfiles.filter(
                  (prov) => getDisclosureStage(activeUserId, prov.id).stage === 3
                ).length,
              })
            }
          />
          <HelpTooltip guideKey="user-privacy" />
        </div>
      </div>

      {/* 3段階開示ルールの明示 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="w-6 h-6 text-teal-800 shrink-0 mt-1"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              個人情報の3段階開示管理と開示履歴
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed">
              個人情報は最初から公開されません。相談の進み具合に合わせて「第1段階：匿名相談」「第2段階：条件の開示」「第3段階：連絡先の開示（面談・見学日程決定後）」を事業所ごとに設定・取り消しできます。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">
              第1段階「匿名相談」
            </span>
            <p className="text-slate-600">
              ニックネーム（{profile.nickname || profile.anonymousCode}）と希望サービス概要のみでチャットできます。障害詳細・連絡先は見えません。
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200 space-y-1">
            <span className="font-bold text-teal-950 block">
              第2段階「条件の開示」
            </span>
            <p className="text-slate-700">
              利用者が同意した場合のみ開示：障害種別（{needs.disabilityTypes.join('・') || '未設定'}）・介助内容・希望曜日（{preferences.preferredDays.join('・') || '未設定'}）・特性プロフィール。
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-1">
            <span className="font-bold text-indigo-950 block">
              第3段階「連絡先の開示」
            </span>
            <p className="text-slate-700">
              面談・見学の日程決定後に同意した場合のみ開示：{userPii?.fullName || '本名'} ／{' '}
              {userPii?.phoneNumber || '電話番号'} ／ {userPii?.email || 'メール'}
            </p>
          </div>
        </div>

        {statusMsg && (
          <div
            role="status"
            className="p-4 rounded-xl bg-teal-50 border border-teal-600 text-teal-950 font-bold text-sm"
          >
            {statusMsg}
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-amber-50 border border-amber-400 text-amber-950 font-bold text-sm"
          >
            {errorMsg}
          </div>
        )}
      </section>

      {/* 各事業所への開示ステータス一覧 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          事業所ごとの情報開示ステータス一覧
        </h2>

        {providerProfiles.length === 0 ? (
          <p className="text-sm text-slate-600">
            現在登録されている事業所はありません。
          </p>
        ) : (
          <div className="divide-y divide-slate-200">
            {providerProfiles.map((prov) => {
              const disc = getDisclosureStage(activeUserId, prov.id);
              const isPreviewing = previewProviderId === prov.id;

              return (
                <div
                  key={prov.id}
                  data-testid={`privacy-row-${prov.id}`}
                  className="py-4 first:pt-0 last:pb-0 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => openProviderDetail(prov.id)}
                        className="text-base font-bold text-slate-900 hover:text-teal-800 text-left cursor-pointer"
                      >
                        {prov.name}（{prov.locationCity}）
                      </button>
                      <p className="text-sm text-slate-600">
                        現在の公開範囲：
                        <strong
                          className={
                            disc.stage === 3
                              ? 'text-indigo-900 ml-1'
                              : disc.stage === 2
                              ? 'text-teal-900 ml-1'
                              : 'text-slate-800 ml-1'
                          }
                        >
                          第{disc.stage}段階（
                          {disc.stage === 1
                            ? '匿名相談のみ'
                            : disc.stage === 2
                            ? '条件の開示済み'
                            : '連絡先（氏名・電話・メール）開示中'}
                          ）
                        </strong>
                      </p>
                      <p className="text-xs text-slate-500">
                        {disc.scheduleDecidedAt
                          ? `面談・見学日程確定済み（${disc.scheduleSummary}）`
                          : '面談・見学日程：未確定（連絡先の開示は日程確定後に利用できます）'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {disc.stage === 1 && (
                        <button
                          type="button"
                          data-testid={`privacy-grant-s2-${prov.id}`}
                          onClick={() => {
                            grantStage2Disclosure(activeUserId, prov.id);
                            setErrorMsg('');
                            setStatusMsg(
                              `「${prov.name}」に第2段階「条件の開示」を行いました。`
                            );
                          }}
                          className="min-h-[42px] px-4 py-2 rounded-xl border border-teal-700 text-teal-900 bg-teal-50 hover:bg-teal-100 text-xs sm:text-sm font-bold cursor-pointer"
                        >
                          第2段階（条件）を開示
                        </button>
                      )}

                      {disc.stage === 2 && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              revokeDisclosureToStage(activeUserId, prov.id, 1);
                              setErrorMsg('');
                              setStatusMsg(
                                `「${prov.name}」の開示設定を第1段階（匿名相談）へ戻しました。`
                              );
                            }}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                          >
                            匿名へ戻す
                          </button>

                          {disc.scheduleDecidedAt ? (
                            <button
                              type="button"
                              data-testid={`privacy-open-s3-${prov.id}`}
                              onClick={() => setPreviewProviderId(prov.id)}
                              className="min-h-[42px] px-4 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white text-xs sm:text-sm font-bold cursor-pointer"
                            >
                              第3段階（連絡先）を開示
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openChatWith(prov.id)}
                              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>チャットで日程確定</span>
                            </button>
                          )}
                        </>
                      )}

                      {disc.stage === 3 && (
                        <>
                          <button
                            type="button"
                            data-testid={`privacy-revoke-s3-${prov.id}`}
                            onClick={() => {
                              revokeStage3Disclosure(activeUserId, prov.id);
                              setErrorMsg('');
                              setStatusMsg(
                                `「${prov.name}」への連絡先開示を取り消し、第2段階へ戻しました。`
                              );
                            }}
                            className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                          >
                            連絡先開示を取り消す
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isPreviewing && (
                    <div className="p-4 rounded-xl bg-indigo-50/70 border-2 border-indigo-700 space-y-3">
                      <p className="text-sm font-bold text-indigo-950">
                        「{prov.name}」に氏名（{userPii?.fullName || profile.nickname}）・電話番号（{userPii?.phoneNumber || '未設定'}）・メールアドレス（{userPii?.email || '未設定'}）を開示しますか？
                      </p>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          data-testid={`privacy-confirm-s3-${prov.id}`}
                          onClick={() => {
                            const res = grantStage3Disclosure(
                              activeUserId,
                              prov.id,
                              true
                            );
                            setPreviewProviderId(null);
                            if (!res.ok) {
                              setErrorMsg(
                                res.message || '日程確定後に開示できます。'
                              );
                              return;
                            }
                            setErrorMsg('');
                            setStatusMsg(
                              `「${prov.name}」へ第3段階「連絡先の開示」を行いました。`
                            );
                          }}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" aria-hidden="true" />
                          <span>連絡先を開示する</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewProviderId(null)}
                          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold cursor-pointer"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 開示履歴一覧（「何が・誰に・いつ開示されたか」） */}
      <section
        data-testid="disclosure-history-section"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4"
      >
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-teal-800" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900">
            開示・取消の履歴（何が・誰に・いつ開示されたか）
          </h2>
        </div>

        {myHistory.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span>まだ事業所に開示した履歴はありません。</span>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap">
                    日時
                  </th>
                  <th className="py-2.5 px-3 font-bold">開示先（事業所）</th>
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap">
                    段階・操作
                  </th>
                  <th className="py-2.5 px-3 font-bold">開示・変更された項目</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {myHistory.map((h) => (
                  <tr key={h.id}>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {h.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {h.providerName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-xs font-bold ${
                          h.action === 'granted'
                            ? 'bg-teal-50 border-teal-200 text-teal-900'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        第{h.stage}段階（
                        {h.action === 'granted' ? '開示' : '取り消し'}）
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {h.disclosedItems.join('・')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

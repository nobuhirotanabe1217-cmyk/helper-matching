import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { HelpTooltip } from './HelpTooltip';
import { SpeechButton } from './SpeechButton';
import { buildUserPrivacySpeechText } from '../utils/speech';

export const UserPrivacySettings: React.FC = () => {
  const {
    activeUserId,
    currentUserBundle,
    providerProfiles,
    getDisclosureStage,
    grantStage3Disclosure,
    revokeStage3Disclosure,
    navigateTo,
    openProviderDetail,
  } = useAppState();

  const [previewProviderId, setPreviewProviderId] = useState<string | null>(
    null
  );
  const [statusMsg, setStatusMsg] = useState<string>('');

  const { profile } = currentUserBundle;

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

      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="w-6 h-6 text-teal-800 shrink-0 mt-1"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              登録内容の公開設定（個人情報の段階的開示）
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed">
              当サービスでは、利用者の個人情報を最初から全事業所に公開しません。事業所ごとに「第1段階（匿名）」「第2段階（メッセージ交換）」「第3段階（本人同意による追加情報の開示）」を管理できます。
            </p>
          </div>
        </div>

        {/* 第3段階で開示される項目の確認ボックス */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
          <p className="font-bold text-slate-900">
            あなたが「この情報を事業所に開示する（第3段階）」に同意した事業所にのみ表示される情報：
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <dt className="text-slate-500">ニックネーム・登録者の立場</dt>
              <dd className="font-bold text-slate-900">
                {profile.nickname}（{profile.disclosableInfo.contactPersonRole}）
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">最寄り駅エリア</dt>
              <dd className="font-bold text-slate-900">
                {profile.disclosableInfo.nearestStationArea}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">担当相談支援事業所</dt>
              <dd className="font-bold text-slate-900">
                {profile.disclosableInfo.consultationSupportOffice}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">具体的な希望日時メモ</dt>
              <dd className="font-bold text-slate-900">
                {profile.disclosableInfo.detailedScheduleNote}
              </dd>
            </div>
          </dl>
        </div>

        {statusMsg && (
          <div
            role="status"
            className="p-4 rounded-xl bg-teal-50 border border-teal-600 text-teal-950 font-bold text-sm"
          >
            {statusMsg}
          </div>
        )}
      </section>

      {/* 各事業所への開示状況一覧 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          事業所ごとの情報開示ステータス一覧
        </h2>

        <div className="divide-y divide-slate-200">
          {providerProfiles.map((prov) => {
            const disc = getDisclosureStage(activeUserId, prov.id);
            const isPreviewing = previewProviderId === prov.id;

            return (
              <div key={prov.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
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
                            ? 'text-teal-900 ml-1'
                            : 'text-slate-800 ml-1'
                        }
                      >
                        第{disc.stage}段階（
                        {disc.stage === 1
                          ? '匿名情報のみ公開'
                          : disc.stage === 2
                          ? 'チャット相談中・匿名'
                          : '本人同意により詳細相談情報を開示中'}
                        ）
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {disc.stage < 3 ? (
                      <button
                        type="button"
                        onClick={() => setPreviewProviderId(prov.id)}
                        className="min-h-[44px] px-4 py-2 rounded-xl border border-teal-700 text-teal-900 bg-teal-50 hover:bg-teal-100 text-sm font-bold cursor-pointer"
                      >
                        開示内容を確認して同意する
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          revokeStage3Disclosure(activeUserId, prov.id);
                          setStatusMsg(
                            `「${prov.name}」への詳細情報開示を取り消しました。`
                          );
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-bold cursor-pointer"
                      >
                        開示を取り消す（匿名に戻す）
                      </button>
                    )}
                  </div>
                </div>

                {isPreviewing && (
                  <div className="p-4 rounded-xl bg-teal-50/70 border-2 border-teal-700 space-y-3">
                    <p className="text-sm font-bold text-teal-950">
                      「{prov.name}」に最寄り駅エリア（
                      {profile.disclosableInfo.nearestStationArea}
                      ）および担当相談支援事業所名を開示しますか？
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          grantStage3Disclosure(activeUserId, prov.id);
                          setPreviewProviderId(null);
                          setStatusMsg(
                            `「${prov.name}」へ第3段階の情報開示を行いました。`
                          );
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" aria-hidden="true" />
                        この情報を事業所に開示する
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
      </section>
    </div>
  );
};

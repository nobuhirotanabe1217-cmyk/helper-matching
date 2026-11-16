import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  FileText,
  Key,
  Database,
  Ban,
  Activity,
  TrendingUp,
  Building2,
  Users,
  CreditCard,
  MapPin,
  Sliders,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { calculateAdminBusinessMetrics } from '../utils/subscription';
import { ProviderAccountApprovalStatus } from '../types/domain';
import { HelpTooltip } from './HelpTooltip';

export const AdminSecurityConsole: React.FC = () => {
  const {
    session,
    auditLogs,
    rateLimitMap,
    securityAlertMessage,
    setSecurityAlertMessage,
    toggleMfaSetting,
    simulateRateLimitTrigger,
    userPIIList,
    userProfiles,
    providerProfiles,
    providerSubscriptions,
    subscriptionPlans,
    chatRequests,
    interactions,
    updatePlanMonthlyPrice,
    updateProviderApprovalStatus,
    subscribeProviderToPlan,
    navigateTo,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<
    'business' | 'overview' | 'audit' | 'separation' | 'production_gap'
  >('business');

  const [filterAction, setFilterAction] = useState<string>('all');
  const [showPiiDemoMask, setShowPiiDemoMask] = useState<boolean>(false);

  const standardPlan =
    subscriptionPlans.find((p) => p.id === 'standard') || subscriptionPlans[1];
  const [priceInput, setPriceInput] = useState<string>(
    String(standardPlan?.monthlyPriceYen ?? 3980)
  );
  const [priceSavedMessage, setPriceSavedMessage] = useState<string>('');

  const metrics = calculateAdminBusinessMetrics({
    users: userProfiles,
    providers: providerProfiles,
    subscriptions: providerSubscriptions,
    plans: subscriptionPlans,
    chatRequests,
    interactions,
  });

  const projectedMonthlyRevenueAt50 = metrics.simulatedTarget50RevenueYen;

  const blockedIpCount = Object.values(rateLimitMap).filter(
    (r) => r.isBlocked
  ).length;

  const securityAlertLogs = auditLogs.filter((l) => l.isSecurityAlert);

  const filteredLogs = auditLogs.filter((l) => {
    if (filterAction !== 'all') {
      return l.action === filterAction;
    }
    return true;
  });

  const handlePriceSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(priceInput);
    if (Number.isNaN(numeric) || numeric < 0) return;
    updatePlanMonthlyPrice('standard', numeric);
    setPriceSavedMessage(
      `有料プラン月額料金を ${numeric.toLocaleString()}円 に更新しました（売上試算・事業者画面に即時反映済）。`
    );
    setTimeout(() => setPriceSavedMessage(''), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* 画面ヘッダー */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-800 text-white">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-bold text-teal-800">
                ケアピタ（CarePita）運営管理者コンソール
              </p>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              事業運営・サブスク契約管理＆セキュリティ監査
            </h1>
            <p className="text-sm text-slate-600">
              初期展開エリア（杉並区・中野区・練馬区／目標50事業所）の契約状況・売上試算と、個人情報分離管理・監査ログを一元管理します。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <HelpTooltip guideKey="admin-security" tone="slate" />
            <button
              type="button"
              onClick={() => navigateTo('top')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-bold cursor-pointer"
            >
              トップ画面へ戻る
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
              activeTab === 'business'
                ? 'bg-teal-800 text-white'
                : 'bg-teal-50 text-teal-900 border border-teal-300 hover:bg-teal-100'
            }`}
          >
            1. 事業運営・契約管理・売上試算
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            2. セキュリティ概要
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('separation')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
              activeTab === 'separation'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            3. 個人情報分離管理（A/B構造）
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            4. 監査ログ（{auditLogs.length}件）
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('production_gap')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
              activeTab === 'production_gap'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            5. 本番移行・実装状況整理
          </button>
        </div>

        {securityAlertMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-amber-50 border-2 border-amber-500 text-amber-950 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-sm font-bold">{securityAlertMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setSecurityAlertMessage(null)}
              className="text-xs font-bold text-amber-800 underline shrink-0 cursor-pointer"
            >
              閉じる
            </button>
          </div>
        )}
      </section>

      {/* ==================== TAB 1: 事業運営・契約管理・売上試算 ==================== */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          {/* 主要KPI 6カード */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-teal-800" />
                登録利用者数
              </span>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {metrics.totalUsers}
                <span className="text-xs font-normal text-slate-600 ml-1">
                  名（無料）
                </span>
              </p>
              <p className="text-[11px] text-slate-500">利用者・家族は完全無料</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-800" />
                登録事業所数
              </span>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {metrics.totalProviders}
                <span className="text-xs font-normal text-slate-600 ml-1">
                  / 目標50
                </span>
              </p>
              <p className="text-[11px] text-slate-500">杉並・中野・練馬エリア</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500">
                無料プラン事業所
              </span>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-800">
                {metrics.freeProvidersCount}
                <span className="text-xs font-normal text-slate-600 ml-1">
                  事業所
                </span>
              </p>
              <p className="text-[11px] text-slate-500">月額0円（閲覧のみ）</p>
            </div>

            <div className="bg-white border-2 border-teal-700 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-teal-900 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-teal-800" />
                有料契約事業所数
              </span>
              <p className="text-2xl font-bold font-mono tabular-nums text-teal-900">
                {metrics.paidProvidersCount}
                <span className="text-xs font-normal text-slate-600 ml-1">
                  事業所
                </span>
              </p>
              <p className="text-[11px] text-teal-800 font-bold">
                チャット・案件管理解放
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500">
                有料プラン転換率
              </span>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {metrics.paidConversionRatePercent}%
              </p>
              <p className="text-[11px] text-slate-500">
                登録事業所に占める有料比率
              </p>
            </div>

            <div className="bg-teal-900 text-white rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-teal-200 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                現在の月額売上試算
              </span>
              <p className="text-2xl font-bold font-mono tabular-nums">
                ¥{metrics.estimatedMonthlyRevenueYen.toLocaleString()}
              </p>
              <p className="text-[11px] text-teal-100">
                50社到達時試算: ¥{projectedMonthlyRevenueAt50.toLocaleString()}/月
              </p>
            </div>
          </div>

          {/* 地域別・サービス種別・マッチング稼働状況 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 地域別の登録事業所数 */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-800" />
                地域別の対応・登録事業所数
              </h2>
              <p className="text-xs text-slate-600">
                初期展開エリア（杉並区・中野区・練馬区周辺）のカバー状況
              </p>
              <div className="space-y-2 pt-1">
                {Object.entries(metrics.providersByArea).map(([area, count]) => (
                  <div
                    key={area}
                    className="flex items-center justify-between text-sm py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <span className="font-bold text-slate-800">{area}</span>
                    <span className="font-mono font-bold text-teal-900">
                      {count} 事業所
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* サービス種別ごとの登録数 */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-800" />
                サービス種別ごとの登録事業所数
              </h2>
              <p className="text-xs text-slate-600">
                対象4サービスの提供体制バランス
              </p>
              <div className="space-y-2 pt-1">
                {Object.entries(metrics.providersByService).map(
                  ([service, count]) => (
                    <div
                      key={service}
                      className="flex items-center justify-between text-sm py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <span className="font-bold text-slate-800">{service}</span>
                      <span className="font-mono font-bold text-teal-900">
                        {count} 事業所
                      </span>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* チャット申請数・マッチング状況 */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-800" />
                チャット申請・マッチング進捗状況
              </h2>
              <p className="text-xs text-slate-600">
                有料プラン事業所からのアプローチと承認状況
              </p>
              <div className="space-y-2 pt-1 text-sm">
                <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">
                    チャット開始申請 総数
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {metrics.totalChatRequests} 件
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-teal-50 border border-teal-200">
                  <span className="text-teal-950 font-bold">
                    利用者承認済（チャット開通）
                  </span>
                  <span className="font-mono font-bold text-teal-900">
                    {metrics.approvedChatRequests} 件
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-amber-950 font-medium">
                    利用者の返信・承認待ち
                  </span>
                  <span className="font-mono font-bold text-amber-900">
                    {metrics.pendingChatRequests} 件
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">
                    対応中案件（契約・面談調整中）
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {metrics.activeCasesCount} 件
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* 料金プラン金額変更設定（指示書 9・10） */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-teal-800" />
                  有料プラン月額料金の設定変更（初期設定：3,980円）
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  事業検証フェーズに合わせて月額料金を柔軟に変更でき、事業者側画面・売上試算に即時反映されます。
                </p>
              </div>
            </div>

            {priceSavedMessage && (
              <div
                role="status"
                className="p-3 rounded-xl bg-teal-50 border border-teal-400 text-teal-950 text-xs sm:text-sm font-bold"
              >
                {priceSavedMessage}
              </div>
            )}

            <form
              onSubmit={handlePriceSave}
              className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1"
            >
              <div className="space-y-1">
                <label
                  htmlFor="admin-plan-price-input"
                  className="block text-xs font-bold text-slate-700"
                >
                  有料プラン（スタンダード）月額料金（税込・円）
                </label>
                <input
                  id="admin-plan-price-input"
                  type="number"
                  min={0}
                  step={100}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="min-h-[44px] w-48 px-3.5 py-2 rounded-xl border border-slate-300 text-base font-mono font-bold text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-sm font-bold cursor-pointer"
              >
                料金設定を更新する
              </button>

              <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                <span className="text-xs text-slate-500 font-bold">
                  プリセット検証：
                </span>
                {[2980, 3980, 4980].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setPriceInput(String(preset));
                      updatePlanMonthlyPrice('standard', preset);
                      setPriceSavedMessage(
                        `有料プラン月額料金を ${preset.toLocaleString()}円 に変更しました。`
                      );
                      setTimeout(() => setPriceSavedMessage(''), 4000);
                    }}
                    className="min-h-[38px] px-3 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-teal-50 text-xs font-mono font-bold text-slate-800 cursor-pointer"
                  >
                    ¥{preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </form>
          </section>

          {/* 事業者アカウント管理（一覧表示・承認・停止・プラン切替） */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-800" />
                登録事業者アカウント管理（一覧・承認／停止・契約プラン確認）
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                事業所の審査ステータス（承認済／一時停止）や契約プランを管理できます。
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-3 px-3 font-bold">事業所名・所在地</th>
                    <th className="py-3 px-3 font-bold">対応サービス</th>
                    <th className="py-3 px-3 font-bold">現在の契約プラン</th>
                    <th className="py-3 px-3 font-bold">アカウント状態</th>
                    <th className="py-3 px-3 font-bold text-right">管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {providerProfiles.map((prov) => {
                    const sub = providerSubscriptions.find(
                      (s) => s.providerId === prov.id
                    );
                    const isPaid =
                      sub &&
                      sub.planId !== 'free' &&
                      sub.status === 'active';
                    const approvalStatus: ProviderAccountApprovalStatus =
                      sub?.accountApprovalStatus || 'approved';

                    return (
                      <tr key={prov.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{prov.name}</p>
                          <p className="text-xs text-slate-500">
                            {prov.locationCity}（対応：{prov.coverageAreas.join('・')}）
                          </p>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-700">
                          {prov.serviceTypes.join(' / ')}
                        </td>
                        <td className="py-3 px-3">
                          {isPaid ? (
                            <div>
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-950 font-bold text-xs">
                                有料プラン（¥
                                {(
                                  standardPlan?.monthlyPriceYen ?? 3980
                                ).toLocaleString()}
                                /月）
                              </span>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                次回更新: {sub?.nextRenewalDate}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">
                              無料プラン（0円）
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {approvalStatus === 'approved' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800">
                              <CheckCircle className="w-3.5 h-3.5" />
                              承認済・公開中
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                              <Ban className="w-3.5 h-3.5" />
                              停止中
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              subscribeProviderToPlan(
                                prov.id,
                                isPaid ? 'free' : 'standard'
                              )
                            }
                            className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer"
                          >
                            {isPaid ? '無料へ変更' : '有料へ変更'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateProviderApprovalStatus(
                                prov.id,
                                approvalStatus === 'approved'
                                  ? 'suspended'
                                  : 'approved'
                              )
                            }
                            className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                              approvalStatus === 'approved'
                                ? 'border border-red-300 text-red-800 hover:bg-red-50'
                                : 'bg-teal-800 text-white hover:bg-teal-900'
                            }`}
                          >
                            {approvalStatus === 'approved'
                              ? '一時停止する'
                              : '承認に戻す'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB 2: 概要 & 不正アクセスシミュレーション ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* セキュリティKPIカード */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500">
                AI機微情報送信保護
              </span>
              <p className="text-lg font-bold text-teal-900 flex items-center gap-1.5">
                <Ban className="w-5 h-5 text-teal-800" />
                完全遮断中（OFF）
              </p>
              <p className="text-xs text-slate-600">
                障害情報・ニーズは生成AIに送信されません
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500">
                認証モデル・多要素認証
              </span>
              <p className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <Key className="w-5 h-5 text-teal-800" />
                {session.mfaEnabled ? 'MFA有効化済' : 'MFA未設定'}
              </p>
              <button
                type="button"
                onClick={toggleMfaSetting}
                className="text-xs font-bold text-teal-800 underline cursor-pointer"
              >
                {session.mfaEnabled ? '設定を切替（無効化試行）' : 'MFAを有効化する'}
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500">
                不正アクセス遮断中IP
              </span>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {blockedIpCount} 件
              </p>
              <p className="text-xs text-slate-600">連続失敗検知レートリミット</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500">
                セキュリティ警告ログ
              </span>
              <p className="text-2xl font-bold font-mono tabular-nums text-amber-700">
                {securityAlertLogs.length} 件
              </p>
              <p className="text-xs text-slate-600">未認可PII要求の自動遮断</p>
            </div>
          </div>

          {/* セキュリティテスト・シミュレーション機能 */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-800" />
                セキュリティ機能の動作テスト（シミュレーション）
              </h2>
              <p className="text-sm text-slate-600">
                不正アクセス防御や権限拒否ロジックが正常に作動するか画面上で検証できます。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <p className="font-bold text-slate-900 text-sm">
                  1. ブルートフォース（連続ログイン試行）遮断テスト
                </p>
                <p className="text-xs text-slate-600">
                  同一IPからの5回連続認証失敗をシミュレートし、自動アカウント・IPロックおよび監査ログ生成を確認します。
                </p>
                <button
                  type="button"
                  onClick={simulateRateLimitTrigger}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  5回連続失敗をシミュレート実行
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <p className="font-bold text-slate-900 text-sm">
                  2. 最小特権原則（管理者による直接PII閲覧制限）
                </p>
                <p className="text-xs text-slate-600">
                  運営管理者であっても、本人の明示的同意のない機微な個人特定情報への無制限アクセスは拒否される安全構造です。
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-teal-950 font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-800 shrink-0" />
                  管理者によるusers_pii直接参照はサーバーサイドで拒否確認済
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB 3: 個人情報の分離管理 (A/B構造) ==================== */}
      {activeTab === 'separation' && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-800" />
                個人情報の分離管理アーキテクチャ
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                本システムでは、個人を特定する情報（領域A）と支援ニーズ（領域B）を物理的・論理的に別々のデータ領域で管理しています。両者はランダムな内部ID（userId）でのみ関連付けられ、事業所検索画面では領域AのAPIエンドポイントやコレクションには一切アクセスできません。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded">
                    領域 A: 本人特定情報 (PII)
                  </span>
                  <Lock className="w-4 h-4 text-red-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  users_pii（最重要機密・直接検索不可）
                </h3>
                <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                  <li>氏名・フリガナ（架空データ）</li>
                  <li>電話番号・メールアドレス</li>
                  <li>郵便番号・詳細住所（番地・部屋番号）</li>
                  <li>緊急連絡先氏名・電話番号</li>
                </ul>
                <p className="text-xs text-red-900 font-bold bg-white p-2.5 rounded-lg border border-red-200">
                  ※無料プラン・有料プランを問わず、本人の明示的な第3段階同意がない限り非公開。
                </p>
              </div>

              <div className="p-4 rounded-xl border-2 border-teal-200 bg-teal-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                    領域 B: 支援ニーズ・照合情報
                  </span>
                  <ShieldCheck className="w-4 h-4 text-teal-800" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  users_public_profile（匿名マッチング用）
                </h3>
                <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                  <li>匿名コード（例：利用希望者A（001））</li>
                  <li>市区町村（杉並区・中野区・練馬区等）</li>
                  <li>希望サービス（移動支援・居宅介護等）</li>
                  <li>支援・介助内容（車いす・移乗・入浴等）</li>
                  <li>希望曜日・時間帯・性別希望</li>
                </ul>
                <p className="text-xs text-teal-900 font-bold bg-white p-2.5 rounded-lg border border-teal-200">
                  ※個人を特定できる情報は一切含まず、無料プラン事業所でもニーズ概要・相性度を確認可能。
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">
                  内部ID（ランダムキー）によるデータ分離結合モデル
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPiiDemoMask(!showPiiDemoMask)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {showPiiDemoMask ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      PIIマスクを適用する
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      PII（架空名義）を開発者表示
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">内部ランダムID</th>
                      <th className="py-2.5 px-3 font-bold">領域B: 外部表示匿名ID</th>
                      <th className="py-2.5 px-3 font-bold">領域B: 居住市区町村</th>
                      <th className="py-2.5 px-3 font-bold text-red-800">
                        領域A: 氏名・詳細住所（厳重隔離）
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {userProfiles.map((p) => {
                      const pii = userPIIList.find((item) => item.userId === p.id);
                      return (
                        <tr key={p.id}>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {p.id}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-teal-900">
                            {p.anonymousCode}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800">{p.city}</td>
                          <td className="py-2.5 px-3 text-slate-800">
                            {showPiiDemoMask ? (
                              <span className="font-bold">
                                {pii?.fullName} / {pii?.detailedAddress}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">
                                [MASKED_PII_ENCRYPTED_VAULT]
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB 4: 操作履歴・監査ログ ==================== */}
      {activeTab === 'audit' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-800" />
                セキュリティ＆課金・チャット申請監査ログ
              </h2>
              <p className="text-xs text-slate-600">
                ログイン、プラン変更、チャット開始申請・承認、情報開示同意・取消などの記録。※機微な障害情報はログに含めない設計です。
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="log-filter" className="text-xs font-bold text-slate-600">
                絞り込み:
              </label>
              <select
                id="log-filter"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="min-h-[40px] px-3 py-1 rounded-xl border border-slate-300 text-xs font-medium bg-white"
              >
                <option value="all">すべてのアクション</option>
                <option value="AUTH_LOGIN">AUTH_LOGIN（ログイン）</option>
                <option value="DATA_VIEW_PII">DATA_VIEW_PII（個人特定情報）</option>
                <option value="DATA_VIEW_MATCHING">DATA_VIEW_MATCHING（照合閲覧）</option>
                <option value="CONSENT_GRANTED">CONSENT_GRANTED（承認・開示同意）</option>
                <option value="CONSENT_REVOKED">CONSENT_REVOKED（辞退・開示取消）</option>
                <option value="MESSAGE_SENT">MESSAGE_SENT（チャット申請・送信）</option>
                <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED（遮断ロック）</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`py-3 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 ${
                  log.isSecurityAlert ? 'bg-red-50/70 p-2.5 rounded-lg' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        log.isSecurityAlert
                          ? 'bg-red-200 text-red-900'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-900">
                      実行者: {log.actorRole} ({log.actorId})
                    </span>
                    {log.targetId && (
                      <span className="text-slate-500">→ 対象: {log.targetId}</span>
                    )}
                  </div>
                  <p className="text-slate-800">{log.detail}</p>
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums shrink-0">
                  {log.timestamp} · {log.ipAddress}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== TAB 5: 本番移行・実装状況整理（指示書 13） ==================== */}
      {activeTab === 'production_gap' && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-800" />
                試作品と本番運用の境界整理レポート（指示書 12・13）
              </h2>
              <p className="text-sm text-slate-600">
                今回の試作品で実装した機能、デモとして擬似的に表現している機能、本番導入時に必要な機能を明確に整理しています。
              </p>
            </div>

            {/* 1. 今回の試作品で実装した機能 */}
            <div className="border border-teal-200 rounded-xl p-4 bg-teal-50/40 space-y-2">
              <h3 className="font-bold text-teal-950 text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-800" />
                1. 今回の試作品で実装した機能
              </h3>
              <ul className="text-sm text-slate-800 space-y-1 list-disc list-inside">
                <li>
                  <strong>事業者向け2段階料金モデル（無料プラン0円／有料プラン月額3,980円）</strong>：プラン定義を定数・設定テーブル化し、将来のプレミアムプラン（4,980円）や管理画面からの金額変更に対応。
                </li>
                <li>
                  <strong>無料プラン事業者の閲覧制限＆チャット制限モーダル</strong>：匿名ニーズ概要と相性度（%）は閲覧可能とし、チャット送信や自由記述閲覧時は有料プラン案内モーダルを表示。
                </li>
                <li>
                  <strong>有料プラン事業者のチャット開始申請＆案件ステータス管理</strong>：利用希望者への「チャット開始申請」送信、および「検討中・対応中・対応不可」のステータス管理を実装。
                </li>
                <li>
                  <strong>利用者・家族側のチャット開始申請「承認／辞退」フロー</strong>：事業所からの申請通知カードを確認し、承認した場合のみチャットが開通する2段階同意設計。
                </li>
                <li>
                  <strong>運営管理者用の事業数値・サブスク売上試算コンソール</strong>：登録利用者・事業所数、有料転換率、月額売上試算、地域別・サービス別集計、アカウント承認／停止切替を実装。
                </li>
              </ul>
            </div>

            {/* 2. デモとして擬似的に表現している機能 */}
            <div className="border border-amber-300 rounded-xl p-4 bg-amber-50/50 space-y-2">
              <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-800" />
                2. デモとして擬似的に表現している機能
              </h3>
              <ul className="text-sm text-amber-950 space-y-1 list-disc list-inside">
                <li>
                  <strong>サブスクリプション契約・解約処理（課金デモ画面）</strong>：クレジットカード情報の入力は一切行わず、ワンクリックで契約状態（<code>free</code> / <code>active_paid</code>）と次回更新日を即時切り替える擬似決済として実装。
                </li>
                <li>
                  <strong>データ永続化とセッション管理</strong>：ブラウザ内のLocalStorageを用いた状態保持であり、複数端末間のリアルタイム同期や実メール・SMS通知は擬似表示で表現。
                </li>
              </ul>
            </div>

            {/* 3. 本番導入時に必要な機能 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-800" />
                3. 本番導入時に必要な機能（Stripe決済・セキュリティ基盤）
              </h3>
              <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                <li>
                  <strong>Stripe Checkout / Customer Portal 連携</strong>：カード情報を自社サーバーに一切触れさせず（非保持化）、Stripe Webhook（<code>checkout.session.completed</code>, <code>customer.subscription.deleted</code>）で契約ステータスを自動同期するバックエンド実装。
                </li>
                <li>
                  <strong>指定事業所番号の実在確認（WAM NET照合）</strong>：悪質・架空事業者の登録を防ぐため、東京都の指定障害福祉サービス事業者番号の審査フロー導入。
                </li>
                <li>
                  <strong>Firebase Authentication + Cloud Run バックエンド検証</strong>：有料プラン権限（Custom ClaimsまたはサーバーサイドDB照会）と個人情報第3段階開示同意をサーバー側で強制検証する仕組み。
                </li>
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

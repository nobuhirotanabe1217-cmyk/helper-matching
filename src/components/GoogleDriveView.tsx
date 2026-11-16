import React, { useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  FolderOpen,
  FileText,
  UploadCloud,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  Eye,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { calculateMatchResult } from '../utils/matching';
import { HelpTooltip } from './HelpTooltip';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  getCurrentGoogleUser,
  logout,
  listDriveFiles,
  createDriveTextFile,
  updateDriveTextFile,
  deleteDriveFile,
  getDriveFileTextContent,
  DriveFileItem,
} from '../utils/googleAuth';

interface PendingDriveMutation {
  type: 'create' | 'update' | 'delete';
  title: string;
  description: string;
  targetFileName: string;
  fileId?: string;
  content?: string;
}

export const GoogleSignInButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}> = ({ onClick, disabled = false, label = 'Sign in with Google' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="gsi-material-button inline-flex items-center justify-center min-h-[46px] px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 shadow-xs text-slate-800 font-bold text-sm transition-all cursor-pointer disabled:opacity-60"
  >
    <div className="gsi-material-button-state" />
    <div className="gsi-material-button-content-wrapper flex items-center gap-3">
      <div className="gsi-material-button-icon w-5 h-5 shrink-0">
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          className="block w-5 h-5"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
      </div>
      <span className="gsi-material-button-contents">{label}</span>
      <span className="sr-only">Sign in with Google</span>
    </div>
  </button>
);

export const GoogleDriveView: React.FC = () => {
  const {
    currentUserBundle,
    currentProviderBundle,
    providerProfiles,
    getProviderBundleById,
  } = useAppState();

  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(getCurrentGoogleUser());
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [statusBanner, setStatusBanner] = useState<string>('');

  // 新規・編集用ドキュメントエディタ
  const [docFileName, setDocFileName] = useState<string>(
    `ケアピタ_支援ニーズ条件シート_${currentUserBundle.profile.anonymousCode}.txt`
  );
  const [docContent, setDocContent] = useState<string>('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);

  // プレビュー用ステート
  const [previewFile, setPreviewFile] = useState<{
    file: DriveFileItem;
    content: string;
  } | null>(null);

  // 破壊的・変更操作の事前確認モーダル（MANDATORY）
  const [pendingMutation, setPendingMutation] =
    useState<PendingDriveMutation | null>(null);
  const [isExecutingMutation, setIsExecutingMutation] =
    useState<boolean>(false);

  // 初期テンプレート生成
  const buildUserCareSheetContent = useCallback(() => {
    const { profile, needs, preferences } = currentUserBundle;
    return [
      `==================================================`,
      `ケアピタ（CarePita）匿名支援ニーズ・介助条件シート`,
      `出力日時: ${new Date().toLocaleString('ja-JP')}`,
      `==================================================`,
      ``,
      `【基本情報（個人情報分離・匿名化済）】`,
      `・匿名ID: ${profile.anonymousCode}`,
      `・ニックネーム: ${profile.nickname}`,
      `・希望地域: ${profile.city}`,
      `・年代 / 性別: ${profile.ageGroup} / ${profile.gender}`,
      `・障害支援区分: ${needs.supportCategory}`,
      ``,
      `【希望する障害福祉サービス】`,
      `・${needs.desiredServices.join(' / ')}`,
      ``,
      `【必要な介助内容】`,
      `・${needs.careNeeds.join('、')}`,
      `・必須項目: ${needs.essentialCareNeeds.join('、') || 'なし'}`,
      ``,
      `【身体状況・移動手段】`,
      `・${needs.physicalConditions.join('、')}`,
      ``,
      `【コミュニケーション・行動面の配慮】`,
      `・${needs.communicationConsiderations.join('、')}`,
      `・補足: ${needs.communicationFreeText || '特になし'}`,
      ``,
      `【希望曜日・時間帯・ヘルパー性別希望】`,
      `・希望曜日: ${preferences.preferredDays.join('・')}（${preferences.frequency}）`,
      `・希望時間帯: ${preferences.preferredTimeSlots.join(' / ')}`,
      `・ヘルパー性別希望: ${preferences.helperGenderPreference}`,
      `・利用開始希望時期: ${preferences.startTiming}`,
      `・事業所へのメッセージ: ${preferences.freeMessageToProvider || 'なし'}`,
    ].join('\n');
  }, [currentUserBundle]);

  const buildProviderSheetContent = useCallback(() => {
    const { profile, capabilities, availability } = currentProviderBundle;
    const activeDays = availability.weeklySchedule
      .filter((d) => d.available)
      .map((d) => `${d.day}曜(${d.timeSlots.join('・')})`)
      .join(' / ');

    return [
      `==================================================`,
      `ケアピタ（CarePita）事業所受入条件・空き枠シート`,
      `出力日時: ${new Date().toLocaleString('ja-JP')}`,
      `==================================================`,
      ``,
      `【事業所概要】`,
      `・事業所名: ${profile.name}`,
      `・所在地: ${profile.locationCity}`,
      `・対応サービス: ${profile.serviceTypes.join(' / ')}`,
      `・訪問可能エリア: ${profile.coverageAreas.join('・')}`,
      `・現在の受入状況: ${availability.acceptanceStatus}`,
      ``,
      `【対応可能な介助項目】`,
      `・${capabilities.supportedCareItems.join('、')}`,
      `・車いす移乗介助: ${capabilities.supportsWheelchairTransfer ? '対応可' : '要相談'}`,
      `・2人介助対応: ${capabilities.supportsTwoPersonCare ? '対応可' : '不可'}`,
      `・同性介助方針: ${capabilities.helperGenderPolicy}`,
      ``,
      `【対応可能な曜日・時間帯】`,
      `・${activeDays || '要相談'}`,
      `・受入条件メモ: ${availability.acceptableConditionsNote}`,
    ].join('\n');
  }, [currentProviderBundle]);

  const buildMatchSummaryContent = useCallback(() => {
    const matches = providerProfiles
      .map((p) => {
        const bundle = getProviderBundleById(p.id);
        if (!bundle) return null;
        return {
          provider: bundle,
          result: calculateMatchResult(currentUserBundle, bundle),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort(
        (a, b) =>
          b.result.breakdown.totalScore - a.result.breakdown.totalScore
      );

    return [
      `==================================================`,
      `ケアピタ（CarePita）マッチング相性度比較レポート`,
      `対象利用者: ${currentUserBundle.profile.anonymousCode}（${currentUserBundle.profile.city}）`,
      `出力日時: ${new Date().toLocaleString('ja-JP')}`,
      `==================================================`,
      ``,
      ...matches.map(
        (m, idx) =>
          `${idx + 1}. ${m.provider.profile.name}（${m.provider.profile.locationCity}）\n` +
          `   ・相性度スコア: ${m.result.breakdown.totalScore}%（判定: ${m.result.judgment}）\n` +
          `   ・対応サービス: ${m.provider.profile.serviceTypes.join(' / ')}\n` +
          `   ・受入状況: ${m.provider.availability.acceptanceStatus}\n`
      ),
    ].join('\n');
  }, [currentUserBundle, providerProfiles, getProviderBundleById]);

  useEffect(() => {
    setDocContent(buildUserCareSheetContent());
  }, [buildUserCareSheetContent]);

  const fetchFiles = useCallback(async (query?: string) => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setIsLoadingFiles(true);
    setErrorMsg('');
    try {
      const list = await listDriveFiles(token, query);
      setFiles(list);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Googleドライブの読み込みに失敗しました';
      setErrorMsg(message);
      if (message.includes('401') || message.includes('403')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
        fetchFiles();
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, [fetchFiles]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        await fetchFiles(searchQuery);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Googleログイン中にエラーが発生しました';
      setErrorMsg(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    setFiles([]);
    setStatusBanner('Googleアカウントからサインアウトしました。');
  };

  // テンプレート切り替え
  const selectTemplate = (type: 'user' | 'provider' | 'match') => {
    setEditingFileId(null);
    if (type === 'user') {
      setDocFileName(
        `ケアピタ_支援ニーズ条件シート_${currentUserBundle.profile.anonymousCode}.txt`
      );
      setDocContent(buildUserCareSheetContent());
    } else if (type === 'provider') {
      setDocFileName(
        `ケアピタ_事業所受入条件シート_${currentProviderBundle.profile.name}.txt`
      );
      setDocContent(buildProviderSheetContent());
    } else {
      setDocFileName(
        `ケアピタ_マッチング相性レポート_${currentUserBundle.profile.anonymousCode}.txt`
      );
      setDocContent(buildMatchSummaryContent());
    }
  };

  // ファイルプレビュー・編集読み込み
  const handlePreviewFile = async (file: DriveFileItem) => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setErrorMsg('');
    try {
      const content = await getDriveFileTextContent(
        token,
        file.id,
        file.mimeType
      );
      setPreviewFile({ file, content });
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'このファイル形式のテキストプレビューは取得できません。右側の「Driveで開く」をご利用ください。'
      );
    }
  };

  const handleLoadForEdit = async (file: DriveFileItem) => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setErrorMsg('');
    try {
      const content = await getDriveFileTextContent(
        token,
        file.id,
        file.mimeType
      );
      setEditingFileId(file.id);
      setDocFileName(file.name);
      setDocContent(content);
      setStatusBanner(
        `「${file.name}」を編集フォームに読み込みました。内容を修正して上書き保存できます。`
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'テキスト形式以外のファイルは直接編集できません。'
      );
    }
  };

  // 変更・削除リクエスト（必ず確認ダイアログを挟む）
  const requestSaveDocument = () => {
    if (!docFileName.trim()) {
      setErrorMsg('ファイル名を入力してください。');
      return;
    }
    if (editingFileId) {
      setPendingMutation({
        type: 'update',
        title: 'Googleドライブ上のファイルを上書き更新しますか？',
        description: `Googleドライブ内の既存ファイル「${docFileName}」の内容を現在入力されているテキストで上書き保存します。`,
        targetFileName: docFileName,
        fileId: editingFileId,
        content: docContent,
      });
    } else {
      setPendingMutation({
        type: 'create',
        title: 'Googleドライブに新しいファイルを作成・保存しますか？',
        description: `あなたのGoogleドライブに「${docFileName}」を新規作成して保存します。`,
        targetFileName: docFileName,
        content: docContent,
      });
    }
  };

  const requestDeleteDocument = (file: DriveFileItem) => {
    setPendingMutation({
      type: 'delete',
      title: `Googleドライブから「${file.name}」を削除しますか？`,
      description:
        'この操作を実行すると、あなたのGoogleドライブから対象のファイルが完全に削除されます。元に戻すことはできません。',
      targetFileName: file.name,
      fileId: file.id,
    });
  };

  const executeConfirmedMutation = async () => {
    if (!pendingMutation) return;
    const token = await getAccessToken();
    if (!token) {
      setPendingMutation(null);
      setNeedsAuth(true);
      return;
    }

    setIsExecutingMutation(true);
    setErrorMsg('');
    try {
      if (pendingMutation.type === 'create') {
        await createDriveTextFile(
          token,
          pendingMutation.targetFileName,
          pendingMutation.content || ''
        );
        setStatusBanner(
          `Googleドライブに「${pendingMutation.targetFileName}」を保存しました。`
        );
      } else if (
        pendingMutation.type === 'update' &&
        pendingMutation.fileId
      ) {
        await updateDriveTextFile(
          token,
          pendingMutation.fileId,
          pendingMutation.content || ''
        );
        setStatusBanner(
          `Googleドライブの「${pendingMutation.targetFileName}」を上書き更新しました。`
        );
        setEditingFileId(null);
      } else if (
        pendingMutation.type === 'delete' &&
        pendingMutation.fileId
      ) {
        await deleteDriveFile(token, pendingMutation.fileId);
        setStatusBanner(
          `Googleドライブから「${pendingMutation.targetFileName}」を削除しました。`
        );
        if (previewFile?.file.id === pendingMutation.fileId) {
          setPreviewFile(null);
        }
      }
      setPendingMutation(null);
      await fetchFiles(searchQuery);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Googleドライブの操作中にエラーが発生しました'
      );
      setPendingMutation(null);
    } finally {
      setIsExecutingMutation(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* ヘッダーカード */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-teal-800">
              <FolderOpen className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-900 border border-teal-200">
                  Google Workspace 連携
                </span>
                <span className="text-xs font-bold text-slate-500">
                  個人情報分離・インメモリ認証トークン管理
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Google ドライブ連携（支援条件シート・受入予定表の保存と管理）
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                匿名化された支援ニーズ条件シートや事業所の受入条件表、マッチング相性レポートをご自身のGoogleドライブへ保存・閲覧・管理できます。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!needsAuth && user && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 shrink-0">
                <div className="text-xs">
                  <span className="block font-bold text-slate-900">
                    {user.displayName || 'Google ユーザー'}
                  </span>
                  <span className="block text-slate-500">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>サインアウト</span>
                </button>
              </div>
            )}
            <HelpTooltip guideKey="google-drive" />
          </div>
        </div>
      </section>

      {statusBanner && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-bold flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner('')}
            className="text-emerald-800 hover:underline text-xs cursor-pointer"
          >
            閉じる
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm font-bold flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-amber-900 hover:underline text-xs cursor-pointer"
          >
            閉じる
          </button>
        </div>
      )}

      {/* 未認証時のサインインカード */}
      {needsAuth ? (
        <section className="bg-white border-2 border-teal-200 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Google アカウントでサインインして Google ドライブを連携
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ボタンを押してGoogleアカウントでログインすると、ご自身のGoogleドライブ内のファイル一覧表示・検索や、ケアピタの支援条件シート・相性レポートの保存が行えます。アクセストークンはブラウザのメモリ上のみで安全に保持されます。
            </p>
          </div>
          <div className="pt-1 flex justify-center">
            <GoogleSignInButton
              onClick={handleLogin}
              disabled={isLoggingIn}
              label={
                isLoggingIn ? 'Google 認証中...' : 'Sign in with Google'
              }
            />
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左カラム：ケアピタ書類のGoogleドライブ出力・編集 */}
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-teal-800">
                STEP 1：書類の作成・上書き保存
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                ケアピタ書類を Google ドライブへ保存
              </h2>
              <p className="text-xs text-slate-600">
                テンプレートを選択して内容を編集し、Googleドライブへ保存できます（保存前に確認ダイアログが表示されます）。
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">
                テンプレートを選択
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => selectTemplate('user')}
                  className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50/60 hover:border-teal-300 text-left text-xs font-bold text-slate-800 cursor-pointer transition-colors"
                >
                  1. 利用者の匿名支援ニーズ条件シート（{currentUserBundle.profile.anonymousCode}）
                </button>
                <button
                  type="button"
                  onClick={() => selectTemplate('provider')}
                  className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50/60 hover:border-teal-300 text-left text-xs font-bold text-slate-800 cursor-pointer transition-colors"
                >
                  2. 事業所の受入条件・空き枠シート（{currentProviderBundle.profile.name}）
                </button>
                <button
                  type="button"
                  onClick={() => selectTemplate('match')}
                  className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50/60 hover:border-teal-300 text-left text-xs font-bold text-slate-800 cursor-pointer transition-colors"
                >
                  3. マッチング相性度比較レポート
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label
                  htmlFor="drive-doc-filename"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  保存ファイル名
                  {editingFileId && (
                    <span className="ml-2 text-amber-800 font-extrabold">
                      （既存ファイル上書きモード）
                    </span>
                  )}
                </label>
                <input
                  id="drive-doc-filename"
                  type="text"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="drive-doc-content"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  書類の内容（自由に追記・編集できます）
                </label>
                <textarea
                  id="drive-doc-content"
                  rows={10}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={requestSaveDocument}
                  className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <UploadCloud className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {editingFileId
                      ? 'Googleドライブへ上書き保存（確認へ）'
                      : 'Googleドライブへ新規保存（確認へ）'}
                  </span>
                </button>
                {editingFileId && (
                  <button
                    type="button"
                    onClick={() => selectTemplate('user')}
                    className="min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    新規作成に戻す
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 右カラム：Googleドライブのファイル一覧・検索・操作 */}
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-teal-800">
                  STEP 2：マイドライブのファイル閲覧・管理
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Google ドライブ内のファイル一覧（{files.length}件）
                </h2>
              </div>
              <button
                type="button"
                onClick={() => fetchFiles(searchQuery)}
                disabled={isLoadingFiles}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isLoadingFiles ? 'animate-spin' : ''
                  }`}
                  aria-hidden="true"
                />
                <span>再読み込み</span>
              </button>
            </div>

            {/* ファイル名検索バー */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchFiles(searchQuery);
                  }}
                  placeholder="Googleドライブ内のファイル名で検索（例：ケアピタ）"
                  aria-label="Googleドライブ内のファイル名で検索"
                  className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchFiles(searchQuery)}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                検索
              </button>
            </div>

            {/* プレビュー表示パネル */}
            {previewFile && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-teal-300 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-teal-900">
                    プレビュー：{previewFile.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewFile(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    閉じる
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {previewFile.content}
                </pre>
              </div>
            )}

            {/* ファイルリスト */}
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {isLoadingFiles ? (
                <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
                  Google ドライブからファイル一覧を取得しています...
                </div>
              ) : files.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs sm:text-sm text-slate-600">
                  該当するファイルが見つかりませんでした。左側のフォームからケアピタ書類をGoogleドライブに保存してみましょう。
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-teal-700">
                        <FileText className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          更新日時：
                          {file.modifiedTime
                            ? new Date(file.modifiedTime).toLocaleString(
                                'ja-JP'
                              )
                            : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(file)}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>内容確認</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadForEdit(file)}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg border border-teal-300 bg-teal-50 hover:bg-teal-100 text-xs font-bold text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>編集</span>
                      </button>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center gap-1"
                        >
                          <ExternalLink
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          <span>Drive</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => requestDeleteDocument(file)}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>削除</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* 破壊的・変更操作の明示的ユーザー確認モーダル（MANDATORY） */}
      {pendingMutation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drive-mutation-confirm-title"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  pendingMutation.type === 'delete'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Google ドライブ操作の確認
                </span>
                <h3
                  id="drive-mutation-confirm-title"
                  className="text-base sm:text-lg font-extrabold text-slate-900"
                >
                  {pendingMutation.title}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {pendingMutation.description}
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800">
              対象ファイル名：{pendingMutation.targetFileName}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isExecutingMutation}
                onClick={() => setPendingMutation(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={isExecutingMutation}
                onClick={executeConfirmedMutation}
                className={`min-h-[44px] px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold cursor-pointer ${
                  pendingMutation.type === 'delete'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-teal-800 hover:bg-teal-900'
                }`}
              >
                {isExecutingMutation
                  ? '実行中...'
                  : pendingMutation.type === 'delete'
                  ? '削除を実行する'
                  : pendingMutation.type === 'update'
                  ? '上書き更新を実行する'
                  : '保存を実行する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

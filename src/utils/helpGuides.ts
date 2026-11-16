import type { AppView } from '../context/AppStateContext';

export type HelpGuideKey =
  | AppView
  | 'matching-score-chart'
  | 'user-progress-board'
  | 'provider-progress-board'
  | 'user-favorites-memo'
  | 'disclosure-stages'
  | 'provider-payment-method';

export type HelpRoleScope = 'user' | 'provider' | 'shared' | 'admin';

export interface HelpGuideStep {
  heading: string;
  detail: string;
}

export interface HelpGuideItem {
  key: HelpGuideKey;
  roleScope: HelpRoleScope;
  title: string;
  summary: string;
  steps: HelpGuideStep[];
  tip?: string;
}

export const ALL_SCREEN_VIEWS: AppView[] = [
  'top',
  'login',
  'register',
  'registration-complete',
  'user-dashboard',
  'user-wizard',
  'user-search',
  'user-favorites',
  'user-provider-detail',
  'user-privacy',
  'provider-dashboard',
  'provider-wizard',
  'provider-search',
  'provider-user-detail',
  'provider-billing',
  'chat',
  'google-drive',
  'admin-security',
];

export const HELP_GUIDES: Record<HelpGuideKey, HelpGuideItem> = {
  top: {
    key: 'top',
    roleScope: 'shared',
    title: 'ケアピタの基本的な使い方',
    summary:
      '障害福祉ヘルパーを探す利用者・ご家族と、支援可能な事業所を匿名条件で安全につなぐマッチング画面です。',
    steps: [
      {
        heading: '利用者・事業所を新規登録',
        detail:
          '左の「利用者を新規登録する」または右の「事業所を新規登録する」から条件を登録します（最初は0件から試せます）。',
      },
      {
        heading: '上部バーで役割を切り替え',
        detail:
          '画面上部の「利用者画面 / 事業所画面」ボタンで、登録したどちらの視点にもワンクリックで移動できます。',
      },
      {
        heading: '相性比較からお気に入り・相談へ',
        detail:
          '希望介助や空き曜日の相性％を確認し、気になる事業所の保存やチャット相談に進めます。',
      },
    ],
    tip: '利用者は完全無料、事業所は登録・掲載・受信返信まで0円で試せます。',
  },

  login: {
    key: 'login',
    roleScope: 'shared',
    title: 'ログイン・2段階認証の使い方',
    summary:
      '利用者・事業所それぞれの登録メールアドレスとパスワード、2段階認証（メールまたはSMSの6桁コード）で安全にログインします。',
    steps: [
      {
        heading: '利用者 / 事業所の切り替え',
        detail:
          '上部のタブで「利用者ログイン」または「事業所ログイン」を選択してから入力します。',
      },
      {
        heading: 'メールアドレス・パスワード入力',
        detail:
          '新規登録時に設定したメールアドレスとパスワードを入力します。画面下部のテストアカウントボタンで自動入力もできます。',
      },
      {
        heading: 'メール・SMSの2段階認証（6桁コード）',
        detail:
          '個人情報を守るため、登録済みのメールまたはSMSへ届く6桁の確認コードを入力してログインを完了します。',
      },
    ],
    tip: 'デモ検証時は確認コード表示エリアからワンタップでテストコードを入力できます。',
  },

  register: {
    key: 'register',
    roleScope: 'shared',
    title: '新規登録画面の使い方',
    summary:
      '利用者・事業所それぞれの希望条件や対応可能条件を1画面で登録できます。テスト入力ボタンも用意しています。',
    steps: [
      {
        heading: '登録する立場を選択',
        detail:
          '上部の「利用者を新規登録」または「事業所を新規登録」タブを選んで入力フォームを切り替えます。',
      },
      {
        heading: '必須条件を選択・テスト入力',
        detail:
          '希望地域や介助内容・曜日をタップして選びます。「ワンタップでテスト内容を自動入力」を使うとすぐ試せます。',
      },
      {
        heading: 'メール／SMSの2段階認証で確認',
        detail:
          '事業所は料金プランを選んだあと、設定したメールまたはSMSへ届く6桁の確認コードを入力すると安全に登録が完了します。',
      },
    ],
    tip: '利用者の氏名や詳細住所はここでは不要です。匿名で安全に登録できます。',
  },

  'registration-complete': {
    key: 'registration-complete',
    roleScope: 'shared',
    title: '登録完了後の進め方',
    summary:
      'アカウントの登録が無事に完了した状態です。次の画面へ進んで実際のマッチング動作を試せます。',
    steps: [
      {
        heading: '登録内容のサマリーを確認',
        detail:
          '設定した地域・サービス種別・曜日や料金プランが正しく保存されているか確認できます。',
      },
      {
        heading: 'もう片方のアカウントも登録',
        detail:
          '利用者だけ・事業所だけの状態でも、「続けて相手側を登録する」からペアを揃えるとマッチングが即座に計算されます。',
      },
      {
        heading: 'マイページ・一覧画面へ移動',
        detail:
          '「マイページへ進む」または「一覧を見る」ボタンから、相性表示やチャット申請を操作できます。',
      },
    ],
  },

  'user-dashboard': {
    key: 'user-dashboard',
    roleScope: 'user',
    title: '利用者マイページの使い方',
    summary:
      '登録中の希望条件や現在のマッチング進捗、事業所からのスカウト・おすすめ候補をまとめて確認するホーム画面です。',
    steps: [
      {
        heading: 'マッチング進捗を確認',
        detail:
          '上部の進捗ボードでお気に入り保存・相談中・詳細開示の件数と、現在のステップを一目で把握できます。',
      },
      {
        heading: 'お気に入り保存・メモ比較',
        detail:
          'おすすめ事業所の「お気に入り」ボタンを押すと保存され、マイページ上のお気に入り一覧や専用タブから比較できます。',
      },
      {
        heading: '条件変更や公開設定を調整',
        detail:
          '「希望条件を変更」で曜日や介助内容を見直したり、「公開設定」で個人情報の開示範囲を事業所ごとに管理できます。',
      },
    ],
    tip: '事業所からのチャット申請が届いた場合は、画面内の通知カードから承認／見送りを選択できます。',
  },

  'user-wizard': {
    key: 'user-wizard',
    roleScope: 'user',
    title: '希望条件の登録・変更（4ステップ）',
    summary:
      'サービス種別・必要な介助内容・希望の曜日やヘルパー性別などをステップ順に設定・更新できます。',
    steps: [
      {
        heading: 'ステップタブで自由に行き来',
        detail:
          '上部にあるステップ1〜4のタブを押すと、入力内容を保ったまま確認したい項目へ直接移動できます。',
      },
      {
        heading: '該当するカードをタップ',
        detail:
          '「入浴の介助」「車いす」などのカードを押すだけで選択できます。必須にしたい介助も分けて指定できます。',
      },
      {
        heading: '一時保存または完了',
        detail:
          '途中の内容は右上の「一時保存する」で保存でき、最後のボタンで最新条件による事業所との相性が再計算されます。',
      },
    ],
  },

  'user-search': {
    key: 'user-search',
    roleScope: 'user',
    title: '事業所一覧・絞り込みの使い方',
    summary:
      'あなたの希望条件と各事業所の対応条件を自動照合し、相性スコア順に表示・比較できる画面です。',
    steps: [
      {
        heading: '条件で絞り込み・並び替え',
        detail:
          '「絞り込み条件」を開くとサービス種別や希望曜日、相性スコア順／お気に入り優先などで候補を絞り込めます。',
      },
      {
        heading: '相性リングとグラフで比較',
        detail:
          '各カードの右上にある相性％や「希望介助への対応（✓）」「空き曜日」を見て、条件に合う事業所を比較できます。',
      },
      {
        heading: 'お気に入り保存・詳細・相談',
        detail:
          '気になる事業所は「お気に入り」で保存し、個人メモを残せます。詳しく見る・チャット相談ボタンから連絡可能です。',
      },
    ],
    tip: '上部の「お気に入りのみ」タブに切り替えると、保存した事業所だけを比較できます。',
  },

  'user-favorites': {
    key: 'user-favorites',
    roleScope: 'user',
    title: 'お気に入り事業所の比較・メモ管理',
    summary:
      'お気に入り登録した事業所だけを一覧表示し、見学希望や気になった点を非公開メモとして残せる画面です。',
    steps: [
      {
        heading: '候補を一覧で比較',
        detail:
          '相性％・対応介助・空き曜日を並べて見比べられます。上部タブから「すべて」の一覧へいつでも戻れます。',
      },
      {
        heading: '個人用メモを入力して保存',
        detail:
          '各事業所のメモ欄に「火曜午前に見学希望」「担当者へ質問したい点」などを記入し「メモを保存」で記録できます。',
      },
      {
        heading: '相談に進む／お気に入り解除',
        detail:
          '候補が固まったら「チャットで相談する」へ進み、検討外になった事業所は「お気に入り済」ボタンで解除できます。',
      },
    ],
    tip: 'お気に入りメモは利用者ご本人（ご家族）のみ閲覧でき、事業所側には共有されません。',
  },

  'user-provider-detail': {
    key: 'user-provider-detail',
    roleScope: 'user',
    title: '事業所詳細・相談申請の使い方',
    summary:
      '事業所の紹介文や対応可能な医療的・行動的配慮、1週間の空き枠、相性内訳を詳しく確認できる画面です。',
    steps: [
      {
        heading: '対応条件と空き曜日を確認',
        detail:
          '5項目の相性バランスグラフや週間スケジュール表で、自分の希望曜日と合っているか確認します。',
      },
      {
        heading: 'お気に入り保存＆比較メモ',
        detail:
          'ページ内の「お気に入り登録」ボタンから保存し、見学時の確認事項などを個人メモに書き留められます。',
      },
      {
        heading: 'チャットで相談を申し込む',
        detail:
          '気になる点があれば相談ボタンからチャットを開始できます。氏名などの個人情報は同意するまで開示されません。',
      },
    ],
  },

  'user-privacy': {
    key: 'user-privacy',
    roleScope: 'user',
    title: '公開設定（段階的情報開示）の使い方',
    summary:
      '氏名・最寄り駅・連絡先などの個人情報を、どの事業所にどこまで開示するかを自分で管理・取り消しできる画面です。',
    steps: [
      {
        heading: '3段階の開示ルールを確認',
        detail:
          '最初は「第1段階（匿名）」のみ公開され、チャット相談（第2段階）を経て同意した場合のみ詳細情報（第3段階）が開示されます。',
      },
      {
        heading: '事業所ごとに開示を切り替え',
        detail:
          '事業所一覧から、面談や契約を進める相手だけに第3段階の詳細情報開示を許可できます。',
      },
      {
        heading: 'いつでも開示を取り消し可能',
        detail:
          '検討を終えた事業所に対しては「開示を取り消す」ボタンで即座に匿名状態へ戻せます。',
      },
    ],
  },

  'provider-dashboard': {
    key: 'provider-dashboard',
    roleScope: 'provider',
    title: '事業所マイページの使い方',
    summary:
      '受入状況のワンタップ切り替え、新規登録3ステップ、案件進捗、相性の良い利用希望者の確認ができる管理画面です。',
    steps: [
      {
        heading: '受入状況を最新に保つ',
        detail:
          '上部の「現在の受入状況」プルダウンを切り替えると、利用者検索画面の表示に即時反映されます。',
      },
      {
        heading: '最初の3ステップと案件進捗を確認',
        detail:
          '導入チェックリストや「未対応・検討中・対応中」の進捗ボードで、対応漏れを防ぎながら案件を管理できます。',
      },
      {
        heading: '利用希望者へ反応・チャット申請',
        detail:
          '候補カードの「詳細を見る」またはチャット申請ボタンから利用希望者へアプローチできます（受信返信は無料プランでも可）。',
      },
    ],
    tip: '右上の「無料へ切替 / 有料へ切替」や「料金プラン」から、プランごとの操作感も確認できます。',
  },

  'provider-wizard': {
    key: 'provider-wizard',
    roleScope: 'provider',
    title: '事業所情報・受入条件の編集（3ステップ）',
    summary:
      '事業所名・提供サービス・対応可能な介助項目・1週間の空き曜日を3ステップで設定・更新します。',
    steps: [
      {
        heading: '基本情報と提供サービスを設定',
        detail:
          '居宅介護・移動支援など複数サービスを同時に登録し、対応エリアを指定します。',
      },
      {
        heading: '対応介助・ヘルパー性別・配慮事項',
        detail:
          '入浴・排泄・車いす介助や医療的配慮・同性介助の対応方針を選ぶと、相性計算の精度が上がります。',
      },
      {
        heading: '曜日別の空き状況を入力して保存',
        detail:
          '月〜日の受入可否と時間帯を登録し、保存すると利用希望者との相性が即時に更新されます。',
      },
    ],
  },

  'provider-search': {
    key: 'provider-search',
    roleScope: 'provider',
    title: '利用希望者検索の使い方',
    summary:
      '地域でヘルパーを探している利用希望者を、個人特定されない匿名コードの状態でマッチング度順に閲覧できます。',
    steps: [
      {
        heading: '希望サービスや地域・曜日で絞り込み',
        detail:
          '「絞り込み条件」から自事業所の空き曜日や対応可能サービスに一致する利用希望者を抽出します。',
      },
      {
        heading: '案件ステータスと相性％を確認',
        detail:
          '各カードの「検討中」「対応中」ステータスを切り替えながら、候補者の必要介助と希望曜日を確認できます。',
      },
      {
        heading: 'チャット開始申請または詳細確認',
        detail:
          '受け入れ可能な方には詳細画面または申請ボタンからチャット開始を打診できます（スカウト送信は有料プラン対象）。',
      },
    ],
  },

  'provider-user-detail': {
    key: 'provider-user-detail',
    roleScope: 'provider',
    title: '利用希望者詳細・段階的開示の確認',
    summary:
      '利用希望者の詳細な支援ニーズ・配慮事項・希望スケジュールを確認し、受け入れ検討リアクションを送る画面です。',
    steps: [
      {
        heading: '開示段階（第1〜第3段階）を確認',
        detail:
          '上部の開示ステータスにより、匿名ニーズのみか、本人同意済みの最寄り駅・相談支援情報まで見られるかを確認します。',
      },
      {
        heading: '支援ニーズと5項目相性をチェック',
        detail:
          '必須の介助項目やコミュニケーション上の配慮事項を確認し、自事業所で無理なく対応できるか判断します。',
      },
      {
        heading: 'リアクション更新・チャット申請',
        detail:
          '「対応を検討したい」などのステータス更新や、チャット開始申請メッセージの送信を行えます。',
      },
    ],
  },

  'provider-billing': {
    key: 'provider-billing',
    roleScope: 'provider',
    title: '料金プラン・お支払い設定の使い方',
    summary:
      '無料プランと定額サブスクプランの切り替えや、クレジットカード・銀行口座振替の登録・変更を行う画面です。',
    steps: [
      {
        heading: 'プラン内容と法令設計を確認',
        detail:
          '斡旋手数料（成果報酬）は0円で、事業者登録・掲載・利用者からのチャット返信は無料のまま利用できます。',
      },
      {
        heading: 'クレジットカードまたは口座振替を選択',
        detail:
          '有料プラン契約時は、クレジットカード番号または金融機関名・支店・口座情報（口座振替）を切り替えながら設定できます。',
      },
      {
        heading: 'プラン変更・解約手続き',
        detail:
          'ボタンひとつでアップグレードや解約（無料プランへの復帰）の挙動を確認できます。',
      },
    ],
    tip: '試作品デモのため、入力した決済情報で実際の引き落としは発生しません。',
  },

  chat: {
    key: 'chat',
    roleScope: 'shared',
    title: 'チャット・情報開示の使い方',
    summary:
      '承認された相手や問い合わせ相手のリストを切り替えながら、定型文や自由記述で日程調整や質問を行える画面です。',
    steps: [
      {
        heading: '左の一覧から会話相手を選択',
        detail:
          'やり取り中または未読メッセージのある相手をタップすると、右側にメッセージ履歴が表示されます。',
      },
      {
        heading: '定型文チップまたは入力欄で送信',
        detail:
          'よく使う挨拶・質問テンプレートをタップすると入力欄に挿入され、そのまま簡単に送信できます。',
      },
      {
        heading: '利用者側は詳細情報の開示を操作',
        detail:
          '面談に進む相手には画面上部の「個人情報の開示確認（第3段階へ）」で追加情報を許可できます（取り消しも可能）。',
      },
    ],
  },

  'google-drive': {
    key: 'google-drive',
    roleScope: 'shared',
    title: 'Google Drive 連携の使い方',
    summary:
      '支援条件シートや事業所の受入条件表、相性レポートを自身のGoogleドライブへ保存・閲覧できる画面です。',
    steps: [
      {
        heading: 'Google アカウントでサインイン',
        detail:
          '画面の案内から Google 認証を行うと、あなたのドライブ内の連携フォルダへ安全にアクセスできるようになります。',
      },
      {
        heading: '保存したいシートを選択して書き出し',
        detail:
          '匿名化された支援ニーズ表や事業所比較レポートをワンクリックでドライブへ保存できます。',
      },
      {
        heading: '保存済みファイルの一覧確認・管理',
        detail:
          '保存したドキュメントの閲覧や整理ができ、ログアウトすればアクセストークンは破棄されます。',
      },
    ],
  },

  'admin-security': {
    key: 'admin-security',
    roleScope: 'admin',
    title: '運営管理者コンソールの使い方',
    summary:
      'サービス全体のサブスク料金設定・契約数・売上試算と、個人情報分離アーキテクチャおよび監査ログを確認する管理画面です。',
    steps: [
      {
        heading: '上部タブで管理ビューを切り替え',
        detail:
          '「事業運営・売上試算」「システム概要」「PII分離」「監査ログ」の各タブで運用状況を確認します。',
      },
      {
        heading: '有料プランの月額料金を即時変更',
        detail:
          '標準プラン月額を更新すると、売上シミュレーションや事業所画面の料金表示に即座に反映されます。',
      },
      {
        heading: '監査ログ・不審アクセス監視',
        detail:
          '誰がどの開示操作や閲覧を行ったかを時系列で確認でき、不正アクセス検証も行えます。',
      },
    ],
  },

  'matching-score-chart': {
    key: 'matching-score-chart',
    roleScope: 'user',
    title: '相性スコア・5項目グラフの見方',
    summary:
      '相性％は「サービス種別・希望地域・介助内容・希望曜日・ヘルパー性別」の5項目の適合度を自動計算した結果です。',
    steps: [
      {
        heading: '◎（満点・高い一致）',
        detail:
          '希望する介助や曜日、性別方針などが事業所の対応条件としっかり一致している項目です。',
      },
      {
        heading: '○・△（一部一致・相談可）',
        detail:
          '主要な条件は合うものの、一部曜日や補足条件について事前の確認・調整をおすすめする項目です。',
      },
      {
        heading: '×（条件外・対象外）',
        detail:
          '提供対象外のサービスやエリア外など、現時点の条件では一致しない項目を示しています。',
      },
    ],
  },

  'user-progress-board': {
    key: 'user-progress-board',
    roleScope: 'user',
    title: 'マッチング進捗バーの見方',
    summary:
      '気になる事業所の検討が現在どの段階（保存→相談申請→チャット→情報開示）まで進んでいるかを可視化します。',
    steps: [
      {
        heading: 'お気に入り保存（25%）',
        detail:
          '候補としてブックマークした段階です。メモ機能を使って比較検討できます。',
      },
      {
        heading: '承認待ち / チャット相談中（50%〜75%）',
        detail:
          '双方でチャット申請またはメッセージのやり取りを行っている段階です。',
      },
      {
        heading: '詳細開示済み（100%）',
        detail:
          '本人の同意により最寄り駅や相談支援情報まで共有し、具体的な面談・利用調整に入っている段階です。',
      },
    ],
  },

  'provider-progress-board': {
    key: 'provider-progress-board',
    roleScope: 'provider',
    title: '事業所案件進捗ボードの見方',
    summary:
      '利用希望者からの相談や、事業所から送ったチャット申請のステータス件数・対応状況を一覧で把握できます。',
    steps: [
      {
        heading: '承認待ち・新着を優先確認',
        detail:
          '利用希望者から届いた質問や未対応の候補者を優先的にチェックするとマッチングにつながりやすくなります。',
      },
      {
        heading: '案件ステータスを更新',
        detail:
          '「検討中」「対応中」「対応不可」を切り替えてスタッフ間の引き継ぎ状況を整理できます。',
      },
    ],
  },

  'user-favorites-memo': {
    key: 'user-favorites-memo',
    roleScope: 'user',
    title: 'お気に入り登録・個人メモの使い方',
    summary:
      '複数事業所を見比べる際、自分（ご家族）だけの控えメモを事業所ごとに残せる機能です。',
    steps: [
      {
        heading: 'ハートではなくしおりアイコンで保存',
        detail:
          'カード右下の「お気に入り」を押すと保存され、ヘッダーの「お気に入り」タブに件数が表示されます。',
      },
      {
        heading: '個人メモ欄に条件や質問を記録',
        detail:
          '「お気に入り」一覧や事業所詳細ページで「土曜午後の空き確認」「見学希望」などを書き込んで保存できます。',
      },
    ],
    tip: '保存した個人メモは事業所には公開されません。安心して比較にお使いください。',
  },

  'disclosure-stages': {
    key: 'disclosure-stages',
    roleScope: 'shared',
    title: '段階的情報開示（第1〜第3段階）',
    summary:
      '障害福祉分野のプライバシーを守るため、利用者の同意なしに個人情報が全事業所に公開されない仕組みです。',
    steps: [
      {
        heading: '第1段階：匿名マッチング',
        detail:
          '市区町村・希望サービス・必要な介助内容・曜日のみで照合します。氏名や連絡先は表示されません。',
      },
      {
        heading: '第2段階：チャット相談',
        detail:
          'お互いが承認・送信すると匿名コードのままチャット欄で事前の条件すり合わせができます。',
      },
      {
        heading: '第3段階：本人同意後の詳細開示',
        detail:
          '利用者が明示的に同意した特定の事業所にのみ、ニックネーム・最寄り駅・相談支援事業所などを開示します。',
      },
    ],
  },

  'provider-payment-method': {
    key: 'provider-payment-method',
    roleScope: 'provider',
    title: 'お支払い方法（カード・口座振替）',
    summary:
      '有料プラン契約時の決済手段として、クレジットカードまたは法人口座からの口座振替を選択できます。',
    steps: [
      {
        heading: 'クレジットカード決済',
        detail:
          'カード番号・有効期限・セキュリティコードを入力して即時で利用開始できます（デモ検証ではテスト番号が使えます）。',
      },
      {
        heading: '銀行口座振替',
        detail:
          '金融機関名・支店コード・口座番号・名義人カナを指定して振替手続きを行えます。',
      },
    ],
  },
};

export function getHelpGuide(key: HelpGuideKey): HelpGuideItem {
  return HELP_GUIDES[key] || HELP_GUIDES.top;
}

export function filterHelpGuidesByRole(roleScope: HelpRoleScope): HelpGuideItem[] {
  return Object.values(HELP_GUIDES).filter(
    (guide) => guide.roleScope === roleScope
  );
}

export function validateHelpGuide(guide: HelpGuideItem): boolean {
  if (!guide.title.trim() || !guide.summary.trim()) return false;
  if (!Array.isArray(guide.steps) || guide.steps.length < 2) return false;
  return guide.steps.every(
    (s) => s.heading.trim().length > 0 && s.detail.trim().length > 0
  );
}

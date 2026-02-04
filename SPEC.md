# Twitter（X）自動投稿システム 要件定義書 v1.2（Cron外部起動版）

## 1. システム概要
### 1.1 目的
複数のX（Twitter）アカウントを効率的に運用するため、AIを活用した投稿コンテンツの自動生成、下書き/予約投稿、投稿管理、日次アナリティクス取得を行うシングルユーザー向けWebアプリを構築する。

### 1.2 対象ユーザー
運用者（朔弥）のみ（シングルユーザー）

### 1.3 運用アカウント種別
- adult：ファンクラブ誘導（複数アカウント運用可能性あり）
- info_product：商材販売（詳細未定、複数アカウント運用可能性あり）

### 1.4 前提（重要）
- デプロイ先：Vercel Hobby（無料）を想定
- 予約投稿・分析取得などの定期処理は Vercel Cron を使わず、外部の cron-job.org からHTTPで起動する
- X APIアプリは1つ（環境変数で管理）。各アカウントのOAuth User TokenをDBに保存し投稿/分析に利用
- 1人で複数アカウントを操作するため、**投稿間隔・日次上限・ジッター（ランダム遅延）**などの安全設定をシステム要件に含める

## 2. 機能要件
### 2.1 認証・アクセス制御
- AUTH-001 ログイン：シングルユーザー用の簡易認証（パスワード or OAuth）
- AUTH-002 管理者のみアクセス：全ページ/全APIは認証必須
- AUTH-003 Cron起動API保護：cron-job.orgから叩くエンドポイントは 署名（HMAC）or 固定シークレットで認可

### 2.2 アカウント管理機能
- ACC-001 アカウント登録：X OAuth認証でアカウントを連携
- ACC-002 アカウント一覧：登録済みアカウントの一覧表示
- ACC-003 アカウント切り替え：操作対象アカウントの切り替え
- ACC-004 アカウント削除：登録済みアカウントの削除

補足：
- X APIアプリは1つ（envで管理）
- OAuth User Token（access/refresh）をDBに保存（暗号化）
- Token失効時は「要再連携」状態へ遷移（ジョブ失敗理由として記録）

### 2.3 ペルソナ管理機能
- PER-001 ペルソナ登録：アカウントごとに1つ登録
- PER-002 ペルソナ編集
- PER-003 ペルソナ適用：ツイート生成時に適用

ペルソナ項目（案）
- キャラクター名、口調・トーン、年齢設定、趣味・興味
- 禁止ワード（配列）
- ハッシュタグテンプレ（配列）
- 投稿テーマ/カテゴリ（配列）
- その他自由記述

### 2.4 投稿タイプ管理機能
- TYPE-001 投稿タイプ一覧：定義済み投稿タイプの一覧表示
- TYPE-002 投稿タイプ詳細：目的・構成・Tipsの表示
- TYPE-003 投稿タイプ編集：ナレッジファイルの編集（管理者）

投稿タイプ定義（v1.1を踏襲）
- awareness / authority / ideal / engagement / fan / education / cta / algorithm

### 2.5 ナレッジ管理機能（外部ファイル）
- KNW-001 ナレッジ参照：生成時に該当タイプのナレッジを自動参照
- KNW-002 ナレッジ編集：Markdownの閲覧・編集
- KNW-003 ナレッジ追加：新規ナレッジファイル追加

格納構成
```
/knowledge
  /types/*.md
  /templates/weekly-balance.md
  /general/x-algorithm.md
```

共通フォーマット（v1.1を踏襲）
- 目的 / 構成パターン / Tips / NG / 参考投稿

### 2.6 ツイート生成機能
- GEN-001 単発生成（型指定）：タイプ選択で1件生成
- GEN-002 単発生成（テーマ指定）：テーマ/キーワード指定で生成
- GEN-003 週間バランス生成：配分を考慮してN日分一括生成
- GEN-004 過去投稿参照生成：高エンゲ投稿を参照して生成
- GEN-005 再生成
- GEN-006 編集：生成結果を手動編集
- GEN-007 バリデーション：文字数・禁止ワード・NGパターン・リンク数などの自動チェック
- GEN-008 種別ルール：adult/info_productでテンプレや禁止事項を切替可能

週間配分（デフォルト案）
- 認知20 / 権威10 / 理想10 / エンゲ20 / ファン15 / 教育10 / CTA10 / アルゴ5

### 2.7 投稿管理機能（下書き/予約/投稿）
- POST-001 即座投稿：生成ツイートを即投稿
- POST-002 予約投稿：日時指定で予約
- POST-003 下書き保存
- POST-004 投稿履歴：投稿済み一覧
- POST-005 投稿削除：X上から削除
- POST-006 カレンダー表示：予約/投稿済みを表示

#### 2.7.1 予約投稿の実行（外部Cron起動）
- POST-010 予約実行（ジョブ）：cron-job.orgが 10分に1回 /api/cron/run-posting を叩く
- POST-011 直列処理：同時投稿を避けるため、予約投稿は 基本1件ずつ直列で処理
- POST-012 間隔ルール：アカウント別の 最小間隔・日次上限・ジッターに従う
- POST-013 冪等性：同一tweet_idが二重投稿されない仕組み（job単位でロック/状態管理）

#### 2.7.2 失敗時の扱い
- POST-014 リトライ：429/5xxは自動リトライ（回数上限あり）
- POST-015 失敗キュー：認証失効/権限不足などは “failed（要対応）” として残し、UIで確認可能
- POST-016 デッドレター：最終失敗理由（last_error）を記録

### 2.8 メディア管理機能
- MED-001 画像アップロード
- MED-002 動画アップロード
- MED-003 メディアライブラリ
- MED-004 メディア添付

※画像/動画の生成はシステム外

### 2.9 アナリティクス（エンゲージメント分析）
- ANA-001 投稿別メトリクス：impressions/likes/retweets/replies/quotes/bookmarks
- ANA-002 時系列分析：期間指定で推移グラフ表示
- ANA-003 ベスト抽出：ランキング
- ANA-004 タイプ別比較
- ANA-005 アカウント別サマリー
- ANA-006 AI提案：結果から改善案生成

#### 2.9.1 日次取得（2日前の投稿を対象）
- ANA-010 日次取得ジョブ：cron-job.orgが 1日1回 /api/cron/fetch-analytics を叩く
- ANA-011 対象範囲：原則「2日前に投稿されたツイート」を対象（例：48h〜72h前のposted_at）
- ANA-012 二重取得防止：同一tweet_id + 日付で重複保存しない（ユニーク制約 or upsert）

## 3. 非機能要件
### 3.1 パフォーマンス
- ツイート生成：単発10秒以内、週間60秒以内
- cron実行：10分間隔でタイムアウトしない設計（1回の実行で処理する件数を制限可能に）

### 3.2 可用性
- Vercel SLAに準拠
- DB/ストレージは外部（Supabase推奨）
- cron-job.org停止時：次回起動で追いつく（ジョブがDBに残っている前提）

### 3.3 セキュリティ
- DB保存トークンは暗号化（アプリ側暗号化、鍵は環境変数）
- Cron起動APIは署名検証（HMAC）または固定シークレット＋レート制限
- 重要操作（投稿/削除/ナレッジ編集）は認証必須
- ログにトークンや個人情報を出さない

### 3.4 拡張性
- アカウント数：上限なし（UIで管理できる範囲）
- ペルソナ：アカウントごとに1
- 投稿タイプ/ナレッジ：外部ファイルで追加・編集可能
- ジョブ処理：posting_jobs で拡張可能

## 4. システム構成
### 4.1 技術スタック（案）
- Front/Backend：Next.js（App Router） + Route Handlers / Server Actions（Vercel）
- DB：Supabase Postgres
- Storage：Supabase Storage
- 認証：NextAuth or Supabase Auth（シングルユーザー）
- AI：OpenRouter（無料モデル想定）
- X API：X API v2（従量課金の可能性あり）
- Cron：cron-job.org（外部HTTP実行）

### 4.2 構成図（概念）
```
cron-job.org → Vercel(Next.js API) → Supabase(DB/Storage)
　　　　　　　　　　　　　　　↘ X API / OpenRouter
```

## 5. 画面構成（案）
- SCR-001 ログイン
- SCR-002 ダッシュボード（今日の予約/失敗ジョブ/配分/ベスト投稿）
- SCR-003 生成（単発）
- SCR-004 生成（週間）
- SCR-005 投稿管理（下書き/予約/履歴/カレンダー）
- SCR-006 メディア
- SCR-007 分析
- SCR-008 アカウント設定
- SCR-009 ペルソナ設定
- SCR-010 ナレッジ管理
- SCR-011 ジョブ監視（posting_jobs / analytics_jobs の失敗一覧）

## 6. データ設計（更新版）
### 6.1 テーブル一覧
- accounts
- personas
- tweets
- media
- tweet_media
- analytics
- posting_jobs（追加）
- knowledge_files（任意追加）
- account_safety_settings（追加）

### 6.2 テーブル定義（既存はv1.1踏襲）
#### posting_jobs（追加）
- id (UUID, PK)
- tweet_id (UUID, FK → tweets.id)
- account_id (UUID, FK → accounts.id)
- run_at (TIMESTAMP) 予約実行予定時刻
- status (ENUM) 'pending' / 'running' / 'success' / 'failed'
- attempts (INTEGER) default 0
- last_error (TEXT, nullable)
- locked_at (TIMESTAMP, nullable) 直列化/ロック用途
- created_at / updated_at

要件：
- pending の中から run_at <= now を取り出し、1回のcron実行で最大N件処理（Nは環境変数で調整）

#### account_safety_settings（追加）
- id (UUID, PK)
- account_id (UUID, FK → accounts.id)
- min_interval_sec (INTEGER) 最小投稿間隔
- daily_cap (INTEGER) 1日上限投稿数
- jitter_sec_max (INTEGER) ランダム遅延の最大秒
- quiet_hours_start / quiet_hours_end (TIME, nullable) 休止時間帯
- created_at / updated_at

#### knowledge_files（任意）
- id (UUID, PK)
- path (TEXT) 例: knowledge/types/awareness.md
- category (TEXT) types/templates/general
- updated_at / updated_by

#### analytics（既存に運用要件追加）
- ユニーク制約例： (tweet_id, date_trunc('day', fetched_at)) など、日次スナップショットの重複防止

## 7. API設計（最小要件）
### 7.1 Cron起動API（外部から呼ばれる）
#### POST /api/cron/run-posting
- 認可：HMAC署名 or Bearerシークレット
- 動作：pendingかつrun_at<=nowのposting_jobsを最大N件処理（直列）

#### POST /api/cron/fetch-analytics
- 認可：同上
- 動作：posted_atが 48〜72時間前の tweets を対象にメトリクス取得→analyticsへupsert

### 7.2 通常API
- generate / post / analytics / knowledge は従来通り（要認証）

## 8. 運用ルール（最小）
- 複数アカウントでも同時投稿はしない（posting_jobs直列）
- 投稿間隔/日次上限/休止時間を設定できる
- トークン失効時はジョブ失敗として可視化し、再連携で復旧



## 0. 開発フェーズ定義（Codex向け）
本プロジェクトは段階的に実装する。

### Phase1: プロジェクト土台（起動できる状態）
- Next.js(App Router)+TypeScript の雛形
- Supabase client（env読み取りまで、実接続/DDLは不要）
- .env.example の追加（キーはダミー）
- README にローカル起動手順（npm install / npm run dev）
- 画面は最低限でOK（/ で “Setup OK” 表示）

### Phase2: DBスキーマ（DDL）
- supabase/schema.sql の作成（6章のテーブル一式、制約含む）

### Phase3: Cron API（外部cron起動）
- /api/cron/run-posting と /api/cron/fetch-analytics（7章）
- secret/HMAC保護、ロック/冪等性、リトライ

### Phase4以降
- 認証UI、X OAuth、投稿生成、投稿管理UI、分析UIなど（2章の各機能）

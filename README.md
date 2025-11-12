# sphylics

完全匿名のチャットプラットフォームと、RFC 6749準拠のOAuth 2.0プロバイダー「bbauth」を提供します。

## プロジェクト構成

```
sphylics/
├── frontend/        # 匿名チャットフロントエンド (Vue.js 3)
├── workers/         # bbauth - Cloudflare Workers実装
├── appsscript/      # bbauth - Google Apps Script実装
└── docs/            # APIドキュメント
```

## 🗨️ 匿名チャットアプリ

完全匿名のチャットプラットフォーム。安全でプライベートなコミュニケーションを提供します。

### 特徴

- 🔒 完全匿名 - 個人情報不要
- 🔐 エンドツーエンド暗号化
- 📝 マークダウン対応
- 🌓 ダークモード/ライトモード
- 📱 完全レスポンシブ対応

### 技術スタック

- Vue.js 3
- Vue Router 4
- Vite
- Tailwind CSS 3
- Markdown-it
- Material Design Icons

## 🔐 bbauth - OAuth 2.0 Provider

RFC 6749準拠のOAuth 2.0プロバイダー。Cloudflare WorkersとGoogle Apps Scriptを組み合わせた、セキュアで高速な認証基盤です。

### 特徴

- ✅ RFC 6749準拠のOAuth 2.0実装
- ✅ OpenID Connect Discovery対応
- ✅ PKCE必須 (RFC 7636)
- ✅ ES256 JWT署名
- ✅ Google Apps Script統合
- ✅ グローバル分散 (Cloudflare Edge)
- ✅ 月間100万認証で$5.50のコスト効率

### アーキテクチャ

```mermaid
flowchart LR
    A[Client Application]
        --> B[Cloudflare Workers<br/>(OAuth Logic)]
    B --> C[Google Apps Script<br/>(Identity Verification)]
    C --> D[Cloudflare Workers<br/>(Token Issue)]
    D --> A
```

### クイックスタート

詳細は [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) を参照してください。

```bash
# 1. Workers環境準備
cd workers
npm install
wrangler kv:namespace create "KV"

# 2. Apps Scriptデプロイ
cd ../appsscript
clasp login
clasp create --type webapp
clasp push

# 3. JWT鍵ペア生成
wrangler secret put ADMIN_TOKEN
curl -X POST https://your-worker.workers.dev/setup/init

# 4. デプロイ
wrangler deploy
```

### ドキュメント

- [API Reference](docs/API_REFERENCE.md) - OAuth 2.0エンドポイント仕様
- [Architecture](docs/ARCHITECTURE.md) - システムアーキテクチャ
- [Security](docs/SECURITY.md) - セキュリティ設計
- [Setup Guide](docs/SETUP_GUIDE.md) - セットアップ手順

## セットアップ

```bash
cd frontend
npm install
```

## 開発サーバー起動

```bash
npm run dev
```

## ビルド

```bash
npm run build
```

## ページ一覧

- `/` - トップページ
- `/about` - About
- `/policy` - プライバシーポリシー
- `/faq` - FAQ
- `/inquiry` - お問い合わせ
- `/chat/:chatId` - チャットルーム
- `/dashboard` - ダッシュボード
- `/error` - エラーページ
- `/newchat` - 新規チャット作成
- `/newaccount` - アカウント作成
- `/joinchat` - チャット参加
- `/jobs` - 採用情報
- `/terms` - 利用規約
- `/stats` - 統計情報
- `/devs` - API Docs
- `/admin` - 管理者ページ
- `/information` - お知らせ
- `/newfunctionlab` - 新機能ラボ
- `/search` - 検索

## ライセンス

MIT

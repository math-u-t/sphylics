# bbauth - Cloudflare Workers

このディレクトリには、bbauthのCloudflare Workers実装が含まれています。

## ファイル構成

```
workers/
├── src/
│   ├── index.ts              # メインエントリポイント
│   ├── types.ts              # TypeScript型定義
│   ├── crypto.ts             # 暗号化機能
│   └── handlers/
│       ├── authorize.ts      # Authorization Endpoint
│       ├── callback.ts       # Callback Handler
│       ├── token.ts          # Token Endpoint
│       ├── userinfo.ts       # UserInfo Endpoint
│       ├── discovery.ts      # OIDC Discovery & JWKS
│       └── admin.ts          # Admin Endpoints
├── wrangler.toml             # Cloudflare Workers設定
├── package.json              # 依存関係
├── tsconfig.json             # TypeScript設定
└── README.md                 # このファイル
```

## セットアップ

### 1. 依存関係のインストール

```bash
cd workers
npm install
```

### 2. KV Namespaceの作成

```bash
# 本番環境用
wrangler kv:namespace create "KV"

# プレビュー環境用
wrangler kv:namespace create "KV" --preview
```

出力されたIDを `wrangler.toml` に設定します。

### 3. JWT鍵ペアの生成

初回セットアップエンドポイントを使用：

```bash
# 管理トークンを生成
openssl rand -base64 32

# 管理トークンを設定
wrangler secret put ADMIN_TOKEN

# 一時デプロイ
wrangler deploy

# 鍵ペア生成
curl -X POST https://your-worker.workers.dev/setup/init \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

レスポンスのJWT鍵をシークレットに保存：

```bash
wrangler secret put JWT_PRIVATE_KEY
wrangler secret put JWT_PUBLIC_KEY
```

### 4. 環境変数の設定

`wrangler.toml` を編集：

```toml
[vars]
ISSUER_URL = "https://bbauth.example.com"
APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
ALLOWED_ORIGINS = "https://example.com"
```

## デプロイ

### 開発環境

```bash
npm run dev
# または
wrangler dev
```

### 本番環境

```bash
npm run deploy
# または
wrangler deploy
```

### 環境別デプロイ

```bash
# 本番環境
npm run deploy:production

# 開発環境
npm run deploy:dev
```

## クライアント登録

```bash
curl -X POST https://bbauth.example.com/admin/client/register \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "myapp",
    "clientSecret": null,
    "redirectUris": ["https://myapp.com/callback"],
    "allowedScopes": ["email", "drive.readonly"],
    "clientType": "public",
    "name": "My Application"
  }'
```

## エンドポイント

### OAuth 2.0

- `GET /oauth/authorize` - Authorization Endpoint
- `GET /oauth/callback` - Callback Handler (Apps Script → Workers)
- `POST /oauth/token` - Token Endpoint
- `GET /oauth/userinfo` - UserInfo Endpoint

### OpenID Connect Discovery

- `GET /.well-known/openid-configuration` - Discovery Document
- `GET /.well-known/jwks.json` - JSON Web Key Set

### 管理

- `POST /setup/init` - 初回セットアップ（JWT鍵生成）
- `POST /admin/client/register` - クライアント登録
- `GET /admin/client/list` - クライアント一覧
- `DELETE /admin/client/delete/:clientId` - クライアント削除
- `POST /admin/provider/register` - プロバイダー登録

## ログ確認

```bash
npm run tail
# または
wrangler tail
```

## KV操作

```bash
# キー一覧
npm run kv:list

# キー取得
wrangler kv:key get "client:myapp" --binding KV

# キー削除
wrangler kv:key delete "client:myapp" --binding KV
```

## セキュリティ

### シークレット管理

すべてのシークレットは `wrangler secret put` で設定します：

```bash
wrangler secret put JWT_PRIVATE_KEY
wrangler secret put JWT_PUBLIC_KEY
wrangler secret put ADMIN_TOKEN
```

### シークレット一覧

```bash
wrangler secret list
```

### シークレット削除

```bash
wrangler secret delete SECRET_NAME
```

## トラブルシューティング

### エラー: "KV binding not found"

**解決策:** `wrangler.toml` のKV Namespace IDを確認

### エラー: "JWT signing failed"

**解決策:** JWT秘密鍵が正しく設定されているか確認

```bash
wrangler secret list
```

### エラー: "CORS error"

**解決策:** `ALLOWED_ORIGINS` にクライアントURLを追加

## パフォーマンス

- Cold start: ~0ms (V8 Isolates)
- Authorization: 50-100ms
- Token issuance: 30-80ms
- UserInfo: 20-50ms

## コスト

- 無料枠: 100,000 req/日
- 有料プラン: $5/月 (10M req)

## サポート

問題が発生した場合は、GitHub Issuesで報告してください：
https://github.com/math-u-t/sphylics/issues

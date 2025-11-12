# bbauth Setup Guide

## 前提条件

- Cloudflareアカウント（Workers, KV利用可能）
- Google Workspaceアカウント
- Node.js 18以上
- Git

---

## セットアップフロー

```
1. Cloudflare Workers環境準備
   ↓
2. Google Apps Scriptデプロイ
   ↓
3. JWT鍵ペア生成
   ↓
4. 環境変数設定
   ↓
5. クライアント登録
   ↓
6. 動作確認
```

---

## Step 1: Cloudflare Workers環境準備

### 1.1 KV Namespaceの作成

```bash
# 本番環境用
wrangler kv:namespace create "KV"

# プレビュー環境用
wrangler kv:namespace create "KV" --preview
```

**出力例:**
```
✅ [[kv_namespaces]]
binding = "KV"
id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
preview_id = "p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6"
```

### 1.2 wrangler.toml更新

`workers/wrangler.toml` のKV IDを更新:

```toml
kv_namespaces = [
  { binding = "KV", id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", preview_id = "p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6" }
]
```

---

## Step 2: Google Apps Scriptデプロイ

### 2.1 Apps Scriptプロジェクト作成

1. https://script.google.com/ にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「bbauth-provider」に変更

### 2.2 ファイルアップロード

以下のファイルをApps Scriptエディタにコピー:

- `appsscript/src/Main.gs`
- `appsscript/src/Auth.gs`
- `appsscript/src/Scopes.gs`

または `@google/clasp` を使用:

```bash
cd appsscript
npm install -g @google/clasp
clasp login
clasp create --type webapp --title "bbauth-provider"
clasp push
```

### 2.3 appsscript.json設定

プロジェクト設定 → マニフェストを表示 → 以下を貼り付け:

```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {
    "enabledAdvancedServices": []
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_ACCESSING",
    "access": "ANYONE"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive.readonly"
  ]
}
```

**重要:** `executeAs` が `USER_ACCESSING` であることを確認!

### 2.4 デプロイ

1. 「デプロイ」→「新しいデプロイ」
2. 種類: 「ウェブアプリ」
3. 次のユーザーとして実行: **アクセスしたユーザー**
4. アクセスできるユーザー: **全員**
5. 「デプロイ」をクリック

**Web App URLをコピー:**
```
https://script.google.com/macros/s/AKfycbx.../exec
```

---

## Step 3: JWT鍵ペア生成

### 3.1 初回セットアップエンドポイント使用

まず、管理トークンを生成:

```bash
# 管理トークン生成（32文字のランダム文字列）
openssl rand -base64 32
# 例: kR9mP2xQ7wL4sT6nV8bZ3cF5gH1jK0yU...
```

Cloudflare Workersに一時的にデプロイ:

```bash
cd workers
npm install
wrangler secret put ADMIN_TOKEN
# 上記で生成したトークンを入力

wrangler deploy
```

鍵ペア生成リクエスト:

```bash
curl -X POST https://bbauth.example.workers.dev/setup/init \
  -H "Authorization: Bearer kR9mP2xQ7wL4sT6nV8bZ3cF5gH1jK0yU..." \
  -H "Content-Type: application/json"
```

**レスポンス:**
```json
{
  "message": "Setup successful. Store these keys in your Cloudflare Workers secrets.",
  "jwt_private_key": "LS0tLS1CRUdJTi...",
  "jwt_public_key": "LS0tLS1CRUdJTi...",
  "instructions": [
    "wrangler secret put JWT_PRIVATE_KEY",
    "wrangler secret put JWT_PUBLIC_KEY"
  ]
}
```

### 3.2 シークレット保存

```bash
# JWT秘密鍵
wrangler secret put JWT_PRIVATE_KEY
# レスポンスのjwt_private_keyを貼り付け

# JWT公開鍵
wrangler secret put JWT_PUBLIC_KEY
# レスポンスのjwt_public_keyを貼り付け
```

---

## Step 4: 環境変数設定

### 4.1 wrangler.toml更新

```toml
[env.production]
vars = {
  ISSUER_URL = "https://bbauth.example.com",
  APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  ALLOWED_ORIGINS = "https://example.com"
}
```

### 4.2 カスタムドメイン設定（オプション）

Cloudflare Dashboard → Workers → bbauth → Triggers → Custom Domains:

1. 「Add Custom Domain」
2. ドメイン入力: `bbauth.example.com`
3. DNS自動設定

---

## Step 5: クライアント登録

### 5.1 管理APIでクライアント登録

```bash
curl -X POST https://bbauth.example.com/admin/client/register \
  -H "Authorization: Bearer kR9mP2xQ7wL4sT6nV8bZ3cF5gH1jK0yU..." \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "myapp",
    "clientSecret": null,
    "redirectUris": ["https://myapp.com/callback"],
    "allowedScopes": ["email", "drive.readonly", "gmail.send"],
    "clientType": "public",
    "name": "My Application"
  }'
```

**レスポンス:**
```json
{
  "message": "Client registered successfully",
  "clientId": "myapp"
}
```

---

## Step 6: 動作確認

### 6.1 Authorization Codeリクエスト

ブラウザで以下URLにアクセス:

```
https://bbauth.example.com/oauth/authorize?client_id=myapp&redirect_uri=https://myapp.com/callback&response_type=code&scope=email&state=abc123&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
```

1. 同意画面が表示される
2. 「許可」をクリック
3. Apps Scriptにリダイレクト（初回はOAuth同意画面）
4. `https://myapp.com/callback?code=...&state=abc123` にリダイレクト

### 6.2 Token取得

```bash
curl -X POST https://bbauth.example.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=YOUR_CODE&redirect_uri=https://myapp.com/callback&client_id=myapp&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

**レスポンス:**
```json
{
  "access_token": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "id_token": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "email"
}
```

### 6.3 UserInfo取得

```bash
curl -X GET https://bbauth.example.com/oauth/userinfo \
  -H "Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**レスポンス:**
```json
{
  "sub": "user@example.com",
  "email": "user@example.com",
  "email_verified": true
}
```

---

## トラブルシューティング

### 問題1: Apps Scriptで「メールアドレスが取得できない」

**原因:**
- 「実行ユーザー」が「スクリプトのオーナー」になっている

**解決策:**
1. デプロイ設定を開く
2. 「次のユーザーとして実行」を **「アクセスしたユーザー」** に変更
3. 再デプロイ

---

### 問題2: JWT検証エラー

**原因:**
- JWT公開鍵が正しく設定されていない

**解決策:**
```bash
# 公開鍵を再確認
wrangler secret list

# 再設定
wrangler secret put JWT_PUBLIC_KEY
```

---

### 問題3: CORS エラー

**原因:**
- `ALLOWED_ORIGINS` にクライアントURLが含まれていない

**解決策:**
`wrangler.toml` で許可オリジンを追加:

```toml
ALLOWED_ORIGINS = "https://myapp.com,https://localhost:3000"
```

---

### 問題4: KVにデータが保存されない

**原因:**
- KV Namespace IDが間違っている

**解決策:**
```bash
# KV一覧確認
wrangler kv:namespace list

# wrangler.tomlのIDを修正
```

---

## 短縮URLの設定（オプション）

### Cloudflare Workersカスタムドメイン

1. `bbauth.link` ドメインを取得
2. Cloudflare Dashboardでドメインを追加
3. Workers → bbauth → Custom Domains → `bbauth.link`

### bit.ly等の短縮サービス

```
https://bit.ly/bbauth-login
↓
https://bbauth.example.com/oauth/authorize?client_id=...
```

---

## 次のステップ

- [ ] ログ監視の設定
- [ ] カスタムエラーページの作成
- [ ] Rate Limitingの設定
- [ ] セキュリティ監査の実施

---

## サポート

- GitHub Issues: https://github.com/math-u-t/sphylics/issues
- Documentation: https://github.com/math-u-t/sphylics/tree/main/docs

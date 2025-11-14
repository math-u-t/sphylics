# Flexio セットアップガイド

このガイドでは、Flexioプロジェクトをローカル環境およびプロダクション環境で動作させるための手順を説明します。

## 前提条件

- Node.js 18以上
- npm または yarn
- Cloudflareアカウント（プロダクション環境用）
- Googleアカウント（Apps Script認証用）

## 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/flexio.git
cd flexio
```

## 2. フロントエンドのセットアップ

### 依存関係のインストール

```bash
cd frontend
npm install
```

### 環境変数の設定

```bash
# .env.example をコピー
cp .env.example .env.development

# .env.development を編集（必要に応じて）
# デフォルト値:
# VITE_API_BASE_URL=http://localhost:8787
```

### 開発サーバーの起動

```bash
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

## 3. Workers（バックエンド）のセットアップ

### 依存関係のインストール

```bash
cd ../workers
npm install
```

### 環境変数の設定

```bash
# .env.example をコピー
cp .env.example .env
```

`.env` ファイルを編集して、以下の値を設定します：

```env
# JWT鍵ペアの生成（ES256用）
# 以下のコマンドで生成できます：
# openssl ecparam -name prime256v1 -genkey -noout -out private-key.pem
# openssl ec -in private-key.pem -pubout -out public-key.pem

JWT_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# 管理者トークン（ランダムな文字列）
ADMIN_TOKEN="your-secure-admin-token-here"

# Apps Script URL（後で設定）
APPS_SCRIPT_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
```

### wrangler.toml の設定

`wrangler.toml` を編集：

1. **Cloudflare Account ID の設定**（プロダクション環境用）
   ```toml
   account_id = "your-cloudflare-account-id"
   ```

2. **KV Namespace の作成**
   ```bash
   # プロダクション用
   wrangler kv:namespace create "KV"

   # プレビュー用
   wrangler kv:namespace create "KV" --preview
   ```

   出力された ID を `wrangler.toml` に設定：
   ```toml
   kv_namespaces = [
     { binding = "KV", id = "abc123...", preview_id = "xyz789..." }
   ]
   ```

3. **環境変数の更新**
   ```toml
   [vars]
   ISSUER_URL = "https://your-domain.com"
   APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
   ALLOWED_ORIGINS = "http://localhost:5173,https://your-domain.com"
   ```

### ローカル開発サーバーの起動

```bash
npm run dev
# または
wrangler dev
```

Workers APIは `http://localhost:8787` で起動します。

## 4. Google Apps Script のセットアップ

### Apps Script プロジェクトの作成

1. [Google Apps Script](https://script.google.com) にアクセス
2. 新しいプロジェクトを作成
3. `appsscript/src/` 内のすべての `.js` ファイルをコピー
4. `appsscript.json` の内容を Apps Script の設定ファイルに貼り付け

### Web App としてデプロイ

1. Apps Script エディタで「デプロイ」→「新しいデプロイ」
2. 種類：「ウェブアプリ」を選択
3. 設定：
   - **実行ユーザー**: 自分
   - **アクセスできるユーザー**: 全員
4. デプロイして、Web App URL をコピー

### Workers に URL を設定

コピーした URL を以下に設定：

- `workers/.env` の `APPS_SCRIPT_URL`
- `workers/wrangler.toml` の `APPS_SCRIPT_URL`
- `appsscript/src/Main.js` の `callbackUrl`（Workers のデプロイ後）

## 5. プロダクション環境へのデプロイ

### Workers のデプロイ

```bash
cd workers

# Secretsの設定
wrangler secret put JWT_PRIVATE_KEY
wrangler secret put JWT_PUBLIC_KEY
wrangler secret put ADMIN_TOKEN

# デプロイ
npm run deploy
# または
wrangler deploy
```

### フロントエンドのデプロイ

フロントエンドは任意のホスティングサービスにデプロイできます：

#### Cloudflare Pages の場合

```bash
cd frontend
npm run build

# Cloudflare Pages にデプロイ
# ダッシュボードからプロジェクトを作成し、dist フォルダーをアップロード
```

#### Vercel の場合

```bash
cd frontend
npm install -g vercel
vercel
```

#### Netlify の場合

```bash
cd frontend
npm run build

# Netlify にドラッグ&ドロップまたはCLIを使用
```

### 環境変数の更新

デプロイ後、実際のドメインで環境変数を更新：

**Workers (`wrangler.toml`):**
```toml
[env.production]
vars = {
  ISSUER_URL = "https://your-actual-domain.com",
  APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  ALLOWED_ORIGINS = "https://your-frontend-domain.com"
}
```

**Frontend (`.env.production`):**
```env
VITE_API_BASE_URL=https://your-workers.your-subdomain.workers.dev
```

## 6. 動作確認

### ローカル環境

1. Workers を起動: `http://localhost:8787`
2. Frontend を起動: `http://localhost:5173`
3. ブラウザで Frontend にアクセス
4. チャットを作成してメッセージを送信

### API エンドポイントの確認

```bash
# ヘルスチェック
curl http://localhost:8787/

# Discovery ドキュメント
curl http://localhost:8787/.well-known/openid-configuration
```

## 7. トラブルシューティング

### CORS エラー

- `wrangler.toml` の `ALLOWED_ORIGINS` にフロントエンドのURLが含まれているか確認
- ローカル開発時は `http://localhost:5173` を追加

### KV エラー

- KV Namespace が正しく作成されているか確認
- `wrangler.toml` の KV ID が正しいか確認

### 認証エラー

- JWT鍵ペアが正しく設定されているか確認
- Apps Script URL が正しいか確認

### ビルドエラー

```bash
# 依存関係を再インストール
cd frontend && rm -rf node_modules && npm install
cd workers && rm -rf node_modules && npm install
```

## 8. 次のステップ

- [ ] OAuth 2.0 フローの実装（現在はlocalStorageのみ）
- [ ] リアルタイム通信（WebSocket）の実装
- [ ] テストの追加
- [ ] CI/CD パイプラインの設定

## 参考リンク

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Google Apps Script ドキュメント](https://developers.google.com/apps-script)
- [Vue.js ドキュメント](https://vuejs.org/)
- [Vite ドキュメント](https://vitejs.dev/)

# フロントエンド ドキュメント

このドキュメントはリポジトリ内のフロントエンド部分（`/frontend`）のセットアップ、開発、ビルド、デプロイ、及び主要な実装方針をまとめたものです。

**対象**: `frontend/` ディレクトリ（Vite + Vue ベースのフロントエンド）

---

**セットアップ**:

- **前提**: Node.js (推奨: 16以上) と npm または pnpm がインストールされていること。
- **依存関係のインストール**:

```bash
cd frontend
npm install
# または pnpm を使う場合
pnpm install
```

---

**開発 (ローカル実行)**:

- 開発サーバー起動:

```bash
cd frontend
npm run dev
```

- ブラウザで `http://localhost:5173`（Vite のデフォルト）を開き、ホットリロードで開発します。

（補足）`package.json` に定義されたスクリプト名はプロジェクトに依存します。一般的には `dev`, `build`, `preview`, `lint` などを確認してください。

---

**ビルド / プロダクション生成**:

- ビルドコマンド:

```bash
cd frontend
npm run build
```

- ローカルでビルド成果物を確認する場合:

```bash
npm run preview
```

ビルド成果物は通常 `frontend/dist` に出力されます（`vite.config.js` の設定により異なる場合があります）。

---

**環境変数**:

- Vite ベースの場合、環境変数は `VITE_` プレフィックスを付けて `.env` ファイルに置くのが標準的です。例:

```
VITE_API_BASE=https://api.example.com
VITE_SENTRY_DSN=...
```

- 重要: 秘密情報（API シークレット等）はリポジトリに直接コミットしないでください。デプロイ先のシークレット管理機能を使ってください。

---

**フロントエンド API（フロントから呼ぶバックエンド）**:

- フロントエンドは通常、`fetch` または `axios` を使ってバックエンドの REST/GraphQL エンドポイントを叩きます。`VITE_API_BASE` のような環境変数でベース URL を切り替える設計が推奨されます。
- 例（fetch）:

```js
const base = import.meta.env.VITE_API_BASE;
const res = await fetch(`${base}/v1/chats`, { method: 'GET' });
```

- API レスポンスやエラー処理のルール（例: 共通のエラーフォーマット、認証トークンの付与方法）はチームで統一しておきます。

---

**アーキテクチャと主要ディレクトリ**:

- `frontend/src/`:
	- `main.js` / `main.ts`: アプリエントリ
	- `App.vue`: ルートコンポーネント
	- `router/`: ルーティング設定（`index.js`）
	- `components/`: 再利用コンポーネント（`AppHeader.vue`, `AppFooter.vue`, など）
	- `views/`: ルートに対応するページコンポーネント
	- `composables/`: Vue Composition API の再利用ロジック

- **設計方針（推奨）**:
	- 単一責任: コンポーネントは一つの責務に集中させる
	- 小さなプレゼンテーショナルコンポーネントと、少数のコンテナ/ページコンポーネントに分ける
	- API 呼び出しと副作用は `composables` に切り出す

---

**ルーティング**:

- ルートは `frontend/src/router/index.js` で定義されています。動的ルートや認証が必要なページはルーターの `beforeEach` 等で制御します。

---

**スタイリング**:

- プロジェクトには `tailwind.config.js` / `postcss.config.js` が含まれている可能性があります（ユーティリティファーストの Tailwind CSS を使用）。
- グローバル CSS は `src/style.css`（または `main.js` からインポートされるファイル）を確認してください。

---

**テスト**:

- ユニットテスト（例: Vitest / Jest）や E2E テスト（例: Playwright / Cypress）がプロジェクトに導入されている場合、`package.json` の `test` / `test:e2e` スクリプトを利用してください。
- まだ導入されていない場合は、まずユニットテスト (Vitest) を導入することを推奨します。

---

**Lint / フォーマット**:

- ESLint や Prettier を導入している場合は、コミット前に自動整形・静的解析を実行してください。例:

```bash
npm run lint
npm run format
```

---

**デプロイ**:

- ビルド済みの `dist`（または `build`）フォルダを静的ホスティング（Netlify / Vercel / S3 + CloudFront 等）にデプロイします。
- 環境ごとに `VITE_*` の値を切り替え、CI/CD のシークレット管理を利用してください。

---

**トラブルシューティング**:

- 開発サーバーが起動しない場合:
	- Node.js のバージョンを確認する (`node -v`)。
	- 依存関係を再インストールしてキャッシュをクリアする: `rm -rf node_modules package-lock.json && npm install`。
- API 通信で CORS エラーが出る場合:
	- バックエンドの CORS 設定を確認、またはローカル開発時にプロキシを設定する。

---

**貢献（Contribution）**:

- 新しい機能や修正はブランチを切って PR を作成してください。PR には変更の要約、関連チケット、動作確認手順を記載してください。

---

**補足 / 参考ファイル**:

- `frontend/package.json` — スクリプトと依存関係を確認してください。
- `frontend/vite.config.js` — ビルドやパス関連の設定。
- `frontend/src/router/index.js` — ルーティング定義。

---

必要であれば、このドキュメントに以下の追加情報を追記します:
- 既存の `package.json` の具体的なスクリプト一覧
- 主要コンポーネントとその責務の短いサマリ
- CI/CD (GitHub Actions 等) のサンプルワークフロー

ご希望があれば、次は `frontend/package.json` を読み取り、実際のスクリプト名とコマンドをこのドキュメントに反映します。
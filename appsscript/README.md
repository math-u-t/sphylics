# bbauth - Google Apps Script

このディレクトリには、bbauthのGoogle Apps Script実装が含まれています。

>[!IMPORTANT]
>
>このディレクトリのコードはすべて`.gs`ファイルです。

## ファイル構成

```
appsscript/
├── src/
│   ├── Main.js          # メインエントリポイント
│   ├── Auth.js          # 認証ユーティリティ
│   └── Scopes.js        # スコープ実行
├── appsscript.json      # Apps Script設定
└── README.md            # このファイル
```

## デプロイ方法

### 方法1: Web UIから

1. https://script.google.com/ にアクセス
2. 「新しいプロジェクト」を作成
3. `src/` 内のファイルをコピー＆ペースト
4. プロジェクト設定 → マニフェストを表示 → `appsscript.json` の内容を貼り付け
5. 「デプロイ」→「新しいデプロイ」
   - 種類: ウェブアプリ
   - 実行ユーザー: **アクセスしたユーザー** （重要！）
   - アクセス: 全員
6. デプロイ完了後、Web App URLをコピー

### 方法2: claspコマンドから

```bash
cd appsscript

# claspをインストール
npm install -g @google/clasp

# Googleアカウントでログイン
clasp login

# プロジェクトを作成
clasp create --type webapp --title "bbauth-provider"

# ファイルをプッシュ
clasp push

# Webアプリとしてデプロイ
clasp deploy --description "bbauth v1.0.0"

# デプロイIDを確認
clasp deployments
```

## 初期設定

デプロイ後、スクリプトエディタで `setup()` 関数を実行して、コールバックURLを設定します：

```javascript
// Main.js の setup() 関数を編集
function setup() {
  const callbackUrl = 'https://your-bbauth-domain.com/oauth/callback';
  const props = PropertiesService.getScriptProperties();
  props.setProperty('CALLBACK_URL', callbackUrl);
  Logger.log('Setup complete. Callback URL set to: ' + callbackUrl);
}
```

実行方法：
1. Apps Scriptエディタで `Main.js` を開く
2. 関数選択ドロップダウンから `setup` を選択
3. 「実行」をクリック

## 必要な権限

このスクリプトは以下のOAuthスコープを要求します：

- `https://www.googleapis.com/auth/userinfo.email` - メールアドレス取得
- `https://www.googleapis.com/auth/gmail.send` - Gmail送信
- `https://www.googleapis.com/auth/drive.readonly` - Drive読み取り

## 重要な注意事項

### 実行モード

**必ず「アクセスしたユーザー」モードでデプロイしてください！**

- ✅ 正: 「次のユーザーとして実行: アクセスしたユーザー」
- ❌ 誤: 「次のユーザーとして実行: 自分」

「自分」モードでデプロイすると、すべてのユーザーがスクリプトオーナーの権限で実行されてしまいます。

### セキュリティ

- このスクリプトはユーザーのメールアドレスのみを取得します
- パスワードやトークンは一切取り扱いません
- すべての通信はHTTPS経由で行われます

## トラブルシューティング

### エラー: "Unable to retrieve user email"

**原因:** 実行モードが「自分」になっている

**解決策:**
1. デプロイを削除
2. 「新しいデプロイ」→ 実行ユーザーを「アクセスしたユーザー」に変更
3. 再デプロイ

### エラー: "Authorization required"

**原因:** 初回アクセス時のOAuth同意画面

**解決策:**
1. 「許可を確認」をクリック
2. Googleアカウントを選択
3. 権限を許可

## ログ確認

```bash
# claspでログを確認
clasp lojs

# または、Apps Scriptエディタの「実行ログ」タブで確認
```

## 更新手順

```bash
# ファイルを編集後
clasp push

# 新しいバージョンをデプロイ
clasp deploy --description "v1.1.0"
```

## サポート

問題が発生した場合は、GitHub Issuesで報告してください：
https://github.com/math-u-t/sphylics/issues

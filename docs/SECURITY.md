# bbauth Security Documentation

## 概要

bbauthは、RFC 6749準拠のOAuth 2.0プロバイダーとして、Zero Trust Architectureに基づいた設計を採用しています。本ドキュメントでは、脅威モデル分析、セキュリティ対策、暗号アルゴリズムの選定理由を説明します。

---

## セキュリティ設計原則

### 1. Zero Trust Architecture

- **最小権限**: Apps Scriptは必要最小限の権限のみ実行
- **検証**: すべてのリクエストを暗号学的に検証
- **分離**: OAuth Business LogicとIdentity Verificationを完全分離

### 2. Defense in Depth (多層防御)

- **暗号化**: 通信はすべてHTTPS（TLS 1.3）
- **署名**: Ed25519によるプロバイダー真正性保証
- **検証**: PKCE必須化によるコード横取り攻撃防止

### 3. 透明性

- **オープンソース**: 全コードをGitHubで公開
- **監査可能**: すべてのセキュリティ決定を文書化

---

## STRIDE 脅威モデル分析

### Spoofing (なりすまし)

**脅威:**
- 攻撃者が正規プロバイダーになりすます
- 偽のApps Scriptを設置して認証情報を窃取

**対策:**
- ✅ Ed25519署名による Provider ID 検証
  - 公開鍵（32バイト）を Provider ID として使用
  - 署名検証により偽プロバイダーを排除
  - 衝突確率 < 2^-128（宇宙年齢内に衝突しない）

- ✅ HTTPS証明書検証
  - Cloudflare WorkersがTLS証明書を自動検証
  - 中間者攻撃を防止

**実装例:**
```typescript
// Provider ID生成
const providerId = `bbauth:${base64(ed25519PublicKey)}`;

// 署名検証
const isValid = await ed25519.verify(data, signature, publicKey);
```

---

### Tampering (改ざん)

**脅威:**
- Authorization Codeの改ざん
- アクセストークンの偽造

**対策:**
- ✅ JWT署名（ES256）
  - すべてのトークンにECDSA署名
  - 公開鍵で検証可能

- ✅ PKCE (RFC 7636)
  - Code Verifier/Challengeによる改ざん検出
  - S256（SHA-256ハッシュ）方式

**実装例:**
```typescript
// JWT署名
const accessToken = await signJWT(payload, privateKey);

// PKCE検証
const isValid = await verifyPKCE(codeVerifier, codeChallenge, 'S256');
```

---

### Repudiation (否認)

**脅威:**
- ユーザーが認証を否認

**対策:**
- ✅ 監査ログ
  - すべてのOAuth操作をCloudflare Logsに記録
  - タイムスタンプ付き

- ✅ JWT claims
  - `iat` (issued at) で発行時刻を記録
  - `jti` (JWT ID) でトークン一意性を保証

---

### Information Disclosure (情報漏洩)

**脅威:**
- アクセストークン漏洩
- メールアドレス漏洩

**対策:**
- ✅ 短命なトークン
  - Authorization Code: 10分
  - Access Token: 1時間
  - Refresh Token: 30日

- ✅ HTTPS必須
  - すべての通信を暗号化

- ✅ CORS制限
  - `ALLOWED_ORIGINS` 環境変数で制御

**実装例:**
```typescript
// トークン有効期限
const payload = {
  exp: Math.floor(Date.now() / 1000) + 3600, // 1時間
};
```

---

### Denial of Service (サービス妨害)

**脅威:**
- 大量リクエストによるサービス停止

**対策:**
- ✅ Cloudflare Workers Rate Limiting（計画中）
  - Authorization Endpoint: 10 req/min/IP
  - Token Endpoint: 20 req/min/client

- ✅ KV TTL
  - 使用済みコードは自動削除
  - メモリリーク防止

---

### Elevation of Privilege (権限昇格)

**脅威:**
- 攻撃者が管理者権限を取得

**対策:**
- ✅ 管理エンドポイント認証
  - `ADMIN_TOKEN` 環境変数で保護
  - Bearer Token認証

- ✅ スコープ検証
  - クライアントは事前登録されたスコープのみ使用可能
  - Apps Script側でも二重検証

**実装例:**
```typescript
// 管理エンドポイント保護
if (authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## OWASP Top 10 対策状況

### A01:2021 - Broken Access Control

**対策:**
- ✅ OAuth 2.0によるアクセス制御
- ✅ スコープベースの権限管理
- ✅ JWT検証によるトークン認証

### A02:2021 - Cryptographic Failures

**対策:**
- ✅ ES256（ECDSA P-256 + SHA-256）によるJWT署名
- ✅ Ed25519によるプロバイダー署名
- ✅ TLS 1.3による通信暗号化

### A03:2021 - Injection

**対策:**
- ✅ TypeScript型システムによる入力検証
- ✅ URLパラメータのサニタイゼーション
- ✅ Apps Script側でのGmail/Drive API安全使用

### A04:2021 - Insecure Design

**対策:**
- ✅ PKCE必須化（RFC 7636）
- ✅ State parameter推奨
- ✅ Zero Trust Architecture

### A05:2021 - Security Misconfiguration

**対策:**
- ✅ 環境変数によるシークレット管理
- ✅ `wrangler secret put` による安全な設定
- ✅ デフォルト拒否ポリシー

### A06:2021 - Vulnerable Components

**対策:**
- ✅ Web Crypto API（ブラウザ標準）使用
- ✅ カスタム暗号実装を排除
- ✅ Cloudflare Workers Runtime（自動更新）

### A07:2021 - Authentication Failures

**対策:**
- ✅ Google Session認証
- ✅ 多要素認証（Google側）
- ✅ Authorization Code再利用防止

### A08:2021 - Software and Data Integrity

**対策:**
- ✅ JWT署名による完全性保証
- ✅ Ed25519署名による改ざん検出
- ✅ GitHub Actionsによる自動ビルド検証（計画中）

### A09:2021 - Security Logging Failures

**対策:**
- ✅ Cloudflare Logsに全操作を記録
- ✅ エラー詳細をLogger.log()に出力
- ✅ 監査ログ保持（90日）

### A10:2021 - Server-Side Request Forgery

**対策:**
- ✅ Apps Script URLをホワイトリスト化
- ✅ Redirect URI事前登録必須
- ✅ Open Redirect対策

---

## 暗号アルゴリズム選定理由

### Ed25519 (Provider署名)

**選定理由:**
- ✅ 高速（ECDSA P-256より10倍高速）
- ✅ 短い鍵長（32バイト）
- ✅ 側面チャネル攻撃耐性
- ✅ RFC 8032標準化

**セキュリティ強度:**
- 128ビット安全性（AES-128相当）
- 衝突確率 < 2^-128

### ES256 (JWT署名)

**選定理由:**
- ✅ OpenID Connect標準
- ✅ 広範なライブラリサポート
- ✅ FIPS 186-4準拠

**セキュリティ強度:**
- 128ビット安全性
- NISTが承認したアルゴリズム

### SHA-256 (PKCE)

**選定理由:**
- ✅ RFC 7636指定
- ✅ 高速なハッシュ計算
- ✅ 広範なサポート

**セキュリティ強度:**
- 128ビット衝突耐性
- 256ビットプリイメージ耐性

---

## セキュリティ監査チェックリスト

### デプロイ前チェック

- [ ] JWT秘密鍵が `wrangler secret put` で設定済み
- [ ] `ADMIN_TOKEN` が強力なランダム値（32文字以上）
- [ ] `ALLOWED_ORIGINS` が適切に設定
- [ ] Apps Script が「アクセスしたユーザーで実行」モード
- [ ] Redirect URI が本番URLに更新

### 定期監査

- [ ] Cloudflare Logsで異常アクセスを確認（週次）
- [ ] 使用されていないクライアントの削除（月次）
- [ ] 依存パッケージの脆弱性スキャン（月次）
- [ ] JWT鍵のローテーション（年次）

### インシデント対応

- [ ] 侵害検知時の手順を文書化
- [ ] すべてのRefresh Tokenを無効化する手順
- [ ] JWT秘密鍵を緊急ローテーションする手順

---

## 既知の制限事項

### 1. Apps Scriptの制約

- **制限**: Crypto APIがない
- **影響**: 署名生成をWorkers側で実施
- **対策**: Workers-Apps Script間通信をHTTPS化

### 2. Cloudflare Workers制約

- **制限**: 最大50ms CPU時間
- **影響**: 大量のトークン検証は不可
- **対策**: JWT検証のキャッシュ（計画中）

### 3. KV Eventual Consistency

- **制限**: KV書き込み後の即時読み取りが保証されない
- **影響**: 稀にAuthorization Code再利用が可能
- **対策**: Workersメモリキャッシュによる二重使用防止（計画中）

---

## 脆弱性報告

セキュリティ脆弱性を発見した場合:

1. **GitHub Security Advisory** で非公開報告
2. メール: `security@example.com`（公開後に設定）
3. PGP公開鍵: `https://example.com/pgp.asc`

**報奨金制度:** 将来的に導入予定

---

## セキュリティアップデート履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2025-01-10 | 1.0.0 | 初回リリース |

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [STRIDE Threat Model](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
- [RFC 6819 - OAuth 2.0 Threat Model](https://datatracker.ietf.org/doc/html/rfc6819)
- [NIST SP 800-63B - Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

# bbauth API Reference

RFC 6749準拠 OAuth 2.0 Provider API仕様

## Base URL

```
https://bbauth.example.com
```

## 認証フロー概要

```
[Client] → GET /oauth/authorize
         ← 302 Redirect to Apps Script

[Apps Script] → メールアドレス取得
              ← 302 Redirect to /oauth/callback

[Client] → POST /oauth/token (Authorization Code)
         ← Access Token + Refresh Token + ID Token

[Client] → GET /oauth/userinfo (with Access Token)
         ← User Information
```

## Endpoints

### 1. Authorization Endpoint

ユーザー認可を開始し、Authorization Codeを取得します。

**Endpoint:** `GET /oauth/authorize`

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `client_id` | string | Yes | クライアントID |
| `redirect_uri` | string | Yes | リダイレクトURI（事前登録済み） |
| `response_type` | string | Yes | `code` 固定 |
| `scope` | string | Yes | スコープ（スペース区切り）<br>例: `email drive.readonly` |
| `state` | string | Recommended | CSRF対策用ランダム文字列 |
| `code_challenge` | string | Yes | PKCE Code Challenge（S256） |
| `code_challenge_method` | string | Yes | `S256` 固定 |
| `nonce` | string | Optional | ID Token検証用 |
| `provider_id` | string | Optional | Provider ID（複数IdP対応用） |

**Example Request:**

```http
GET /oauth/authorize?client_id=myapp&redirect_uri=https://myapp.com/callback&response_type=code&scope=email+drive.readonly&state=xyz123&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256 HTTP/1.1
Host: bbauth.example.com
```

**Success Response:**

```http
HTTP/1.1 302 Found
Location: https://myapp.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz123
```

**Error Response:**

```http
HTTP/1.1 302 Found
Location: https://myapp.com/callback?error=invalid_scope&error_description=Invalid+scope&state=xyz123
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `invalid_request` | 必須パラメータ不足 |
| `unauthorized_client` | クライアント認証失敗 |
| `access_denied` | ユーザーが拒否 |
| `unsupported_response_type` | response_typeが不正 |
| `invalid_scope` | スコープが無効 |
| `server_error` | サーバーエラー |

---

### 2. Token Endpoint

Authorization CodeをAccess Tokenに交換、またはRefresh Tokenで更新します。

**Endpoint:** `POST /oauth/token`

**Content-Type:** `application/x-www-form-urlencoded`

#### 2.1 Authorization Code Grant

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `grant_type` | string | Yes | `authorization_code` 固定 |
| `code` | string | Yes | Authorization Code |
| `redirect_uri` | string | Yes | 認可時と同じリダイレクトURI |
| `client_id` | string | Yes | クライアントID |
| `code_verifier` | string | Yes | PKCE Code Verifier |
| `client_secret` | string | Conditional | Confidential Clientの場合必須 |

**Example Request:**

```http
POST /oauth/token HTTP/1.1
Host: bbauth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&redirect_uri=https://myapp.com/callback&client_id=myapp&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**Success Response:**

```json
{
  "access_token": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "id_token": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "email drive.readonly"
}
```

#### 2.2 Refresh Token Grant

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `grant_type` | string | Yes | `refresh_token` 固定 |
| `refresh_token` | string | Yes | リフレッシュトークン |
| `client_id` | string | Yes | クライアントID |
| `scope` | string | Optional | スコープ（元のサブセット） |
| `client_secret` | string | Conditional | Confidential Clientの場合必須 |

**Example Request:**

```http
POST /oauth/token HTTP/1.1
Host: bbauth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA&client_id=myapp
```

**Success Response:**

```json
{
  "access_token": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "email drive.readonly"
}
```

**Error Response:**

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid authorization code"
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `invalid_request` | 必須パラメータ不足 |
| `invalid_client` | クライアント認証失敗 |
| `invalid_grant` | コード/トークンが無効 |
| `unauthorized_client` | クライアントが許可されていない |
| `unsupported_grant_type` | grant_typeが不正 |
| `invalid_scope` | スコープが無効 |

---

### 3. UserInfo Endpoint

Access Tokenを使用してユーザー情報を取得します。

**Endpoint:** `GET /oauth/userinfo`

**Authentication:** Bearer Token

**Example Request:**

```http
GET /oauth/userinfo HTTP/1.1
Host: bbauth.example.com
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response:**

```json
{
  "sub": "user@example.com",
  "email": "user@example.com",
  "email_verified": true
}
```

**Error Response:**

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token", error_description="Invalid or expired access token"
Content-Type: application/json

{
  "error": "invalid_token",
  "error_description": "Invalid or expired access token"
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `invalid_token` | トークンが無効または期限切れ |
| `insufficient_scope` | スコープが不足 |

---

### 4. OpenID Connect Discovery

OpenID Connect Discovery Document

**Endpoint:** `GET /.well-known/openid-configuration`

**Example Response:**

```json
{
  "issuer": "https://bbauth.example.com",
  "authorization_endpoint": "https://bbauth.example.com/oauth/authorize",
  "token_endpoint": "https://bbauth.example.com/oauth/token",
  "userinfo_endpoint": "https://bbauth.example.com/oauth/userinfo",
  "jwks_uri": "https://bbauth.example.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["ES256"],
  "scopes_supported": ["email", "drive.readonly", "gmail.send"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "none"],
  "code_challenge_methods_supported": ["S256"]
}
```

---

### 5. JWKS Endpoint

JWT署名検証用公開鍵

**Endpoint:** `GET /.well-known/jwks.json`

**Example Response:**

```json
{
  "keys": [
    {
      "kty": "EC",
      "use": "sig",
      "kid": "default",
      "alg": "ES256",
      "crv": "P-256",
      "x": "WKn-ZIGevcwGIyyrzFoZNBdaq9_TsqzGl96oc0CWuis",
      "y": "y77t-RvAHRKTsSGdIYUfweuOvwrvDD-Q3Hv5J0fSKbE"
    }
  ]
}
```

---

## Scopes

| Scope | Description | Apps Script権限 |
|-------|-------------|----------------|
| `email` | メールアドレス取得 | `Session.getActiveUser()` |
| `drive.readonly` | Drive読み取り | `DriveApp.getFiles()` |
| `gmail.send` | Gmail送信 | `GmailApp.sendEmail()` |

---

## JWT Structure

### Access Token

```json
{
  "header": {
    "alg": "ES256",
    "typ": "JWT"
  },
  "payload": {
    "iss": "https://bbauth.example.com",
    "sub": "user@example.com",
    "aud": "myapp",
    "iat": 1704067200,
    "exp": 1704070800,
    "scope": "email drive.readonly"
  }
}
```

### ID Token

```json
{
  "header": {
    "alg": "ES256",
    "typ": "JWT"
  },
  "payload": {
    "iss": "https://bbauth.example.com",
    "sub": "user@example.com",
    "aud": "myapp",
    "iat": 1704067200,
    "exp": 1704070800,
    "email": "user@example.com",
    "email_verified": true,
    "nonce": "n-0S6_WzA2Mj"
  }
}
```

---

## PKCE (Proof Key for Code Exchange)

### 1. Code Verifierの生成

```javascript
const codeVerifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
// 例: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

### 2. Code Challengeの計算 (S256)

```javascript
const encoder = new TextEncoder();
const data = encoder.encode(codeVerifier);
const hash = await crypto.subtle.digest('SHA-256', data);
const codeChallenge = base64url(hash);
// 例: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
```

### 3. Authorizeリクエスト

```
code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
code_challenge_method=S256
```

### 4. Tokenリクエスト

```
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

---

## Rate Limiting

現在、Rate Limitingは実装されていませんが、将来的に以下を予定:

- Authorization Endpoint: 10 req/min/IP
- Token Endpoint: 20 req/min/client
- UserInfo Endpoint: 60 req/min/token

---

## Security Considerations

1. **HTTPS必須**: すべてのエンドポイントはHTTPS経由のみ
2. **PKCE必須**: Authorization Code Flowでは必須
3. **State推奨**: CSRF対策のためstate使用推奨
4. **短命なコード**: Authorization Codeは10分で失効
5. **トークンローテーション**: Refresh Token使用時は再発行推奨

---

## References

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 7519 - JWT](https://datatracker.ietf.org/doc/html/rfc7519)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)

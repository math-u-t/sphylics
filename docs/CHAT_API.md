# Flexio Chat API ドキュメント

## 概要

Flexio Chat APIは、Cloudflare Workersを使用したリアルタイムチャットルーム管理APIです。
トークンベースの認証により、チャットルームの作成・管理を行うことができます。

## アーキテクチャ

### Workers vs Pages の役割分担

- **Workers** (`api.flexio.workers.dev`)
  - すべてのAPIエンドポイントを提供
  - データの永続化（Cloudflare KV使用）
  - 認証・認可処理

- **Pages** (`flexio.pages.dev`)
  - 静的なWebページの配信のみ
  - Workers APIとfetch/WebSocketで通信
  - チャットUI: `/chat/CHAT_LINK/`

### データストレージ

Cloudflare KVを使用してチャットデータを保存します：
- Key: `chat:{link}`
- Value: JSON形式のChatDataオブジェクト

## 認証

すべてのAPI操作はトークンベースで管理されます。
- チャット作成時に提供された`token`が管理者トークンとして保存されます
- 更新・削除操作には管理者トークンが必要です
- 閲覧にはトークン不要（オプショナル）

## エンドポイント一覧

### ベースURL

```
https://api.flexio.workers.dev
```

---

## 1. チャット作成

新しいチャットルームを作成します。

### エンドポイント

```
POST /chat/new
```

### リクエスト

#### Headers

```
Content-Type: application/json
```

#### Body

```json
{
  "token": "YOUR_ADMIN_TOKEN",
  "future": {},
  "content": {
    "title": "チャットタイトル",
    "about": "チャットの説明",
    "tag": ["tag1", "tag2", "tag3"],
    "link": "unique-chat-link"
  }
}
```

#### パラメータ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| token | string | ✓ | 管理者トークン（任意の文字列） |
| future | object | - | 将来の拡張用（現在未使用） |
| content.title | string | ✓ | チャットルームのタイトル |
| content.about | string | ✓ | チャットルームの説明 |
| content.tag | string[] | ✓ | タグの配列 |
| content.link | string | ✓ | 一意のチャットリンク（英数字、ハイフン、アンダースコアのみ） |

### レスポンス

#### 成功時 (201 Created)

```json
{
  "statusCode": 201,
  "content": {
    "link": "unique-chat-link",
    "title": "チャットタイトル",
    "about": "チャットの説明",
    "tags": ["tag1", "tag2", "tag3"],
    "createdAt": 1699999999999,
    "updatedAt": 1699999999999,
    "participantCount": 0,
    "isAdmin": true
  }
}
```

#### エラー時

```json
{
  "statusCode": 400,
  "content": "Missing required fields: token, content",
  "error": "Missing required fields: token, content"
}
```

```json
{
  "statusCode": 409,
  "content": "Chat link already exists",
  "error": "Chat link already exists"
}
```

### 使用例

```bash
curl -X POST https://api.flexio.workers.dev/chat/new \
  -H "Content-Type: application/json" \
  -d '{
    "token": "my-secret-token-123",
    "content": {
      "title": "技術討論ルーム",
      "about": "プログラミングに関する議論を行うチャットルーム",
      "tag": ["programming", "tech", "discussion"],
      "link": "tech-discussion-2024"
    }
  }'
```

---

## 2. チャット取得

指定したリンクのチャット情報を取得します。

### エンドポイント

```
GET /chat/:link
```

### リクエスト

#### URL Parameters

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| link | string | ✓ | チャットリンク |

#### Query Parameters

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| token | string | - | 管理者トークン（管理者かどうか判定に使用） |

### レスポンス

#### 成功時 (200 OK)

```json
{
  "statusCode": 200,
  "content": {
    "link": "tech-discussion-2024",
    "title": "技術討論ルーム",
    "about": "プログラミングに関する議論を行うチャットルーム",
    "tags": ["programming", "tech", "discussion"],
    "createdAt": 1699999999999,
    "updatedAt": 1699999999999,
    "participantCount": 5,
    "isAdmin": false
  }
}
```

#### エラー時 (404 Not Found)

```json
{
  "statusCode": 404,
  "content": "Chat not found",
  "error": "Chat not found"
}
```

### 使用例

```bash
# 一般ユーザーとして取得
curl https://api.flexio.workers.dev/chat/tech-discussion-2024

# 管理者として取得
curl "https://api.flexio.workers.dev/chat/tech-discussion-2024?token=my-secret-token-123"
```

---

## 3. チャットリスト取得

チャット一覧を取得します。

### エンドポイント

```
GET /chat/list
```

### リクエスト

#### Query Parameters

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| token | string | - | - | 管理者トークン（管理者かどうか判定に使用） |
| limit | number | - | 50 | 取得件数 |
| offset | number | - | 0 | オフセット（ページネーション用） |
| tag | string | - | - | タグでフィルタ |

### レスポンス

#### 成功時 (200 OK)

```json
{
  "statusCode": 200,
  "content": {
    "chats": [
      {
        "link": "tech-discussion-2024",
        "title": "技術討論ルーム",
        "about": "プログラミングに関する議論を行うチャットルーム",
        "tags": ["programming", "tech", "discussion"],
        "createdAt": 1699999999999,
        "updatedAt": 1699999999999,
        "participantCount": 5,
        "isAdmin": false
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### 使用例

```bash
# すべてのチャットを取得
curl https://api.flexio.workers.dev/chat/list

# タグでフィルタ
curl "https://api.flexio.workers.dev/chat/list?tag=programming"

# ページネーション
curl "https://api.flexio.workers.dev/chat/list?limit=10&offset=20"
```

---

## 4. チャット更新

チャット情報を更新します（管理者のみ）。

### エンドポイント

```
PUT /chat/update
```

### リクエスト

#### Headers

```
Content-Type: application/json
```

#### Body

```json
{
  "token": "YOUR_ADMIN_TOKEN",
  "link": "tech-discussion-2024",
  "content": {
    "title": "新しいタイトル",
    "about": "新しい説明",
    "tag": ["new-tag1", "new-tag2"]
  }
}
```

#### パラメータ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| token | string | ✓ | 管理者トークン |
| link | string | ✓ | チャットリンク |
| content.title | string | - | 新しいタイトル |
| content.about | string | - | 新しい説明 |
| content.tag | string[] | - | 新しいタグ配列 |

### レスポンス

#### 成功時 (200 OK)

```json
{
  "statusCode": 200,
  "content": {
    "link": "tech-discussion-2024",
    "title": "新しいタイトル",
    "about": "新しい説明",
    "tags": ["new-tag1", "new-tag2"],
    "createdAt": 1699999999999,
    "updatedAt": 1700000000000,
    "participantCount": 5,
    "isAdmin": true
  }
}
```

#### エラー時

```json
{
  "statusCode": 403,
  "content": "Forbidden: Invalid admin token",
  "error": "Forbidden: Invalid admin token"
}
```

```json
{
  "statusCode": 404,
  "content": "Chat not found",
  "error": "Chat not found"
}
```

### 使用例

```bash
curl -X PUT https://api.flexio.workers.dev/chat/update \
  -H "Content-Type: application/json" \
  -d '{
    "token": "my-secret-token-123",
    "link": "tech-discussion-2024",
    "content": {
      "title": "改訂版：技術討論ルーム",
      "tag": ["programming", "tech", "discussion", "updated"]
    }
  }'
```

---

## 5. チャット削除

チャットルームを削除します（管理者のみ）。

### エンドポイント

```
DELETE /chat/delete
```

### リクエスト

#### Headers

```
Content-Type: application/json
```

#### Body

```json
{
  "token": "YOUR_ADMIN_TOKEN",
  "link": "tech-discussion-2024"
}
```

#### パラメータ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| token | string | ✓ | 管理者トークン |
| link | string | ✓ | チャットリンク |

### レスポンス

#### 成功時 (200 OK)

```json
{
  "statusCode": 200,
  "content": "Chat deleted successfully"
}
```

#### エラー時

```json
{
  "statusCode": 403,
  "content": "Forbidden: Invalid admin token",
  "error": "Forbidden: Invalid admin token"
}
```

```json
{
  "statusCode": 404,
  "content": "Chat not found",
  "error": "Chat not found"
}
```

### 使用例

```bash
curl -X DELETE https://api.flexio.workers.dev/chat/delete \
  -H "Content-Type: application/json" \
  -d '{
    "token": "my-secret-token-123",
    "link": "tech-discussion-2024"
  }'
```

---

## 6. 参加者数更新

チャットルームの参加者数を更新します。

### エンドポイント

```
POST /chat/:link/participants
```

### リクエスト

#### URL Parameters

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| link | string | ✓ | チャットリンク |

#### Headers

```
Content-Type: application/json
```

#### Body

```json
{
  "action": "join"
}
```

または

```json
{
  "action": "leave"
}
```

#### パラメータ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| action | "join" \| "leave" | ✓ | 参加または退出 |

### レスポンス

#### 成功時 (200 OK)

```json
{
  "statusCode": 200,
  "content": {
    "participantCount": 6
  }
}
```

#### エラー時

```json
{
  "statusCode": 400,
  "content": "Invalid action. Use \"join\" or \"leave\"",
  "error": "Invalid action. Use \"join\" or \"leave\""
}
```

```json
{
  "statusCode": 404,
  "content": "Chat not found",
  "error": "Chat not found"
}
```

### 使用例

```bash
# 参加
curl -X POST https://api.flexio.workers.dev/chat/tech-discussion-2024/participants \
  -H "Content-Type: application/json" \
  -d '{"action": "join"}'

# 退出
curl -X POST https://api.flexio.workers.dev/chat/tech-discussion-2024/participants \
  -H "Content-Type: application/json" \
  -d '{"action": "leave"}'
```

---

## エラーコード一覧

| ステータスコード | 説明 |
|----------------|------|
| 200 | OK - リクエスト成功 |
| 201 | Created - リソース作成成功 |
| 400 | Bad Request - リクエストパラメータが不正 |
| 403 | Forbidden - 権限がない |
| 404 | Not Found - リソースが見つからない |
| 409 | Conflict - リソースが既に存在する |
| 500 | Internal Server Error - サーバーエラー |

## 統一されたレスポンス形式

すべてのAPIレスポンスは以下の形式に従います：

```typescript
{
  statusCode: number;
  content: any | string;
  error?: string;  // エラー時のみ
}
```

## データモデル

### ChatData (KV保存データ)

```typescript
{
  link: string;              // 一意のチャットリンク
  title: string;             // チャットタイトル
  about: string;             // チャット説明
  tags: string[];            // タグ配列
  adminToken: string;        // 管理者トークン
  createdAt: number;         // 作成日時（UnixTime）
  updatedAt: number;         // 更新日時（UnixTime）
  participantCount: number;  // 参加者数
}
```

### ChatResponse (APIレスポンス)

```typescript
{
  link: string;
  title: string;
  about: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  participantCount: number;
  isAdmin?: boolean;  // リクエストユーザーが管理者かどうか
}
```

## Pages側での使用例

### JavaScript (Fetch API)

```javascript
// チャット作成
async function createChat(token, title, about, tags, link) {
  const response = await fetch('https://api.flexio.workers.dev/chat/new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: token,
      content: {
        title: title,
        about: about,
        tag: tags,
        link: link,
      }
    })
  });

  const data = await response.json();
  if (data.statusCode === 201) {
    console.log('チャット作成成功:', data.content);
    return data.content;
  } else {
    console.error('エラー:', data.error);
    throw new Error(data.error);
  }
}

// チャット情報取得
async function getChat(link, token = null) {
  const url = new URL(`https://api.flexio.workers.dev/chat/${link}`);
  if (token) {
    url.searchParams.set('token', token);
  }

  const response = await fetch(url);
  const data = await response.json();

  if (data.statusCode === 200) {
    return data.content;
  } else {
    throw new Error(data.error);
  }
}

// 参加者数更新
async function updateParticipants(link, action) {
  const response = await fetch(`https://api.flexio.workers.dev/chat/${link}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: action })
  });

  const data = await response.json();
  if (data.statusCode === 200) {
    return data.content.participantCount;
  } else {
    throw new Error(data.error);
  }
}
```

### WebSocket統合（将来の拡張）

現在は実装されていませんが、リアルタイムメッセージング機能を追加する場合：

```javascript
// 将来の実装例
const ws = new WebSocket('wss://api.flexio.workers.dev/chat/tech-discussion-2024/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'user-token'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('新しいメッセージ:', message);
};
```

## セキュリティ考慮事項

1. **トークン管理**
   - 管理者トークンは安全に保管してください
   - HTTPS通信を使用してください
   - トークンをURLパラメータではなくリクエストボディで送信してください

2. **リンクの検証**
   - チャットリンクは英数字、ハイフン、アンダースコアのみを使用
   - 推測されにくいランダムなリンクを推奨

3. **CORS設定**
   - Workers側で適切なCORS設定を行ってください
   - `ALLOWED_ORIGINS`環境変数でPages URLを許可

## パフォーマンス考慮事項

1. **KV制限**
   - Cloudflare KVの読み取り制限に注意
   - チャットリスト取得は大量のチャットがある場合、パフォーマンスに影響
   - 大規模な場合はDurable Objectsの使用を検討

2. **キャッシング**
   - チャット情報はキャッシュ可能
   - 参加者数はリアルタイム性が必要

## デプロイ

### Workers デプロイ

```bash
cd workers
npm install
wrangler publish
```

### 環境変数設定

```bash
wrangler secret put ADMIN_TOKEN
wrangler secret put JWT_PRIVATE_KEY
wrangler secret put JWT_PUBLIC_KEY
```

## ライセンス

MIT License

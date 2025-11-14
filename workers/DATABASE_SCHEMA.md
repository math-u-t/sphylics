# Flexio Database Schema Documentation

## Overview

Flexio uses **Cloudflare KV** (Key-Value store) for data persistence. This document describes the key naming conventions, data structures, and relationships.

## Key Naming Conventions

All keys follow a prefix-based naming scheme for efficient querying and organization.

### Pattern Format

```
<entity>:<identifier>[:<sub-entity>:<sub-identifier>]
```

---

## Entity Types

### 1. Chat

**Primary Key**: `chat:<chatLink>`

**Data Structure**:
```typescript
{
  link: string;              // Unique chat identifier
  title: string;             // Chat title (max 100 chars)
  about: string;             // Description (max 500 chars)
  tags: string[];            // Tag array
  recent: string;            // ISO 8601 - last activity
  authory: {
    blocked: string[];       // Blocked user names
    notParticipating: string[];
    audience: string[];      // View-only users
    entrant: string[];       // Can post comments
    manager: string[];       // Can manage users
    owner: string[];         // Full control
  };
  createdAt: number;         // Unix timestamp (ms)
  updatedAt: number;         // Unix timestamp (ms)
  commentCount: number;      // Total comments
}
```

**Related Keys**:
- `chat:<chatLink>:comment:<commentID>` → stores `commentID` (for indexing)
- `chat:<chatLink>:users` → (future: user list)

**Indexes**:
- List all chats: `KV.list({ prefix: 'chat:' })`
- Find chat comments: `KV.list({ prefix: 'chat:<chatLink>:comment:' })`

**Example**:
```json
// Key: chat:general-discussion
{
  "link": "general-discussion",
  "title": "General Discussion",
  "about": "A place for general conversation",
  "tags": ["public", "general"],
  "recent": "2025-11-14T12:34:56Z",
  "authory": {
    "blocked": [],
    "notParticipating": [],
    "audience": ["user1"],
    "entrant": ["user2", "user3"],
    "manager": [],
    "owner": ["creator"]
  },
  "createdAt": 1731586496000,
  "updatedAt": 1731586496000,
  "commentCount": 42
}
```

---

### 2. Comment

**Primary Key**: `comment:<commentID>`

**Data Structure**:
```typescript
{
  commentID: string;         // UUID v4
  chatLink: string;          // Parent chat
  userName: string;          // Author (chat-scoped)
  text: string;              // Comment text (max 2000 chars)
  commentedTime: string;     // ISO 8601
  editedTime?: string;       // ISO 8601 (if edited)
  reaction: {
    [userName: string]: string;  // reaction name
  };
  deleted: boolean;          // Soft delete flag
}
```

**Related Keys**:
- `chat:<chatLink>:comment:<commentID>` → links comment to chat

**Indexes**:
- List all comments: `KV.list({ prefix: 'comment:' })`
- Find comments in chat: `KV.list({ prefix: 'chat:<chatLink>:comment:' })`

**Example**:
```json
// Key: comment:550e8400-e29b-41d4-a716-446655440000
{
  "commentID": "550e8400-e29b-41d4-a716-446655440000",
  "chatLink": "general-discussion",
  "userName": "user2",
  "text": "Hello everyone!",
  "commentedTime": "2025-11-14T12:34:56Z",
  "reaction": {
    "user1": "good",
    "user3": "love"
  },
  "deleted": false
}
```

---

### 3. Account

**Primary Key**: `account:<accountID>`

**Data Structure**:
```typescript
{
  accountID: string;         // UUID v4
  bbauthAccountID: string;   // bbauth integration
  belonging: {
    [chatLink: string]: {
      authory: ChatRole;     // Role in this chat
      userName: string;      // Identity in this chat
      joinedAt: string;      // ISO 8601
    };
  };
  serviceJoined: string;     // ISO 8601
  flexioCoin: number;        // Virtual currency (future use)
  createdAt: number;         // Unix timestamp (ms)
  updatedAt: number;         // Unix timestamp (ms)
}
```

**Example**:
```json
// Key: account:a1b2c3d4-e5f6-7890-abcd-ef1234567890
{
  "accountID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "bbauthAccountID": "bbauth-12345",
  "belonging": {
    "general-discussion": {
      "authory": "entrant",
      "userName": "user2",
      "joinedAt": "2025-11-14T10:00:00Z"
    },
    "tech-chat": {
      "authory": "owner",
      "userName": "admin",
      "joinedAt": "2025-11-01T08:00:00Z"
    }
  },
  "serviceJoined": "2025-11-01T08:00:00Z",
  "flexioCoin": 100,
  "createdAt": 1730448000000,
  "updatedAt": 1731586496000
}
```

---

### 4. Report

**Primary Key**: `report:<reportID>`

**Data Structure**:
```typescript
{
  reportID: string;          // UUID v4
  type: 'comment' | 'chat';
  targetID: string;          // commentID or chatLink
  reporterName: string;      // Reporter username
  reason: string;            // Report reason
  createdAt: string;         // ISO 8601
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  reviewedBy?: string;       // Admin username
  reviewedAt?: string;       // ISO 8601
}
```

**Related Keys**:
- `report:comment:<commentID>:<reportID>` → index reports by comment
- `report:chat:<chatLink>:<reportID>` → index reports by chat

**Example**:
```json
// Key: report:f1e2d3c4-b5a6-7890-1234-567890abcdef
{
  "reportID": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
  "type": "comment",
  "targetID": "550e8400-e29b-41d4-a716-446655440000",
  "reporterName": "user1",
  "reason": "Spam content",
  "createdAt": "2025-11-14T13:00:00Z",
  "status": "pending"
}
```

---

### 5. Notification

**Primary Key**: `notification:<accountID>:<notificationID>`

**Data Structure**:
```typescript
{
  notificationID: string;    // UUID v4
  accountID: string;         // Recipient account
  title: string;             // Notification title
  message: string;           // Notification message
  chatLink: string;          // Related chat
  commentID: string | null;  // Related comment (if any)
  createdTime: string;       // ISO 8601
  read: boolean;             // Read status
}
```

**Indexes**:
- Get user notifications: `KV.list({ prefix: 'notification:<accountID>:' })`

**Example**:
```json
// Key: notification:a1b2c3d4-e5f6-7890-abcd-ef1234567890:notif-123
{
  "notificationID": "notif-123",
  "accountID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "New reaction on your comment",
  "message": "user3 reacted with ❤️ to your comment",
  "chatLink": "general-discussion",
  "commentID": "550e8400-e29b-41d4-a716-446655440000",
  "createdTime": "2025-11-14T13:30:00Z",
  "read": false
}
```

---

### 6. Admin Log

**Primary Key**: `adminlog:<logID>`

**Data Structure**:
```typescript
{
  logID: string;             // UUID v4
  adminUserName: string;     // Admin who performed action
  action: string;            // Action description
  targetType: 'chat' | 'comment' | 'user' | 'report' | 'document' | 'faq';
  targetID: string;          // Target entity ID
  details: any;              // Action details (JSON)
  timestamp: string;         // ISO 8601
}
```

**Related Keys**:
- `adminlog:user:<adminUserName>:<logID>` → stores `logID` (index by admin)

**Indexes**:
- All logs: `KV.list({ prefix: 'adminlog:' })`
- Admin-specific logs: `KV.list({ prefix: 'adminlog:user:<adminUserName>:' })`

**Example**:
```json
// Key: adminlog:log-abc123
{
  "logID": "log-abc123",
  "adminUserName": "council-admin",
  "action": "Resolved report",
  "targetType": "report",
  "targetID": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
  "details": {
    "reportType": "comment",
    "action": "resolve",
    "notes": "Spam confirmed and removed"
  },
  "timestamp": "2025-11-14T14:00:00Z"
}
```

---

### 7. Trust Score

**Primary Key**: `trust:<chatLink>`

**Data Structure**:
```typescript
{
  chatLink: string;
  ageScore: number;          // 0-1
  userScore: number;         // 0-1
  commentScore: number;      // 0-1
  trustScore: number;        // 0-1 (weighted: 0.4×age + 0.3×user + 0.3×comment)
  calculatedAt: string;      // ISO 8601
}
```

**TTL**: 3600 seconds (1 hour)

**Example**:
```json
// Key: trust:general-discussion
{
  "chatLink": "general-discussion",
  "ageScore": 0.85,
  "userScore": 0.72,
  "commentScore": 0.68,
  "trustScore": 0.761,
  "calculatedAt": "2025-11-14T14:00:00Z"
}
```

---

### 8. Rate Limit

**Primary Key**: `ratelimit:<identifier>`

**Data Structure**:
```typescript
{
  count: number;             // Request count
  resetAt: number;           // Unix timestamp (ms)
}
```

**TTL**: 120 seconds (2 minutes)

**Example**:
```json
// Key: ratelimit:192.168.1.100
{
  "count": 45,
  "resetAt": 1731586560000
}
```

---

## Key Relationships

### Chat → Comments

```
chat:general-discussion
  └── chat:general-discussion:comment:comment-id-1 → "comment-id-1"
  └── chat:general-discussion:comment:comment-id-2 → "comment-id-2"

comment:comment-id-1 → { ... full comment data ... }
comment:comment-id-2 → { ... full comment data ... }
```

### Comment → Reports

```
comment:comment-id-1
  └── report:comment:comment-id-1:report-id-1 → "report-id-1"
  └── report:comment:comment-id-1:report-id-2 → "report-id-2"

report:report-id-1 → { ... full report data ... }
report:report-id-2 → { ... full report data ... }
```

### Account → Notifications

```
account:account-id-1
  └── notification:account-id-1:notif-1 → { ... notification data ... }
  └── notification:account-id-1:notif-2 → { ... notification data ... }
```

### Admin → Logs

```
adminlog:log-1 → { ... log data ... }
adminlog:log-2 → { ... log data ... }
  └── adminlog:user:council-admin:log-1 → "log-1"
  └── adminlog:user:audit-admin:log-2 → "log-2"
```

---

## Query Patterns

### 1. Get all chats

```typescript
const chatList = await env.KV.list({ prefix: 'chat:' });
for (const key of chatList.keys) {
  if (!key.name.includes(':comment:')) {  // Skip sub-entities
    const chatData = await env.KV.get(key.name);
    // Process chat
  }
}
```

### 2. Get comments in a chat

```typescript
const commentKeys = await env.KV.list({
  prefix: `chat:${chatLink}:comment:`
});

for (const key of commentKeys.keys) {
  const commentId = await env.KV.get(key.name);
  const comment = await env.KV.get(`comment:${commentId}`);
  // Process comment
}
```

### 3. Get user notifications

```typescript
const notifications = await env.KV.list({
  prefix: `notification:${accountID}:`
});

for (const key of notifications.keys) {
  const notification = await env.KV.get(key.name);
  // Process notification
}
```

### 4. Get admin logs

```typescript
// All logs
const allLogs = await env.KV.list({ prefix: 'adminlog:', limit: 100 });

// Specific admin
const adminLogs = await env.KV.list({
  prefix: `adminlog:user:${adminUserName}:`,
  limit: 50
});
```

---

## Data Retention

| Entity | Retention Policy | TTL |
|--------|------------------|-----|
| Chat | Permanent (until deleted) | None |
| Comment | Permanent (soft delete) | None |
| Account | Permanent | None |
| Report | Permanent (for audit) | None |
| Notification | 90 days | None (manual cleanup) |
| Admin Log | Permanent (for transparency) | None |
| Trust Score | Cached | 1 hour |
| Rate Limit | Temporary | 2 minutes |

---

## Backup & Migration

### Export Strategy

```typescript
// Export all chats
const chats = await env.KV.list({ prefix: 'chat:' });
const backup = [];

for (const key of chats.keys) {
  const data = await env.KV.get(key.name);
  backup.push({
    key: key.name,
    value: data,
    metadata: key.metadata
  });
}

// Save to external storage
await saveToExternalStorage(backup);
```

### Import Strategy

```typescript
// Import from backup
for (const item of backup) {
  await env.KV.put(item.key, item.value, {
    metadata: item.metadata
  });
}
```

---

## Performance Considerations

### 1. KV List Limitations

- **Limit**: Max 1000 keys per `list()` call
- **Solution**: Use pagination with `cursor`

```typescript
let cursor;
do {
  const result = await env.KV.list({
    prefix: 'chat:',
    cursor
  });

  // Process result.keys

  cursor = result.list_complete ? undefined : result.cursor;
} while (cursor);
```

### 2. Caching

- Trust scores are cached for 1 hour
- Rate limits are cached for 2 minutes
- Consider caching frequently accessed chats

### 3. Indexing

Use secondary keys for efficient lookups:
- `chat:<chatLink>:comment:<commentID>` for comment-to-chat mapping
- `report:comment:<commentID>:<reportID>` for comment-to-reports mapping
- `adminlog:user:<adminUserName>:<logID>` for admin activity tracking

---

## Schema Evolution

### Adding New Fields

Safe (backward compatible):
```typescript
// Old schema
{ title: string; about: string; }

// New schema
{ title: string; about: string; newField?: string; }
```

### Removing Fields

Requires migration:
```typescript
// Step 1: Mark as deprecated (don't use in new code)
// Step 2: Remove from new writes
// Step 3: Migrate existing data
// Step 4: Remove field from type definitions
```

### Changing Field Types

Requires versioning:
```typescript
// Add version field
{ _version: 2; createdAt: string; }  // v2: ISO 8601
// vs
{ _version: 1; createdAt: number; }  // v1: Unix timestamp
```

---

## Security Considerations

1. **Never expose INSIDE_ACCOUNT_TOKEN** - Server-side only
2. **Validate all inputs** before storing in KV
3. **Soft delete sensitive data** (comments, reports) for audit trails
4. **Encrypt sensitive fields** if storing PII (not currently used)
5. **Rate limit KV operations** to prevent abuse
6. **Use unique UUIDs** for all IDs (prevents enumeration attacks)

---

## Monitoring

### Key Metrics

- KV read operations/sec
- KV write operations/sec
- Average query latency
- Total storage used
- Number of active chats
- Number of reports pending

### Alerts

- KV storage > 80% of quota
- Sudden spike in reports (potential abuse)
- Admin log anomalies (unauthorized access attempts)

---

## Future Enhancements

1. **Migration to D1** (SQL database) for complex queries
2. **Durable Objects** for real-time features
3. **Search indexing** with Cloudflare Workers AI
4. **Analytics pipeline** with Cloudflare Analytics Engine
5. **Geo-replication** for global performance

---

**Last Updated**: 2025-11-14
**Schema Version**: 1.0.0

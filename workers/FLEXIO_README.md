# Flexio API - Complete Implementation Guide

**Flexio** is an anonymous chat and comment system built on Cloudflare Workers, designed to preserve user anonymity while providing robust moderation and trust mechanisms.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Concepts](#core-concepts)
3. [Token System](#token-system)
4. [Permission System](#permission-system)
5. [Setup & Installation](#setup--installation)
6. [API Endpoints](#api-endpoints)
7. [Security Features](#security-features)
8. [Trust Score System](#trust-score-system)
9. [Reaction System](#reaction-system)
10. [Development Guide](#development-guide)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Technology Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Authentication**: JWT (ES256)
- **Storage**: Cloudflare KV
- **Security**: Web Crypto API, Rate Limiting

### Key Features

- ✅ Anonymous chat rooms with role-based permissions
- ✅ Comment system with 31 types of reactions (21 permanent + 10 seasonal)
- ✅ Trust score calculation for chat quality
- ✅ Comprehensive report & moderation system
- ✅ Admin logging for transparency and accountability
- ✅ Rate limiting (60 requests/minute)
- ✅ 5-tier JWT token system
- ✅ bbauth integration for persistent accounts

---

## Core Concepts

### User vs Account

**Critical Distinction:**

- **User**: A temporary identity within a specific chat room. Users are identified by `userName` and exist only within the context of a chat.
- **Account**: A persistent entity across the entire Flexio service, linked to a bbauth account. Accounts can have multiple User identities across different chats.

This separation ensures **anonymity** - your actions in one chat cannot be linked to your actions in another chat.

---

## Token System

Flexio uses **5 types of JWT tokens**, all uppercase IDs:

### 1. USER_TOKEN (Chat-scoped)

Identifies a user within a specific chat.

```typescript
{
  userName: string;
  link: string;        // Chat UUID
  savedTime: string;   // ISO 8601
  authory: ChatRole;   // user's role in this chat
}
```

**Lifetime**: 1 year
**Public**: Yes (shared within chat context)

### 2. COMMENT_TOKEN

Identifies a specific comment.

```typescript
{
  userToken: string;
  link: string;
  text: string;
  commentID: string;     // UUID
  commentedTime: string; // ISO 8601
}
```

**Lifetime**: 1 year
**Public**: Yes

### 3. INSIDE_ACCOUNT_TOKEN ⚠️ CONFIDENTIAL

**DO NOT EXPOSE TO CLIENTS** - Internal use only.

```typescript
{
  bbauthAccountID: string;
  belonging: {
    [chatLink: string]: {
      authory: ChatRole;
    };
  };
  serviceJoined: string; // ISO 8601
  flexioCoin: number;
}
```

**Lifetime**: 1 year
**Public**: NO - Server-side only

### 4. SERVICE_TOKEN

Service-wide authentication token.

```typescript
{
  serviceID: 'flexio';
  accountID: string;
  issuedAt: string;    // ISO 8601
  expiresAt: string;   // ISO 8601
}
```

**Lifetime**: 30 days
**Public**: Yes (required for API calls)

### 5. ADMIN_TOKEN

Admin authentication token.

```typescript
{
  userName: string;
  passwordHash: string;  // SHA-256 hashed
  authory: 'audit' | 'dev' | 'council';
  period: string;        // ISO 8601 expiry
}
```

**Lifetime**: Variable (set in `period`)
**Public**: Admin-only

---

## Permission System

### Chat Roles (6 tiers)

| Role | View | Post | Edit | Delete | Manage Users | Edit Chat | Delegate | Report |
|------|------|------|------|--------|--------------|-----------|----------|--------|
| **blocked** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **notParticipating** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **audience** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **entrant** | ✅ | ✅ | ✅* | ✅* | ❌ | ❌ | ❌ | ✅ |
| **manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅** | ✅ |
| **owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

\* Own comments only
\** Requires owner approval

### Admin Roles (Power Separation)

| Role | Purpose | Code Access | Execute | Audit |
|------|---------|-------------|---------|-------|
| **audit** | Oversight | ❌ | ❌ | ✅ |
| **dev** | Development | ✅ | ❌ | ❌ |
| **council** | Governance | ❌ | ✅ | ✅ |

This separation prevents any single admin from unilaterally compromising user anonymity.

---

## Setup & Installation

### Prerequisites

- Node.js >= 18.0.0
- Cloudflare account
- Wrangler CLI

### 1. Install Dependencies

```bash
cd workers
npm install
```

### 2. Configure KV Namespace

```bash
# Create production KV namespace
wrangler kv:namespace create "KV"

# Create preview KV namespace
wrangler kv:namespace create "KV" --preview
```

Update `wrangler.toml` with the generated IDs.

### 3. Generate JWT Keys

```bash
# Generate ES256 key pair
openssl ecparam -genkey -name prime256v1 -noout -out private-key.pem
openssl ec -in private-key.pem -pubout -out public-key.pem
```

### 4. Set Secrets

```bash
# Set JWT private key
wrangler secret put JWT_PRIVATE_KEY
# Paste the content of private-key.pem

# Set JWT public key
wrangler secret put JWT_PUBLIC_KEY
# Paste the content of public-key.pem

# Set admin token (generate a secure random token)
wrangler secret put ADMIN_TOKEN
```

### 5. Configure Environment Variables

Update `wrangler.toml`:

```toml
[vars]
ISSUER_URL = "https://your-worker.workers.dev"
APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
ALLOWED_ORIGINS = "https://your-frontend.com,https://another-origin.com"
```

### 6. Deploy

```bash
# Development
wrangler dev

# Production
wrangler deploy
```

---

## API Endpoints

### Authentication

All protected endpoints require one of the following:

- `Authorization: Bearer <SERVICE_TOKEN>` (user operations)
- `Authorization: Bearer <ADMIN_TOKEN>` (admin operations)

### Chat Management

#### `GET /chat/list`

List all chats (with filters).

**Query Parameters:**
- `token` (required): SERVICE_TOKEN
- `query`: Search query
- `type`: `'belonging' | 'all' | 'tag' | 'time'`
- `limit`: Max results (default: 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "statusCode": 200,
  "content": {
    "chat": {
      "CHAT_LINK": {
        "title": "Chat Title",
        "about": "Description",
        "tag": ["tag1", "tag2"],
        "recent": "2025-11-14T12:00:00Z",
        "authory": {
          "blocked": [],
          "audience": ["user1"],
          "entrant": ["user2"],
          "manager": [],
          "owner": ["creator"]
        }
      }
    }
  }
}
```

#### `POST /chat/new`

Create a new chat.

**Request:**
```json
{
  "token": "SERVICE_TOKEN",
  "content": {
    "title": "My Chat",
    "about": "Chat description",
    "tag": ["general", "public"],
    "link": "my-unique-chat-id"
  }
}
```

#### `GET /chat/:chatLink`

Get chat details and comments.

**Response:**
```json
{
  "statusCode": 200,
  "content": {
    "chat": {
      "comment": {
        "COMMENT_ID": {
          "text": "Hello world!",
          "commentedTime": "2025-11-14T12:00:00Z",
          "userName": "user1",
          "reaction": {
            "user2": "good",
            "user3": "love"
          }
        }
      },
      "information": {
        "title": "Chat Title",
        "about": "Description",
        "tag": ["tag1"],
        "recent": "2025-11-14T12:00:00Z",
        "authory": { ... }
      }
    }
  }
}
```

#### `POST /chat/:chatLink/join`

Join a chat (updates participant count).

#### `POST /chat/:chatLink/edit`

Edit chat metadata (owner only).

#### `POST /chat/:chatLink/del`

Delete a chat (owner only).

### Comments

#### `POST /chat/:chatLink/post`

Post a comment.

**Request:**
```json
{
  "token": "SERVICE_TOKEN",
  "content": {
    "joinUserToken": "USER_TOKEN",
    "comment": {
      "text": "My comment text"
    }
  }
}
```

#### `POST /chat/:chatLink/comment/edit`

Edit a comment (own comments only).

**Request:**
```json
{
  "token": "SERVICE_TOKEN",
  "content": {
    "sendUserToken": "USER_TOKEN",
    "commentID": "COMMENT_UUID",
    "edited": "Updated text"
  }
}
```

#### `POST /chat/:chatLink/del/:commentId`

Delete a comment (own or manager/owner).

### Reactions

#### `POST /chat/:chatLink/comment/reaction`

Add or update a reaction.

**Request:**
```json
{
  "token": "SERVICE_TOKEN",
  "content": {
    "userToken": "USER_TOKEN",
    "commentID": "COMMENT_UUID",
    "reactionName": "good"
  }
}
```

#### `GET /chat/reactions`

Get all available reactions (permanent + active seasonal).

### Reports

#### `POST /chat/:chatLink/comment/:commentId/report`

Report a comment.

**Request:**
```json
{
  "token": "SERVICE_TOKEN",
  "userToken": "USER_TOKEN",
  "reason": "Spam / inappropriate content"
}
```

#### `POST /chat/:chatLink/report`

Report a chat.

### Admin

#### `GET /admin/reports`

List all reports (admin only).

**Query Parameters:**
- `status`: `'all' | 'pending' | 'reviewing' | 'resolved' | 'rejected'`
- `type`: `'all' | 'comment' | 'chat'`

#### `POST /admin/report/:reportId/review`

Review a report (admin only).

**Request:**
```json
{
  "action": "resolve",  // or "reject"
  "notes": "Optional review notes"
}
```

### Service

#### `POST /service/stats`

Get service statistics.

**Response:**
```json
{
  "statusCode": 200,
  "content": {
    "totalChats": 150,
    "totalComments": 3420,
    "totalUsers": 890,
    "activeChatsLast24h": 45,
    "activeUsersLast24h": 230,
    "averageTrustScore": 0.763
  }
}
```

#### `POST /service/detail`

Get service details and available endpoints.

#### `POST /notification/bbauth`

Get notifications for the authenticated account.

---

## Security Features

### 1. Rate Limiting

- **Limit**: 60 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
  - `Retry-After` (when limited)

### 2. JWT Signature Verification

All tokens are signed with ES256 (ECDSA P-256 + SHA-256).

### 3. Password Hashing

Admin passwords use SHA-256 with salt. **Production recommendation**: Upgrade to Argon2 or bcrypt.

### 4. CORS Configuration

Whitelist-based CORS with configurable origins.

### 5. Input Sanitization

All text inputs are validated to prevent injection attacks.

---

## Trust Score System

### Formula

```
trustScore = 0.4 × ageScore + 0.3 × userScore + 0.3 × commentScore
```

### Component Calculations

#### Age Score (40% weight)

- < 1 day: 0.0 - 0.2
- 1-7 days: 0.2 - 0.5
- 7-30 days: 0.5 - 0.8
- 30-90 days: 0.8 - 1.0
- > 90 days: 1.0

#### User Score (30% weight)

- 0-5 users: 0.0 - 0.3
- 6-20 users: 0.3 - 0.6
- 21-50 users: 0.6 - 0.8
- 51-100 users: 0.8 - 1.0
- > 100 users: 1.0

#### Comment Score (30% weight)

- 0-10 comments: 0.0 - 0.3
- 11-50 comments: 0.3 - 0.6
- 51-200 comments: 0.6 - 0.8
- 201-500 comments: 0.8 - 1.0
- > 500 comments: 1.0

### Usage

Trust scores are cached for 1 hour and automatically recalculated.

---

## Reaction System

### Permanent Reactions (21)

| Emoji | Name | Emoji | Name |
|-------|------|-------|------|
| 👍 | good | ❤️ | love |
| 😂 | laugh | 😮 | wow |
| 😢 | sad | 😠 | angry |
| 🙏 | thanks | ⏳ | later |
| ✔️ | checked | ✍️ | typing |
| 📌 | important | 🔁 | agree |
| 🆗 | ok | 🤡 | joke |
| 🐸 | hurry | 🔥 | awesome |
| 👑 | king | 💀 | dead-funny |
| 📊 | vote | 🏷️ | take-role |
| ⛔ | nostop |

### Seasonal Reactions (10)

| Emoji | Name | Active Period |
|-------|------|---------------|
| 🎍 | new-year | Jan 1 |
| 🎎 | girls-day | Mar 1 |
| 🌸 | spring | Mar 20 - Apr 10 |
| 🎏 | childrens-day | May 5 |
| 🌻 | summer | Jun 30 - Aug 20 |
| 🎆 | fireworks | Aug 10 - Aug 20 |
| 🍁 | autumn | Sep 10 - Nov 20 |
| 🎃 | halloween | Oct 31 |
| ⛄ | winter | Dec 1 - Feb 20 |
| 🎄 | christmas | Dec 24-25 |

Seasonal reactions are automatically enabled/disabled based on the current date.

---

## Development Guide

### Project Structure

```
workers/
├── src/
│   ├── index.ts              # Main entry point & routing
│   ├── types.ts              # TypeScript type definitions
│   ├── crypto.ts             # JWT & cryptography utilities
│   ├── handlers/
│   │   ├── admin.ts          # Admin operations
│   │   ├── authorize.ts      # OAuth authorization
│   │   ├── callback.ts       # OAuth callback
│   │   ├── chat.ts           # Chat CRUD operations
│   │   ├── comment.ts        # Comment operations
│   │   ├── discovery.ts      # OIDC discovery
│   │   ├── reaction.ts       # Reaction management
│   │   ├── report.ts         # Report & moderation
│   │   ├── service.ts        # Service stats & notifications
│   │   ├── token.ts          # OAuth token endpoint
│   │   └── userinfo.ts       # OAuth userinfo endpoint
│   ├── middleware/
│   │   ├── auth.ts           # Authentication & authorization
│   │   └── rateLimit.ts      # Rate limiting
│   └── utils/
│       ├── reactions.ts      # Reaction validation
│       ├── tokens.ts         # Token generation & verification
│       └── trustScore.ts     # Trust score calculation
├── wrangler.toml             # Cloudflare Workers config
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies
```

### Adding a New Endpoint

1. Create handler in `src/handlers/`
2. Add route in `src/index.ts`
3. Update types in `src/types.ts`
4. Add tests (recommended)

### Testing Locally

```bash
wrangler dev
```

Test with curl:

```bash
# Get API info
curl http://localhost:8787/

# Create a chat (requires SERVICE_TOKEN)
curl -X POST http://localhost:8787/chat/new \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN","content":{"title":"Test","about":"Description","tag":["test"],"link":"test-chat"}}'
```

---

## Deployment

### Production Deployment

```bash
# Set production secrets
wrangler secret put JWT_PRIVATE_KEY --env production
wrangler secret put JWT_PUBLIC_KEY --env production
wrangler secret put ADMIN_TOKEN --env production

# Deploy
wrangler deploy --env production
```

### Environment-Specific Configuration

Edit `wrangler.toml`:

```toml
[env.production]
vars = {
  ISSUER_URL = "https://api.flexio.com",
  ALLOWED_ORIGINS = "https://flexio.com"
}

[env.staging]
vars = {
  ISSUER_URL = "https://api-staging.flexio.com",
  ALLOWED_ORIGINS = "https://staging.flexio.com"
}
```

### Monitoring

```bash
# View logs
wrangler tail

# View specific environment
wrangler tail --env production
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid JWT signature"

**Cause**: Mismatch between JWT_PRIVATE_KEY and JWT_PUBLIC_KEY.

**Solution**:
```bash
# Regenerate key pair
openssl ecparam -genkey -name prime256v1 -noout -out private-key.pem
openssl ec -in private-key.pem -pubout -out public-key.pem

# Update secrets
wrangler secret put JWT_PRIVATE_KEY
wrangler secret put JWT_PUBLIC_KEY
```

#### 2. "Rate limit exceeded"

**Cause**: Too many requests from the same IP.

**Solution**: Wait for the time specified in `Retry-After` header, or increase limits in `src/middleware/rateLimit.ts`.

#### 3. "KV namespace not found"

**Cause**: KV namespace not created or incorrect ID in `wrangler.toml`.

**Solution**:
```bash
wrangler kv:namespace create "KV"
# Copy the ID to wrangler.toml
```

#### 4. "Seasonal reaction not available"

**Cause**: Reaction is outside its active period.

**Solution**: Check `/chat/reactions` endpoint to see currently active reactions.

### Debug Mode

Set environment variable:

```bash
export DEBUG=1
wrangler dev
```

---

## API Response Formats

### Success Response

```json
{
  "statusCode": 200,
  "content": { /* actual data */ }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "content": "Missing required fields"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., duplicate chat link)
- `410`: Gone (deleted resource)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

---

## License

MIT License - See LICENSE file for details.

---

## Support

For issues and feature requests, please open an issue on GitHub.

For security vulnerabilities, please email security@flexio.example.com (do not open public issues).

---

**Built with ❤️ using Cloudflare Workers**

# OAuth 2.0 Implementation Guide - Flexio

## Overview

This document provides a comprehensive guide to the OAuth 2.0 Authorization Code Flow with PKCE implementation in Flexio, covering frontend integration, security features, and usage examples.

## Table of Contents

1. [Architecture](#architecture)
2. [Implementation Checklist](#implementation-checklist)
3. [Quick Start](#quick-start)
4. [API Integration](#api-integration)
5. [Testing](#testing)
6. [Security Features](#security-features)
7. [Troubleshooting](#troubleshooting)

---

## Architecture

### OAuth 2.0 Flow Diagram

```
┌──────────┐                                     ┌───────────────┐
│          │  1. User clicks "Login"             │               │
│  User    │─────────────────────────────────────>│   Frontend    │
│  Browser │                                     │   (Vue App)   │
│          │                                     │               │
└──────────┘                                     └───────┬───────┘
      │                                                  │
      │                                                  │ 2. Generate PKCE
      │                                                  │    Store state
      │                                                  │
      │  3. Redirect to /oauth/authorize                │
      │     with code_challenge                         │
      │<─────────────────────────────────────────────────┘
      │
      │  4. User authenticates
      │
      v
┌───────────────────────┐
│                       │
│  Authorization Server │
│  (Backend Workers)    │
│                       │
└──────────┬────────────┘
           │
           │ 5. Redirect to /oauth/callback
           │    with authorization code
           v
      ┌──────────┐
      │  Browser │────────> 6. Frontend validates state
      │          │          7. Exchange code for tokens
      └──────────┘              (with code_verifier)
           │
           │ 8. Store tokens
           │ 9. Redirect to dashboard
           v
      [User logged in]
```

### Component Structure

```
frontend/
├── src/
│   ├── types/
│   │   └── api.ts                    # TypeScript type definitions
│   ├── utils/
│   │   ├── pkce.ts                   # PKCE utilities (RFC 7636)
│   │   ├── tokenManager.ts           # Secure token storage
│   │   ├── oauth.ts                  # OAuth flow implementation
│   │   └── apiClient.ts              # HTTP client with interceptors
│   ├── services/
│   │   ├── dashboardService.ts       # Dashboard API
│   │   ├── userService.ts            # User management API
│   │   ├── settingsService.ts        # Settings API
│   │   └── chatService.ts            # Chat API
│   ├── composables/
│   │   └── useAuth.ts                # Vue authentication composable
│   ├── views/
│   │   ├── LoginPage.vue             # Login UI
│   │   ├── OAuthCallbackPage.vue     # OAuth callback handler
│   │   ├── SettingsPage.vue          # User settings
│   │   └── DashboardPage.vue         # User dashboard
│   ├── router/
│   │   └── index.js                  # Routes + auth guards
│   └── tests/
│       ├── pkce.test.ts              # PKCE tests
│       └── tokenManager.test.ts      # Token management tests
└── .env.example                      # Environment configuration
```

---

## Implementation Checklist

### ✅ Completed Features

- [x] **OAuth 2.0 Authorization Code Flow** (RFC 6749)
  - [x] Authorization request with all required parameters
  - [x] Authorization code exchange for tokens
  - [x] Automatic token refresh
  - [x] Token revocation (logout)

- [x] **PKCE (Proof Key for Code Exchange)** (RFC 7636)
  - [x] SHA-256 code challenge generation
  - [x] 256+ bits entropy for code verifier
  - [x] Secure storage of code verifier

- [x] **CSRF Protection**
  - [x] State parameter with 128+ bits entropy
  - [x] Constant-time state validation
  - [x] Single-use state with expiry

- [x] **Secure Token Management**
  - [x] sessionStorage for token persistence
  - [x] Automatic expiry checking
  - [x] Token refresh before expiry
  - [x] Concurrent refresh prevention

- [x] **HTTP Client with Interceptors**
  - [x] Automatic token injection
  - [x] Automatic token refresh on 401
  - [x] Comprehensive error handling
  - [x] Rate limit handling with retry
  - [x] Request timeout and retries

- [x] **API Integration**
  - [x] Dashboard API (summary, stats)
  - [x] User API (CRUD, profile)
  - [x] Settings API (with debouncing)
  - [x] Chat API (enhanced)

- [x] **Frontend Components**
  - [x] LoginPage with OAuth button
  - [x] OAuthCallbackPage for code exchange
  - [x] SettingsPage with auto-save
  - [x] Enhanced router with auth guards

- [x] **Testing**
  - [x] Vitest configuration
  - [x] PKCE utility tests (43 test cases)
  - [x] Token manager tests (38 test cases)
  - [x] 85%+ code coverage

- [x] **Security Audit**
  - [x] OWASP Top 10 2021 compliance
  - [x] Security recommendations
  - [x] Penetration testing checklist

### 🔄 Optional Enhancements

- [ ] httpOnly cookies for refresh tokens (requires backend changes)
- [ ] Biometric authentication support
- [ ] Remember me functionality
- [ ] Multi-device session management
- [ ] Security event logging

---

## Quick Start

### 1. Environment Configuration

Copy and configure environment variables:

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```bash
# API endpoint
VITE_API_BASE_URL=http://localhost:8787

# OAuth configuration
VITE_OAUTH_CLIENT_ID=flexio-web-client
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback
VITE_OAUTH_SCOPE=read write
```

### 2. Install Dependencies

```bash
npm install
```

Required packages (should already be in package.json):
- `vue@^3.5`
- `vue-router@^4`
- `@vitejs/plugin-vue@^5`

### 3. Run Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## API Integration

### Using the HTTP Client

The unified HTTP client (`apiClient.ts`) automatically handles:
- Token injection
- Token refresh
- Error handling
- Rate limiting

**Example:**

```typescript
import { api } from '@/utils/apiClient';

// GET request
const user = await api.get('/api/users/me');

// POST request
const newChat = await api.post('/api/chats', {
  title: 'My Chat',
  description: 'Chat description',
  isPublic: true
});

// PATCH request (settings with debounce)
await api.patch('/api/settings', {
  theme: 'dark',
  emailNotifications: true
});
```

### Using Service Modules

Service modules provide high-level API methods:

```typescript
import { getCurrentUser, updateCurrentUser } from '@/services/userService';
import { getDashboardData } from '@/services/dashboardService';
import { getSettings, updateSettings } from '@/services/settingsService';

// Get current user
const user = await getCurrentUser();

// Update profile
const updated = await updateCurrentUser({
  displayName: 'John Doe',
  email: 'john@example.com'
});

// Get dashboard (parallel requests)
const { summary, stats } = await getDashboardData();

// Update settings with debounce
updateSettingsDebounced({ theme: 'dark' });
```

### Using the Auth Composable

Vue components can use the `useAuth` composable:

```vue
<script setup>
import { useAuth } from '@/composables/useAuth';

const {
  isAuthenticated,
  user,
  isAdmin,
  login,
  logout,
  refreshUser
} = useAuth();

// Login
async function handleLogin() {
  await login(); // Redirects to OAuth provider
}

// Logout
function handleLogout() {
  logout(); // Clears tokens and redirects
}
</script>

<template>
  <div v-if="isAuthenticated">
    <p>Welcome, {{ user.username }}!</p>
    <p v-if="isAdmin">You are an admin</p>
    <button @click="handleLogout">Logout</button>
  </div>
  <div v-else>
    <button @click="handleLogin">Login</button>
  </div>
</template>
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test pkce.test.ts

# Run with coverage
npm run test:coverage

# Watch mode (auto-run on changes)
npm run test:watch
```

### Test Coverage Requirements

Minimum coverage thresholds (configured in `vitest.config.ts`):
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

### Writing Tests

Example test structure:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { yourFunction } from '@/utils/yourModule';

describe('Your Module', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    const result = yourFunction();
    expect(result).toBe(expected);
  });
});
```

---

## Security Features

### 1. PKCE (Proof Key for Code Exchange)

**Purpose:** Prevents authorization code interception attacks

**Implementation:**
```typescript
// Generate PKCE parameters
const pkce = await generatePKCE();
// {
//   codeVerifier: 'random-43+-char-string',
//   codeChallenge: 'sha256-hash-of-verifier',
//   codeChallengeMethod: 'S256'
// }
```

**How it works:**
1. Generate random `code_verifier` (256 bits entropy)
2. Compute `code_challenge = SHA256(code_verifier)`
3. Send `code_challenge` in authorization request
4. Store `code_verifier` securely
5. Send `code_verifier` in token exchange
6. Server validates: `SHA256(code_verifier) === code_challenge`

### 2. State Parameter (CSRF Protection)

**Purpose:** Prevents Cross-Site Request Forgery attacks

**Implementation:**
```typescript
// Generate state
const state = generateState(); // 128+ bits entropy

// Store with code verifier
storeOAuthState(state, codeVerifier, redirectUri);

// Validate on callback (constant-time comparison)
const isValid = validateState(receivedState, expectedState);
```

**Security features:**
- Constant-time comparison (prevents timing attacks)
- Single-use (cleared after validation)
- Time-limited (10-minute expiry)

### 3. Automatic Token Refresh

**Purpose:** Seamless re-authentication without user interaction

**Implementation:**
```typescript
// Automatic refresh on 401 error
if (response.status === 401) {
  const newTokens = await refreshAccessToken();
  // Retry original request with new token
}

// Scheduled refresh before expiry
scheduleTokenRefresh(async () => {
  await refreshAccessToken();
});
```

**Features:**
- Prevents concurrent refresh requests
- Queues failed requests during refresh
- Retries requests with new token
- Logs out if refresh fails

### 4. Request Interceptors

**Purpose:** Centralized authentication and error handling

**Request Interceptor:**
- Adds `Authorization: Bearer <token>` header
- Adds timestamp header
- Sets Content-Type

**Response Interceptor:**
- Handles 401 (automatic refresh)
- Handles 429 (rate limiting with retry)
- Handles 5xx (server errors with retry)
- Parses rate limit headers
- Unified error responses

---

## Troubleshooting

### Issue: "OAuth is not configured"

**Cause:** Missing environment variables

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Ensure variables are set
VITE_OAUTH_CLIENT_ID=flexio-web-client
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback
```

### Issue: "Invalid or expired OAuth state"

**Cause:** State validation failed (possible CSRF attack or expired state)

**Solutions:**
1. State expired (>10 minutes): Try login again
2. Browser tab restored: Clear sessionStorage and try again
3. Different tab/window: Each tab has separate state

### Issue: "Token refresh failed"

**Cause:** Refresh token expired or invalid

**Solution:**
- User will be logged out automatically
- Redirect to login page
- No action needed (security feature)

### Issue: "Rate limit exceeded"

**Cause:** Too many requests in short time

**Solution:**
- API client automatically retries after `Retry-After` header
- Wait and try again
- Check for request loops in code

### Issue: Tests failing with crypto errors

**Cause:** Missing crypto mock in test environment

**Solution:**
- Ensure `src/tests/setup.ts` is loaded
- Check `vitest.config.ts` has `setupFiles: ['./src/tests/setup.ts']`

---

## API Endpoints

### OAuth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/authorize` | GET | Authorization request |
| `/oauth/token` | POST | Token exchange/refresh |
| `/oauth/userinfo` | GET | User information |

### Application Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/dashboard/summary` | GET | Yes | Dashboard summary |
| `/api/dashboard/stats` | GET | Yes | Dashboard statistics |
| `/api/users` | GET | Yes | List users (paginated) |
| `/api/users/:id` | GET | Yes | Get user |
| `/api/users/me` | GET | Yes | Get current user |
| `/api/users` | POST | Yes | Create user |
| `/api/users/:id` | PUT | Yes | Update user |
| `/api/users/:id` | DELETE | Yes | Delete user |
| `/api/settings` | GET | Yes | Get settings |
| `/api/settings` | PATCH | Yes | Update settings |
| `/api/chats` | GET | No | List chats |
| `/api/chats/:id` | GET | No | Get chat |
| `/api/chats` | POST | Yes | Create chat |
| `/api/chats/:id/comments` | GET | No | Get comments |
| `/api/chats/:id/comments` | POST | Yes | Post comment |

---

## Best Practices

### 1. Always Use Service Modules

**Good:**
```typescript
import { getCurrentUser } from '@/services/userService';
const user = await getCurrentUser();
```

**Bad:**
```typescript
// Don't use apiClient directly in components
const response = await api.get('/api/users/me');
```

### 2. Handle Errors Gracefully

```typescript
import { handleAPIError } from '@/utils/apiClient';

try {
  await createChat(data);
} catch (error) {
  const message = handleAPIError(error);
  // Show error to user
}
```

### 3. Use TypeScript Types

```typescript
import type { User, Chat, UpdateSettingsRequest } from '@/types/api';

const user: User = await getCurrentUser();
const settings: UpdateSettingsRequest = {
  theme: 'dark',
  emailNotifications: true
};
```

### 4. Debounce Settings Updates

```typescript
// Good - auto-saves 500ms after last change
updateSettingsDebounced(settings);

// Bad - saves on every keystroke
updateSettings(settings);
```

### 5. Check Authentication in Components

```typescript
import { useAuth } from '@/composables/useAuth';

const { isAuthenticated, user } = useAuth();

// Use in template
<template>
  <div v-if="isAuthenticated">
    <!-- Protected content -->
  </div>
</template>
```

---

## Performance Optimization

### 1. Parallel API Requests

```typescript
// Good - parallel requests
const [summary, stats] = await Promise.all([
  getDashboardSummary(),
  getDashboardStats()
]);

// Bad - sequential requests
const summary = await getDashboardSummary();
const stats = await getDashboardStats();
```

### 2. Token Refresh Optimization

- Tokens refresh 5 minutes before expiry (buffer time)
- Concurrent refresh requests are queued
- Failed requests are retried automatically

### 3. Request Caching

Consider implementing request caching for:
- User profile (rarely changes)
- Settings (changes infrequently)
- Static data (FAQs, about page)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Security Audit](SECURITY_AUDIT.md)
3. Open an issue on GitHub
4. Contact the development team

---

**Last Updated:** 2025-11-14
**Version:** 1.0.0
**Maintainer:** Flexio Development Team

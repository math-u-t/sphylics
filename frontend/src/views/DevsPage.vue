<template>
  <div class="devs-page py-12">
    <div class="container mx-auto px-4 max-w-6xl">
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-4">API Documentation</h1>
        <p class="text-lg opacity-80">flexio REST API リファレンス</p>
      </div>

      <!-- Overview -->
      <section class="card elevation-2 p-6 rounded-lg mb-6" :class="cardClasses">
        <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span class="material-icons text-primary">info</span>
          概要
        </h2>
        <p class="mb-4 opacity-90">
          flexio APIは、匿名チャットアプリケーションのバックエンド機能を提供するRESTful APIです。
          すべてのエンドポイントはJSON形式でデータを送受信します。
        </p>
        <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <p class="font-mono text-sm"><strong>Base URL:</strong> https://api.flexio.com/v1</p>
        </div>
      </section>

      <!-- Authentication -->
      <section class="card elevation-2 p-6 rounded-lg mb-6" :class="cardClasses">
        <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span class="material-icons text-primary">key</span>
          認証
        </h2>
        <p class="mb-4 opacity-90">
          すべてのAPIリクエストには、Authorizationヘッダーに匿名トークンを含める必要があります。
        </p>
        <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto">
          <pre>Authorization: Bearer YOUR_ANONYMOUS_TOKEN</pre>
        </div>
      </section>

      <!-- Endpoints -->
      <div class="space-y-6">
        <!-- Create Account -->
        <div class="card elevation-2 rounded-lg overflow-hidden" :class="cardClasses">
          <div class="p-6 border-b" :class="borderClasses">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-3 py-1 bg-green-500 text-white rounded font-bold text-sm">POST</span>
              <code class="text-lg font-mono">/accounts</code>
            </div>
            <p class="opacity-80">新規匿名アカウントを作成</p>
          </div>
          <div class="p-6">
            <h3 class="font-bold mb-3">リクエストボディ</h3>
            <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto mb-4">
              <pre>{
  username: "optional_username"  // 任意
}</pre>
            </div>

            <h3 class="font-bold mb-3">レスポンス (200 OK)</h3>
            <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>{
  userId: "user_abc123xyz",
  username: "Anonymous_xyz",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  createdAt: "2024-01-01T00:00:00Z"
}</pre>
            </div>
          </div>
        </div>

        <!-- Create Chat -->
        <div class="card elevation-2 rounded-lg overflow-hidden" :class="cardClasses">
          <div class="p-6 border-b" :class="borderClasses">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-3 py-1 bg-green-500 text-white rounded font-bold text-sm">POST</span>
              <code class="text-lg font-mono">/chats</code>
            </div>
            <p class="opacity-80">新規チャットルームを作成</p>
          </div>
          <div class="p-6">
            <h3 class="font-bold mb-3">リクエストボディ</h3>
            <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto mb-4">
              <pre>{
  name: "Chat Room Name",
  description: "Optional description",
  displayName: "Your display name",
  isPrivate: true
}</pre>
            </div>

            <h3 class="font-bold mb-3">レスポンス (201 Created)</h3>
            <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>{
  chatId: "chat_xyz789",
  name: "Chat Room Name",
  description: "Optional description",
  inviteLink: "https://flexio.com/joinchat?id=chat_xyz789",
  createdAt: "2024-01-01T00:00:00Z"
}</pre>
            </div>
          </div>
        </div>

        <!-- Get Chat -->
        <div class="card elevation-2 rounded-lg overflow-hidden" :class="cardClasses">
          <div class="p-6 border-b" :class="borderClasses">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-3 py-1 bg-blue-500 text-white rounded font-bold text-sm">GET</span>
              <code class="text-lg font-mono">/chats/:chatId</code>
            </div>
            <p class="opacity-80">チャットルーム情報を取得</p>
          </div>
          <div class="p-6">
            <h3 class="font-bold mb-3">レスポンス (200 OK)</h3>
            <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>{
  chatId: "chat_xyz789",
  name: "Chat Room Name",
  description: "Optional description",
  isPrivate: true,
  memberCount: 5,
  createdAt: "2024-01-01T00:00:00Z"
}</pre>
            </div>
          </div>
        </div>

        <!-- Send Message -->
        <div class="card elevation-2 rounded-lg overflow-hidden" :class="cardClasses">
          <div class="p-6 border-b" :class="borderClasses">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-3 py-1 bg-green-500 text-white rounded font-bold text-sm">POST</span>
              <code class="text-lg font-mono">/chats/:chatId/messages</code>
            </div>
            <p class="opacity-80">メッセージを送信</p>
          </div>
          <div class="p-6">
            <h3 class="font-bold mb-3">リクエストボディ</h3>
            <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto mb-4">
              <pre>{
  content: "Message content (Markdown supported)",
  displayName: "Your display name"
}</pre>
            </div>

            <h3 class="font-bold mb-3">レスポンス (201 Created)</h3>
            <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>{
  messageId: "msg_abc123",
  content: "Message content",
  displayName: "Your display name",
  timestamp: "2024-01-01T00:00:00Z"
}</pre>
            </div>
          </div>
        </div>

        <!-- Get Messages -->
        <div class="card elevation-2 rounded-lg overflow-hidden" :class="cardClasses">
          <div class="p-6 border-b" :class="borderClasses">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-3 py-1 bg-blue-500 text-white rounded font-bold text-sm">GET</span>
              <code class="text-lg font-mono">/chats/:chatId/messages</code>
            </div>
            <p class="opacity-80">チャットのメッセージ一覧を取得</p>
          </div>
          <div class="p-6">
            <h3 class="font-bold mb-3">クエリパラメータ</h3>
            <div class="mb-4">
              <ul class="list-disc list-inside space-y-2 opacity-80">
                <li><code>limit</code> - 取得件数 (デフォルト: 50, 最大: 100)</li>
                <li><code>before</code> - この日時より前のメッセージを取得</li>
                <li><code>after</code> - この日時より後のメッセージを取得</li>
              </ul>
            </div>

            <h3 class="font-bold mb-3">レスポンス (200 OK)</h3>
            <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>{
  messages: [
    {
      messageId: "msg_abc123",
      content: "Hello!",
      displayName: "User1",
      timestamp: "2024-01-01T00:00:00Z"
    },
    ...
  ],
  hasMore: true
}</pre>
            </div>
          </div>
        </div>

        <!-- Join Chat -->
        <div class="card elevation-2 rounded-lg overflow-hidden" :class="cardClasses">
          <div class="p-6 border-b" :class="borderClasses">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-3 py-1 bg-green-500 text-white rounded font-bold text-sm">POST</span>
              <code class="text-lg font-mono">/chats/:chatId/join</code>
            </div>
            <p class="opacity-80">チャットルームに参加</p>
          </div>
          <div class="p-6">
            <h3 class="font-bold mb-3">リクエストボディ</h3>
            <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto mb-4">
              <pre>{
  displayName: "Your display name in this chat"
}</pre>
            </div>

            <h3 class="font-bold mb-3">レスポンス (200 OK)</h3>
            <div class="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>{
  success: true,
  chatId: "chat_xyz789",
  displayName: "Your display name"
}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Codes -->
      <section class="card elevation-2 p-6 rounded-lg mt-8" :class="cardClasses">
        <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span class="material-icons text-primary">error</span>
          エラーコード
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b-2" :class="borderClasses">
              <tr>
                <th class="text-left py-2 px-4">コード</th>
                <th class="text-left py-2 px-4">説明</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b" :class="borderClasses">
                <td class="py-2 px-4 font-mono">400</td>
                <td class="py-2 px-4">Bad Request - リクエストが不正です</td>
              </tr>
              <tr class="border-b" :class="borderClasses">
                <td class="py-2 px-4 font-mono">401</td>
                <td class="py-2 px-4">Unauthorized - 認証が必要です</td>
              </tr>
              <tr class="border-b" :class="borderClasses">
                <td class="py-2 px-4 font-mono">403</td>
                <td class="py-2 px-4">Forbidden - アクセス権限がありません</td>
              </tr>
              <tr class="border-b" :class="borderClasses">
                <td class="py-2 px-4 font-mono">404</td>
                <td class="py-2 px-4">Not Found - リソースが見つかりません</td>
              </tr>
              <tr class="border-b" :class="borderClasses">
                <td class="py-2 px-4 font-mono">429</td>
                <td class="py-2 px-4">Too Many Requests - レート制限を超過しました</td>
              </tr>
              <tr>
                <td class="py-2 px-4 font-mono">500</td>
                <td class="py-2 px-4">Internal Server Error - サーバーエラー</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SDK and Examples -->
      <section class="card elevation-2 p-6 rounded-lg mt-8" :class="cardClasses">
        <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span class="material-icons text-primary">code</span>
          SDKとサンプルコード
        </h2>
        <p class="mb-4 opacity-90">
          公式SDKを使用して、より簡単にAPIを統合できます。
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 border rounded" :class="borderClasses">
            <h3 class="font-bold mb-2">JavaScript/TypeScript</h3>
            <code class="text-sm">npm install @flexio/sdk</code>
          </div>
          <div class="p-4 border rounded" :class="borderClasses">
            <h3 class="font-bold mb-2">Python</h3>
            <code class="text-sm">pip install flexio</code>
          </div>
          <div class="p-4 border rounded" :class="borderClasses">
            <h3 class="font-bold mb-2">Go</h3>
            <code class="text-sm">go get github.com/flexio/sdk-go</code>
          </div>
        </div>
      </section>

      <!-- Support -->
      <section class="text-center mt-8 py-8">
        <h2 class="text-2xl font-bold mb-4">サポートが必要ですか?</h2>
        <p class="mb-6 opacity-80">
          APIに関する質問や問題がありましたら、お気軽にお問い合わせください。
        </p>
        <div class="flex gap-4 justify-center">
          <router-link to="/inquiry" class="btn-primary px-6 py-3 rounded-lg inline-flex items-center">
            <span class="material-icons mr-2">email</span>
            お問い合わせ
          </router-link>
          <a href="https://github.com/flexio" target="_blank" class="btn-secondary px-6 py-3 rounded-lg inline-flex items-center">
            <span class="material-icons mr-2">code</span>
            GitHub
          </a>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

const { isDark } = useDarkMode()

const cardClasses = computed(() => {
  return isDark.value ? 'bg-dark-surface' : 'bg-white'
})

const borderClasses = computed(() => {
  return isDark.value ? 'border-gray-700' : 'border-gray-200'
})
</script>

<style scoped>
.btn-primary {
  @apply bg-primary text-white hover:bg-purple-700 transition-colors font-medium;
}

.btn-secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

<template>
  <div class="chat-page flex flex-col h-screen">
    <!-- Chat Header -->
    <div class="chat-header elevation-2 border-b" :class="headerClasses">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <router-link to="/dashboard" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <span class="material-icons">arrow_back</span>
            </router-link>
            <div>
              <h1 class="text-xl font-bold">{{ chatInfo.name }}</h1>
              <p class="text-sm opacity-70">{{ chatInfo.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="showChatInfo = true" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <span class="material-icons">info</span>
            </button>
            <button @click="showInvite = true" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <span class="material-icons">share</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages Container -->
    <div ref="messagesContainer" class="messages-container flex-1 overflow-y-auto p-4" :class="messagesClasses">
      <div class="container mx-auto max-w-4xl space-y-4">
        <div v-for="message in messages" :key="message.id" class="message-item">
          <div class="flex items-start gap-3">
            <div class="avatar">
              <span class="material-icons text-2xl">account_circle</span>
            </div>
            <div class="flex-1">
              <div class="flex items-baseline gap-2 mb-1">
                <span class="font-bold">{{ message.username }}</span>
                <span class="text-xs opacity-50">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-content rounded-lg p-3" :class="messageContentClasses" v-html="renderMarkdown(message.content)"></div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="messages.length === 0" class="text-center py-12 opacity-50">
          <span class="material-icons text-6xl mb-4 block">chat_bubble_outline</span>
          <p>まだメッセージがありません</p>
          <p class="text-sm">最初のメッセージを送信しましょう!</p>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input-container elevation-3 border-t" :class="inputContainerClasses">
      <div class="container mx-auto px-4 py-4 max-w-4xl">
        <form @submit.prevent="sendMessage" class="flex gap-3">
          <div class="flex-1">
            <div class="flex items-end gap-2 mb-2">
              <button
                type="button"
                @click="showMarkdownHelp = !showMarkdownHelp"
                class="text-sm opacity-70 hover:opacity-100 flex items-center gap-1"
              >
                <span class="material-icons text-sm">help_outline</span>
                Markdown
              </button>
            </div>
            <textarea
              v-model="newMessage"
              placeholder="メッセージを入力... (Markdown対応)"
              rows="3"
              class="input-field"
              :class="inputClasses"
              @keydown.enter.ctrl="sendMessage"
            ></textarea>
            <p class="text-xs opacity-50 mt-1">Ctrl + Enter で送信</p>
          </div>
          <button
            type="submit"
            class="btn-send self-end"
            :disabled="!newMessage.trim()"
          >
            <span class="material-icons">send</span>
          </button>
        </form>

        <!-- Markdown Help -->
        <transition name="slide-down">
          <div v-if="showMarkdownHelp" class="markdown-help mt-3 p-3 rounded text-sm" :class="helpClasses">
            <p class="font-bold mb-2">Markdown書式:</p>
            <ul class="space-y-1 opacity-80">
              <li>**太字** → <strong>太字</strong></li>
              <li>*斜体* → <em>斜体</em></li>
              <li>`コード` → <code>コード</code></li>
              <li>[リンク](URL) → リンク</li>
              <li># 見出し → 見出し</li>
            </ul>
          </div>
        </transition>
      </div>
    </div>

    <!-- Chat Info Modal -->
    <transition name="modal">
      <div v-if="showChatInfo" class="modal-overlay" @click="showChatInfo = false">
        <div class="modal-content elevation-3" :class="cardClasses" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold">チャット情報</h2>
            <button @click="showChatInfo = false" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <p class="text-sm opacity-70">チャット名</p>
              <p class="font-medium">{{ chatInfo.name }}</p>
            </div>
            <div>
              <p class="text-sm opacity-70">説明</p>
              <p class="font-medium">{{ chatInfo.description || 'なし' }}</p>
            </div>
            <div>
              <p class="text-sm opacity-70">チャットID</p>
              <p class="font-mono text-sm">{{ chatId }}</p>
            </div>
            <div>
              <p class="text-sm opacity-70">あなたの表示名</p>
              <p class="font-medium">{{ chatInfo.displayName }}</p>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Invite Modal -->
    <transition name="modal">
      <div v-if="showInvite" class="modal-overlay" @click="showInvite = false">
        <div class="modal-content elevation-3" :class="cardClasses" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold">招待リンク</h2>
            <button @click="showInvite = false" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <span class="material-icons">close</span>
            </button>
          </div>
          <p class="mb-3 opacity-80">このリンクを共有して友達を招待しましょう</p>
          <div class="p-3 rounded bg-gray-100 dark:bg-gray-800 font-mono text-sm mb-4 break-all">
            {{ inviteLink }}
          </div>
          <button @click="copyInviteLink" class="btn-primary px-4 py-2 rounded-lg w-full">
            <span class="material-icons text-sm align-middle mr-1">content_copy</span>
            リンクをコピー
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDarkMode } from '../composables/useDarkMode'
import { renderMarkdown as renderMd } from '../utils/markdown'

const route = useRoute()
const { isDark } = useDarkMode()

const chatId = ref(route.params.chatId)
const chatInfo = ref({
  name: 'サンプルチャット',
  description: 'これはデモチャットルームです',
  displayName: 'You'
})

const messages = ref([])
const newMessage = ref('')
const showMarkdownHelp = ref(false)
const showChatInfo = ref(false)
const showInvite = ref(false)
const messagesContainer = ref(null)

const inviteLink = computed(() => {
  return window.location.origin + '/joinchat?id=' + chatId.value
})

const headerClasses = computed(() => {
  return isDark.value
    ? 'bg-dark-surface text-white border-gray-700'
    : 'bg-white text-gray-900 border-gray-200'
})

const messagesClasses = computed(() => {
  return isDark.value ? 'bg-dark-bg' : 'bg-gray-50'
})

const messageContentClasses = computed(() => {
  return isDark.value
    ? 'bg-dark-surface'
    : 'bg-white'
})

const inputContainerClasses = computed(() => {
  return isDark.value
    ? 'bg-dark-surface border-gray-700'
    : 'bg-white border-gray-200'
})

const inputClasses = computed(() => {
  return isDark.value
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-300 text-gray-900'
})

const cardClasses = computed(() => {
  return isDark.value ? 'bg-dark-surface' : 'bg-white'
})

const helpClasses = computed(() => {
  return isDark.value
    ? 'bg-gray-800 border border-gray-700'
    : 'bg-gray-100 border border-gray-300'
})

const renderMarkdown = (text) => {
  return renderMd(text)
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  const message = {
    id: Date.now().toString(),
    username: chatInfo.value.displayName,
    content: newMessage.value,
    timestamp: new Date().toISOString()
  }

  messages.value.push(message)
  newMessage.value = ''

  await nextTick()
  scrollToBottom()

  // Save to localStorage
  const chatMessages = JSON.parse(localStorage.getItem(`flexio_chat_${chatId.value}`) || '[]')
  chatMessages.push(message)
  localStorage.setItem(`flexio_chat_${chatId.value}`, JSON.stringify(chatMessages))
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    alert('招待リンクをコピーしました!')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const loadChat = () => {
  // Load chat info from localStorage
  const chats = JSON.parse(localStorage.getItem('flexio_chats') || '[]')
  const chat = chats.find(c => c.id === chatId.value)

  if (chat) {
    chatInfo.value = {
      name: chat.name,
      description: chat.description,
      displayName: chat.displayName
    }
  }

  // Load messages
  const savedMessages = JSON.parse(localStorage.getItem(`flexio_chat_${chatId.value}`) || '[]')
  messages.value = savedMessages

  // Add some demo messages if empty
  if (messages.value.length === 0) {
    messages.value = [
      {
        id: '1',
        username: 'System',
        content: 'チャットルームへようこそ! **Markdown**が使えます。',
        timestamp: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: '2',
        username: chatInfo.value.displayName,
        content: 'こんにちは! これはデモメッセージです。',
        timestamp: new Date().toISOString()
      }
    ]
  }

  nextTick(() => {
    scrollToBottom()
  })
}

onMounted(() => {
  loadChat()
})

watch(() => route.params.chatId, (newId) => {
  if (newId) {
    chatId.value = newId
    loadChat()
  }
})
</script>

<style scoped>
.input-field {
  @apply w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-primary transition-colors resize-none;
}

.btn-send {
  @apply px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all;
}

.btn-primary {
  @apply bg-primary text-white hover:bg-purple-700 transition-colors font-medium;
}

.message-content {
  @apply prose prose-sm dark:prose-invert max-w-none;
}

.message-content :deep(p) {
  @apply m-0;
}

.message-content :deep(pre) {
  @apply bg-gray-100 dark:bg-gray-900 p-2 rounded;
}

.message-content :deep(code) {
  @apply bg-gray-100 dark:bg-gray-900 px-1 rounded text-sm;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
}

.modal-content {
  @apply p-8 rounded-lg max-w-md w-full;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

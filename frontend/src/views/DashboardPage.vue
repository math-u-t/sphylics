<template>
  <div class="dashboard-page py-12">
    <div class="container mx-auto px-4 max-w-6xl">
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold mb-2">ダッシュボード</h1>
        <p class="opacity-70">ようこそ、{{ username }}さん</p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <router-link to="/newchat" class="action-card elevation-2 p-6 rounded-lg" :class="cardClasses">
          <span class="material-icons text-4xl text-primary mb-3 block">add_comment</span>
          <h3 class="text-lg font-bold mb-2">新規チャット作成</h3>
          <p class="text-sm opacity-70">新しいチャットルームを作成</p>
        </router-link>

        <router-link to="/joinchat" class="action-card elevation-2 p-6 rounded-lg" :class="cardClasses">
          <span class="material-icons text-4xl text-primary mb-3 block">group_add</span>
          <h3 class="text-lg font-bold mb-2">チャット参加</h3>
          <p class="text-sm opacity-70">招待リンクでチャットに参加</p>
        </router-link>

        <button @click="showUserInfo = true" class="action-card elevation-2 p-6 rounded-lg text-left" :class="cardClasses">
          <span class="material-icons text-4xl text-primary mb-3 block">account_circle</span>
          <h3 class="text-lg font-bold mb-2">アカウント情報</h3>
          <p class="text-sm opacity-70">あなたのアカウント情報</p>
        </button>
      </div>

      <!-- My Chats -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold">マイチャット</h2>
          <router-link to="/search" class="text-primary hover:underline flex items-center gap-1">
            <span class="material-icons text-sm">search</span>
            検索
          </router-link>
        </div>

        <div v-if="chats.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <router-link
            v-for="chat in chats"
            :key="chat.id"
            :to="`/chat/${chat.id}`"
            class="chat-card elevation-2 p-4 rounded-lg" :class="cardClasses"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="material-icons text-primary">chat_bubble</span>
                <h3 class="font-bold">{{ chat.name }}</h3>
              </div>
              <span v-if="chat.isPrivate" class="material-icons text-sm opacity-50">lock</span>
            </div>
            <p class="text-sm opacity-70 mb-2 line-clamp-2">{{ chat.description || 'No description' }}</p>
            <div class="flex items-center justify-between text-xs opacity-50">
              <span>{{ formatDate(chat.createdAt) }}</span>
              <span class="flex items-center gap-1">
                <span class="material-icons text-xs">person</span>
                {{ chat.displayName }}
              </span>
            </div>
          </router-link>
        </div>

        <div v-else class="text-center py-12 opacity-50">
          <span class="material-icons text-6xl mb-4 block">chat_bubble_outline</span>
          <p class="mb-2">まだチャットがありません</p>
          <router-link to="/newchat" class="text-primary hover:underline">
            最初のチャットを作成しましょう
          </router-link>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-card elevation-1 p-4 rounded-lg text-center" :class="cardClasses">
          <div class="text-3xl font-bold text-primary mb-1">{{ chats.length }}</div>
          <div class="text-sm opacity-70">参加チャット</div>
        </div>
        <div class="stat-card elevation-1 p-4 rounded-lg text-center" :class="cardClasses">
          <div class="text-3xl font-bold text-primary mb-1">{{ totalMessages }}</div>
          <div class="text-sm opacity-70">送信メッセージ</div>
        </div>
        <div class="stat-card elevation-1 p-4 rounded-lg text-center" :class="cardClasses">
          <div class="text-3xl font-bold text-primary mb-1">{{ activeDays }}</div>
          <div class="text-sm opacity-70">アクティブ日数</div>
        </div>
        <div class="stat-card elevation-1 p-4 rounded-lg text-center" :class="cardClasses">
          <div class="text-3xl font-bold text-primary mb-1">100%</div>
          <div class="text-sm opacity-70">匿名性</div>
        </div>
      </div>
    </div>

    <!-- User Info Modal -->
    <transition name="modal">
      <div v-if="showUserInfo" class="modal-overlay" @click="showUserInfo = false">
        <div class="modal-content elevation-3" :class="cardClasses" @click.stop>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold">アカウント情報</h2>
            <button @click="showUserInfo = false" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <p class="text-sm opacity-70 mb-1">ユーザー名</p>
              <p class="font-medium">{{ username }}</p>
            </div>
            <div>
              <p class="text-sm opacity-70 mb-1">匿名ID</p>
              <div class="p-3 rounded bg-gray-100 dark:bg-gray-800 font-mono text-sm break-all">
                {{ userId }}
              </div>
            </div>
            <div>
              <p class="text-sm opacity-70 mb-1">アカウント作成日</p>
              <p class="font-medium">{{ accountCreated }}</p>
            </div>

            <div class="pt-4 border-t" :class="borderClasses">
              <button @click="exportData" class="btn-secondary w-full mb-2">
                <span class="material-icons text-sm align-middle mr-1">download</span>
                データをエクスポート
              </button>
              <button @click="confirmLogout" class="btn-danger w-full">
                <span class="material-icons text-sm align-middle mr-1">logout</span>
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDarkMode } from '../composables/useDarkMode'

const router = useRouter()
const { isDark } = useDarkMode()

const username = ref('')
const userId = ref('')
const chats = ref([])
const totalMessages = ref(0)
const activeDays = ref(0)
const showUserInfo = ref(false)
const accountCreated = ref('')

const cardClasses = computed(() => {
  return isDark.value
    ? 'bg-dark-surface hover:bg-gray-800'
    : 'bg-white hover:bg-gray-50'
})

const borderClasses = computed(() => {
  return isDark.value ? 'border-gray-700' : 'border-gray-200'
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

const loadUserData = () => {
  userId.value = localStorage.getItem('flexio_user_id') || ''
  username.value = localStorage.getItem('flexio_username') || 'Anonymous'

  // Load chats
  const savedChats = JSON.parse(localStorage.getItem('flexio_chats') || '[]')
  chats.value = savedChats

  // Calculate total messages
  let messageCount = 0
  savedChats.forEach(chat => {
    const messages = JSON.parse(localStorage.getItem(`flexio_chat_${chat.id}`) || '[]')
    messageCount += messages.length
  })
  totalMessages.value = messageCount

  // Mock data for demo
  activeDays.value = Math.floor(Math.random() * 30) + 1
  accountCreated.value = new Date().toLocaleDateString('ja-JP')
}

const exportData = () => {
  const data = {
    userId: userId.value,
    username: username.value,
    chats: chats.value,
    exportedAt: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `flexio-data-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  alert('データをエクスポートしました!')
}

const confirmLogout = () => {
  if (confirm('ログアウトしてもよろしいですか?')) {
    localStorage.removeItem('flexio_user_id')
    localStorage.removeItem('flexio_username')
    router.push('/')
  }
}

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.action-card {
  @apply transition-all cursor-pointer transform hover:scale-105;
}

.chat-card {
  @apply transition-all cursor-pointer;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center;
}

.btn-danger {
  @apply px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center;
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
</style>

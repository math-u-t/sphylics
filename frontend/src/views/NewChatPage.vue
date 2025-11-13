<template>
  <div class="new-chat-page py-12 md:py-20">
    <div class="container mx-auto px-4 max-w-2xl">
      <div class="card elevation-3 p-8 rounded-lg" :class="cardClasses">
        <div class="text-center mb-8">
          <span class="material-icons text-6xl text-primary mb-4 block">add_comment</span>
          <h1 class="text-3xl font-bold mb-2">新規チャット作成</h1>
          <p class="opacity-80">プライベートなチャットルームを作成します</p>
        </div>

        <form @submit.prevent="createChat" class="space-y-6">
          <!-- Chat Name -->
          <div>
            <label class="block mb-2 font-medium">
              <span class="material-icons text-sm align-middle mr-1">label</span>
              チャットルーム名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="chatName"
              type="text"
              placeholder="例: プロジェクト会議"
              class="input-field"
              :class="inputClasses"
              required
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block mb-2 font-medium">
              <span class="material-icons text-sm align-middle mr-1">description</span>
              説明 (任意)
            </label>
            <textarea
              v-model="description"
              placeholder="チャットルームの説明を入力してください"
              rows="3"
              class="input-field"
              :class="inputClasses"
            ></textarea>
          </div>

          <!-- Your Display Name in this Chat -->
          <div>
            <label class="block mb-2 font-medium">
              <span class="material-icons text-sm align-middle mr-1">person</span>
              このチャットでの表示名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="displayName"
              type="text"
              placeholder="例: モデレーター"
              class="input-field"
              :class="inputClasses"
              required
            />
            <p class="text-sm opacity-70 mt-1">
              チャットごとに異なる名前を使用できます
            </p>
          </div>

          <!-- Privacy Settings -->
          <div class="info-box p-4 rounded-lg" :class="infoBoxClasses">
            <div class="flex items-start gap-3">
              <span class="material-icons text-primary">lock</span>
              <div class="text-sm">
                <p class="font-medium mb-2">プライバシー設定</p>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="isPrivate"
                    type="checkbox"
                    class="w-4 h-4"
                  />
                  <span>招待制 (推奨)</span>
                </label>
                <p class="opacity-80 mt-2">
                  招待制にすると、招待リンクを知っている人のみが参加できます。
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            class="btn-submit w-full"
            :disabled="loading"
          >
            <span v-if="!loading" class="flex items-center justify-center">
              <span class="material-icons mr-2">create</span>
              チャットルーム作成
            </span>
            <span v-else class="flex items-center justify-center">
              <span class="material-icons animate-spin mr-2">refresh</span>
              作成中...
            </span>
          </button>
        </form>
      </div>

      <!-- Success Modal -->
      <transition name="modal">
        <div v-if="showSuccess" class="modal-overlay" @click="goToChat">
          <div class="modal-content elevation-3" :class="cardClasses" @click.stop>
            <div class="text-center">
              <span class="material-icons text-6xl text-green-500 mb-4">check_circle</span>
              <h2 class="text-2xl font-bold mb-4">チャットルーム作成完了!</h2>

              <div class="mb-6">
                <p class="mb-2 font-medium">チャットID:</p>
                <div class="p-3 rounded bg-gray-100 dark:bg-gray-800 font-mono text-sm mb-3">
                  {{ chatId }}
                </div>

                <p class="mb-2 font-medium">招待リンク:</p>
                <div class="p-3 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs mb-3 break-all">
                  {{ inviteLink }}
                </div>

                <button @click="copyInviteLink" class="btn-secondary px-4 py-2 rounded-lg text-sm">
                  <span class="material-icons text-sm align-middle mr-1">content_copy</span>
                  リンクをコピー
                </button>
              </div>

              <button @click="goToChat" class="btn-primary px-6 py-3 rounded-lg">
                チャットルームへ
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDarkMode } from '../composables/useDarkMode'

const router = useRouter()
const { isDark } = useDarkMode()

const chatName = ref('')
const description = ref('')
const displayName = ref('')
const isPrivate = ref(true)
const loading = ref(false)
const showSuccess = ref(false)
const chatId = ref('')
const inviteLink = ref('')

const cardClasses = computed(() => {
  return isDark.value ? 'bg-dark-surface' : 'bg-white'
})

const inputClasses = computed(() => {
  return isDark.value
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-300 text-gray-900'
})

const infoBoxClasses = computed(() => {
  return isDark.value
    ? 'bg-purple-900 bg-opacity-20 border border-purple-700'
    : 'bg-purple-50 border border-purple-200'
})

const createChat = async () => {
  loading.value = true

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Generate chat ID
  chatId.value = 'chat_' + Math.random().toString(36).substr(2, 9)
  inviteLink.value = window.location.origin + '/joinchat?id=' + chatId.value

  // Save chat to localStorage (mock)
  const chats = JSON.parse(localStorage.getItem('flexio_chats') || '[]')
  chats.push({
    id: chatId.value,
    name: chatName.value,
    description: description.value,
    displayName: displayName.value,
    isPrivate: isPrivate.value,
    createdAt: new Date().toISOString(),
    lastMessage: null
  })
  localStorage.setItem('flexio_chats', JSON.stringify(chats))

  loading.value = false
  showSuccess.value = true
}

const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    alert('招待リンクをコピーしました!')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const goToChat = () => {
  router.push(`/chat/${chatId.value}`)
}
</script>

<style scoped>
.input-field {
  @apply w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-primary transition-colors;
}

.btn-submit {
  @apply px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all;
}

.btn-primary {
  @apply bg-primary text-white hover:bg-purple-700 transition-colors font-medium;
}

.btn-secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

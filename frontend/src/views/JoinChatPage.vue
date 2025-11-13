<template>
  <div class="join-chat-page py-12 md:py-20">
    <div class="container mx-auto px-4 max-w-md">
      <div class="card elevation-3 p-8 rounded-lg" :class="cardClasses">
        <div class="text-center mb-8">
          <span class="material-icons text-6xl text-primary mb-4 block">group_add</span>
          <h1 class="text-3xl font-bold mb-2">チャット参加</h1>
          <p class="opacity-80">招待リンクまたはIDで参加</p>
        </div>

        <form @submit.prevent="joinChat" class="space-y-6">
          <div>
            <label class="block mb-2 font-medium">
              <span class="material-icons text-sm align-middle mr-1">link</span>
              招待リンクまたはチャットID <span class="text-red-500">*</span>
            </label>
            <input
              v-model="inviteCode"
              type="text"
              placeholder="https://... または chat_xyz789"
              class="input-field"
              :class="inputClasses"
              required
            />
          </div>

          <div>
            <label class="block mb-2 font-medium">
              <span class="material-icons text-sm align-middle mr-1">person</span>
              表示名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="displayName"
              type="text"
              placeholder="このチャットでの名前"
              class="input-field"
              :class="inputClasses"
              required
            />
          </div>

          <button
            type="submit"
            class="btn-submit w-full"
            :disabled="loading"
          >
            <span v-if="!loading">参加する</span>
            <span v-else>参加中...</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDarkMode } from '../composables/useDarkMode'

const router = useRouter()
const route = useRoute()
const { isDark } = useDarkMode()

const inviteCode = ref('')
const displayName = ref('')
const loading = ref(false)

const cardClasses = computed(() => {
  return isDark.value ? 'bg-dark-surface' : 'bg-white'
})

const inputClasses = computed(() => {
  return isDark.value
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-300 text-gray-900'
})

const joinChat = async () => {
  loading.value = true

  await new Promise(resolve => setTimeout(resolve, 1000))

  // Extract chat ID from URL or use as-is
  let chatId = inviteCode.value
  if (chatId.includes('joinchat?id=')) {
    chatId = chatId.split('joinchat?id=')[1]
  }

  // Save to local chats
  const chats = JSON.parse(localStorage.getItem('flexio_chats') || '[]')
  if (!chats.find(c => c.id === chatId)) {
    chats.push({
      id: chatId,
      name: `Chat ${chatId.slice(0, 8)}`,
      description: '参加したチャット',
      displayName: displayName.value,
      isPrivate: true,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem('flexio_chats', JSON.stringify(chats))
  }

  loading.value = false
  router.push(`/chat/${chatId}`)
}

onMounted(() => {
  // Auto-fill if ID is in query params
  if (route.query.id) {
    inviteCode.value = route.query.id
  }
})
</script>

<style scoped>
.input-field {
  @apply w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-primary transition-colors;
}

.btn-submit {
  @apply px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 transition-all;
}
</style>

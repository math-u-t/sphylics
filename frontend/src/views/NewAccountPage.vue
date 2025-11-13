<template>
  <div class="new-account-page py-12 md:py-20">
    <div class="container mx-auto px-4 max-w-md">
      <div class="card elevation-3 p-8 rounded-lg" :class="cardClasses">
        <div class="text-center mb-8">
          <span class="material-icons text-6xl text-primary mb-4 block">person_add</span>
          <h1 class="text-3xl font-bold mb-2">アカウント作成</h1>
          <p class="opacity-80">数秒で完了します</p>
        </div>

        <form @submit.prevent="createAccount" class="space-y-6">
          <div>
            <label class="block mb-2 font-medium">
              <span class="material-icons text-sm align-middle mr-1">badge</span>
              ユーザー名 (任意)
            </label>
            <input
              v-model="username"
              type="text"
              placeholder="例: anonymous_user"
              class="input-field"
              :class="inputClasses"
            />
            <p class="text-sm opacity-70 mt-1">
              空欄の場合、ランダムな名前が自動生成されます
            </p>
          </div>

          <div class="info-box p-4 rounded-lg" :class="infoBoxClasses">
            <div class="flex items-start gap-3">
              <span class="material-icons text-primary">info</span>
              <div class="text-sm">
                <p class="font-medium mb-1">完全匿名</p>
                <p class="opacity-80">
                  メールアドレスやパスワードは不要です。匿名IDが自動生成され、ブラウザに保存されます。
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
              <span class="material-icons mr-2">arrow_forward</span>
              アカウント作成
            </span>
            <span v-else class="flex items-center justify-center">
              <span class="material-icons animate-spin mr-2">refresh</span>
              作成中...
            </span>
          </button>
        </form>

        <div class="mt-6 text-center text-sm opacity-70">
          <p>
            アカウント作成により、
            <router-link to="/terms" class="text-primary hover:underline">利用規約</router-link>
            と
            <router-link to="/policy" class="text-primary hover:underline">プライバシーポリシー</router-link>
            に同意したものとみなされます。
          </p>
        </div>
      </div>

      <!-- Success Modal -->
      <transition name="modal">
        <div v-if="showSuccess" class="modal-overlay" @click="closeModal">
          <div class="modal-content elevation-3" :class="cardClasses" @click.stop>
            <div class="text-center">
              <span class="material-icons text-6xl text-green-500 mb-4">check_circle</span>
              <h2 class="text-2xl font-bold mb-4">アカウント作成完了!</h2>
              <p class="mb-2">あなたの匿名ID:</p>
              <div class="p-3 rounded bg-gray-100 dark:bg-gray-800 font-mono text-sm mb-6">
                {{ userId }}
              </div>
              <p class="text-sm opacity-80 mb-6">
                このIDは自動的に保存されました。大切に保管してください。
              </p>
              <router-link to="/dashboard" class="btn-primary px-6 py-3 rounded-lg inline-block">
                ダッシュボードへ
              </router-link>
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

const username = ref('')
const loading = ref(false)
const showSuccess = ref(false)
const userId = ref('')

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
    ? 'bg-blue-900 bg-opacity-20 border border-blue-700'
    : 'bg-blue-50 border border-blue-200'
})

const createAccount = async () => {
  loading.value = true

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Generate anonymous user ID
  userId.value = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

  const displayName = username.value || 'Anonymous_' + Math.random().toString(36).substr(2, 6)

  // Save to localStorage
  localStorage.setItem('flexio_user_id', userId.value)
  localStorage.setItem('flexio_username', displayName)

  loading.value = false
  showSuccess.value = true
}

const closeModal = () => {
  showSuccess.value = false
  router.push('/dashboard')
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

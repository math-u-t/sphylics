<template>
  <header class="sticky top-0 z-50 elevation-2" :class="headerClasses">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and Title -->
        <router-link to="/" class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <span class="material-icons text-3xl text-primary">chat_bubble</span>
          <span class="text-xl font-bold">flexio</span>
        </router-link>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-6">
          <router-link to="/about" class="nav-link">About</router-link>
          <router-link to="/information" class="nav-link">お知らせ</router-link>
          <router-link to="/faq" class="nav-link">FAQ</router-link>
          <router-link v-if="isAuthenticated" to="/dashboard" class="nav-link">
            <span class="material-icons text-sm align-middle mr-1">dashboard</span>
            ダッシュボード
          </router-link>
          <router-link v-if="!isAuthenticated" to="/newaccount" class="btn-primary">
            アカウント作成
          </router-link>
          <button v-if="isAuthenticated" @click="logout" class="btn-secondary">
            ログアウト
          </button>

          <!-- Dark mode toggle -->
          <button @click="toggleDarkMode" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <span class="material-icons">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
          </button>
        </nav>

        <!-- Mobile menu button -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
          <span class="material-icons">{{ mobileMenuOpen ? 'close' : 'menu' }}</span>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <transition name="slide-down">
      <nav v-if="mobileMenuOpen" class="md:hidden border-t" :class="borderClasses">
        <div class="container mx-auto px-4 py-4 space-y-3">
          <router-link to="/about" class="mobile-nav-link" @click="mobileMenuOpen = false">About</router-link>
          <router-link to="/information" class="mobile-nav-link" @click="mobileMenuOpen = false">お知らせ</router-link>
          <router-link to="/faq" class="mobile-nav-link" @click="mobileMenuOpen = false">FAQ</router-link>
          <router-link v-if="isAuthenticated" to="/dashboard" class="mobile-nav-link" @click="mobileMenuOpen = false">
            <span class="material-icons text-sm align-middle mr-1">dashboard</span>
            ダッシュボード
          </router-link>
          <router-link v-if="!isAuthenticated" to="/newaccount" class="mobile-nav-link" @click="mobileMenuOpen = false">
            アカウント作成
          </router-link>
          <button v-if="isAuthenticated" @click="logout" class="mobile-nav-link w-full text-left">
            ログアウト
          </button>
          <button @click="toggleDarkMode" class="mobile-nav-link w-full text-left flex items-center">
            <span class="material-icons mr-2">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
            {{ isDark ? 'ライトモード' : 'ダークモード' }}
          </button>
        </div>
      </nav>
    </transition>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDarkMode } from '../composables/useDarkMode'

const router = useRouter()
const { isDark, toggle } = useDarkMode()
const mobileMenuOpen = ref(false)

const isAuthenticated = computed(() => {
  return !!localStorage.getItem('flexio_user_id')
})

const headerClasses = computed(() => {
  return isDark.value
    ? 'bg-dark-surface text-white'
    : 'bg-light-surface text-gray-900'
})

const borderClasses = computed(() => {
  return isDark.value
    ? 'border-gray-700'
    : 'border-gray-200'
})

const toggleDarkMode = () => {
  toggle()
}

const logout = () => {
  localStorage.removeItem('flexio_user_id')
  localStorage.removeItem('flexio_username')
  localStorage.removeItem('flexio_is_admin')
  mobileMenuOpen.value = false
  router.push('/')
}
</script>

<style scoped>
.nav-link {
  @apply text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors font-medium;
}

.mobile-nav-link {
  @apply block py-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors;
}

.btn-primary {
  @apply px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 transition-colors font-medium;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium;
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

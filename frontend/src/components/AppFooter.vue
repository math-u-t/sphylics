<template>
  <footer class="mt-auto border-t" :class="footerClasses">
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- About Section -->
        <div>
          <h3 class="font-bold text-lg mb-3">flexio</h3>
          <p class="text-sm opacity-80">
            完全匿名のチャットアプリケーション。安全でプライベートなコミュニケーションを提供します。
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="font-bold text-lg mb-3">クイックリンク</h3>
          <ul class="space-y-2 text-sm">
            <li><router-link to="/about" class="footer-link">About</router-link></li>
            <li><router-link to="/faq" class="footer-link">FAQ</router-link></li>
            <li><router-link to="/information" class="footer-link">お知らせ</router-link></li>
            <li><router-link to="/stats" class="footer-link">統計情報</router-link></li>
          </ul>
        </div>

        <!-- Legal -->
        <div>
          <h3 class="font-bold text-lg mb-3">法的情報</h3>
          <ul class="space-y-2 text-sm">
            <li><router-link to="/terms" class="footer-link">利用規約</router-link></li>
            <li><router-link to="/policy" class="footer-link">プライバシーポリシー</router-link></li>
            <li><router-link to="/inquiry" class="footer-link">お問い合わせ</router-link></li>
          </ul>
        </div>

        <!-- Developers -->
        <div>
          <h3 class="font-bold text-lg mb-3">開発者向け</h3>
          <ul class="space-y-2 text-sm">
            <li><router-link to="/devs" class="footer-link">API Docs</router-link></li>
            <li><router-link to="/jobs" class="footer-link">採用情報</router-link></li>
            <li><router-link to="/newfunctionlab" class="footer-link">新機能ラボ</router-link></li>
          </ul>
        </div>
      </div>

      <div class="mt-8 pt-6 border-t text-center text-sm opacity-70" :class="borderClasses">
        <p>&copy; 2024 flexio. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

const { isDark } = useDarkMode()

const footerClasses = computed(() => {
  return isDark.value
    ? 'bg-dark-surface text-white border-gray-700'
    : 'bg-light-surface text-gray-900 border-gray-200'
})

const borderClasses = computed(() => {
  return isDark.value ? 'border-gray-700' : 'border-gray-200'
})
</script>

<style scoped>
.footer-link {
  @apply opacity-80 hover:opacity-100 hover:text-primary transition-all;
}
</style>

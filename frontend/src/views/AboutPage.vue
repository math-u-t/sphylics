<template>
  <div class="about-page py-12 md:py-20">
    <div class="container mx-auto px-4 max-w-4xl">
      <h1 class="text-4xl md:text-5xl font-bold mb-8 text-center">About flexio</h1>

      <div class="space-y-12">
        <!-- Mission Section -->
        <section class="card elevation-2 p-8 rounded-lg" :class="cardClasses">
          <div class="flex items-center gap-3 mb-4">
            <span class="material-icons text-3xl text-primary">flag</span>
            <h2 class="text-2xl font-bold">ミッション</h2>
          </div>
          <p class="text-lg leading-relaxed opacity-90">
            flexioは、完全な匿名性とプライバシーを保ちながら、自由で安全なコミュニケーションを可能にすることを目指しています。
            個人情報の収集を最小限に抑え、ユーザーの権利とプライバシーを最優先に考えたプラットフォームです。
          </p>
        </section>

        <!-- Features Section -->
        <section class="card elevation-2 p-8 rounded-lg" :class="cardClasses">
          <div class="flex items-center gap-3 mb-6">
            <span class="material-icons text-3xl text-primary">star</span>
            <h2 class="text-2xl font-bold">主な機能</h2>
          </div>
          <ul class="space-y-4">
            <li class="flex items-start gap-3">
              <span class="material-icons text-primary mt-1">check_circle</span>
              <div>
                <strong class="block mb-1">完全匿名アカウント</strong>
                <span class="opacity-80">メールアドレスや電話番号は不要。匿名IDで利用できます。</span>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-icons text-primary mt-1">check_circle</span>
              <div>
                <strong class="block mb-1">エンドツーエンド暗号化</strong>
                <span class="opacity-80">あなたの会話は完全に保護されます。</span>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-icons text-primary mt-1">check_circle</span>
              <div>
                <strong class="block mb-1">マークダウン対応</strong>
                <span class="opacity-80">リッチなテキスト形式でメッセージを送信できます。</span>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-icons text-primary mt-1">check_circle</span>
              <div>
                <strong class="block mb-1">招待制チャットルーム</strong>
                <span class="opacity-80">プライベートな会話空間を簡単に作成できます。</span>
              </div>
            </li>
          </ul>
        </section>

        <!-- Technology Section -->
        <section class="card elevation-2 p-8 rounded-lg" :class="cardClasses">
          <div class="flex items-center gap-3 mb-6">
            <span class="material-icons text-3xl text-primary">code</span>
            <h2 class="text-2xl font-bold">テクノロジー</h2>
          </div>
          <p class="mb-4 opacity-90">
            flexioは最新の技術を使用して構築されています：
          </p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="p-4 rounded bg-gray-100 dark:bg-gray-800 text-center">
              <strong>Vue.js</strong>
            </div>
            <div class="p-4 rounded bg-gray-100 dark:bg-gray-800 text-center">
              <strong>WebSocket</strong>
            </div>
            <div class="p-4 rounded bg-gray-100 dark:bg-gray-800 text-center">
              <strong>End-to-End Encryption</strong>
            </div>
            <div class="p-4 rounded bg-gray-100 dark:bg-gray-800 text-center">
              <strong>Markdown</strong>
            </div>
            <div class="p-4 rounded bg-gray-100 dark:bg-gray-800 text-center">
              <strong>Material Design</strong>
            </div>
            <div class="p-4 rounded bg-gray-100 dark:bg-gray-800 text-center">
              <strong>Responsive</strong>
            </div>
          </div>
        </section>

        <!-- Team Section -->
        <section class="card elevation-2 p-8 rounded-lg" :class="cardClasses">
          <div class="flex items-center gap-3 mb-6">
            <span class="material-icons text-3xl text-primary">people</span>
            <h2 class="text-2xl font-bold">チーム</h2>
          </div>
          <p class="opacity-90 mb-4">
            flexioは、プライバシーとセキュリティに情熱を持つ開発者チームによって作られています。
          </p>
          <router-link to="/jobs" class="inline-flex items-center text-primary hover:underline">
            <span>採用情報を見る</span>
            <span class="material-icons ml-1">arrow_forward</span>
          </router-link>
        </section>

        <!-- Contact Section -->
        <section class="text-center">
          <h2 class="text-2xl font-bold mb-4">お問い合わせ</h2>
          <p class="mb-6 opacity-90">
            ご質問やフィードバックがございましたら、お気軽にお問い合わせください。
          </p>
          <router-link to="/inquiry" class="btn-primary inline-flex items-center px-6 py-3 rounded-lg">
            <span class="material-icons mr-2">email</span>
            お問い合わせフォーム
          </router-link>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

const { isDark } = useDarkMode()

const cardClasses = computed(() => {
  return isDark.value
    ? 'bg-dark-surface'
    : 'bg-white'
})
</script>

<style scoped>
.btn-primary {
  @apply bg-primary text-white hover:bg-purple-700 transition-colors font-medium;
}
</style>

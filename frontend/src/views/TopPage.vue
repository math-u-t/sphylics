<template>
  <div class="top-page">
    <!-- Hero Section -->
    <section class="hero py-20 md:py-32" :class="heroClasses">
      <div class="container mx-auto px-4 text-center">
        <div class="mb-8">
          <span class="material-icons text-8xl md:text-9xl text-primary">chat_bubble</span>
        </div>
        <h1 class="text-4xl md:text-6xl font-bold mb-6">
          flexio
        </h1>
        <p class="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
          完全匿名のチャットプラットフォーム。<br />
          安全でプライベートなコミュニケーションを。
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link to="/newaccount" class="btn-large btn-primary">
            <span class="material-icons mr-2">person_add</span>
            今すぐ始める
          </router-link>
          <router-link to="/about" class="btn-large btn-secondary">
            <span class="material-icons mr-2">info</span>
            詳しく見る
          </router-link>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 md:py-24">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">特徴</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="feature-card elevation-2 p-6 rounded-lg" :class="cardClasses">
            <div class="mb-4">
              <span class="material-icons text-5xl text-primary">security</span>
            </div>
            <h3 class="text-xl font-bold mb-3">完全匿名</h3>
            <p class="opacity-80">
              個人情報不要。メールアドレスや電話番号なしで利用できます。
            </p>
          </div>

          <div class="feature-card elevation-2 p-6 rounded-lg" :class="cardClasses">
            <div class="mb-4">
              <span class="material-icons text-5xl text-primary">lock</span>
            </div>
            <h3 class="text-xl font-bold mb-3">プライベート</h3>
            <p class="opacity-80">
              エンドツーエンド暗号化で、あなたの会話を保護します。
            </p>
          </div>

          <div class="feature-card elevation-2 p-6 rounded-lg" :class="cardClasses">
            <div class="mb-4">
              <span class="material-icons text-5xl text-primary">speed</span>
            </div>
            <h3 class="text-xl font-bold mb-3">シンプル</h3>
            <p class="opacity-80">
              複雑な設定不要。すぐにチャットを開始できます。
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-16 md:py-24" :class="sectionClasses">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">使い方</h2>
        <div class="max-w-3xl mx-auto space-y-8">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
              1
            </div>
            <div>
              <h3 class="text-xl font-bold mb-2">アカウント作成</h3>
              <p class="opacity-80">
                匿名IDが自動生成されます。個人情報は一切不要です。
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
              2
            </div>
            <div>
              <h3 class="text-xl font-bold mb-2">チャットルーム作成または参加</h3>
              <p class="opacity-80">
                新規チャットルームを作成するか、招待リンクで既存のルームに参加できます。
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
              3
            </div>
            <div>
              <h3 class="text-xl font-bold mb-2">チャット開始</h3>
              <p class="opacity-80">
                マークダウン形式でメッセージを送信。リアルタイムで会話を楽しめます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 md:py-24">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">
          今すぐ始めましょう
        </h2>
        <p class="text-xl mb-8 opacity-80 max-w-2xl mx-auto">
          無料で簡単。数秒でアカウント作成できます。
        </p>
        <router-link to="/newaccount" class="btn-large btn-primary inline-flex items-center">
          <span class="material-icons mr-2">arrow_forward</span>
          アカウント作成
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

const { isDark } = useDarkMode()

const heroClasses = computed(() => {
  return isDark.value
    ? 'bg-gradient-to-br from-dark-surface to-dark-bg'
    : 'bg-gradient-to-br from-light-surface to-white'
})

const cardClasses = computed(() => {
  return isDark.value
    ? 'bg-dark-surface hover:bg-gray-800'
    : 'bg-white hover:bg-gray-50'
})

const sectionClasses = computed(() => {
  return isDark.value
    ? 'bg-dark-surface'
    : 'bg-light-surface'
})
</script>

<style scoped>
.btn-large {
  @apply px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105;
}

.btn-primary {
  @apply bg-primary text-white hover:bg-purple-700;
}

.btn-secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600;
}

.feature-card {
  @apply transition-all cursor-default;
}
</style>

<template>
  <div class="jobs-page py-12">
    <div class="container mx-auto px-4 max-w-6xl">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4">採用情報</h1>
        <p class="text-lg opacity-80">flexioで一緒に働きませんか?</p>
      </div>

      <!-- Company Values -->
      <section class="mb-12">
        <h2 class="text-3xl font-bold mb-6 text-center">私たちの価値観</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card elevation-2 p-6 rounded-lg text-center" :class="cardClasses">
            <span class="material-icons text-5xl text-primary mb-4 block">security</span>
            <h3 class="font-bold text-xl mb-2">プライバシー第一</h3>
            <p class="opacity-80">ユーザーのプライバシーを最優先に考えます</p>
          </div>
          <div class="card elevation-2 p-6 rounded-lg text-center" :class="cardClasses">
            <span class="material-icons text-5xl text-primary mb-4 block">groups</span>
            <h3 class="font-bold text-xl mb-2">チームワーク</h3>
            <p class="opacity-80">協力し合い、共に成長します</p>
          </div>
          <div class="card elevation-2 p-6 rounded-lg text-center" :class="cardClasses">
            <span class="material-icons text-5xl text-primary mb-4 block">lightbulb</span>
            <h3 class="font-bold text-xl mb-2">イノベーション</h3>
            <p class="opacity-80">新しいアイデアを歓迎します</p>
          </div>
        </div>
      </section>

      <!-- Open Positions -->
      <section>
        <h2 class="text-3xl font-bold mb-6">募集中のポジション</h2>
        <div class="space-y-4">
          <div v-for="job in jobs" :key="job.id" class="card elevation-2 rounded-lg overflow-hidden" :class="cardClasses">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="text-xl font-bold mb-2">{{ job.title }}</h3>
                  <div class="flex flex-wrap gap-2 text-sm">
                    <span class="px-3 py-1 bg-primary bg-opacity-20 text-primary rounded-full">{{ job.type }}</span>
                    <span class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">{{ job.location }}</span>
                  </div>
                </div>
              </div>
              <p class="opacity-80 mb-4">{{ job.description }}</p>
              <div class="mb-4">
                <h4 class="font-bold mb-2">求めるスキル:</h4>
                <ul class="list-disc list-inside opacity-80 space-y-1">
                  <li v-for="skill in job.skills" :key="skill">{{ skill }}</li>
                </ul>
              </div>
              <button class="btn-primary px-6 py-2 rounded-lg">
                <span class="material-icons text-sm align-middle mr-1">arrow_forward</span>
                詳細を見る
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Benefits -->
      <section class="mt-12 card elevation-2 p-8 rounded-lg" :class="cardClasses">
        <h2 class="text-3xl font-bold mb-6 text-center">福利厚生</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex items-start gap-3">
            <span class="material-icons text-primary">check_circle</span>
            <div>
              <h4 class="font-bold mb-1">リモートワーク</h4>
              <p class="text-sm opacity-80">フルリモート勤務可能</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="material-icons text-primary">check_circle</span>
            <div>
              <h4 class="font-bold mb-1">フレックスタイム</h4>
              <p class="text-sm opacity-80">柔軟な勤務時間</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="material-icons text-primary">check_circle</span>
            <div>
              <h4 class="font-bold mb-1">学習支援</h4>
              <p class="text-sm opacity-80">書籍購入、カンファレンス参加費用補助</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="material-icons text-primary">check_circle</span>
            <div>
              <h4 class="font-bold mb-1">最新機器</h4>
              <p class="text-sm opacity-80">MacBook Pro等の最新開発環境</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section class="mt-12 text-center">
        <h2 class="text-3xl font-bold mb-4">ご応募・お問い合わせ</h2>
        <p class="mb-6 opacity-80">興味をお持ちいただいた方は、お気軽にお問い合わせください。</p>
        <router-link to="/inquiry" class="btn-primary px-8 py-3 rounded-lg inline-flex items-center">
          <span class="material-icons mr-2">email</span>
          お問い合わせ
        </router-link>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

const { isDark } = useDarkMode()

const jobs = ref([
  {
    id: 1,
    title: 'フロントエンドエンジニア',
    type: 'フルタイム',
    location: 'リモート',
    description: 'Vue.jsを使用したモダンなWebアプリケーションの開発をお任せします。',
    skills: [
      'Vue.js 3年以上の経験',
      'TypeScript',
      'Tailwind CSS',
      'レスポンシブデザイン'
    ]
  },
  {
    id: 2,
    title: 'バックエンドエンジニア',
    type: 'フルタイム',
    location: 'リモート',
    description: 'スケーラブルなAPIの設計と実装を担当していただきます。',
    skills: [
      'Node.js または Go',
      'RESTful API設計',
      'データベース設計',
      'WebSocket'
    ]
  },
  {
    id: 3,
    title: 'セキュリティエンジニア',
    type: 'フルタイム',
    location: 'リモート',
    description: 'アプリケーションのセキュリティ強化とペネトレーションテストを実施します。',
    skills: [
      'セキュリティ監査経験',
      '暗号化技術の知識',
      'ペネトレーションテスト経験',
      'セキュリティ認証資格歓迎'
    ]
  }
])

const cardClasses = computed(() => {
  return isDark.value ? 'bg-dark-surface' : 'bg-white'
})
</script>

<style scoped>
.btn-primary {
  @apply bg-primary text-white hover:bg-purple-700 transition-colors font-medium;
}
</style>

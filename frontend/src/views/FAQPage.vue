<template>
  <div class="faq-page py-12">
    <div class="container mx-auto px-4 max-w-4xl">
      <h1 class="text-4xl font-bold mb-8 text-center">よくある質問 (FAQ)</h1>

      <div class="space-y-4">
        <div v-for="(faq, index) in faqs" :key="index" class="faq-item card elevation-2 rounded-lg overflow-hidden" :class="cardClasses">
          <button @click="toggleFaq(index)" class="w-full p-6 text-left flex items-center justify-between hover:bg-opacity-80 transition-all">
            <h3 class="font-bold text-lg pr-4">{{ faq.question }}</h3>
            <span class="material-icons transition-transform" :class="{ 'rotate-180': faq.open }">expand_more</span>
          </button>
          <transition name="accordion">
            <div v-if="faq.open" class="px-6 pb-6">
              <p class="opacity-90 leading-relaxed">{{ faq.answer }}</p>
            </div>
          </transition>
        </div>
      </div>

      <div class="mt-12 text-center p-8 rounded-lg" :class="cardClasses">
        <h2 class="text-2xl font-bold mb-4">他にご質問がありますか?</h2>
        <p class="mb-6 opacity-80">お気軽にお問い合わせください。</p>
        <router-link to="/inquiry" class="btn-primary px-6 py-3 rounded-lg inline-flex items-center">
          <span class="material-icons mr-2">email</span>
          お問い合わせ
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

const { isDark } = useDarkMode()

const faqs = ref([
  {
    question: 'flexioとは何ですか?',
    answer: 'flexioは完全匿名のチャットアプリケーションです。個人情報を一切要求せず、安全でプライベートなコミュニケーションを提供します。',
    open: false
  },
  {
    question: 'アカウント作成に個人情報は必要ですか?',
    answer: 'いいえ、メールアドレスや電話番号などの個人情報は一切不要です。匿名IDが自動生成され、それがあなたのアカウントとなります。',
    open: false
  },
  {
    question: 'チャットは本当に匿名ですか?',
    answer: 'はい、すべてのチャットは完全に匿名です。各チャットルームごとに異なる表示名を設定でき、あなたの本当のIDは他のユーザーには見えません。',
    open: false
  },
  {
    question: 'メッセージは暗号化されていますか?',
    answer: 'はい、すべてのメッセージはエンドツーエンド暗号化されており、第三者が読むことはできません。',
    open: false
  },
  {
    question: 'チャットルームに何人まで参加できますか?',
    answer: '現在、1つのチャットルームには最大100人まで参加できます。',
    open: false
  },
  {
    question: 'マークダウン記法は使えますか?',
    answer: 'はい、メッセージ送信時にMarkdown記法を使用できます。太字、斜体、リンク、コードブロックなどがサポートされています。',
    open: false
  },
  {
    question: 'モバイルアプリはありますか?',
    answer: '現在はWebアプリのみですが、レスポンシブデザインによりモバイルブラウザでも快適にご利用いただけます。専用アプリは開発中です。',
    open: false
  },
  {
    question: 'チャット履歴は保存されますか?',
    answer: 'チャット履歴はローカルストレージに保存されます。ブラウザのデータを消去すると履歴も削除されます。',
    open: false
  },
  {
    question: 'アカウントを削除できますか?',
    answer: 'はい、ダッシュボードからいつでもログアウトできます。ローカルデータを削除することでアカウント情報も削除されます。',
    open: false
  },
  {
    question: '無料で使えますか?',
    answer: 'はい、flexioは完全無料でご利用いただけます。',
    open: false
  }
])

const cardClasses = computed(() => {
  return isDark.value ? 'bg-dark-surface' : 'bg-white'
})

const toggleFaq = (index) => {
  faqs.value[index].open = !faqs.value[index].open
}
</script>

<style scoped>
.btn-primary {
  @apply bg-primary text-white hover:bg-purple-700 transition-colors font-medium;
}

.rotate-180 {
  transform: rotate(180deg);
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

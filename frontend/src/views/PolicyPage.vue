<template>
  <div class="policy-page py-12">
    <div class="container mx-auto px-4 max-w-4xl">
      <h1 class="text-4xl font-bold mb-4">プライバシーポリシー</h1>
      <p class="text-sm opacity-70 mb-8">最終更新日: 2024年1月1日</p>

      <div class="prose dark:prose-invert max-w-none space-y-8">
        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">1. はじめに</h2>
          <p class="opacity-90 leading-relaxed">
            flexio（以下「当サービス」）は、ユーザーのプライバシーを最優先に考えています。
            このプライバシーポリシーは、当サービスがどのように情報を収集、使用、保護するかを説明します。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">2. 収集する情報</h2>
          <p class="opacity-90 leading-relaxed mb-4">
            当サービスは、完全匿名を実現するため、最小限の情報のみを収集します：
          </p>
          <ul class="list-disc list-inside space-y-2 opacity-90">
            <li>自動生成された匿名ID</li>
            <li>ユーザーが任意で設定する表示名</li>
            <li>チャットメッセージ（暗号化されて保存）</li>
            <li>技術的な情報（IPアドレス、ブラウザ情報など）</li>
          </ul>
          <p class="opacity-90 leading-relaxed mt-4">
            <strong>収集しない情報：</strong>メールアドレス、電話番号、住所などの個人を特定できる情報は一切収集しません。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">3. 情報の使用目的</h2>
          <p class="opacity-90 leading-relaxed">
            収集した情報は以下の目的でのみ使用されます：
          </p>
          <ul class="list-disc list-inside space-y-2 opacity-90 mt-4">
            <li>サービスの提供と改善</li>
            <li>セキュリティの維持</li>
            <li>技術的な問題の解決</li>
            <li>利用規約違反の検出と対応</li>
          </ul>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">4. データの保護</h2>
          <p class="opacity-90 leading-relaxed mb-4">
            当サービスは、ユーザーデータを保護するために以下の対策を講じています：
          </p>
          <ul class="list-disc list-inside space-y-2 opacity-90">
            <li>エンドツーエンド暗号化による通信の保護</li>
            <li>セキュアなサーバーインフラストラクチャ</li>
            <li>定期的なセキュリティ監査</li>
            <li>アクセス制限と認証システム</li>
          </ul>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">5. データの共有</h2>
          <p class="opacity-90 leading-relaxed">
            当サービスは、ユーザーのデータを第三者と共有、販売、または賃貸することは一切ありません。
            ただし、法的要請がある場合や、サービスの運営に不可欠な場合に限り、最小限の情報を共有する可能性があります。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">6. Cookie</h2>
          <p class="opacity-90 leading-relaxed">
            当サービスは、ユーザー体験を向上させるために最小限のCookieを使用します。
            これには、ログイン状態の維持やテーマ設定の保存などが含まれます。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">7. データの削除</h2>
          <p class="opacity-90 leading-relaxed">
            ユーザーは、いつでもアカウントデータを削除することができます。
            削除されたデータは、バックアップから完全に削除されるまで最大30日間保持される場合があります。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">8. ポリシーの変更</h2>
          <p class="opacity-90 leading-relaxed">
            当サービスは、必要に応じてこのプライバシーポリシーを更新する場合があります。
            重要な変更がある場合は、サービス内で通知します。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">9. お問い合わせ</h2>
          <p class="opacity-90 leading-relaxed mb-4">
            プライバシーポリシーに関するご質問がある場合は、お問い合わせページからご連絡ください。
          </p>
          <router-link to="/inquiry" class="btn-primary px-6 py-3 rounded-lg inline-flex items-center">
            <span class="material-icons mr-2">email</span>
            お問い合わせ
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
  return isDark.value ? 'bg-dark-surface' : 'bg-white'
})
</script>

<style scoped>
.btn-primary {
  @apply bg-primary text-white hover:bg-purple-700 transition-colors font-medium;
}
</style>

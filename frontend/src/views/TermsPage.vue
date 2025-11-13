<template>
  <div class="terms-page py-12">
    <div class="container mx-auto px-4 max-w-4xl">
      <h1 class="text-4xl font-bold mb-4">利用規約</h1>
      <p class="text-sm opacity-70 mb-8">最終更新日: 2024年1月1日</p>

      <div class="prose dark:prose-invert max-w-none space-y-6">
        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">1. 規約への同意</h2>
          <p class="opacity-90 leading-relaxed">
            flexio（以下「当サービス」）をご利用いただくことで、本利用規約に同意したものとみなされます。
            同意いただけない場合は、当サービスをご利用いただけません。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">2. サービスの提供</h2>
          <p class="opacity-90 leading-relaxed">
            当サービスは、匿名チャットプラットフォームを提供します。
            サービスの内容は予告なく変更される場合があります。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">3. ユーザーの責任</h2>
          <p class="opacity-90 leading-relaxed mb-4">ユーザーは以下の行為を行ってはなりません：</p>
          <ul class="list-disc list-inside space-y-2 opacity-90">
            <li>法律、規制、または規則に違反する行為</li>
            <li>他のユーザーへの嫌がらせ、脅迫、または誹謗中傷</li>
            <li>スパム、広告、または商業的な勧誘</li>
            <li>マルウェア、ウイルス、または有害なコードの配布</li>
            <li>知的財産権の侵害</li>
            <li>サービスのセキュリティを脅かす行為</li>
            <li>自動化されたシステム（ボット）の使用</li>
          </ul>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">4. コンテンツ</h2>
          <p class="opacity-90 leading-relaxed">
            ユーザーが投稿したコンテンツについて、ユーザーが責任を負います。
            当サービスは、違法または不適切なコンテンツを削除する権利を有します。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">5. 免責事項</h2>
          <p class="opacity-90 leading-relaxed">
            当サービスは「現状有姿」で提供されます。
            サービスの中断、エラー、またはデータの損失について、当サービスは責任を負いません。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">6. アカウントの停止</h2>
          <p class="opacity-90 leading-relaxed">
            当サービスは、利用規約に違反したユーザーのアカウントを予告なく停止または削除する権利を有します。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">7. 準拠法</h2>
          <p class="opacity-90 leading-relaxed">
            本規約は日本法に準拠し、解釈されます。
          </p>
        </section>

        <section class="card elevation-1 p-6 rounded-lg" :class="cardClasses">
          <h2 class="text-2xl font-bold mb-4">8. 規約の変更</h2>
          <p class="opacity-90 leading-relaxed">
            当サービスは、必要に応じて本規約を変更する場合があります。
            重要な変更がある場合は、サービス内で通知します。
          </p>
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

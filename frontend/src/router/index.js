import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Top',
    component: () => import('../views/TopPage.vue'),
    meta: { title: 'flexio - 匿名チャット' }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/AboutPage.vue'),
    meta: { title: 'About - flexio' }
  },
  {
    path: '/policy',
    name: 'Policy',
    component: () => import('../views/PolicyPage.vue'),
    meta: { title: 'Privacy Policy - flexio' }
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: () => import('../views/FAQPage.vue'),
    meta: { title: 'FAQ - flexio' }
  },
  {
    path: '/inquiry',
    name: 'Inquiry',
    component: () => import('../views/InquiryPage.vue'),
    meta: { title: 'お問い合わせ - flexio' }
  },
  {
    path: '/chat/:chatId',
    name: 'Chat',
    component: () => import('../views/ChatPage.vue'),
    meta: { title: 'チャット - flexio' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardPage.vue'),
    meta: { title: 'ダッシュボード - flexio', requiresAuth: true }
  },
  {
    path: '/error',
    name: 'Error',
    component: () => import('../views/ErrorPage.vue'),
    meta: { title: 'エラー - flexio' }
  },
  {
    path: '/newchat',
    name: 'NewChat',
    component: () => import('../views/NewChatPage.vue'),
    meta: { title: '新規チャット作成 - flexio', requiresAuth: true }
  },
  {
    path: '/newaccount',
    name: 'NewAccount',
    component: () => import('../views/NewAccountPage.vue'),
    meta: { title: 'アカウント作成 - flexio' }
  },
  {
    path: '/joinchat',
    name: 'JoinChat',
    component: () => import('../views/JoinChatPage.vue'),
    meta: { title: 'チャット参加 - flexio', requiresAuth: true }
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: () => import('../views/JobsPage.vue'),
    meta: { title: '採用情報 - flexio' }
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('../views/TermsPage.vue'),
    meta: { title: '利用規約 - flexio' }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('../views/StatsPage.vue'),
    meta: { title: '統計情報 - flexio' }
  },
  {
    path: '/devs',
    name: 'Devs',
    component: () => import('../views/DevsPage.vue'),
    meta: { title: 'API Docs - flexio' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminPage.vue'),
    meta: { title: '管理者ページ - flexio', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/information',
    name: 'Information',
    component: () => import('../views/InformationPage.vue'),
    meta: { title: 'お知らせ - flexio' }
  },
  {
    path: '/newfunctionlab',
    name: 'NewFunctionLab',
    component: () => import('../views/NewFunctionLabPage.vue'),
    meta: { title: '新機能ラボ - flexio' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/SearchPage.vue'),
    meta: { title: '検索 - flexio' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/error'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guard for auth
router.beforeEach((to, from, next) => {
  // Update document title
  document.title = to.meta.title || 'flexio'

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    const isAuthenticated = localStorage.getItem('flexio_user_id')
    if (!isAuthenticated) {
      next('/newaccount')
      return
    }
  }

  // Check if route requires admin
  if (to.meta.requiresAdmin) {
    const isAdmin = localStorage.getItem('flexio_is_admin') === 'true'
    if (!isAdmin) {
      next('/error')
      return
    }
  }

  next()
})

export default router

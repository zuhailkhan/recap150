import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

// Hash history so the app works from any static host or folder, and offline.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/p/:slug', component: () => import('@/views/ProblemView.vue') },
    { path: '/lld/:slug', component: () => import('@/views/LldView.vue') },
    { path: '/hld/:slug', component: () => import('@/views/HldView.vue') },
    { path: '/recap', component: () => import('@/views/RecapHomeView.vue') },
    { path: '/recap/run', component: () => import('@/views/RecapSessionView.vue') },
    { path: '/lab', component: () => import('@/views/LabView.vue') },
    { path: '/settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/:rest(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

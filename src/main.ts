import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { router } from './router'
import { initProgress } from './recap/store'
import './styles/app.css'

registerSW({ immediate: true })
initProgress()
createApp(App).use(router).mount('#app')

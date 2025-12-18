import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/reset.css'
import emitter from '@/utils/mitter'
const app = createApp(App)
app.config.globalProperties.$mitter = emitter
app.use(createPinia())
app.use(router)
app.mount('#app')

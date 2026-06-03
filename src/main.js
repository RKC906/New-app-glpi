import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. Import de Pinia
import App from './App.vue'
import router from './routers'

const app = createApp(App)

app.use(createPinia()) // 2. Activation de Pinia (OBLIGATOIRE avant le router)
app.use(router)

app.mount('#app')
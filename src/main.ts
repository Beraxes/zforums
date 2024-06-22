import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';
import './index.css'
import 'primevue/resources/themes/saga-blue/theme.css';       // theme
import 'primevue/resources/primevue.min.css';                // core css
import 'primeicons/primeicons.css';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue)

app.mount('#app')

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Redirection automatique de la racine vers l'inventaire
    {
      path: '/',
      redirect: '/accueil'
    },
    // Notre route GLPI
    {
      path: '/accueil',
      name: 'accueil',
      component: () => import('@/views/Accueil.vue')
    },
    {
      path: '/computers',
      name: 'computers',
      component: () => import('@/views/computer/ComputerList.vue')
    },
    // computers avec glpi et locale sqlite
    {
      path: '/computerslocale',
      name: 'computerslocale',
      component: () => import('@/views/computer/ComputerListeGlpiLocale.vue')
    },
    {
      path: '/computers/create',
      name: 'computerscreate',
      component: () => import('@/views/computer/ComputerCreate.vue')
    },
    {
      path: '/computers/edit/:id',
      name: 'computer-edit',
      component: () => import('@/views/computer/ComputerEdit.vue')
    }  
  ]
})

export default router
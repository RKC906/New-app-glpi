import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Redirection automatique
    {
      path: '/',
      redirect: '/front/home'
    },
    {
      path: '/front',
      redirect: '/front/home'
    },
    {
      path: '/back',
      redirect: '/back/login'
    },

    //Notre route Frontoffice accessible à tous
    {
      path: '/front/home',
      name: 'home',
      component: () => import('@/views/frontoffice/Home.vue')
    },
    {
      path: '/front/ticketcreate',
      name: 'createticket',
      component: () => import('@/views/frontoffice/tickets/CreateTicket.vue')
    },
    {
      path: '/front/ticketkanban',
      name: 'ticketkanban',
      component: () => import('@/views/frontoffice/tickets/TicketKanban.vue')
    },





    // Notre route Backoffice protégée
    {
      path: '/back/login',
      name: 'login',
      component: () => import('@/views/backoffice/Login.vue')
    },
    {
      path: '/back/accueil',
      name: 'accueil',
      component: () => import('@/views/backoffice/Accueil.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/back/dashboard',
      name: 'dashboard',
      component: () => import('@/views/backoffice/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/back/tickets',
      name: 'tickets',
      component: () => import('@/views/backoffice/tickets/TicketsManager.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/back/computers',
      name: 'computers',
      component: () => import('@/views/backoffice/computer/ComputerList.vue'),
      meta: { requiresAuth: true }
    },
    // computers avec glpi et locale sqlite
    {
      path: '/back/computerslocale',
      name: 'computerslocale',
      component: () => import('@/views/backoffice/computer/ComputerListeGlpiLocale.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/back/computers/create',
      name: 'computerscreate',
      component: () => import('@/views/backoffice/computer/ComputerCreate.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/back/computers/edit/:id',
      name: 'computer-edit',
      component: () => import('@/views/backoffice/computer/ComputerEdit.vue'),
      meta: { requiresAuth: true }
    }  
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.warn("Accès refusé au Backoffice")
    next('/back/login')
  } else if (to.path === '/back/login' && authStore.isAuthenticated) {
    next('/back/accueil') // Si déjà connecté, on l'envoie sur le dashboard
  } else {
    next() // Laisse passer (pour le Front ou si l'admin est connecté)
  }
})

export default router
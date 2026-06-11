import { createRouter, createWebHistory } from 'vue-router'


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
      path: '/back', redirect: '/back/accueil'
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
      component: () => import('@/views/backoffice/Accueil.vue')
    },
    {
      path: '/back/dashboard',
      name: 'dashboard',
      component: () => import('@/views/backoffice/Dashboard.vue')
    },
    {
      path: '/back/tickets',
      name: 'tickets',
      component: () => import('@/views/backoffice/tickets/TicketsManager.vue')
    },
    {
      path: '/back/kanbansetting',
      name: 'kanbansettings',
      component: () => import('@/views/backoffice/kanban/KanbanSetting.vue')
    },
    {
      path: '/back/computers',
      name: 'computers',
      component: () => import('@/views/backoffice/computer/ComputerList.vue')
    },
    // computers avec glpi et locale sqlite
    {
      path: '/back/computerslocale',
      name: 'computerslocale',
      component: () => import('@/views/backoffice/computer/ComputerListeGlpiLocale.vue')
    },
    {
      path: '/back/computers/create',
      name: 'computerscreate',
      component: () => import('@/views/backoffice/computer/ComputerCreate.vue')
    },
    {
      path: '/back/computers/edit/:id',
      name: 'computer-edit',
      component: () => import('@/views/backoffice/computer/ComputerEdit.vue')
    }  
  ]
})



export default router;

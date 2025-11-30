import { createRouter, createWebHistory } from 'vue-router'

// Lazy load components
const Dashboard = () => import('@/components/Dashboard.vue')
const ProjectDetail = () => import('@/components/ProjectDetail.vue')
const UserGlobal = () => import('@/components/UserGlobal.vue')
const TestCrudComponents = () => import('@/components/common/TestCrudComponents.vue')

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/project/:id',
    name: 'ProjectDetail',
    component: ProjectDetail,
    props: true
  },
  {
    path: '/user',
    name: 'UserGlobal',
    component: UserGlobal
  },
  {
    path: '/test/crud',
    name: 'TestCrudComponents',
    component: TestCrudComponents
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Scroll to top on navigation
router.afterEach(() => {
  window.scrollTo(0, 0)
})

export default router

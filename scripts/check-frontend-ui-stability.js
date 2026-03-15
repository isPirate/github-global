const fs = require('fs')
const path = require('path')

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8')
}

const clientAppLayout = read('components/client-app-layout.tsx')
const sidebar = read('components/sidebar/sidebar.tsx')
const sidebarUserProfile = read('components/sidebar/user-profile.tsx')
const appUserMenu = read('components/app-shell/app-user-menu.tsx')
const headerActions = read('components/app-shell/header-actions.tsx')
const repositoriesPage = read('app/repositories/page.tsx')
const repositoriesClientPage = read('app/repositories/repositories-client-page.tsx')
const repositoryToolbar = read('components/repository/repository-toolbar.tsx')
const quickTranslateButton = read('components/repository/quick-translate-button.tsx')
const repositoryCard = read('components/repository/repository-card.tsx')
const tasksPage = read('app/tasks/page.tsx')
const tasksClientPage = read('app/tasks/tasks-client-page.tsx')
const taskToolbar = read('components/tasks/task-toolbar.tsx')
const configPage = read('app/repositories/[id]/config/page.tsx')
const configClientPage = read('app/repositories/[id]/config/config-client-page.tsx')

assert(
  clientAppLayout.includes('cachedSidebarCollapsed') &&
    clientAppLayout.includes('cachedSidebarInitialized') &&
    clientAppLayout.includes('sidebarHydrated'),
  'Client app layout should preserve desktop sidebar state across module navigation'
)

assert(
  sidebar.includes('overflow-visible') && sidebarUserProfile.includes("variant=\"sidebar\""),
  'Sidebar should allow account menus to overflow and use the shared sidebar account menu'
)

assert(
  sidebar.includes('translate-x-1/2') && sidebar.includes('ChevronRight') && sidebar.includes('ChevronLeft'),
  'Sidebar should expose the redesigned desktop collapse trigger'
)

assert(
  appUserMenu.includes("variant = 'header'") && appUserMenu.includes("variant === 'sidebar' && collapsed && 'bottom-0 left-full ml-3'"),
  'Shared account menu should support both header and sidebar variants, including collapsed sidebar positioning'
)

assert(
  headerActions.includes('Bell') && headerActions.includes('AppUserMenu'),
  'Header actions should combine notifications with the shared account menu'
)

assert(
  repositoriesPage.includes('getSession()') && repositoriesPage.includes('initialUser'),
  'Repositories page should resolve the session on the server and pass the initial user into the client page'
)

assert(
  repositoriesClientPage.includes('initialLoading') && repositoriesClientPage.includes('isRefreshing'),
  'Repositories client page should separate initial loading from refresh state'
)

assert(
  !repositoriesClientPage.includes("username: 'Loading...'"),
  'Repositories client page should not replace the user menu with a loading placeholder'
)

assert(
  repositoryToolbar.includes('按仓库名称搜索'),
  'Repository search placeholder should clearly state name-based search'
)

assert(
  quickTranslateButton.includes('立即翻译') && quickTranslateButton.includes('前往配置'),
  'Quick translate button should preserve translate semantics while still guiding unconfigured repositories to settings'
)

assert(
  repositoryCard.includes('grid-cols-[minmax(0,1fr)_48px_48px]'),
  'Repository card should keep the redesigned action hierarchy with a primary translate slot'
)

assert(
  tasksPage.includes('getSession()') && tasksPage.includes('initialUser'),
  'Tasks page should resolve the session on the server and pass the initial user into the client page'
)

assert(
  tasksClientPage.includes('searchInput') && tasksClientPage.includes('searchQuery') && tasksClientPage.includes('setTimeout'),
  'Tasks client page should debounce the search input before querying'
)

assert(
  tasksClientPage.includes('initialLoading') && tasksClientPage.includes('isRefreshing'),
  'Tasks client page should separate initial loading from silent refresh state'
)

assert(
  tasksClientPage.includes("task.status === 'pending'") &&
    tasksClientPage.includes('const hasActiveTasks = stats.pending + stats.processing > 0'),
  'Tasks client page should treat pending and processing tasks as active for auto refresh'
)

assert(
  tasksClientPage.includes("Loader2 className={hasActiveTasks ? 'h-5 w-5 animate-spin' : 'h-5 w-5'}"),
  'Tasks client page should keep the floating auto-refresh indicator spinning while active tasks exist'
)

assert(
  !tasksClientPage.includes("username: 'Loading...'"),
  'Tasks client page should not replace the user menu with a loading placeholder'
)

assert(
  taskToolbar.includes('按仓库名称搜索任务'),
  'Task search placeholder should be updated for the optimized search behavior'
)

assert(
  configPage.includes('getSession()') && configPage.includes('initialUser'),
  'Repository config page should resolve the session on the server and pass the initial user into the client page'
)

assert(
  configClientPage.includes('ClientAppLayout user={initialUser}') &&
    !configClientPage.includes("username: 'Loading...'"),
  'Repository config client page should keep the real shell user during loading and loaded states'
)

console.log('Frontend UI stability checks passed.')

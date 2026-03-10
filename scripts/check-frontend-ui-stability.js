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
const repositoriesPage = read('app/repositories/page.tsx')
const repositoriesClientPage = read('app/repositories/repositories-client-page.tsx')
const repositoryToolbar = read('components/repository/repository-toolbar.tsx')
const tasksPage = read('app/tasks/page.tsx')
const tasksClientPage = read('app/tasks/tasks-client-page.tsx')
const taskToolbar = read('components/tasks/task-toolbar.tsx')

assert(
  clientAppLayout.includes('lg:sticky') &&
    clientAppLayout.includes('lg:top-0') &&
    clientAppLayout.includes('lg:h-screen'),
  'Client app layout should keep the desktop sidebar fixed in view'
)

assert(
  sidebar.includes('overflow-y-auto'),
  'Sidebar should allow its navigation area to scroll independently'
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
  !tasksClientPage.includes("username: 'Loading...'"),
  'Tasks client page should not replace the user menu with a loading placeholder'
)

assert(
  taskToolbar.includes('按仓库名称搜索任务'),
  'Task search placeholder should be updated for the optimized search behavior'
)

console.log('Frontend UI stability checks passed.')

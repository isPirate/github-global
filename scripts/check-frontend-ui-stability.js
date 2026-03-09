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
const repositoryToolbar = read('components/repository/repository-toolbar.tsx')
const tasksPage = read('app/tasks/page.tsx')
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
  repositoriesPage.includes('initialLoading') && repositoriesPage.includes('isRefreshing'),
  'Repositories page should separate initial loading from refresh state'
)

assert(
  repositoriesPage.includes('if (authLoading || initialLoading) {'),
  'Repositories page should keep the loading screen until the first repository payload arrives'
)

assert(
  !repositoriesPage.includes("if (loading || !user)"),
  'Repositories page should not replace the whole layout with Loading on every refresh'
)

assert(
  repositoryToolbar.includes('按仓库名称搜索'),
  'Repository search placeholder should clearly state name-based search'
)

assert(
  tasksPage.includes('searchInput') && tasksPage.includes('searchQuery') && tasksPage.includes('setTimeout'),
  'Tasks page should debounce the search input before querying'
)

assert(
  tasksPage.includes('initialLoading') && tasksPage.includes('isRefreshing'),
  'Tasks page should separate initial loading from silent refresh state'
)

assert(
  !tasksPage.includes('setLoading(true)'),
  'Tasks page should avoid full-page loading resets during polling or search'
)

assert(
  taskToolbar.includes('按仓库名称搜索任务'),
  'Task search placeholder should be updated for the optimized search behavior'
)

console.log('Frontend UI stability checks passed.')

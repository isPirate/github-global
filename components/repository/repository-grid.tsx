import { RepositoryCard } from '@/components/repository/repository-card'

interface RepositoryGridProps {
  repositories: Array<{
    id: number
    name: string
    full_name: string
    description: string | null
    language: string | null
    stargazers_count: number
    private: boolean
    owner: {
      login: string
      type: string
    }
    isActive: boolean
    hasConfig: boolean
    dbId?: string
  }>
}

export function RepositoryGrid({ repositories }: RepositoryGridProps) {
  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
      {repositories.map((repository) => (
        <RepositoryCard key={repository.id} repository={repository} />
      ))}
    </div>
  )
}

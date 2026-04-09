'use client'
import { useState, useEffect, useCallback } from 'react'
import ActivityCard from '@/components/ActivityCard'
import { ACTIVITY_CATEGORIES } from '@/types'

interface Activity {
  id: string; title: string; category: string; startDate: string; endDate: string
  location: string; fee: number; capacity: number; status: string
  _count?: { applications: number }
}

export default function StudentActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '12' })
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    const res = await fetch(`/api/activities?${params}`)
    const data = await res.json()
    if (data.success) {
      setActivities(data.data)
      setTotalPages(data.pagination.totalPages)
    }
    setLoading(false)
  }, [page, search, category])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchActivities() }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">활동 탐색</h1>
        <p className="text-gray-500 mt-1">참여하고 싶은 활동을 찾아보세요</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
        <input
          className="input flex-1 min-w-48"
          placeholder="활동명 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-40" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
          <option value="">전체 카테고리</option>
          {ACTIVITY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn-primary">검색</button>
        {(search || category) && (
          <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setCategory(''); setPage(1) }}>
            초기화
          </button>
        )}
      </form>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-1/3" />
              <div className="h-5 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-lg mb-2">검색 결과가 없습니다.</p>
          <p className="text-sm">다른 키워드나 카테고리로 검색해보세요.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((act) => <ActivityCard key={act.id} activity={act} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

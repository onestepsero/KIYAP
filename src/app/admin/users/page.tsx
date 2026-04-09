'use client'
import { useState, useEffect, useCallback } from 'react'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'

interface User {
  id: string; name: string; email: string; phone: string; role: string
  isApproved: boolean; isActive: boolean; createdAt: string
  student?: { school: { name: string }; grade: number; class: number }
  teacher?: { school: { name: string } }
}

const ROLE_LABELS: Record<string, string> = { STUDENT: '학생', PARENT: '학부모', TEACHER: '교사', ADMIN: '관리자' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (roleFilter) params.set('role', roleFilter)
    if (search) params.set('search', search)
    const res = await fetch(`/api/users?${params}`)
    const data = await res.json()
    if (data.success) {
      setUsers(data.data)
      setTotalPages(data.pagination.totalPages)
    }
    setLoading(false)
  }, [page, roleFilter, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleToggle = async (userId: string, field: 'isApproved' | 'isActive', current: boolean) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    })
    if ((await res.json()).success) fetchUsers()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>

      <div className="flex gap-3 flex-wrap">
        <input className="input flex-1 min-w-48" placeholder="이름 검색..." value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchUsers() } }} />
        <select className="input w-36" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
          <option value="">전체 역할</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn-primary" onClick={() => { setPage(1); fetchUsers() }}>검색</button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['이름', '이메일', '역할', '소속', '가입일', '상태', '관리'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-gray-500">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className="badge bg-blue-100 text-blue-700">{ROLE_LABELS[user.role]}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {user.student ? `${user.student.school.name} ${user.student.grade}-${user.student.class}` :
                     user.teacher ? user.teacher.school.name : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {user.isApproved
                        ? <span className="badge bg-green-100 text-green-700">승인</span>
                        : <span className="badge bg-yellow-100 text-yellow-700">대기</span>
                      }
                      {!user.isActive && <span className="badge bg-red-100 text-red-700">비활성</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {!user.isApproved && (
                        <button
                          onClick={() => handleToggle(user.id, 'isApproved', user.isApproved)}
                          className="text-xs text-green-600 hover:underline">
                          승인
                        </button>
                      )}
                      <button
                        onClick={() => handleToggle(user.id, 'isActive', user.isActive)}
                        className={`text-xs hover:underline ${user.isActive ? 'text-red-600' : 'text-blue-600'}`}>
                        {user.isActive ? '비활성화' : '활성화'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded text-sm ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

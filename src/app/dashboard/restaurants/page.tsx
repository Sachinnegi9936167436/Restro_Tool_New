'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Filter, Globe, XCircle, Phone, Star, ExternalLink,
  ChevronLeft, ChevronRight, Download, SortAsc, SortDesc
} from 'lucide-react'
import toast from 'react-hot-toast'
import { UK_CITIES, CATEGORIES, LEAD_STATUS_CONFIG, formatDate, truncate } from '@/lib/utils'

interface Restaurant {
  id: string; name: string; city: string; category: string
  address: string; phone?: string; website?: string; mapsUrl?: string
  rating?: number; reviews?: number; hasWebsite: boolean
  leadStatus: string; createdAt: string; notes?: string
}

interface Pagination { total: number; page: number; limit: number; totalPages: number }

const STATUS_OPTIONS = ['', 'NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLIENT', 'LOST']

function RestaurantsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [hasWebsite, setHasWebsite] = useState(searchParams.get('hasWebsite') || 'all')
  const [leadStatus, setLeadStatus] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('auth_token')
    const params = new URLSearchParams({
      page: String(page), limit: '20', sortBy, sortOrder,
      ...(search && { search }),
      ...(city && { city }),
      ...(category && { category }),
      ...(hasWebsite !== 'all' && { hasWebsite }),
      ...(leadStatus && { leadStatus }),
    })

    try {
      const res = await fetch(`/api/restaurants?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setRestaurants(data.restaurants)
        setPagination(data.pagination)
      }
    } catch { toast.error('Failed to load restaurants') }
    setLoading(false)
  }, [page, sortBy, sortOrder, search, city, category, hasWebsite, leadStatus])

  useEffect(() => { fetchRestaurants() }, [fetchRestaurants])

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field); setSortOrder('asc')
    }
    setPage(1)
  }

  function SortIcon({ field }: { field: string }) {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
  }

  async function updateStatus(id: string, newStatus: string) {
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`/api/restaurants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ leadStatus: newStatus }),
    })
    if (res.ok) {
      setRestaurants((prev) => prev.map((r) => r.id === id ? { ...r, leadStatus: newStatus } : r))
      toast.success('Status updated')
    }
  }

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const token = localStorage.getItem('auth_token')
    const params = new URLSearchParams({ format, hasWebsite, ...(city && { city }), ...(category && { category }), ...(leadStatus && { leadStatus }) })
    // Use cookie auth for file download
    window.open(`/api/restaurants/export?${params}`, '_blank')
    toast.success(`Exporting as ${format.toUpperCase()}…`)
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            All Restaurants
            {pagination && <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>({pagination.total.toLocaleString()} total)</span>}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} /> Filters
          </button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button className="btn btn-secondary" id="export-btn"
              onClick={() => {
                const menu = document.getElementById('export-menu')
                if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block'
              }}>
              <Download size={14} /> Export
            </button>
            <div id="export-menu" style={{
              display: 'none', position: 'absolute', right: 0, top: '100%', marginTop: 4,
              background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8,
              zIndex: 20, minWidth: 140, overflow: 'hidden'
            }}>
              {(['csv', 'excel', 'pdf'] as const).map((f) => (
                <button key={f} onClick={() => handleExport(f)} style={{
                  display: 'block', width: '100%', padding: '9px 16px', textAlign: 'left',
                  background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem'
                }}>Export {f.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 mb-5 animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div className="relative">
              <Search size={14} className="absolute" style={{ left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input pl-8" placeholder="Search name, phone…" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <select className="input" value={city} onChange={(e) => { setCity(e.target.value); setPage(1) }}>
              <option value="">All Cities</option>
              {UK_CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="input" value={hasWebsite} onChange={(e) => { setHasWebsite(e.target.value); setPage(1) }}>
              <option value="all">All (Website Status)</option>
              <option value="false">No Website</option>
              <option value="true">Has Website</option>
            </select>
            <select className="input" value={leadStatus} onChange={(e) => { setLeadStatus(e.target.value); setPage(1) }}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.filter(Boolean).map((s) => (
                <option key={s} value={s}>{LEAD_STATUS_CONFIG[s as keyof typeof LEAD_STATUS_CONFIG]?.label ?? s}</option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setCity(''); setCategory(''); setHasWebsite('all'); setLeadStatus(''); setPage(1) }}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Name <SortIcon field="name" />
              </th>
              <th onClick={() => toggleSort('city')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                City <SortIcon field="city" />
              </th>
              <th>Category</th>
              <th>Contact</th>
              <th onClick={() => toggleSort('rating')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Rating <SortIcon field="rating" />
              </th>
              <th>Website</th>
              <th>Status</th>
              <th onClick={() => toggleSort('createdAt')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Added <SortIcon field="createdAt" />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : restaurants.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No restaurants found. Try adjusting your filters or run a search.
                </td>
              </tr>
            ) : restaurants.map((r) => {
              const cfg = LEAD_STATUS_CONFIG[r.leadStatus as keyof typeof LEAD_STATUS_CONFIG]
              return (
                <tr key={r.id}>
                  <td style={{ maxWidth: 200 }}>
                    <Link href={`/dashboard/restaurants/${r.id}`}
                      style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
                      {truncate(r.name, 30)}
                    </Link>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.city}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>
                      {r.category}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {r.phone ? <span className="flex items-center gap-1"><Phone size={11} /> {r.phone}</span> : '—'}
                  </td>
                  <td>
                    {r.rating ? (
                      <span className="flex items-center gap-1" style={{ fontSize: '0.82rem', color: '#f59e0b' }}>
                        <Star size={12} fill="currentColor" /> {r.rating}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({r.reviews})</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {r.hasWebsite
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#4ade80' }}><Globe size={11} /> Has Website</span>
                      : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#f87171' }}><XCircle size={11} /> No Website</span>
                    }
                  </td>
                  <td>
                    <select
                      value={r.leadStatus}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
                        borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem',
                        color: cfg ? cfg.color.split(' ')[1] : 'var(--text-primary)', cursor: 'pointer',
                        fontFamily: 'inherit', outline: 'none'
                      }}>
                      {STATUS_OPTIONS.filter(Boolean).map((s) => (
                        <option key={s} value={s}>{LEAD_STATUS_CONFIG[s as keyof typeof LEAD_STATUS_CONFIG]?.label ?? s}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      {r.mapsUrl && (
                        <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer"
                          style={{ padding: '4px', borderRadius: 6, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <Link href={`/dashboard/restaurants/${r.id}`}
                        className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }}
              disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i
              return (
                <button key={pageNum} className="btn"
                  style={{ padding: '6px 12px', background: pageNum === page ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-elevated)', color: pageNum === page ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--bg-border)', fontSize: '0.82rem' }}
                  onClick={() => setPage(pageNum)}>
                  {pageNum}
                </button>
              )
            })}
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }}
              disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { Suspense } from 'react'

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 400 }} />}>
      <RestaurantsContent />
    </Suspense>
  )
}

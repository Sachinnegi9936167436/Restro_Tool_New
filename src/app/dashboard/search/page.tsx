'use client'

import { useState } from 'react'
import { Search, Loader2, MapPin, Globe, XCircle, Phone, Star, ExternalLink, CheckCircle, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { UK_CITIES, CATEGORIES, RADIUS_OPTIONS, LEAD_STATUS_CONFIG } from '@/lib/utils'

interface SearchResult {
  id: string
  placeId: string
  name: string
  address: string
  city: string
  phone?: string
  email?: string
  website?: string
  mapsUrl?: string
  rating?: number
  reviews?: number
  hasWebsite: boolean
  businessStatus?: string
  category: string
  leadStatus: string
}

interface SearchResponse {
  total: number
  newLeads: number
  results: SearchResult[]
}

export default function SearchPage() {
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('India')
  const [category, setCategory] = useState('Restaurant')
  const [radius, setRadius] = useState(5000)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [summary, setSummary] = useState<{ total: number; newLeads: number } | null>(null)
  const [filterNoWebsite, setFilterNoWebsite] = useState(false)

  async function handleSearch() {
    setLoading(true)
    setResults(null)

    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ city, category, radiusMeters: radius, state, country }),
      })
      const data: SearchResponse & { error?: string } = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Search failed')
      } else {
        setSummary({ total: data.total, newLeads: data.newLeads })
        setResults(data.results)
        toast.success(`Found ${data.total} restaurants · ${data.newLeads} new leads saved!`)
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const displayed = results
    ? filterNoWebsite ? results.filter((r) => !r.hasWebsite) : results
    : null

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Search Form */}
      <div className="card p-6 mb-6">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          🔍 Search Restaurants
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
          Search using the LocationIQ API to find restaurants globally
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {/* Country */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Country *
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. USA, UK, India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          {/* State */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              State
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. NY, London, Uttarakhand"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>

          {/* City */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              City
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. New York, London, Dehradun"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Category *
            </label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Radius */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Search Radius
            </label>
            <select className="input" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
              {RADIUS_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-5">
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Searching…</>
              : <><Search size={16} /> Search LocationIQ</>}
          </button>

          {results && (
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={filterNoWebsite}
                onChange={(e) => setFilterNoWebsite(e.target.checked)}
                style={{ accentColor: '#6366f1' }}
              />
              Show only: No Website
            </label>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      {summary && !loading && (
        <div className="flex items-center gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.82rem', color: '#818cf8' }}>
            <strong>{summary.total}</strong> results found
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', fontSize: '0.82rem', color: '#4ade80' }}>
            <strong>{summary.newLeads}</strong> new leads saved
          </div>
          {filterNoWebsite && displayed && (
            <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.82rem', color: '#f87171' }}>
              <strong>{displayed.length}</strong> without website
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4" style={{ height: 200 }}>
              <div className="skeleton" style={{ height: '100%' }} />
            </div>
          ))}
        </div>
      )}

      {/* Results Grid */}
      {displayed && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {displayed.map((r) => {
            const statusCfg = LEAD_STATUS_CONFIG[r.leadStatus as keyof typeof LEAD_STATUS_CONFIG]
            return (
              <div key={r.id} className="card p-4 animate-fade-in" style={{
                borderLeft: r.hasWebsite ? '3px solid #22c55e' : '3px solid #ef4444'
              }}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, lineHeight: 1.3 }}>
                      {r.name}
                    </h3>
                    <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      <MapPin size={11} /> {r.city}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.hasWebsite
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 8px', borderRadius: 9999 }}>
                          <CheckCircle size={10} /> Has Website
                        </span>
                      : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '2px 8px', borderRadius: 9999 }}>
                          <XCircle size={10} /> No Website
                        </span>
                    }
                  </div>
                </div>

                {/* Address */}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>
                  {r.address}
                </p>

                {/* Metrics */}
                <div className="flex items-center gap-4 mb-10" style={{ fontSize: '0.75rem' }}>
                  {r.rating && (
                    <span className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
                      <Star size={12} fill="currentColor" /> {r.rating} ({r.reviews})
                    </span>
                  )}
                  {r.phone && (
                    <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Phone size={11} /> {r.phone}
                    </span>
                  )}
                  {r.email && (
                    <span className="flex items-center gap-1" style={{ color: '#818cf8', fontWeight: 500 }} title={r.email}>
                      <Mail size={11} /> <a href={`mailto:${r.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{r.email.length > 20 ? r.email.slice(0, 18) + '…' : r.email}</a>
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                  <span className="badge" style={{ borderColor: 'transparent', background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    {r.category}
                  </span>
                  <div className="flex gap-2">
                    {r.mapsUrl && (
                      <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                        <ExternalLink size={11} /> Maps
                      </a>
                    )}
                    <a href={`/dashboard/restaurants/${r.id}`} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                      View Lead
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
          {displayed.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No results match your filter. Try removing the &quot;No Website&quot; filter.
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !results && (
        <div className="card p-12 text-center">
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={28} style={{ color: '#6366f1' }} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            Ready to Find Leads
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 400, margin: '0 auto' }}>
            Select a country, state, city, category, and search radius, then click &quot;Search LocationIQ&quot; to discover restaurants globally.
          </p>
          <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8rem', color: '#f87171', maxWidth: 400, margin: '16px auto 0' }}>
            ⚠️ Requires a LocationIQ API key in Settings
          </div>
        </div>
      )}
    </div>
  )
}

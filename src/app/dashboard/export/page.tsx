'use client'

import { useState } from 'react'
import { Download, FileText, Table, FileSpreadsheet, Filter, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { UK_CITIES, CATEGORIES, LEAD_STATUS_CONFIG } from '@/lib/utils'

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLIENT', 'LOST']

export default function ExportPage() {
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')
  const [hasWebsite, setHasWebsite] = useState('all')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [leadStatus, setLeadStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const params = new URLSearchParams({ format, hasWebsite, ...(city && { city }), ...(category && { category }), ...(leadStatus && { leadStatus }) })

    // Direct download via anchor
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`/api/restaurants/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Export failed')
      setLoading(false)
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `restaurants-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`Exported as ${format.toUpperCase()}!`)
    setLoading(false)
  }

  const formatIcons = { csv: Table, excel: FileSpreadsheet, pdf: FileText }
  const formatColors = { csv: '#22c55e', excel: '#16a34a', pdf: '#ef4444' }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="flex items-center gap-3 mb-6">
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Download size={18} className="text-white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Export Data</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Download your restaurant leads in multiple formats</p>
        </div>
      </div>

      {/* Format Selection */}
      <div className="card p-5 mb-5">
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          1. Choose Export Format
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {(['csv', 'excel', 'pdf'] as const).map((f) => {
            const Icon = formatIcons[f]
            const color = formatColors[f]
            const isSelected = format === f
            return (
              <button key={f} onClick={() => setFormat(f)} style={{
                padding: '20px 16px', borderRadius: 12, border: `2px solid ${isSelected ? color : 'var(--bg-border)'}`,
                background: isSelected ? `${color}15` : 'var(--bg-elevated)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'all 0.15s'
              }}>
                <Icon size={28} style={{ color: isSelected ? color : 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isSelected ? color : 'var(--text-primary)' }}>{f.toUpperCase()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {f === 'csv' && 'Comma-separated values'}
                    {f === 'excel' && 'Excel spreadsheet (.xlsx)'}
                    {f === 'pdf' && 'PDF document (landscape)'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={15} style={{ color: '#818cf8' }} />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>2. Apply Filters (optional)</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Website Status</label>
            <select className="input" value={hasWebsite} onChange={(e) => setHasWebsite(e.target.value)}>
              <option value="all">All Restaurants</option>
              <option value="false">No Website Only (Prime Leads)</option>
              <option value="true">Has Website Only</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>City</label>
            <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">All Cities</option>
              {UK_CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Lead Status</label>
            <select className="input" value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{LEAD_STATUS_CONFIG[s as keyof typeof LEAD_STATUS_CONFIG]?.label ?? s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="card p-5">
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>3. Export</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          Exports up to 5,000 records. Larger datasets should be filtered first.
        </p>
        <button className="btn btn-primary" onClick={handleExport} disabled={loading} style={{ width: '100%', padding: '12px' }}>
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Generating {format.toUpperCase()}…</>
            : <><Download size={16} /> Export as {format.toUpperCase()}</>
          }
        </button>
      </div>
    </div>
  )
}

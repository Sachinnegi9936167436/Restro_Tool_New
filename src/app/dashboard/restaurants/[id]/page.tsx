'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Phone, Globe, Star, ExternalLink, Mail,
  MessageSquare, Edit3, Save, X, CheckCircle, XCircle, Clock, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { LEAD_STATUS_CONFIG, formatDate } from '@/lib/utils'

interface Restaurant {
  id: string; placeId: string; name: string; category: string
  address: string; city: string; state: string
  latitude?: number; longitude?: number
  phone?: string; email?: string; website?: string; mapsUrl?: string
  rating?: number; reviews?: number; hasWebsite: boolean
  businessStatus?: string; leadStatus: string; notes?: string
  createdAt: string; updatedAt: string
  emailLogs: { id: string; subject: string; status: string; sentAt?: string; toEmail: string }[]
  smsLogs: { id: string; message: string; status: string; sentAt?: string; toPhone: string }[]
}

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLIENT', 'LOST']

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState('')
  const [email, setEmail] = useState('')
  const [leadStatus, setLeadStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    fetch(`/api/restaurants/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.restaurant) {
          setRestaurant(d.restaurant)
          setNotes(d.restaurant.notes || '')
          setEmail(d.restaurant.email || '')
          setLeadStatus(d.restaurant.leadStatus)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`/api/restaurants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes, email, leadStatus }),
    })
    const data = await res.json()
    if (res.ok) {
      setRestaurant(data.restaurant)
      setEditing(false)
      toast.success('Saved successfully')
    } else {
      toast.error(data.error || 'Save failed')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 40, marginBottom: 16, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        Restaurant not found. <Link href="/dashboard/restaurants" style={{ color: '#818cf8' }}>Go back</Link>
      </div>
    )
  }

  const cfg = LEAD_STATUS_CONFIG[restaurant.leadStatus as keyof typeof LEAD_STATUS_CONFIG]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Back */}
      <Link href="/dashboard/restaurants" className="btn btn-secondary" style={{ marginBottom: 20, padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex' }}>
        <ArrowLeft size={14} /> Back to Restaurants
      </Link>

      {/* Header Card */}
      <div className="card p-6 mb-5" style={{ borderLeft: restaurant.hasWebsite ? '4px solid #22c55e' : '4px solid #ef4444' }}>
        <div className="flex items-start justify-between gap-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {restaurant.name}
            </h2>
            <div className="flex items-center gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>
                {restaurant.category}
              </span>
              {restaurant.hasWebsite
                ? <span style={{ fontSize: '0.78rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> Has Website</span>
                : <span style={{ fontSize: '0.78rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={12} /> No Website — Prime Lead!</span>
              }
              {restaurant.businessStatus && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{restaurant.businessStatus}</span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} /> {restaurant.address}
            </p>
          </div>
          <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
            {!editing ? (
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                <Edit3 size={14} /> Edit
              </button>
            ) : (
              <>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                </button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                  <X size={14} /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          {restaurant.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              <Star size={14} style={{ color: '#f59e0b' }} fill="#f59e0b" />
              <strong style={{ color: 'var(--text-primary)' }}>{restaurant.rating}</strong>
              <span style={{ color: 'var(--text-muted)' }}>({restaurant.reviews} reviews)</span>
            </div>
          )}
          {restaurant.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Phone size={14} /> {restaurant.phone}
            </div>
          )}
          {restaurant.website && (
            <a href={restaurant.website} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#818cf8', textDecoration: 'none' }}>
              <Globe size={14} /> {restaurant.website}
            </a>
          )}
          {restaurant.mapsUrl && (
            <a href={restaurant.mapsUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#06b6d4', textDecoration: 'none' }}>
              <ExternalLink size={14} /> OpenStreetMap
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Lead Management */}
        <div className="card p-5">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
            Lead Management
          </h3>

          {/* Status */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Lead Status</label>
            {editing ? (
              <select className="input" value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{LEAD_STATUS_CONFIG[s as keyof typeof LEAD_STATUS_CONFIG]?.label ?? s}</option>
                ))}
              </select>
            ) : (
              <span className="badge" style={{ borderColor: 'transparent', fontSize: '0.8rem', padding: '4px 12px', ...(cfg ? {} : {}) }}>
                <span style={{ padding: '4px 12px', borderRadius: 6, background: `rgba(99,102,241,0.1)`, color: '#818cf8', fontSize: '0.82rem', fontWeight: 600 }}>
                  {cfg?.label ?? restaurant.leadStatus}
                </span>
              </span>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Business Email (public only)
            </label>
            {editing ? (
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="restaurant@example.com" />
            ) : (
              <p style={{ fontSize: '0.85rem', color: restaurant.email ? '#818cf8' : 'var(--text-muted)' }}>
                {restaurant.email || 'Not available'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Notes</label>
            {editing ? (
              <textarea className="input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this lead…" style={{ resize: 'vertical' }} />
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minHeight: 60, whiteSpace: 'pre-wrap' }}>
                {restaurant.notes || 'No notes added yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href={`/dashboard/campaigns/email?restaurantId=${restaurant.id}`}
              className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              <Mail size={15} /> Send Email Campaign
            </Link>
            <Link href={`/dashboard/campaigns/sms?restaurantId=${restaurant.id}&phone=${restaurant.phone || ''}`}
              className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <MessageSquare size={15} /> Send SMS / WhatsApp
            </Link>
            {restaurant.mapsUrl && (
              <a href={restaurant.mapsUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                <ExternalLink size={15} /> View on Map
              </a>
            )}
          </div>

          {/* Meta */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bg-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="flex justify-between"><span>Place ID:</span><span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.7rem' }}>{restaurant.placeId.slice(0, 20)}…</span></div>
              <div className="flex justify-between"><span>City:</span><span style={{ color: 'var(--text-secondary)' }}>{restaurant.city}, {restaurant.state}</span></div>
              {restaurant.latitude && <div className="flex justify-between"><span>Coordinates:</span><span style={{ color: 'var(--text-secondary)' }}>{restaurant.latitude.toFixed(4)}, {restaurant.longitude?.toFixed(4)}</span></div>}
              <div className="flex justify-between"><span>Added:</span><span style={{ color: 'var(--text-secondary)' }}>{formatDate(restaurant.createdAt)}</span></div>
              <div className="flex justify-between"><span>Updated:</span><span style={{ color: 'var(--text-secondary)' }}>{formatDate(restaurant.updatedAt)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card p-5">
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          Communication History
        </h3>
        {restaurant.emailLogs.length === 0 && restaurant.smsLogs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
            No communications sent yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {restaurant.emailLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <Mail size={14} style={{ color: '#818cf8', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 500 }}>{log.subject}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>To: {log.toEmail}</div>
                </div>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: log.status === 'SENT' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: log.status === 'SENT' ? '#4ade80' : '#f87171' }}>
                  {log.status}
                </span>
                {log.sentAt && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{formatDate(log.sentAt)}</span>}
              </div>
            ))}
            {restaurant.smsLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <MessageSquare size={14} style={{ color: '#06b6d4', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 500 }}>SMS to {log.toPhone}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.message.slice(0, 60)}…</div>
                </div>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: log.status === 'SENT' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: log.status === 'SENT' ? '#4ade80' : '#f87171' }}>
                  {log.status}
                </span>
                {log.sentAt && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{formatDate(log.sentAt)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

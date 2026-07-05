'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Send, Loader2, Eye, EyeOff, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { EMAIL_TEMPLATES, interpolateTemplate } from '@/lib/email-templates'

interface Restaurant {
  id: string; name: string; city: string; address: string; email?: string
}

interface Template { id: string; name: string; subject: string; body: string }

type EmailTemplateKey = keyof typeof EMAIL_TEMPLATES

function EmailCampaignContent() {
  const searchParams = useSearchParams()
  const prefillId = searchParams.get('restaurantId')

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState(prefillId || '')
  const [templates, setTemplates] = useState<Template[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [provider, setProvider] = useState<'smtp' | 'resend'>('smtp')
  const [preview, setPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)

  const selectedRestaurant = restaurants.find((r) => r.id === selectedId)

  const getVars = useCallback(() => {
    const agencyName = process.env.NEXT_PUBLIC_AGENCY_NAME || 'Our Agency'
    return {
      RestaurantName: selectedRestaurant?.name || '{{RestaurantName}}',
      City: selectedRestaurant?.city || '{{City}}',
      Address: selectedRestaurant?.address || '{{Address}}',
      AgencyName: agencyName,
      AgencyWebsite: process.env.NEXT_PUBLIC_APP_URL || 'https://yourwagency.com',
      AgencyEmail: 'hello@agency.com',
      AgencyPhone: '+91 9999999999',
    }
  }, [selectedRestaurant])

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    // Load restaurants with email
    fetch('/api/restaurants?hasWebsite=false&limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.restaurants) setRestaurants(d.restaurants) })

    // Load templates
    fetch('/api/email/templates', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.templates) setTemplates(d.templates) })
  }, [])

  useEffect(() => {
    if (selectedRestaurant?.email) setToEmail(selectedRestaurant.email)
  }, [selectedRestaurant])

  function applyTemplate(templateKey: EmailTemplateKey) {
    const t = EMAIL_TEMPLATES[templateKey]
    setSubject(t.subject)
    setBody(t.body)
  }

  function applyDbTemplate(t: Template) {
    setSubject(t.subject)
    setBody(t.body)
  }

  const interpolated = {
    subject: interpolateTemplate(subject, getVars()),
    body: interpolateTemplate(body, getVars()),
  }

  async function handleSend() {
    if (!selectedId) return toast.error('Select a restaurant first')
    if (!toEmail) return toast.error('Enter recipient email address')
    if (!subject || !body) return toast.error('Subject and body are required')
    if (!confirmSend) { setConfirmSend(true); return }

    setSending(true)
    setConfirmSend(false)

    const token = localStorage.getItem('auth_token')
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ restaurantId: selectedId, toEmail, subject: interpolated.subject, body: interpolated.body, provider }),
    })
    const data = await res.json()

    if (data.success) {
      toast.success('Email sent successfully!')
    } else {
      toast.error(data.error || 'Failed to send email')
    }
    setSending(false)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="flex items-center gap-3 mb-5">
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail size={18} className="text-white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Email Campaign</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Send personalized emails to restaurants without websites</p>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 20, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        <Info size={15} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
        Only send emails to publicly available business email addresses. Emails are sent one at a time with your confirmation required before each send.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        {/* Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Restaurant Selection */}
          <div className="card p-4">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Select Restaurant</h3>
            <select className="input mb-3" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">— Select a restaurant —</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.city})</option>
              ))}
            </select>
            {selectedRestaurant && (
              <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-elevated)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>{selectedRestaurant.name}</strong></div>
                <div>{selectedRestaurant.city}</div>
                {selectedRestaurant.email
                  ? <div style={{ color: '#4ade80', marginTop: 4 }}>✅ Has email: {selectedRestaurant.email}</div>
                  : <div style={{ color: '#f87171', marginTop: 4 }}>⚠️ No public email on record</div>
                }
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="card p-4">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Templates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Object.keys(EMAIL_TEMPLATES) as EmailTemplateKey[]).map((key) => (
                <button key={key} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.78rem' }}
                  onClick={() => applyTemplate(key)}>
                  {EMAIL_TEMPLATES[key].name}
                </button>
              ))}
              {templates.map((t) => (
                <button key={t.id} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.78rem' }}
                  onClick={() => applyDbTemplate(t)}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div className="card p-4">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Email Provider</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['smtp', 'resend'] as const).map((p) => (
                <button key={p} className="btn" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: provider === p ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-elevated)', color: provider === p ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--bg-border)' }}
                  onClick={() => setProvider(p)}>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel — Composer */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Compose Email</h3>
            <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.75rem' }}
              onClick={() => setPreview(!preview)}>
              {preview ? <><EyeOff size={13} /> Editor</> : <><Eye size={13} /> Preview</>}
            </button>
          </div>

          {/* To Email */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              To (Recipient Email)
            </label>
            <input className="input" type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="restaurant@example.com" />
          </div>

          {/* Subject */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Subject</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject…" />
          </div>

          {/* Body */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Body (HTML)</label>
            {preview ? (
              <div style={{
                minHeight: 300, padding: 16, borderRadius: 8, border: '1px solid var(--bg-border)',
                background: '#fff', color: '#111', fontSize: '0.85rem', lineHeight: 1.6
              }} dangerouslySetInnerHTML={{ __html: interpolated.body }} />
            ) : (
              <textarea className="input" rows={14} value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="Paste or type HTML email body… Use {{RestaurantName}}, {{City}}, {{Address}}, {{AgencyName}} as variables."
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem' }} />
            )}
          </div>

          {/* Variables hint */}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Available variables: <code style={{ color: '#818cf8' }}>{'{{RestaurantName}}'}</code>{' '}
            <code style={{ color: '#818cf8' }}>{'{{City}}'}</code>{' '}
            <code style={{ color: '#818cf8' }}>{'{{Address}}'}</code>{' '}
            <code style={{ color: '#818cf8' }}>{'{{AgencyName}}'}</code>
          </div>

          {/* Confirm + Send */}
          {confirmSend && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 12, fontSize: '0.82rem', color: '#fbbf24' }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Confirm sending to: {toEmail}</strong><br />
                Subject: {interpolated.subject}<br />
                Click Send again to confirm.
              </div>
            </div>
          )}

          <button className="btn btn-primary w-full" onClick={handleSend} disabled={sending || !selectedId || !toEmail || !subject || !body}>
            {sending
              ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
              : confirmSend
                ? <><CheckCircle size={15} /> Confirm Send</>
                : <><Send size={15} /> Send Email</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

import { Suspense } from 'react'

export default function EmailCampaignPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 400 }} />}>
      <EmailCampaignContent />
    </Suspense>
  )
}

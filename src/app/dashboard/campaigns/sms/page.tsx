'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, Send, Loader2, Info, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { SMS_TEMPLATES } from '@/lib/sms'

interface Restaurant { id: string; name: string; city: string; phone?: string }

function SmsContent() {
  const searchParams = useSearchParams()
  const prefillId = searchParams.get('restaurantId')
  const prefillPhone = searchParams.get('phone')

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState(prefillId || '')
  const [toPhone, setToPhone] = useState(prefillPhone || '')
  const [message, setMessage] = useState('')
  const [provider, setProvider] = useState<'twilio' | 'whatsapp'>('twilio')
  const [sending, setSending] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)

  const selected = restaurants.find((r) => r.id === selectedId)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    fetch('/api/restaurants?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.restaurants) setRestaurants(d.restaurants) })
  }, [])

  useEffect(() => {
    if (selected?.phone) setToPhone(selected.phone)
  }, [selected])

  function applyTemplate(body: string) {
    const vars: Record<string, string> = {
      RestaurantName: selected?.name || '{{RestaurantName}}',
      City: selected?.city || '{{City}}',
      AgencyName: 'My Web Agency',
      AgencyPhone: '+91 9999999999',
      AgencyWebsite: 'https://mywebagency.com',
    }
    const interpolated = body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
    setMessage(interpolated)
  }

  async function handleSend() {
    if (!selectedId) return toast.error('Select a restaurant first')
    if (!toPhone) return toast.error('Enter recipient phone number')
    if (!message) return toast.error('Message is required')
    if (!confirmSend) { setConfirmSend(true); return }

    setSending(true)
    setConfirmSend(false)

    const token = localStorage.getItem('auth_token')
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ restaurantId: selectedId, toPhone, message, provider }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success(`${provider === 'whatsapp' ? 'WhatsApp' : 'SMS'} sent successfully!`)
      setMessage('')
    } else {
      toast.error(data.error || 'Failed to send message')
    }
    setSending(false)
  }

  const charCount = message.length
  const smsSegments = Math.ceil(charCount / 160) || 1

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="flex items-center gap-3 mb-5">
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #06b6d4, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={18} className="text-white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>SMS / WhatsApp Campaign</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Send messages via Twilio or WhatsApp Business Cloud API</p>
        </div>
      </div>

      {/* Warning */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 20, fontSize: '0.82rem', color: '#fbbf24' }}>
        <Info size={15} style={{ flexShrink: 0 }} />
        Requires Twilio or WhatsApp Business Cloud API credentials in Settings. Manually select each recipient before sending.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        {/* Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card p-4">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Select Restaurant</h3>
            <select className="input mb-3" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">— Select —</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.city})</option>
              ))}
            </select>
            {selected && (
              <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-elevated)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{selected.name}</strong><br />
                {selected.city}<br />
                {selected.phone
                  ? <span style={{ color: '#4ade80' }}>📞 {selected.phone}</span>
                  : <span style={{ color: '#f87171' }}>No phone on record</span>
                }
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Templates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SMS_TEMPLATES.map((t) => (
                <button key={t.id} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.78rem', textAlign: 'left' }}
                  onClick={() => applyTemplate(t.body)}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Provider</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['twilio', 'whatsapp'] as const).map((p) => (
                <button key={p} className="btn" style={{ flex: 1, padding: '8px', fontSize: '0.78rem', background: provider === p ? 'linear-gradient(135deg, #06b6d4, #0284c7)' : 'var(--bg-elevated)', color: provider === p ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--bg-border)' }}
                  onClick={() => setProvider(p)}>
                  {p === 'whatsapp' ? 'WhatsApp' : 'SMS / Twilio'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="card p-5">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Compose Message</h3>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              To Phone Number
            </label>
            <input className="input" value={toPhone} onChange={(e) => setToPhone(e.target.value)} placeholder="+91 9999999999" />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Message</label>
            <textarea className="input" rows={8} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message… or use a template."
              style={{ resize: 'vertical' }} />
          </div>

          <div className="flex items-center justify-between mb-4" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{charCount} characters · {smsSegments} SMS segment{smsSegments > 1 ? 's' : ''}</span>
            <span>Variables: {'{{RestaurantName}}'}, {'{{City}}'}, {'{{AgencyName}}'}</span>
          </div>

          {confirmSend && (
            <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 12, fontSize: '0.82rem', color: '#fbbf24' }}>
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>Sending to: <strong>{toPhone}</strong> via {provider}. Click Send again to confirm.</span>
            </div>
          )}

          <button className="btn btn-primary w-full" onClick={handleSend} disabled={sending || !selectedId || !toPhone || !message}>
            {sending ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={15} /> Send {provider === 'whatsapp' ? 'WhatsApp' : 'SMS'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

import { Suspense } from 'react'

export default function SmsPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 400 }} />}>
      <SmsContent />
    </Suspense>
  )
}

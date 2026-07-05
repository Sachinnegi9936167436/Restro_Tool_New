'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, Trash2, Loader2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { EMAIL_TEMPLATES } from '@/lib/email-templates'

interface Template { id: string; name: string; subject: string; body: string; isDefault: boolean; createdAt: string }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [preview, setPreview] = useState<Template | null>(null)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  async function fetchTemplates() {
    const token = localStorage.getItem('auth_token')
    const res = await fetch('/api/email/templates', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (data.templates) setTemplates(data.templates)
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  async function seedTemplates() {
    setSeeding(true)
    const token = localStorage.getItem('auth_token')
    await fetch('/api/email/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ seed: true }),
    })
    toast.success('Built-in templates seeded!')
    fetchTemplates()
    setSeeding(false)
  }

  async function handleCreate() {
    if (!name || !subject || !body) return toast.error('All fields are required')
    setSaving(true)
    const token = localStorage.getItem('auth_token')
    const res = await fetch('/api/email/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, subject, body }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Template created!')
      setTemplates((prev) => [...prev, data.template])
      setName(''); setSubject(''); setBody('')
      setCreating(false)
    } else {
      toast.error(data.error || 'Failed to create template')
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Email Templates</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage reusable email templates for your campaigns</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={seedTemplates} disabled={seeding}>
            {seeding ? <Loader2 size={14} className="animate-spin" /> : null} Seed Built-ins
          </button>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={14} /> New Template
          </button>
        </div>
      </div>

      {/* Built-in Templates */}
      <div className="card p-5 mb-5">
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          Built-in Templates
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
          {Object.values(EMAIL_TEMPLATES).map((t) => (
            <div key={t.name} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
                <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Built-in</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>{t.subject}</p>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                onClick={() => setPreview({ id: 'builtin', name: t.name, subject: t.subject, body: t.body, isDefault: true, createdAt: new Date().toISOString() })}>
                <Eye size={11} /> Preview
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Database Templates */}
      <div className="card p-5">
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          Custom Templates {templates.length > 0 && `(${templates.length})`}
        </h3>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 8 }} />)}
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No custom templates yet. Create one above or click &quot;Seed Built-ins&quot;.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map((t) => (
              <div key={t.id} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.subject}</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.75rem' }} onClick={() => setPreview(t)}>
                  <Eye size={12} /> Preview
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card p-6" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Create New Template</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Template Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Hindi Outreach" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Subject Line</label>
                <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Use {{RestaurantName}}, {{City}} as variables" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Body (HTML)</label>
                <textarea className="input" rows={12} value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder="<p>Hello {{RestaurantName}}…</p>" style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save Template
              </button>
              <button className="btn btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card p-6" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{preview.name}</h3>
              <button className="btn btn-secondary" style={{ padding: '5px 10px' }} onClick={() => setPreview(null)}>Close</button>
            </div>
            <div style={{ marginBottom: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong>Subject:</strong> {preview.subject}
            </div>
            <div style={{ padding: 20, background: '#fff', borderRadius: 10, color: '#111', fontSize: '0.85rem', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: preview.body }} />
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Settings, Key, Mail, MessageSquare, Globe, Save, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface SettingsState {
  LOCATIONIQ_API_KEY: string
  SMTP_HOST: string
  SMTP_PORT: string
  SMTP_USER: string
  SMTP_PASS: string
  SMTP_FROM: string
  RESEND_API_KEY: string
  RESEND_FROM: string
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_FROM_NUMBER: string
  WHATSAPP_TOKEN: string
  WHATSAPP_PHONE_NUMBER_ID: string
  AGENCY_NAME: string
  AGENCY_WEBSITE: string
  AGENCY_EMAIL: string
  AGENCY_PHONE: string
  EMAIL_RATE_LIMIT_PER_HOUR: string
  SMS_RATE_LIMIT_PER_HOUR: string
}

const DEFAULT_SETTINGS: SettingsState = {
  LOCATIONIQ_API_KEY: '',
  SMTP_HOST: 'smtp.gmail.com', SMTP_PORT: '587', SMTP_USER: '', SMTP_PASS: '', SMTP_FROM: '',
  RESEND_API_KEY: '', RESEND_FROM: '',
  TWILIO_ACCOUNT_SID: '', TWILIO_AUTH_TOKEN: '', TWILIO_FROM_NUMBER: '',
  WHATSAPP_TOKEN: '', WHATSAPP_PHONE_NUMBER_ID: '',
  AGENCY_NAME: 'My Web Agency', AGENCY_WEBSITE: '', AGENCY_EMAIL: '', AGENCY_PHONE: '',
  EMAIL_RATE_LIMIT_PER_HOUR: '50', SMS_RATE_LIMIT_PER_HOUR: '20',
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input className="input pr-10" type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

function Section({ title, icon: Icon, color, children }: { title: string; icon: React.ElementType; color: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} style={{ color }} />
        </div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings({ ...DEFAULT_SETTINGS, ...d.settings })
        setLoading(false)
      })
  }, [])

  function set(key: keyof SettingsState, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const token = localStorage.getItem('auth_token')
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    })
    if (res.ok) {
      toast.success('Settings saved!')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      toast.error('Failed to save settings')
    }
    setSaving(false)
  }

  if (loading) {
    return <div style={{ maxWidth: 900, margin: '0 auto' }}><div className="skeleton" style={{ height: 400, borderRadius: 12 }} /></div>
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} className="text-white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Configure API keys and agency details</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Settings</>}
        </button>
      </div>

      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8rem', color: '#f87171', marginBottom: 20 }}>
        ⚠️ Settings are stored in the database. For production deployments, prefer using environment variables in <code>.env.local</code>.
      </div>

      {/* LocationIQ API */}
      <Section title="LocationIQ Settings" icon={Key} color="#4ade80">
        <Field label="LocationIQ API Key" hint="Required for restaurant search and geocoding">
          <PasswordInput value={settings.LOCATIONIQ_API_KEY} onChange={(v) => set('LOCATIONIQ_API_KEY', v)} placeholder="pk.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        </Field>
      </Section>

      {/* SMTP */}
      <Section title="SMTP Email (Nodemailer)" icon={Mail} color="#818cf8">
        <Field label="SMTP Host"><input className="input" value={settings.SMTP_HOST} onChange={(e) => set('SMTP_HOST', e.target.value)} placeholder="smtp.gmail.com" /></Field>
        <Field label="SMTP Port"><input className="input" value={settings.SMTP_PORT} onChange={(e) => set('SMTP_PORT', e.target.value)} placeholder="587" /></Field>
        <Field label="SMTP User (Email)"><input className="input" type="email" value={settings.SMTP_USER} onChange={(e) => set('SMTP_USER', e.target.value)} placeholder="you@gmail.com" /></Field>
        <Field label="SMTP Password" hint="Use an App Password for Gmail">
          <PasswordInput value={settings.SMTP_PASS} onChange={(v) => set('SMTP_PASS', v)} placeholder="••••••••" />
        </Field>
        <Field label="From Address"><input className="input" value={settings.SMTP_FROM} onChange={(e) => set('SMTP_FROM', e.target.value)} placeholder="Agency Name <email@domain.com>" /></Field>
      </Section>

      {/* Resend */}
      <Section title="Resend API" icon={Mail} color="#06b6d4">
        <Field label="Resend API Key">
          <PasswordInput value={settings.RESEND_API_KEY} onChange={(v) => set('RESEND_API_KEY', v)} placeholder="re_…" />
        </Field>
        <Field label="Resend From Address"><input className="input" value={settings.RESEND_FROM} onChange={(e) => set('RESEND_FROM', e.target.value)} placeholder="noreply@yourdomain.com" /></Field>
      </Section>

      {/* Twilio */}
      <Section title="Twilio SMS" icon={MessageSquare} color="#f59e0b">
        <Field label="Account SID"><PasswordInput value={settings.TWILIO_ACCOUNT_SID} onChange={(v) => set('TWILIO_ACCOUNT_SID', v)} placeholder="AC…" /></Field>
        <Field label="Auth Token"><PasswordInput value={settings.TWILIO_AUTH_TOKEN} onChange={(v) => set('TWILIO_AUTH_TOKEN', v)} placeholder="••••••••" /></Field>
        <Field label="From Phone Number"><input className="input" value={settings.TWILIO_FROM_NUMBER} onChange={(e) => set('TWILIO_FROM_NUMBER', e.target.value)} placeholder="+1234567890" /></Field>
      </Section>

      {/* WhatsApp */}
      <Section title="WhatsApp Business Cloud API" icon={MessageSquare} color="#22c55e">
        <Field label="WhatsApp Token"><PasswordInput value={settings.WHATSAPP_TOKEN} onChange={(v) => set('WHATSAPP_TOKEN', v)} placeholder="Access token" /></Field>
        <Field label="Phone Number ID"><input className="input" value={settings.WHATSAPP_PHONE_NUMBER_ID} onChange={(e) => set('WHATSAPP_PHONE_NUMBER_ID', e.target.value)} placeholder="Phone number ID" /></Field>
      </Section>

      {/* Agency */}
      <Section title="Agency Details" icon={Globe} color="#8b5cf6">
        <Field label="Agency Name"><input className="input" value={settings.AGENCY_NAME} onChange={(e) => set('AGENCY_NAME', e.target.value)} placeholder="My Web Agency" /></Field>
        <Field label="Agency Website"><input className="input" value={settings.AGENCY_WEBSITE} onChange={(e) => set('AGENCY_WEBSITE', e.target.value)} placeholder="https://myagency.com" /></Field>
        <Field label="Agency Email"><input className="input" type="email" value={settings.AGENCY_EMAIL} onChange={(e) => set('AGENCY_EMAIL', e.target.value)} placeholder="hello@myagency.com" /></Field>
        <Field label="Agency Phone"><input className="input" value={settings.AGENCY_PHONE} onChange={(e) => set('AGENCY_PHONE', e.target.value)} placeholder="+91 9999999999" /></Field>
      </Section>

      {/* Rate Limits */}
      <Section title="Rate Limits" icon={Settings} color="#ef4444">
        <Field label="Max Emails per Hour" hint="Prevents accidental bulk sending">
          <input className="input" type="number" value={settings.EMAIL_RATE_LIMIT_PER_HOUR} onChange={(e) => set('EMAIL_RATE_LIMIT_PER_HOUR', e.target.value)} />
        </Field>
        <Field label="Max SMS per Hour">
          <input className="input" type="number" value={settings.SMS_RATE_LIMIT_PER_HOUR} onChange={(e) => set('SMS_RATE_LIMIT_PER_HOUR', e.target.value)} />
        </Field>
      </Section>

      <div className="flex justify-end mt-4">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 32px' }}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save All Settings</>}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import {
  Store, Globe, XCircle, Mail, TrendingUp, Users, Star, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { TooltipProps } from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'
import { LEAD_STATUS_CONFIG, formatDate } from '@/lib/utils'

interface DashboardStats {
  stats: {
    totalRestaurants: number
    noWebsite: number
    hasWebsite: number
    contacted: number
    interested: number
    followUp: number
    client: number
    lost: number
  }
  charts: {
    cityStats: { city: string; count: number }[]
    categoryStats: { category: string; count: number }[]
    monthlyStats: { month: string; count: number }[]
    websiteRatio: { name: string; value: number }[]
  }
  recentLeads: {
    id: string; name: string; city: string
    hasWebsite: boolean; leadStatus: string; createdAt: string
  }[]
  searchHistory: { id: string; city: string; category: string; radius: number; resultsCount: number; newLeads: number; createdAt: string }[]
}

const PIE_COLORS = ['#ef4444', '#22c55e']
const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444']

function StatCard({
  label, value, icon: Icon, color, sub, href
}: {
  label: string; value: number; icon: React.ElementType
  color: string; sub?: string; href?: string
}) {
  const content = (
    <div className="card p-5 flex flex-col gap-3 cursor-pointer" style={{ borderTop: `2px solid ${color}` }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <div style={{ padding: 8, borderRadius: 8, background: `${color}22` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value.toLocaleString()}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>
  return content
}

function SkeletonCard() {
  return <div className="card p-5" style={{ height: 110 }}><div className="skeleton" style={{ height: '100%' }} /></div>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchStats() {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchStats() }, [])

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
          <p style={{ color: '#818cf8', fontWeight: 600 }}>{String(payload[0].value)} leads</p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Analytics Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>
            Track your restaurant lead pipeline across Uttarakhand
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchStats} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : data ? (
          <>
            <StatCard label="Total Restaurants" value={data.stats.totalRestaurants} icon={Store} color="#6366f1" sub="All cities" href="/dashboard/restaurants" />
            <StatCard label="No Website" value={data.stats.noWebsite} icon={XCircle} color="#ef4444" sub="Prime leads" href="/dashboard/restaurants?hasWebsite=false" />
            <StatCard label="Has Website" value={data.stats.hasWebsite} icon={Globe} color="#22c55e" sub="Already online" href="/dashboard/restaurants?hasWebsite=true" />
            <StatCard label="Contacted" value={data.stats.contacted} icon={Mail} color="#f59e0b" sub="Awaiting reply" />
            <StatCard label="Interested" value={data.stats.interested} icon={TrendingUp} color="#06b6d4" sub="Hot leads" />
            <StatCard label="Clients" value={data.stats.client} icon={Star} color="#8b5cf6" sub="Converted" />
          </>
        ) : null}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Monthly Leads */}
        <div className="card p-5">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
            Monthly Leads (Last 6 Months)
          </h3>
          {loading ? (
            <div className="skeleton" style={{ height: 200 }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.charts.monthlyStats ?? []}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Website Ratio */}
        <div className="card p-5">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
            Website vs. No Website
          </h3>
          {loading ? (
            <div className="skeleton" style={{ height: 200 }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data?.charts.websiteRatio ?? []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {data?.charts.websiteRatio.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [String(v), '']} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Cities */}
        <div className="card p-5">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
            Leads by City
          </h3>
          {loading ? (
            <div className="skeleton" style={{ height: 200 }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.charts.cityStats ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="city" type="category" tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data?.charts.cityStats.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Categories */}
        <div className="card p-5">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
            Leads by Category
          </h3>
          {loading ? (
            <div className="skeleton" style={{ height: 200 }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.charts.categoryStats ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="category" tick={{ fill: '#9090b0', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Recent Leads */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Leads</h3>
            <Link href="/dashboard/restaurants" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
              View All
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 36 }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data?.recentLeads.map((r) => {
                const cfg = LEAD_STATUS_CONFIG[r.leadStatus as keyof typeof LEAD_STATUS_CONFIG]
                return (
                  <Link key={r.id} href={`/dashboard/restaurants/${r.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 8, textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: r.hasWebsite ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {r.hasWebsite ? <Globe size={14} style={{ color: '#22c55e' }} /> : <XCircle size={14} style={{ color: '#ef4444' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.city}</div>
                    </div>
                    <span className="badge" style={{ ...cfg && { background: cfg.color.split(' ')[0].replace('bg-', ''), color: '#fff' }, fontSize: '0.65rem' }}>
                      {cfg?.label ?? r.leadStatus}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{formatDate(r.createdAt)}</span>
                  </Link>
                )
              })}
              {(!data?.recentLeads.length) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                  No leads yet. Run a search to find restaurants!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Recent Searches */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Searches</h3>
            <Link href="/dashboard/search" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
              + New Search
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data?.searchHistory.map((s) => (
                <div key={s.id} style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)'
                }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.city}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(s.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {s.category} · {s.radius / 1000}km radius
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: '0.68rem', color: '#818cf8' }}>{s.resultsCount} found</span>
                    <span style={{ fontSize: '0.68rem', color: '#22c55e' }}>{s.newLeads} new</span>
                  </div>
                </div>
              ))}
              {(!data?.searchHistory.length) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                  No searches yet. Start by searching for restaurants!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lead Pipeline */}
      <div className="card p-5 mt-4">
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
          Lead Pipeline Summary
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, width: 120, borderRadius: 8 }} />)
            : data && [
              { label: 'New', val: data.stats.totalRestaurants - data.stats.contacted - data.stats.interested - data.stats.followUp - data.stats.client - data.stats.lost, color: '#6366f1' },
              { label: 'Contacted', val: data.stats.contacted, color: '#f59e0b' },
              { label: 'Interested', val: data.stats.interested, color: '#06b6d4' },
              { label: 'Follow Up', val: data.stats.followUp, color: '#f97316' },
              { label: 'Client', val: data.stats.client, color: '#22c55e' },
              { label: 'Lost', val: data.stats.lost, color: '#ef4444' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{
                flex: '1 1 100px', padding: '12px 16px', borderRadius: 8,
                background: `${color}15`, border: `1px solid ${color}40`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

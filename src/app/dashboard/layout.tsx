'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Search, Store, Mail, MessageSquare,
  FileText, Download, Settings, LogOut, MapPin, Menu, X,
  ChevronRight, Bell
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/search', label: 'Search', icon: Search },
  { href: '/dashboard/restaurants', label: 'Restaurants', icon: Store },
  { href: '/dashboard/campaigns/email', label: 'Email Campaigns', icon: Mail },
  { href: '/dashboard/campaigns/sms', label: 'SMS / WhatsApp', icon: MessageSquare },
  { href: '/dashboard/templates', label: 'Templates', icon: FileText },
  { href: '/dashboard/export', label: 'Export', icon: Download },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/me', { method: 'DELETE' })
    localStorage.removeItem('auth_token')
    toast.success('Logged out successfully')
    router.push('/login')
  }

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--bg-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 12px',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 4px 16px', borderBottom: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MapPin size={18} className="text-white" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Lead Finder
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Uttarakhand</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: 12, paddingBottom: 12 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '4px 12px 8px', textTransform: 'uppercase' }}>
          Navigation
        </div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              onClick={onClose}
              className={cn('sidebar-link', isActive && 'active')}>
              <Icon size={16} />
              <span>{label}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#818cf8' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ paddingBottom: 16, borderTop: '1px solid var(--bg-border)', paddingTop: 12 }}>
        <button onClick={handleLogout} className="sidebar-link w-full" style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Page title from path
  const pageName = NAV_ITEMS.find((n) =>
    pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
  )?.label ?? 'Dashboard'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
               onClick={() => setSidebarOpen(false)} />
          <div style={{ position: 'relative', zIndex: 51 }}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          height: 60, display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 16,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--bg-border)',
          flexShrink: 0,
        }}>
          <button className="md:hidden btn btn-secondary" style={{ padding: '6px 10px' }}
                  onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{pageName}</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Uttarakhand Restaurant Lead Finder
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary" style={{ padding: '6px 10px' }}>
              <Bell size={16} />
            </button>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            }}>A</div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px 24px' }}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

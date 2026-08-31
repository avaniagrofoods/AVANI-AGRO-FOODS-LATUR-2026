import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Building2, FileText, LogOut, ShieldCheck } from 'lucide-react'
import { BUSINESS_INFO } from '../data/links'

export default function PrivateNav({ onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  const handleLogoutClick = async () => {
    try {
      await fetch('/api/verify-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch (e) {
      console.warn('Logout request error', e)
    }
    if (onLogout) {
      onLogout()
    } else {
      window.location.href = '/'
    }
  }

  const navItems = [
    { label: 'Portal Dashboard', href: '/private', icon: LayoutDashboard, exact: true },
    { label: 'Importer Intelligence', href: '/private/importers', icon: Users },
    { label: 'Manufacturer Database', href: '/private/manufacturers', icon: Building2 },
    { label: 'Quotation Management', href: '/private/quotations', icon: FileText },
  ]

  const isActive = (item) => {
    if (item.exact) {
      return path === '/private' || path === '/private/' || path === '/private/dashboard'
    }
    return path.startsWith(item.href) || 
      (item.href === '/private/importers' && path === '/importers') ||
      (item.href === '/private/manufacturers' && path === '/manufacturers') ||
      (item.href === '/private/quotations' && (path === '/admin/quotations' || path === '/quotation-sheet'))
  }

  return (
    <div style={{ background: '#0a1f0d', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '12px 24px', gap: 16 }}>
        
        {/* Portal Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.04em', color: 'white' }}>
              AVANI AGRO FOODS <span style={{ color: 'var(--color-accent)', fontSize: '0.75rem', fontWeight: 700, marginLeft: 6, padding: '2px 8px', borderRadius: 4, background: 'rgba(230,168,23,0.15)' }}>PRIVATE PORTAL</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
              Trade Coordinator: Sachin Shinde | Latur, Maharashtra
            </div>
          </div>
        </div>

        {/* Portal Navigation Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                to={item.href}
                className="btn"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: 6,
                  background: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                  color: active ? 'white' : 'rgba(255,255,255,0.85)',
                  border: active ? '1px solid var(--color-primary-light)' : '1px solid rgba(255,255,255,0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* Logout Action */}
          <button
            onClick={handleLogoutClick}
            className="btn"
            style={{
              padding: '7px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 6,
              background: 'rgba(239,68,68,0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginLeft: 8,
              cursor: 'pointer'
            }}
            title="Logout and end authenticated session"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </div>
  )
}

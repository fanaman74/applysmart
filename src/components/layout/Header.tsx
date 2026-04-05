import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/cn'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/job-search', label: 'Job Search' },
  { to: '/tracker', label: 'Tracker' },
]

export function Header() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    setDropdownOpen(false)
    navigate('/')
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-0 text-xl font-bold text-text">
            Apply<span className="text-accent">Smart</span>er
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      location.pathname === link.to
                        ? 'text-accent bg-accent/10'
                        : 'text-text-secondary hover:text-text hover:bg-surface'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* User dropdown */}
                <div className="relative ml-3" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:text-text transition-colors"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base text-sm font-semibold">
                      {userInitial}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'transition-transform',
                        dropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-surface shadow-xl">
                      <div className="border-b border-border px-4 py-3">
                        <p className="text-xs text-text-muted">Signed in as</p>
                        <p className="truncate text-sm text-text">{user.email}</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:bg-card hover:text-text transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:text-text transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base hover:bg-accent-hover transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-lg p-2 text-text-secondary hover:text-text hover:bg-surface transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface/95 backdrop-blur-lg">
          <div className="mx-auto max-w-6xl px-4 py-4 space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-3 mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base text-sm font-semibold">
                    {userInitial}
                  </span>
                  <span className="truncate text-sm text-text">{user.email}</span>
                </div>

                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      location.pathname === link.to
                        ? 'text-accent bg-accent/10'
                        : 'text-text-secondary hover:text-text hover:bg-card'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text hover:bg-card transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text hover:bg-card transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="block rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-base text-center hover:bg-accent-hover transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

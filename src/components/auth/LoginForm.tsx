import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function LoginForm() {
  const { signIn, signInWithMagicLink, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error: signInError } = await signIn(email, password)
    if (signInError) {
      setError(signInError.message)
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Please enter your email address first.')
      return
    }
    setError(null)
    const { error: otpError } = await signInWithMagicLink(email)
    if (otpError) {
      setError(otpError.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSignIn} className="rounded-xl bg-surface border border-border p-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-text placeholder-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-text placeholder-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            placeholder="Your password"
          />
        </div>

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}

        {magicLinkSent && (
          <p className="text-sm text-success">Magic link sent — check your inbox.</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleMagicLink}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-text-secondary font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send magic link
        </button>

        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-accent hover:text-accent-hover transition-colors">
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}

'use client'

import { Suspense, useMemo, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'

function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next')?.startsWith('/') && !params.get('next')?.startsWith('//') ? params.get('next')! : '/'
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const supabase = useMemo(() => isSupabaseConfigured() ? createClient() : null, [])

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (!supabase) {
      setMessage('Connect a Supabase project before enabling sign-in.')
      return
    }
    setSending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    setSending(false)
    setMessage(error ? error.message : 'Check your email for a secure sign-in link.')
  }

  return <main className="login-shell">
    <Link className="brand" href="/"><Image className="brand-seal" src="/nith-seal.jpeg" alt="" aria-hidden="true" width={36} height={36} sizes="36px" /><span>campus<span className="brand-light">fix</span></span></Link>
    <section className="login-card">
      <div className="eyebrow"><span className="eyebrow-line" /> NIT HAMIRPUR</div>
      <h1>Sign in to<br /><em>CampusFix.</em></h1>
      <p className="hero-intro">We&apos;ll email you a secure sign-in link. Your reports stay private to you and authorized campus staff.</p>
      <form onSubmit={sendLink}>
        <label className="field-label" htmlFor="email">Campus email <span>REQUIRED</span></label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.edu" />
        <button className="submit-button" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Email me a sign-in link'} <span className="arrow-disc" aria-hidden="true">↗</span></button>
        <p className="signin-hint" role="status">{message || 'Use the email address approved by NIT Hamirpur.'}</p>
      </form>
    </section>
    <Link className="text-link" href="/">← Back to CampusFix</Link>
  </main>
}

export default function LoginPage() {
  return <Suspense fallback={<main className="login-shell">Loading sign-in…</main>}><LoginForm /></Suspense>
}
